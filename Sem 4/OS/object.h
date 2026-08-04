// object.h — Content-addressable object store interface
//
// object.c had no header of its own. tree.c and commit.c each carried a
// hand-written forward declaration of object_write/object_read, and index.c
// forgot to, so its call to object_write compiled as an implicit declaration
// (an error in C99 onwards, and a hard error under C23). This header is the
// single declaration point.

#ifndef OBJECT_H
#define OBJECT_H

#include "pes.h"

// Compute the SHA-256 of `len` bytes at `data`.
void compute_hash(const void *data, size_t len, ObjectID *id_out);

// Fill `path_out` with the on-disk path for `id` (".pes/objects/ab/cdef...").
void object_path(const ObjectID *id, char *path_out, size_t path_size);

// Non-zero if the object already exists in the store.
int object_exists(const ObjectID *id);

// Write `data` as an object of `type`, storing its identity in *id_out.
// Existing objects are deduplicated. Returns 0 on success, -1 on error.
int object_write(ObjectType type, const void *data, size_t len, ObjectID *id_out);

// Read the object named by `id`, verifying its content hash.
// On success *data_out is a malloc'd buffer the caller must free.
// Returns 0 on success, -1 if missing, unreadable or corrupt.
int object_read(const ObjectID *id, ObjectType *type_out, void **data_out, size_t *len_out);

#endif // OBJECT_H
