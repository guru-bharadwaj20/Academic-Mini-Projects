// pes.c — CLI entry point and command dispatch
//
// This file is PROVIDED. Do not modify.

#include "pes.h"
#include "index.h"
#include "commit.h"
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

// ─── PROVIDED: Command Implementations ──────────────────────────────────────

// Usage: pes init
int cmd_init(void) {
    if (pes_mkdir(PES_DIR) != 0 && access(PES_DIR, F_OK) != 0) {
        fprintf(stderr, "error: failed to create %s\n", PES_DIR);
        return 1;
    }
    pes_mkdir(OBJECTS_DIR);
    pes_mkdir(".pes/refs");
    pes_mkdir(REFS_DIR);

    if (access(HEAD_FILE, F_OK) != 0) {
        FILE *f = fopen(HEAD_FILE, "w");
        if (f) {
            fprintf(f, "ref: refs/heads/main\n");
            fclose(f);
        }
    }

    printf("Initialized empty PES repository in %s/\n", PES_DIR);
    return 0;
}

// Usage: pes add <file>...
int cmd_add(int argc, char *argv[]) {
    if (argc < 3) {
        fprintf(stderr, "Usage: pes add <file>...\n");
        return 1;
    }

    // sizeof(Index) is ~5.42 MB (MAX_INDEX_ENTRIES * sizeof(IndexEntry)).
    // As a stack local that overflows the default 1 MB thread stack on
    // Windows outright, and consumes most of Linux's 8 MB. Heap-allocate it.
    Index *index = malloc(sizeof(Index));
    if (index == NULL) {
        fprintf(stderr, "error: out of memory\n");
        return 1;
    }

    if (index_load(index) != 0) {
        fprintf(stderr, "error: failed to load index\n");
        free(index);
        return 1;
    }

    // Report failure if ANY file could not be staged.
    int failures = 0;
    for (int i = 2; i < argc; i++) {
        if (index_add(index, argv[i]) != 0) {
            fprintf(stderr, "error: failed to add '%s'\n", argv[i]);
            failures++;
        }
    }

    free(index);
    return failures == 0 ? 0 : 1;
}

// Usage: pes status
int cmd_status(void) {
    // See cmd_add: sizeof(Index) is far too large for the stack.
    Index *index = malloc(sizeof(Index));
    if (index == NULL) {
        fprintf(stderr, "error: out of memory\n");
        return 1;
    }

    if (index_load(index) != 0) {
        fprintf(stderr, "error: failed to load index\n");
        free(index);
        return 1;
    }
    index_status(index);
    free(index);
    return 0;
}

// Usage: pes commit -m <message>
int cmd_commit(int argc, char *argv[]) {
    if (argc < 4 || strcmp(argv[2], "-m") != 0) {
        fprintf(stderr, "error: commit requires a message (-m \"message\")\n");
        return 1;
    }

    const char *message = argv[3];
    ObjectID commit_id;
    if (commit_create(message, &commit_id) != 0) {
        fprintf(stderr, "error: commit failed\n");
        return 1;
    }

    char hex[HASH_HEX_SIZE + 1];
    hash_to_hex(&commit_id, hex);
    printf("Committed: %.12s... %s\n", hex, message);
    return 0;
}

// Callback for commit_walk used by cmd_log.
static void print_commit(const ObjectID *id, const Commit *commit, void *ctx) {
    (void)ctx;
    char hex[HASH_HEX_SIZE + 1];
    hash_to_hex(id, hex);
    printf("commit %s\n", hex);
    printf("Author: %s\n", commit->author);
    printf("Date:   %llu\n", (unsigned long long)commit->timestamp);
    printf("\n    %s\n\n", commit->message);
}

// Usage: pes log
int cmd_log(void) {
    if (commit_walk(print_commit, NULL) != 0) {
        fprintf(stderr, "No commits yet.\n");
        return 1;
    }
    return 0;
}

// ─── PROVIDED: Command dispatch ─────────────────────────────────────────────

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "Usage: pes <command> [args]\n");
        fprintf(stderr, "\nCommands:\n");
        fprintf(stderr, "  init            Create a new PES repository\n");
        fprintf(stderr, "  add <file>...   Stage files for commit\n");
        fprintf(stderr, "  status          Show working directory status\n");
        fprintf(stderr, "  commit -m <msg> Create a commit from staged files\n");
        fprintf(stderr, "  log             Show commit history\n");
        return 1;
    }

    const char *cmd = argv[1];

    // Propagate the command's status. main() used to return 0 no matter what
    // happened, so a failed add or commit still looked like success to any
    // script, Makefile or test harness driving this binary - which is also
    // why the integration test could not assert on error paths.
    if      (strcmp(cmd, "init") == 0)     return cmd_init();
    else if (strcmp(cmd, "add") == 0)      return cmd_add(argc, argv);
    else if (strcmp(cmd, "status") == 0)   return cmd_status();
    else if (strcmp(cmd, "commit") == 0)   return cmd_commit(argc, argv);
    else if (strcmp(cmd, "log") == 0)      return cmd_log();

    fprintf(stderr, "Unknown command: %s\n", cmd);
    fprintf(stderr, "Run 'pes' with no arguments for usage.\n");
    return 1;
}
