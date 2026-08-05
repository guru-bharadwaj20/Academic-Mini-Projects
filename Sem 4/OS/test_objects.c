// test_objects.c — Phase 1 unit tests: content-addressable object store
//
// Build:  make test_objects
// Run:    ./test_objects
//
// Exercises hash_to_hex / hex_to_hash round-tripping and the
// object_write / object_read store, including deduplication and the
// integrity check that rejects a corrupted object file.

#include "pes.h"
#include "object.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

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

static void setup_repo(void) {
    pes_mkdir(PES_DIR);
    pes_mkdir(OBJECTS_DIR);
}

static void test_hex_roundtrip(void) {
    printf("\n-- hash_to_hex / hex_to_hash --\n");

    ObjectID id;
    for (int i = 0; i < HASH_SIZE; i++) id.hash[i] = (uint8_t)(i * 7 + 3);

    char hex[HASH_HEX_SIZE + 1];
    hash_to_hex(&id, hex);

    CHECK(strlen(hex) == HASH_HEX_SIZE, "hex string is 64 characters");

    ObjectID back;
    CHECK(hex_to_hash(hex, &back) == 0, "hex_to_hash accepts valid hex");
    CHECK(memcmp(id.hash, back.hash, HASH_SIZE) == 0, "round-trip preserves all 32 bytes");

    ObjectID junk;
    CHECK(hex_to_hash("too-short", &junk) == -1, "hex_to_hash rejects a short string");
}

static void test_write_read_roundtrip(void) {
    printf("\n-- object_write / object_read --\n");

    const char *payload = "hello pes-vcs\n";
    size_t payload_len = strlen(payload);

    ObjectID id;
    CHECK(object_write(OBJ_BLOB, payload, payload_len, &id) == 0, "object_write returns success");
    CHECK(object_exists(&id), "written object exists on disk");

    ObjectType type;
    void *data = NULL;
    size_t len = 0;
    CHECK(object_read(&id, &type, &data, &len) == 0, "object_read returns success");
    CHECK(type == OBJ_BLOB, "type round-trips as OBJ_BLOB");
    CHECK(len == payload_len, "length round-trips");
    CHECK(data && memcmp(data, payload, payload_len) == 0, "content round-trips byte-for-byte");
    free(data);
}

static void test_empty_blob(void) {
    printf("\n-- zero-length blob --\n");

    ObjectID id;
    CHECK(object_write(OBJ_BLOB, "", 0, &id) == 0, "empty blob can be written");

    ObjectType type;
    void *data = NULL;
    size_t len = 1;
    CHECK(object_read(&id, &type, &data, &len) == 0, "empty blob can be read back");
    CHECK(len == 0, "empty blob reads back as zero length");
    free(data);
}

static void test_deduplication(void) {
    printf("\n-- deduplication --\n");

    const char *payload = "identical content";
    ObjectID a, b;
    object_write(OBJ_BLOB, payload, strlen(payload), &a);
    object_write(OBJ_BLOB, payload, strlen(payload), &b);

    CHECK(memcmp(a.hash, b.hash, HASH_SIZE) == 0, "same content yields the same hash");

    ObjectID c;
    object_write(OBJ_BLOB, "different content", 17, &c);
    CHECK(memcmp(a.hash, c.hash, HASH_SIZE) != 0, "different content yields a different hash");
}

static void test_type_affects_hash(void) {
    printf("\n-- header is part of the hash --\n");

    const char *payload = "same bytes";
    ObjectID as_blob, as_tree;
    object_write(OBJ_BLOB, payload, strlen(payload), &as_blob);
    object_write(OBJ_TREE, payload, strlen(payload), &as_tree);

    CHECK(memcmp(as_blob.hash, as_tree.hash, HASH_SIZE) != 0,
          "same bytes under a different type hash differently");
}

static void test_missing_object(void) {
    printf("\n-- reading a missing object --\n");

    ObjectID nope;
    memset(nope.hash, 0xAB, HASH_SIZE);

    ObjectType type;
    void *data = NULL;
    size_t len = 0;
    CHECK(object_read(&nope, &type, &data, &len) == -1, "object_read fails for an absent object");
    CHECK(!object_exists(&nope), "object_exists reports absent object as missing");
}

static void test_integrity_check(void) {
    printf("\n-- corruption detection --\n");

    const char *payload = "trust but verify";
    ObjectID id;
    object_write(OBJ_BLOB, payload, strlen(payload), &id);

    char path[512];
    object_path(&id, path, sizeof(path));

    FILE *f = fopen(path, "r+b");
    if (!f) {
        printf("  [SKIP] could not open object file to corrupt it\n");
        return;
    }
    fseek(f, -1, SEEK_END);
    fputc('X', f);
    fclose(f);

    ObjectType type;
    void *data = NULL;
    size_t len = 0;
    CHECK(object_read(&id, &type, &data, &len) == -1,
          "object_read rejects an object whose hash no longer matches");
    free(data);
}

int main(void) {
    printf("=== Phase 1: object store tests ===\n");
    setup_repo();

    test_hex_roundtrip();
    test_write_read_roundtrip();
    test_empty_blob();
    test_deduplication();
    test_type_affects_hash();
    test_missing_object();
    test_integrity_check();

    printf("\n=== %d/%d passed ===\n", tests_run - tests_failed, tests_run);
    return tests_failed == 0 ? 0 : 1;
}
