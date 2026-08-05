// index.c — Staging area implementation

#include "index.h"
#include "object.h"
#include "commit.h"
#include "tree.h"
#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <dirent.h>

// ─── PROVIDED ────────────────────────────────────────────────────────────────

IndexEntry* index_find(Index *index, const char *path) {
    for (int i = 0; i < index->count; i++) {
        if (strcmp(index->entries[i].path, path) == 0)
            return &index->entries[i];
    }
    return NULL;
}

int index_remove(Index *index, const char *path) {
    for (int i = 0; i < index->count; i++) {
        if (strcmp(index->entries[i].path, path) == 0) {
            int remaining = index->count - i - 1;
            if (remaining > 0)
                memmove(&index->entries[i], &index->entries[i + 1],
                        remaining * sizeof(IndexEntry));
            index->count--;
            return index_save(index);
        }
    }
    fprintf(stderr, "error: '%s' is not in the index\n", path);
    return -1;
}

// Is `path` recorded in HEAD's tree with exactly this blob hash?
// Used to tell "staged" (differs from HEAD) from "already committed".
static int matches_head(const char *path, const ObjectID *hash);

// Recursively list untracked files, skipping the repository's own metadata.
static void scan_untracked(const Index *index, const char *dir, int *count);

int index_status(const Index *index) {
    printf("Staged changes:\n");
    int staged_count = 0;
    for (int i = 0; i < index->count; i++) {
        // Only entries that DIFFER from HEAD are staged. This used to dump
        // the whole index, so everything still showed as "staged" forever
        // after a commit - index.h documents a HEAD comparison, which was
        // never implemented.
        if (matches_head(index->entries[i].path, &index->entries[i].hash))
            continue;
        printf("  staged:     %s\n", index->entries[i].path);
        staged_count++;
    }
    if (staged_count == 0) printf("  (nothing to show)\n");
    printf("\n");

    printf("Unstaged changes:\n");
    int unstaged_count = 0;
    for (int i = 0; i < index->count; i++) {
        struct stat st;
        if (stat(index->entries[i].path, &st) != 0) {
            printf("  deleted:    %s\n", index->entries[i].path);
            unstaged_count++;
        } else {
            if (st.st_mtime != (time_t)index->entries[i].mtime_sec ||
                st.st_size != (off_t)index->entries[i].size) {
                printf("  modified:   %s\n", index->entries[i].path);
                unstaged_count++;
            }
        }
    }
    if (unstaged_count == 0) printf("  (nothing to show)\n");
    printf("\n");

    printf("Untracked files:\n");
    int untracked_count = 0;
    scan_untracked(index, ".", &untracked_count);
    if (untracked_count == 0) printf("  (nothing to show)\n");
    printf("\n");

    return 0;
}

// ─── index_status helpers ───────────────────────────────────────────────────

static int matches_head(const char *path, const ObjectID *hash) {
    ObjectID head_id;
    if (head_read(&head_id) != 0) return 0;          // no commits yet

    ObjectType type;
    void *data = NULL;
    size_t len = 0;
    if (object_read(&head_id, &type, &data, &len) != 0 || type != OBJ_COMMIT) {
        free(data);
        return 0;
    }

    char *text = malloc(len + 1);
    if (!text) { free(data); return 0; }
    memcpy(text, data, len);
    text[len] = '\0';
    free(data);

    Commit head_commit;
    int parsed = commit_parse(text, len, &head_commit);
    free(text);
    if (parsed != 0) return 0;

    // Walk the tree hierarchy down to `path`, one component at a time.
    ObjectID current = head_commit.tree;
    const char *segment = path;

    for (;;) {
        const char *slash = strchr(segment, '/');
        size_t seg_len = slash ? (size_t)(slash - segment) : strlen(segment);

        if (object_read(&current, &type, &data, &len) != 0 || type != OBJ_TREE) {
            free(data);
            return 0;
        }

        Tree *tree = malloc(sizeof(Tree));
        if (!tree) { free(data); return 0; }
        int ok = (tree_parse(data, len, tree) == 0);
        free(data);
        if (!ok) { free(tree); return 0; }

        int found = 0;
        for (int i = 0; i < tree->count; i++) {
            if (strlen(tree->entries[i].name) != seg_len) continue;
            if (strncmp(tree->entries[i].name, segment, seg_len) != 0) continue;
            current = tree->entries[i].hash;
            found = 1;
            break;
        }
        free(tree);
        if (!found) return 0;

        if (!slash) break;
        segment = slash + 1;
    }

    return memcmp(current.hash, hash->hash, HASH_SIZE) == 0;
}

