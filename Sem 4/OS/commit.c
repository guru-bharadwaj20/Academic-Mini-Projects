// commit.c — Commit creation and history traversal

#include "commit.h"
#include "index.h"
#include "tree.h"
#include "object.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <inttypes.h>
#include <time.h>
#include <unistd.h>
#include <fcntl.h>

// ─── PROVIDED ────────────────────────────────────────────────────────────────

// Advance past the next newline, or NULL if there is not one.
//
// commit_parse used to write `p = strchr(p, '\n') + 1;` in five places with
// no check. On a truncated or malformed commit object strchr returns NULL,
// so this computed NULL+1 and the next read segfaulted - `pes log` crashed
// on any corrupt object instead of reporting it.
static const char *next_line(const char *p) {
    if (p == NULL) return NULL;
    const char *newline = strchr(p, '\n');
    return newline ? newline + 1 : NULL;
}

int commit_parse(const void *data, size_t len, Commit *commit_out) {
    (void)len;
    const char *p = (const char *)data;
    char hex[HASH_HEX_SIZE + 1];

    if (p == NULL) return -1;

    if (sscanf(p, "tree %64s\n", hex) != 1) return -1;
    if (hex_to_hash(hex, &commit_out->tree) != 0) return -1;
    p = next_line(p);
    if (!p) return -1;

    if (strncmp(p, "parent ", 7) == 0) {
        if (sscanf(p, "parent %64s\n", hex) != 1) return -1;
        if (hex_to_hash(hex, &commit_out->parent) != 0) return -1;
        commit_out->has_parent = 1;
        p = next_line(p);
        if (!p) return -1;
    } else {
        commit_out->has_parent = 0;
    }

    char author_buf[256];
    uint64_t ts;
    if (sscanf(p, "author %255[^\n]\n", author_buf) != 1) return -1;
    char *last_space = strrchr(author_buf, ' ');
    if (!last_space) return -1;
    ts = (uint64_t)strtoull(last_space + 1, NULL, 10);
    *last_space = '\0';
    snprintf(commit_out->author, sizeof(commit_out->author), "%s", author_buf);
    commit_out->timestamp = ts;

    // Skip the author line, the committer line, and the blank separator.
    p = next_line(p);
    if (!p) return -1;
    p = next_line(p);
    if (!p) return -1;
    p = next_line(p);
    if (!p) return -1;

    snprintf(commit_out->message, sizeof(commit_out->message), "%s", p);
    return 0;
}

int commit_serialize(const Commit *commit, void **data_out, size_t *len_out) {
    char tree_hex[HASH_HEX_SIZE + 1];
    char parent_hex[HASH_HEX_SIZE + 1];
    hash_to_hex(&commit->tree, tree_hex);

    // Use a large enough buffer: headers + message
    size_t buf_size = 512 + HASH_HEX_SIZE * 2 + strlen(commit->author) * 2 + strlen(commit->message) + 64;
    char *buf = malloc(buf_size);
    if (!buf) return -1;

    // snprintf returns the length it WOULD have written. The previous
    // `n += snprintf(buf + n, buf_size - n, ...)` therefore let n exceed
    // buf_size on truncation, and since buf_size - n is size_t, that
    // underflowed to ~2^64 - so the next snprintf was handed a colossal
    // "remaining space" and wrote past the end of the buffer.
    //
    // APPEND checks each result against the space actually left and bails
    // out instead.
    size_t n = 0;
    int written;

#define APPEND(...)                                                   \
    do {                                                              \
        written = snprintf(buf + n, buf_size - n, __VA_ARGS__);       \
        if (written < 0 || (size_t)written >= buf_size - n) {          \
            free(buf);                                                \
            return -1;                                                \
        }                                                             \
        n += (size_t)written;                                         \
    } while (0)

    APPEND("tree %s\n", tree_hex);
    if (commit->has_parent) {
        hash_to_hex(&commit->parent, parent_hex);
        APPEND("parent %s\n", parent_hex);
    }
    APPEND("author %s %" PRIu64 "\n"
           "committer %s %" PRIu64 "\n"
           "\n"
           "%s",
           commit->author, commit->timestamp,
           commit->author, commit->timestamp,
           commit->message);

#undef APPEND

    *data_out = buf;
    *len_out = n;
    return 0;
}

