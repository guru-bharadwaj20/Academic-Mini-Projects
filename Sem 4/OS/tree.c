// tree.c — Tree object serialization and construction

#include "pes.h"
#include "tree.h"
#include "index.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <sys/stat.h>

// Forward declaration
int object_write(ObjectType type, const void *data, size_t len, ObjectID *id_out);

#define MODE_FILE      0100644
#define MODE_EXEC      0100755
#define MODE_DIR       0040000

// ─── PROVIDED ───────────────────────────────────────────────────────────────

uint32_t get_file_mode(const char *path) {
    struct stat st;
    if (lstat(path, &st) != 0) return 0;
    if (S_ISDIR(st.st_mode))  return MODE_DIR;
    if (st.st_mode & S_IXUSR) return MODE_EXEC;
    return MODE_FILE;
}

int tree_parse(const void *data, size_t len, Tree *tree_out) {
    tree_out->count = 0;
    const uint8_t *ptr = (const uint8_t *)data;
    const uint8_t *end = ptr + len;

    while (ptr < end && tree_out->count < MAX_TREE_ENTRIES) {
        TreeEntry *entry = &tree_out->entries[tree_out->count];

        const uint8_t *space = memchr(ptr, ' ', end - ptr);
        if (!space) return -1;

        char mode_str[16] = {0};
        size_t mode_len = space - ptr;
        if (mode_len >= sizeof(mode_str)) return -1;
        memcpy(mode_str, ptr, mode_len);
        entry->mode = strtol(mode_str, NULL, 8);

        ptr = space + 1;

        const uint8_t *null_byte = memchr(ptr, '\0', end - ptr);
        if (!null_byte) return -1;

        size_t name_len = null_byte - ptr;
        if (name_len >= sizeof(entry->name)) return -1;
        memcpy(entry->name, ptr, name_len);
        entry->name[name_len] = '\0';

        ptr = null_byte + 1;

        if (ptr + HASH_SIZE > end) return -1;
        memcpy(entry->hash.hash, ptr, HASH_SIZE);
        ptr += HASH_SIZE;

        tree_out->count++;
    }
    return 0;
}

static int compare_tree_entries(const void *a, const void *b) {
    return strcmp(((const TreeEntry *)a)->name, ((const TreeEntry *)b)->name);
}

int tree_serialize(const Tree *tree, void **data_out, size_t *len_out) {
    /* An empty tree is legitimate. malloc(0) may return NULL, which the old
       `if (!buffer) return -1;` reported as a failure. */
    if (tree->count <= 0) {
        *data_out = NULL;
        *len_out = 0;
        return 0;
    }

    size_t max_size = (size_t)tree->count * 296;
    uint8_t *buffer = malloc(max_size);
    if (!buffer) return -1;

    /* This copied the whole ~292 KB Tree struct onto the stack just to sort
       it, regardless of how many entries were actually in use. Copy only the
       live entries instead. */
    TreeEntry *sorted = malloc((size_t)tree->count * sizeof(TreeEntry));
    if (sorted == NULL) { free(buffer); return -1; }
    memcpy(sorted, tree->entries, (size_t)tree->count * sizeof(TreeEntry));
    qsort(sorted, tree->count, sizeof(TreeEntry), compare_tree_entries);

    size_t offset = 0;
    for (int i = 0; i < tree->count; i++) {
        const TreeEntry *entry = &sorted[i];
        int written = sprintf((char *)buffer + offset, "%o %s", entry->mode, entry->name);
        offset += written + 1;
        memcpy(buffer + offset, entry->hash.hash, HASH_SIZE);
        offset += HASH_SIZE;
    }

    free(sorted);

    *data_out = buffer;
    *len_out = offset;
    return 0;
}

// ─── IMPLEMENTED ─────────────────────────────────────────────────────────────

static int write_tree_level(IndexEntry *entries, int count, int depth, ObjectID *id_out) {
    /* sizeof(Tree) is ~292 KB and this function recurses once per directory
       level, so a deep tree multiplied that down the stack. Heap-allocate. */
    Tree *tree = malloc(sizeof(Tree));
    if (tree == NULL) return -1;
    tree->count = 0;

    int i = 0;
    while (i < count) {
        char *path = entries[i].path;
        char *p = path;
        for (int d = 0; d < depth; d++) {
            p = strchr(p, '/');
            if (!p) { free(tree); return -1; }
            p++;
        }

        char *slash = strchr(p, '/');

        if (!slash) {
            TreeEntry *entry = &tree->entries[tree->count];
            entry->mode = entries[i].mode;
            strncpy(entry->name, p, sizeof(entry->name) - 1);
            entry->name[sizeof(entry->name) - 1] = '\0';
            memcpy(entry->hash.hash, entries[i].hash.hash, HASH_SIZE);
            tree->count++;
            i++;
        } else {
            char dir_name[256];
            size_t dir_len = slash - p;
            if (dir_len >= sizeof(dir_name)) { free(tree); return -1; }
            memcpy(dir_name, p, dir_len);
            dir_name[dir_len] = '\0';

            int j = i;
            while (j < count) {
                char *pj = entries[j].path;
                for (int d = 0; d < depth; d++) {
                    pj = strchr(pj, '/');
                    if (!pj) break;
                    pj++;
                }
                if (!pj) break;
                char *sj = strchr(pj, '/');
                if (!sj) break;
                size_t len = sj - pj;
                if (len != dir_len || strncmp(pj, dir_name, dir_len) != 0) break;
                j++;
            }

            ObjectID sub_id;
            if (write_tree_level(entries + i, j - i, depth + 1, &sub_id) != 0) {
                free(tree);
                return -1;
            }

            TreeEntry *entry = &tree->entries[tree->count];
            entry->mode = MODE_DIR;
            strncpy(entry->name, dir_name, sizeof(entry->name) - 1);
            entry->name[sizeof(entry->name) - 1] = '\0';
            memcpy(entry->hash.hash, sub_id.hash, HASH_SIZE);
            tree->count++;
            i = j;
        }
    }

    void *data;
    size_t len;
    if (tree_serialize(tree, &data, &len) != 0) { free(tree); return -1; }
    free(tree);

    int ret = object_write(OBJ_TREE, data, len, id_out);
    free(data);
    return ret;
}

int tree_from_index(ObjectID *id_out) {
    /* sizeof(Index) is ~5.42 MB - too large for the stack, and the memset
       below zeroed all of it on every commit. */
    Index *idx = malloc(sizeof(Index));
    if (idx == NULL) return -1;

    memset(idx, 0, sizeof(*idx));
    if (index_load(idx) != 0 || idx->count == 0) {
        free(idx);
        return -1;
    }

    int rc = write_tree_level(idx->entries, idx->count, 0, id_out);
    free(idx);
    return rc;
}
