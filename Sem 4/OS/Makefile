CC = gcc
CFLAGS = -Wall -Wextra -O2 -MMD -MP
LDFLAGS = -lcrypto

# ─── Main binary ─────────────────────────────────────────────────────────────

SRCS = object.c tree.c index.c commit.c pes.c
OBJS = $(SRCS:.c=.o)

pes: $(OBJS)
	$(CC) -o $@ $^ $(LDFLAGS)

# -MMD -MP (in CFLAGS) makes the compiler emit a .d file listing every header
# each object really depends on, which is then included below. The old
# hand-maintained "%.o: %.c pes.h" listed only pes.h, so editing tree.h,
# index.h or commit.h triggered no rebuild and left stale objects linking
# against a changed struct layout.
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# ─── Test binaries ───────────────────────────────────────────────────────────

test_objects: test_objects.o object.o
	$(CC) -o $@ $^ $(LDFLAGS)

# tree.o pulls in index_load via tree_from_index, so index.o must be linked too.
test_tree: test_tree.o object.o tree.o index.o
	$(CC) -o $@ $^ $(LDFLAGS)

# ─── Convenience targets ────────────────────────────────────────────────────

.PHONY: all clean test test-unit test-integration

all: pes test_objects test_tree

clean:
	rm -f pes test_objects test_tree $(OBJS) test_objects.o test_tree.o
	rm -f $(OBJS:.o=.d) test_objects.d test_tree.d
	rm -rf .pes

test: test-unit test-integration

test-unit: test_objects test_tree
	@echo "=== Running Phase 1 tests ==="
	./test_objects
	@echo ""
	@echo "=== Running Phase 2 tests ==="
	./test_tree

test-integration: pes
	@echo "=== Running integration tests ==="
	bash test_sequence.sh

# ─── Generated header dependencies ──────────────────────────────────────────

DEPS = $(OBJS:.o=.d) test_objects.d test_tree.d
-include $(DEPS)
