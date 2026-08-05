// object.c — Content-addressable object store

#include "pes.h"
#include "object.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <openssl/evp.h>

// ─── PROVIDED ────────────────────────────────────────────────────────────────

void hash_to_hex(const ObjectID *id, char *hex_out) {
    for (int i = 0; i < HASH_SIZE; i++) {
        sprintf(hex_out + i * 2, "%02x", id->hash[i]);
    }
    hex_out[HASH_HEX_SIZE] = '\0';
}

int hex_to_hash(const char *hex, ObjectID *id_out) {
    if (strlen(hex) < HASH_HEX_SIZE) return -1;
    for (int i = 0; i < HASH_SIZE; i++) {
        unsigned int byte;
        if (sscanf(hex + i * 2, "%2x", &byte) != 1) return -1;
        id_out->hash[i] = (uint8_t)byte;
    }
    return 0;
}

void compute_hash(const void *data, size_t len, ObjectID *id_out) {
    unsigned int hash_len;
    EVP_MD_CTX *ctx = EVP_MD_CTX_new();
    if (ctx == NULL) {
        // Previously unchecked: a NULL ctx was passed straight to
        // EVP_DigestInit_ex and dereferenced.
        memset(id_out->hash, 0, HASH_SIZE);
        return;
    }
    EVP_DigestInit_ex(ctx, EVP_sha256(), NULL);
    EVP_DigestUpdate(ctx, data, len);
    EVP_DigestFinal_ex(ctx, id_out->hash, &hash_len);
    EVP_MD_CTX_free(ctx);
}

void object_path(const ObjectID *id, char *path_out, size_t path_size) {
    char hex[HASH_HEX_SIZE + 1];
    hash_to_hex(id, hex);
    snprintf(path_out, path_size, "%s/%.2s/%s", OBJECTS_DIR, hex, hex + 2);
}

int object_exists(const ObjectID *id) {
    char path[512];
    object_path(id, path, sizeof(path));
    return access(path, F_OK) == 0;
}

// ─── IMPLEMENTED ─────────────────────────────────────────────────────────────

int object_write(ObjectType type, const void *data, size_t len, ObjectID *id_out) {
    const char *type_str = (type == OBJ_BLOB) ? "blob" :
                           (type == OBJ_TREE) ? "tree" : "commit";

    // Step 1: Build header + full object
    char header[64];
    int header_len = snprintf(header, sizeof(header), "%s %zu", type_str, len);
    header[header_len] = '\0';
    size_t full_len = header_len + 1 + len;
    uint8_t *full = malloc(full_len);
    if (!full) return -1;
    memcpy(full, header, header_len + 1);
    memcpy(full + header_len + 1, data, len);

    // Step 2: Compute hash
    compute_hash(full, full_len, id_out);

    // Step 3: Deduplication
    if (object_exists(id_out)) { free(full); return 0; }

    // Step 4: Create shard directory.
    // EEXIST is fine (another object already sharded here); anything else is
    // fatal, and was previously ignored.
    char hex[HASH_HEX_SIZE + 1];
    hash_to_hex(id_out, hex);
    char shard_dir[512];
    snprintf(shard_dir, sizeof(shard_dir), "%s/%.2s", OBJECTS_DIR, hex);
    if (pes_mkdir(shard_dir) != 0 && errno != EEXIST) {
        free(full);
        return -1;
    }

    // Step 5: Write to temp file
    char tmp_path[512];
    snprintf(tmp_path, sizeof(tmp_path), "%s/tmp_XXXXXX", shard_dir);
    int fd = mkstemp(tmp_path);
    if (fd < 0) { free(full); return -1; }

    // write() may satisfy only part of the request; the old single call
    // treated a short write as success and stored a truncated object.
    size_t written_total = 0;
    while (written_total < full_len) {
        ssize_t n = write(fd, full + written_total, full_len - written_total);
        if (n <= 0) {
            free(full);
            close(fd);
            unlink(tmp_path);
            return -1;
        }
        written_total += (size_t)n;
    }
    free(full);

    // Step 6: fsync temp file, then close.
    // Every one of these error paths used to leak its tmp_XXXXXX file into
    // the shard directory.
    if (fsync(fd) != 0) { close(fd); unlink(tmp_path); return -1; }
    if (close(fd) != 0) { unlink(tmp_path); return -1; }

    // Step 7: Rename to final path
    char final_path[512];
    object_path(id_out, final_path, sizeof(final_path));
    if (rename(tmp_path, final_path) != 0) {
        // Silently losing this meant the object was reported as written but
        // was not in the store, so a later read failed with no explanation.
        unlink(tmp_path);
        return -1;
    }

    // Step 8: fsync shard directory so the rename is durable.
    // Best-effort: not supported on every platform/filesystem.
    int dir_fd = open(shard_dir, O_RDONLY);
    if (dir_fd >= 0) { fsync(dir_fd); close(dir_fd); }

    return 0;
}

int object_read(const ObjectID *id, ObjectType *type_out, void **data_out, size_t *len_out) {
    // Step 1: Get path
    char path[512];
    object_path(id, path, sizeof(path));

    // Step 2: Read file
    FILE *f = fopen(path, "rb");
    if (!f) return -1;
    if (fseek(f, 0, SEEK_END) != 0) { fclose(f); return -1; }
    long sz = ftell(f);
    // ftell() returns -1 on error; assigning that straight into a size_t
    // produced SIZE_MAX and a nonsensical allocation request.
    if (sz <= 0) { fclose(f); return -1; }
    size_t full_len = (size_t)sz;
    if (fseek(f, 0, SEEK_SET) != 0) { fclose(f); return -1; }
    uint8_t *full = malloc(full_len);
    if (!full) { fclose(f); return -1; }
    if (fread(full, 1, full_len, f) != full_len) { free(full); fclose(f); return -1; }
    fclose(f);

    // Step 3: Verify integrity
    ObjectID computed;
    compute_hash(full, full_len, &computed);
    if (memcmp(computed.hash, id->hash, HASH_SIZE) != 0) { free(full); return -1; }

    // Step 4: Parse header (find the '\0')
    uint8_t *null_ptr = memchr(full, '\0', full_len);
    if (!null_ptr) { free(full); return -1; }

    // Step 5: Parse type
    if (strncmp((char *)full, "blob", 4) == 0) *type_out = OBJ_BLOB;
    else if (strncmp((char *)full, "tree", 4) == 0) *type_out = OBJ_TREE;
    else if (strncmp((char *)full, "commit", 6) == 0) *type_out = OBJ_COMMIT;
    else { free(full); return -1; }

    // Step 6: Extract data
    size_t header_len = null_ptr - full;
    size_t data_len = full_len - header_len - 1;
    void *data = malloc(data_len);
    if (!data) { free(full); return -1; }
    memcpy(data, null_ptr + 1, data_len);
    *data_out = data;
    *len_out = data_len;

    free(full);
    return 0;
}
