// commit.h — Commit object interface
//
// A commit ties together a tree snapshot, parent history, author info,
// and a human-readable message.

#ifndef COMMIT_H
#define COMMIT_H

#include "pes.h"

typedef struct {
    ObjectID tree;          // Root tree hash (the project snapshot)
    ObjectID parent;        // Parent commit hash
    int has_parent;         // 0 for the initial commit, 1 otherwise
    char author[256];       // Author string (from PES_AUTHOR env var)
    uint64_t timestamp;     // Unix timestamp of commit creation
    char message[4096];     // Commit message
} Commit;

// Create a commit from the current index.
//   1. Build a tree from the index (using tree_from_index)
//   2. Read current HEAD as the parent (may not exist for first commit)
//   3. Create the commit object and write it to the object store
//   4. Update HEAD/branch ref to point to the new commit
// Returns 0 on success, -1 on error.
int commit_create(const char *message, ObjectID *commit_id_out);

// Parse raw commit object data into a Commit struct.
int commit_parse(const void *data, size_t len, Commit *commit_out);

// Serialize a Commit struct into raw bytes for object_write(OBJ_COMMIT, ...).
// Caller must free(*data_out).
int commit_serialize(const Commit *commit, void **data_out, size_t *len_out);

// Walk commit history starting from HEAD, following parent pointers.
// Calls `callback` for each commit, from newest to oldest.
// Stops at the root commit (no parent).
typedef void (*commit_walk_fn)(const ObjectID *id, const Commit *commit, void *ctx);
int commit_walk(commit_walk_fn callback, void *ctx);

// ─── HEAD helpers ───────────────────────────────────────────────────────────

// Distinguishes "this branch has no commits yet" from a genuine failure.
#define HEAD_NO_COMMITS 1

// Read the commit hash that HEAD currently points to.
// Follows symbolic refs: if HEAD contains "ref: refs/heads/main",
// reads .pes/refs/heads/main to get the actual commit hash.
//
// Returns:
//    0                 success, *id_out is the current commit
//    HEAD_NO_COMMITS   empty repository - HEAD is valid but the branch it
//                      names has no commits yet
//   -1                 HEAD is missing, unreadable or corrupt
//
// Callers MUST tell the last two apart: treating a corrupt ref as "empty"
// makes the next commit a parentless root and orphans all history.
int head_read(ObjectID *id_out);

// Update HEAD (or the branch it points to) to a new commit hash.
// Must use atomic write (temp file + rename).
int head_update(const ObjectID *new_commit);

#endif // COMMIT_H
