// test_tree.c — Phase 2 unit tests: tree object serialization
//
// Build:  make test_tree
// Run:    ./test_tree
//
// Exercises tree_serialize / tree_parse round-tripping, the requirement
// that entries come back sorted by name, and rejection of malformed data.

#include "pes.h"
#include "tree.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

static int tests_run = 0;
static int tests_failed = 0;

#define CHECK(cond, msg)                                            \
    do {                                                            \
        tests_run++;                                                \
        if (cond) {                                                 \
            printf("  [PASS] %s\n", msg);                           \
        } else {                                                    \
            tests_failed++;                                         \
            printf("  [FAIL] %s  (%s:%d)\n", msg, __FILE__, __LINE__); \
        }                                                           \
    } while (0)

static void fill_hash(ObjectID *id, uint8_t seed) {
    for (int i = 0; i < HASH_SIZE; i++) id->hash[i] = (uint8_t)(seed + i);
}

static void add_entry(Tree *t, const char *name, uint32_t mode, uint8_t seed) {
    TreeEntry *e = &t->entries[t->count++];
    e->mode = mode;
    snprintf(e->name, sizeof(e->name), "%s", name);
    fill_hash(&e->hash, seed);
}

static void test_roundtrip(void) {
    printf("\n-- tree_serialize / tree_parse --\n");

    Tree in;
    in.count = 0;
    add_entry(&in, "main.c",  0100644, 1);
    add_entry(&in, "build.sh", 0100755, 2);
    add_entry(&in, "src",     0040000, 3);

    void *data = NULL;
    size_t len = 0;
    CHECK(tree_serialize(&in, &data, &len) == 0, "tree_serialize returns success");
    CHECK(len > 0, "serialized form is non-empty");

    Tree out;
    CHECK(tree_parse(data, len, &out) == 0, "tree_parse returns success");
    CHECK(out.count == in.count, "entry count round-trips");

    free(data);
}

static void test_sorted_output(void) {
    printf("\n-- entries are sorted by name --\n");

    Tree in;
    in.count = 0;
    add_entry(&in, "zebra.txt", 0100644, 10);
    add_entry(&in, "alpha.txt", 0100644, 20);
    add_entry(&in, "middle.txt", 0100644, 30);

    void *data = NULL;
    size_t len = 0;
    tree_serialize(&in, &data, &len);

    Tree out;
    tree_parse(data, len, &out);

    CHECK(out.count == 3, "all three entries parsed");
    if (out.count == 3) {
        CHECK(strcmp(out.entries[0].name, "alpha.txt") == 0, "first entry is alpha.txt");
        CHECK(strcmp(out.entries[1].name, "middle.txt") == 0, "second entry is middle.txt");
        CHECK(strcmp(out.entries[2].name, "zebra.txt") == 0, "third entry is zebra.txt");
    }
    free(data);
}

static void test_modes_and_hashes(void) {
    printf("\n-- modes and hashes survive the round trip --\n");

    Tree in;
    in.count = 0;
    add_entry(&in, "a_regular", 0100644, 100);
    add_entry(&in, "b_exec",    0100755, 150);
    add_entry(&in, "c_dir",     0040000, 200);

    void *data = NULL;
    size_t len = 0;
    tree_serialize(&in, &data, &len);

    Tree out;
    tree_parse(data, len, &out);

    if (out.count == 3) {
        CHECK(out.entries[0].mode == 0100644, "regular-file mode round-trips");
        CHECK(out.entries[1].mode == 0100755, "executable mode round-trips");
        CHECK(out.entries[2].mode == 0040000, "directory mode round-trips");

        ObjectID expect;
        fill_hash(&expect, 100);
        CHECK(memcmp(out.entries[0].hash.hash, expect.hash, HASH_SIZE) == 0,
              "entry hash round-trips byte-for-byte");
    } else {
        CHECK(0, "expected 3 entries back");
    }
    free(data);
}

static void test_empty_tree(void) {
    printf("\n-- empty tree --\n");

    Tree in;
    in.count = 0;

    void *data = NULL;
    size_t len = 0;
    CHECK(tree_serialize(&in, &data, &len) == 0, "empty tree serializes");
    CHECK(len == 0, "empty tree produces zero bytes");

    Tree out;
    CHECK(tree_parse(data, len, &out) == 0, "empty tree parses");
    CHECK(out.count == 0, "empty tree parses back to zero entries");
    free(data);
}

static void test_malformed_input(void) {
    printf("\n-- malformed input is rejected --\n");

    Tree out;

    // No space separating mode from name.
    const char *no_space = "100644filename";
    CHECK(tree_parse(no_space, strlen(no_space), &out) == -1,
          "input with no mode/name separator is rejected");

    // Mode and name but truncated before the 32-byte hash.
    char truncated[32];
    int n = snprintf(truncated, sizeof(truncated), "100644 f");
    truncated[n] = '\0';
    CHECK(tree_parse(truncated, (size_t)n + 1, &out) == -1,
          "input truncated before the hash is rejected");
}

static void test_long_name_rejected(void) {
    printf("\n-- oversized entry name --\n");

    char blob[600];
    size_t off = 0;
    off += (size_t)snprintf(blob + off, sizeof(blob) - off, "100644 ");
    for (int i = 0; i < 400; i++) blob[off++] = 'x';
    blob[off++] = '\0';
    memset(blob + off, 0xAA, HASH_SIZE);
    off += HASH_SIZE;

    Tree out;
    CHECK(tree_parse(blob, off, &out) == -1,
          "entry name longer than the 256-byte field is rejected");
}

int main(void) {
    printf("=== Phase 2: tree object tests ===\n");
    pes_mkdir(PES_DIR);
    pes_mkdir(OBJECTS_DIR);

    test_roundtrip();
    test_sorted_output();
    test_modes_and_hashes();
    test_empty_tree();
    test_malformed_input();
    test_long_name_rejected();

    printf("\n=== %d/%d passed ===\n", tests_run - tests_failed, tests_run);
    return tests_failed == 0 ? 0 : 1;
}