static void scan_untracked(const Index *index, const char *dir, int *count) {
    DIR *d = opendir(dir);
    if (!d) return;

    struct dirent *ent;
    while ((ent = readdir(d)) != NULL) {
        if (strcmp(ent->d_name, ".") == 0 || strcmp(ent->d_name, "..") == 0) continue;
        if (strcmp(ent->d_name, ".pes") == 0) continue;
        if (strcmp(ent->d_name, ".git") == 0) continue;

        char full[512];
        if (strcmp(dir, ".") == 0)
            snprintf(full, sizeof(full), "%s", ent->d_name);
        else
            snprintf(full, sizeof(full), "%s/%s", dir, ent->d_name);

        struct stat st;
        if (stat(full, &st) != 0) continue;   // was unchecked: S_ISREG read
                                              // uninitialised memory on failure

        if (S_ISDIR(st.st_mode)) {
            // Recurse. The old version scanned only ".", so untracked files
            // in subdirectories were never reported - even though the index
            // fully supports nested paths like "src/main.c".
            scan_untracked(index, full, count);
            continue;
        }

        if (!S_ISREG(st.st_mode)) continue;

        // Skip build artefacts by suffix. The old test was
        // strstr(name, ".o") != NULL, which matched ANY name CONTAINING
        // ".o" - hiding notes.org, config.old, report.odt and so on.
        size_t n = strlen(ent->d_name);
        if (n >= 2 && strcmp(ent->d_name + n - 2, ".o") == 0) continue;
        if (n >= 2 && strcmp(ent->d_name + n - 2, ".d") == 0) continue;
        if (strcmp(ent->d_name, "pes") == 0 || strcmp(ent->d_name, "pes.exe") == 0) continue;

        int is_tracked = 0;
        for (int i = 0; i < index->count; i++) {
            if (strcmp(index->entries[i].path, full) == 0) { is_tracked = 1; break; }
        }
        if (is_tracked) continue;

        printf("  untracked:  %s\n", full);
        (*count)++;
    }
    closedir(d);
}

// ─── IMPLEMENTED ─────────────────────────────────────────────────────────────

int index_load(Index *index) {
    index->count = 0;
    FILE *f = fopen(INDEX_FILE, "r");
    if (!f) return 0;

    while (index->count < MAX_INDEX_ENTRIES) {
        IndexEntry *e = &index->entries[index->count];
        char hex[HASH_HEX_SIZE + 1];

        /* mtime_sec is uint64_t. Reading it with "%u" wrote only 32 bits
           and left the upper half indeterminate, so index_status compared
           file mtimes against garbage and reported clean files as
           modified. SCNu64/PRIu64 keep the width correct on every
           platform. */
        // "%511s" stops at the first whitespace, so `pes add "my file.txt"`
        // stored only "my" and the index line no longer round-tripped. The
        // path is the final field, so read it to the end of the line instead.
        // The leading space in the format skips the separator.
        int rc = fscanf(f, "%o %64s %" SCNu64 " %u %511[^\n]",
                        &e->mode, hex,
                        &e->mtime_sec, &e->size, e->path);
        if (rc != 5) break;

        if (hex_to_hash(hex, &e->hash) != 0) { fclose(f); return -1; }
        index->count++;
    }

    fclose(f);
    return 0;
}

static int compare_index_entries(const void *a, const void *b) {
    return strcmp(((const IndexEntry *)a)->path, ((const IndexEntry *)b)->path);
}

int index_save(const Index *index) {
    char tmp_path[256];
    snprintf(tmp_path, sizeof(tmp_path), "%s.tmp", INDEX_FILE);

    FILE *f = fopen(tmp_path, "w");
    if (!f) return -1;

    Index *sorted = malloc(sizeof(Index));
    if (!sorted) { fclose(f); return -1; }
    *sorted = *index;
    qsort(sorted->entries, sorted->count, sizeof(IndexEntry), compare_index_entries);

    for (int i = 0; i < sorted->count; i++) {
        IndexEntry *e = &sorted->entries[i];
        char hex[HASH_HEX_SIZE + 1];
        hash_to_hex(&e->hash, hex);
        fprintf(f, "%o %s %" PRIu64 " %u %s\n",
                e->mode, hex, e->mtime_sec, e->size, e->path);
    }

    free(sorted);
    fflush(f);
    fsync(fileno(f));
    fclose(f);
    rename(tmp_path, INDEX_FILE);
    return 0;
}

int index_add(Index *index, const char *path) {
    FILE *f = fopen(path, "rb");
    if (!f) { fprintf(stderr, "error: cannot open '%s'\n", path); return -1; }
    fseek(f, 0, SEEK_END);
    size_t size = ftell(f);
    fseek(f, 0, SEEK_SET);
    void *data = malloc(size + 1);
    if (!data) { fclose(f); return -1; }
    if (size > 0 && fread(data, 1, size, f) != size) {
        free(data); fclose(f); return -1;
    }
    fclose(f);

    ObjectID id;
    if (object_write(OBJ_BLOB, data, size, &id) != 0) { free(data); return -1; }
    free(data);

    struct stat st;
    if (lstat(path, &st) != 0) return -1;

    IndexEntry *entry = index_find(index, path);
    if (!entry) {
        if (index->count >= MAX_INDEX_ENTRIES) return -1;
        entry = &index->entries[index->count++];
    }

    strncpy(entry->path, path, sizeof(entry->path) - 1);
    entry->path[sizeof(entry->path) - 1] = '\0';
    memcpy(entry->hash.hash, id.hash, HASH_SIZE);
    entry->mode = (st.st_mode & S_IXUSR) ? 0100755 : 0100644;
    entry->mtime_sec = (uint32_t)st.st_mtime;
    entry->size = (uint32_t)st.st_size;

    return index_save(index);
}
