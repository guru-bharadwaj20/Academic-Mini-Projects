#!/usr/bin/env bash
# test_sequence.sh — end-to-end integration test for pes
#
# Run:  make test-integration      (or: bash test_sequence.sh)
#
# Drives the CLI through a full init -> add -> status -> commit -> log
# cycle inside a scratch directory, so it never touches the real repo.

set -u

PES_BIN="$(cd "$(dirname "$0")" && pwd)/pes"
WORKDIR="$(mktemp -d 2>/dev/null || echo "./.pes-itest-$$")"

passed=0
failed=0

check() {
    local msg="$1"
    shift
    if "$@" >/dev/null 2>&1; then
        printf '  [PASS] %s\n' "$msg"
        passed=$((passed + 1))
    else
        printf '  [FAIL] %s\n' "$msg"
        failed=$((failed + 1))
    fi
}

check_contains() {
    local msg="$1" haystack="$2" needle="$3"
    if printf '%s' "$haystack" | grep -q -- "$needle"; then
        printf '  [PASS] %s\n' "$msg"
        passed=$((passed + 1))
    else
        printf '  [FAIL] %s (expected to find %s)\n' "$msg" "$needle"
        failed=$((failed + 1))
    fi
}

cleanup() {
    cd / 2>/dev/null || true
    rm -rf "$WORKDIR"
}
trap cleanup EXIT

if [ ! -x "$PES_BIN" ]; then
    echo "error: $PES_BIN not found or not executable - run 'make pes' first" >&2
    exit 1
fi

mkdir -p "$WORKDIR"
cd "$WORKDIR" || exit 1

export PES_AUTHOR="Integration Test <test@localhost>"

echo "=== Integration: repository lifecycle ==="
echo "(scratch dir: $WORKDIR)"

echo
echo "-- init --"
init_out="$("$PES_BIN" init 2>&1)"
check_contains "init reports success" "$init_out" "Initialized"
check "creates .pes directory"        test -d .pes
check "creates object store"          test -d .pes/objects
check "creates refs/heads"            test -d .pes/refs/heads
check "creates HEAD file"             test -f .pes/HEAD
check_contains "HEAD points at refs/heads/main" "$(cat .pes/HEAD)" "refs/heads/main"

echo
echo "-- add --"
printf 'hello world\n' > greeting.txt
mkdir -p src
printf 'int main(void){return 0;}\n' > src/main.c

check "stages a top-level file"   "$PES_BIN" add greeting.txt
check "stages a nested file"      "$PES_BIN" add src/main.c
check "index file was created"    test -f .pes/index
check_contains "index lists the nested path" "$(cat .pes/index)" "src/main.c"

echo
echo "-- status --"
status_out="$("$PES_BIN" status 2>&1)"
check_contains "status lists a staged file" "$status_out" "greeting.txt"

echo
echo "-- commit --"
commit_out="$("$PES_BIN" commit -m "first commit" 2>&1)"
check_contains "commit reports success"  "$commit_out" "Committed"
check "branch ref was written"           test -f .pes/refs/heads/main
check "branch ref is non-empty"          test -s .pes/refs/heads/main

echo
echo "-- log --"
log_out="$("$PES_BIN" log 2>&1)"
check_contains "log shows the commit message" "$log_out" "first commit"
check_contains "log shows the author"         "$log_out" "Integration Test"

echo
echo "-- second commit --"
printf 'hello again\n' >> greeting.txt
"$PES_BIN" add greeting.txt >/dev/null 2>&1
second_out="$("$PES_BIN" commit -m "second commit" 2>&1)"
check_contains "second commit succeeds" "$second_out" "Committed"

log2="$("$PES_BIN" log 2>&1)"
check_contains "history retains the first commit"  "$log2" "first commit"
check_contains "history includes the second commit" "$log2" "second commit"

echo
echo "-- error handling --"
if "$PES_BIN" add definitely-not-here.txt >/dev/null 2>&1; then
    printf '  [FAIL] adding a missing file should report failure\n'
    failed=$((failed + 1))
else
    printf '  [PASS] adding a missing file reports failure\n'
    passed=$((passed + 1))
fi

if "$PES_BIN" frobnicate >/dev/null 2>&1; then
    printf '  [FAIL] unknown command should exit non-zero\n'
    failed=$((failed + 1))
else
    printf '  [PASS] unknown command exits non-zero\n'
    passed=$((passed + 1))
fi

echo
echo "=== $passed/$((passed + failed)) passed ==="
[ "$failed" -eq 0 ]
