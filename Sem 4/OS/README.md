# PES-VCS Lab Report

## Course Information

- Course Subject: Operating System
- Subject Code: UE24CS242B
- Project Title: PES-VCS - A Version Control System from Scratch

## Student Information

- Name: Guru R Bharadwaj
- SRN: PES1UG24CS177
- Repository Name: PES1UG24CS177-pes-vcs

## Project Objective

This project implements a lightweight local version control system inspired by core Git internals. The system supports object storage, index-based staging, tree construction, commit creation, and commit history traversal.

## Implemented Components

The following core modules have been implemented as part of the project:

- object.c: object_write and object_read for content-addressable object storage.
- tree.c: tree_from_index for hierarchical tree generation from staged paths.
- index.c: index_load, index_save, and index_add for staging area management.
- commit.c: commit_create for snapshot commit generation and HEAD updates.

## Build and Execution

Use the following commands to build and validate the project:

```bash
make
make all
make clean
make test_objects
./test_objects
make test_tree
./test_tree
make test-integration
```

## Command Summary

Supported CLI operations in PES-VCS:

- pes init
- pes add <file>...
- pes status
- pes commit -m "message"
- pes log

## Screenshot Evidence

The following screenshots are available in the Screenshots directory and mapped to their corresponding validation steps.

| Screenshot | Description |
| --- | --- |
| ![Phase 1 Object Storage Test Output](Screenshots/Phase1_ObjectStorage_TestOutput.png) | Phase 1 object storage test output showing successful blob write/read and integrity checks. |
| ![Phase 2 Tree Test Output](Screenshots/Phase2_Tree_TestOutput.png) | Phase 2 tree test output verifying tree serialization and parsing correctness. |
| ![Phase 2 Object Binary View](Screenshots/Phase2_ObjectBinary_View.png) | Hex dump view of a stored tree object demonstrating raw object layout. |
| ![Phase 3 Index Status and File](Screenshots/Phase3_Index_Status_and_File.png) | Phase 3 staging demonstration showing init, add, status, and index file contents. |
| ![Phase 4 Commit Log](Screenshots/Phase4_Commit_Log.png) | Commit log output showing commit metadata and history traversal. |
| ![Phase 4 Object Growth and Refs](Screenshots/Phase4_ObjectGrowth_and_Refs.png) | Object store growth and reference files after multiple commits. |
| ![Integration Test Start](Screenshots/Integration_Test_Start.png) | Integration test setup/start state before sequence execution. |
| ![Integration First Commit](Screenshots/Integration_FirstCommit.png) | Integration sequence output at first successful commit checkpoint. |
| ![Integration Full History](Screenshots/Integration_FullHistory.png) | Integration sequence output demonstrating complete commit history flow. |
| ![Integration Object Store and Refs](Screenshots/Integration_ObjectStore_and_Refs.png) | Final integration state showing object files and HEAD/branch references. |

## Repository Structure

```text
.
|- commit.c
|- commit.h
|- index.c
|- index.h
|- object.c
|- pes.c
|- pes.h
|- tree.c
|- tree.h
|- test_objects.c
|- test_tree.c
|- test_sequence.sh
|- Makefile
|- README.md
|- .gitignore
`- Screenshots/
```

## Notes

- The author field used during commits is controlled by the PES_AUTHOR environment variable.
- The object store is maintained under .pes/objects with hash-based sharding.
- Atomic file update patterns are used where required by the assignment specification.

## References

- Git Internals (Pro Git): https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain
- Git from the inside out: https://codewords.recurse.com/issues/two/git-from-the-inside-out
- The Git Parable: https://tom.preston-werner.com/2009/05/19/the-git-parable.html