int commit_walk(commit_walk_fn callback, void *ctx) {
    ObjectID id;
    if (head_read(&id) != 0) return -1;

    while (1) {
        ObjectType type;
        void *raw;
        size_t raw_len;
        if (object_read(&id, &type, &raw, &raw_len) != 0) return -1;

        // Ensure null termination for commit_parse
        char *buf = malloc(raw_len + 1);
        if (!buf) { free(raw); return -1; }
        memcpy(buf, raw, raw_len);
        buf[raw_len] = '\0';
        free(raw);

        Commit c;
        int rc = commit_parse(buf, raw_len, &c);
        free(buf);
        if (rc != 0) return -1;

        callback(&id, &c, ctx);

        if (!c.has_parent) break;
        id = c.parent;
    }
    return 0;
}

int head_read(ObjectID *id_out) {
    FILE *f = fopen(HEAD_FILE, "r");
    if (!f) return -1;
    char line[512];
    if (!fgets(line, sizeof(line), f)) { fclose(f); return -1; }
    fclose(f);
    line[strcspn(line, "\r\n")] = '\0';

    char ref_path[512];
    if (strncmp(line, "ref: ", 5) == 0) {
        snprintf(ref_path, sizeof(ref_path), "%s/%s", PES_DIR, line + 5);
        f = fopen(ref_path, "r");
        if (!f) return -1;
        if (!fgets(line, sizeof(line), f)) { fclose(f); return -1; }
        fclose(f);
        line[strcspn(line, "\r\n")] = '\0';
    }
    return hex_to_hash(line, id_out);
}

int head_update(const ObjectID *new_commit) {
    FILE *f = fopen(HEAD_FILE, "r");
    if (!f) return -1;
    char line[512];
    if (!fgets(line, sizeof(line), f)) { fclose(f); return -1; }
    fclose(f);
    line[strcspn(line, "\r\n")] = '\0';

    char target_path[520];
    if (strncmp(line, "ref: ", 5) == 0) {
        snprintf(target_path, sizeof(target_path), "%s/%s", PES_DIR, line + 5);
    } else {
        snprintf(target_path, sizeof(target_path), "%s", HEAD_FILE);
    }

    char tmp_path[528];
    snprintf(tmp_path, sizeof(tmp_path), "%s.tmp", target_path);

    f = fopen(tmp_path, "w");
    if (!f) return -1;

    char hex[HASH_HEX_SIZE + 1];
    hash_to_hex(new_commit, hex);
    fprintf(f, "%s\n", hex);

    fflush(f);
    fsync(fileno(f));
    fclose(f);

    return rename(tmp_path, target_path);
}

// ─── IMPLEMENTED ─────────────────────────────────────────────────────────────

int commit_create(const char *message, ObjectID *commit_id_out) {
    // Step 1: Build tree from index
    ObjectID tree_id;
    if (tree_from_index(&tree_id) != 0) {
        fprintf(stderr, "error: nothing to commit\n");
        return -1;
    }

    // Step 2: Fill commit struct
    Commit commit;
    memset(&commit, 0, sizeof(commit));
    memcpy(commit.tree.hash, tree_id.hash, HASH_SIZE);

    // Step 3: Read parent (may not exist for first commit)
    ObjectID parent_id;
    if (head_read(&parent_id) == 0) {
        commit.has_parent = 1;
        memcpy(commit.parent.hash, parent_id.hash, HASH_SIZE);
    } else {
        commit.has_parent = 0;
    }

    // Step 4: Set author and timestamp
    snprintf(commit.author, sizeof(commit.author), "%s", pes_author());
    commit.timestamp = (uint64_t)time(NULL);

    // Step 5: Set message
    snprintf(commit.message, sizeof(commit.message), "%s", message);

    // Step 6: Serialize commit
    void *data;
    size_t len;
    if (commit_serialize(&commit, &data, &len) != 0) return -1;

    // Step 7: Write commit object
    if (object_write(OBJ_COMMIT, data, len, commit_id_out) != 0) {
        free(data);
        return -1;
    }
    free(data);

    // Step 8: Update HEAD
    return head_update(commit_id_out);
}
