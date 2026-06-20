# Semester Mini Projects (Sem 3 & Sem 4)

Short, focused collection of semester course projects used for learning and demonstration. The repository contains two semester folders with small, self-contained assignments and demos.

- **Sem 3:** Compiler/lexer project, Verilog multiplier, and a C-based symptom checker. See [Sem 3/README.md](Sem%203/README.md).
- **Sem 4:** Encrypted chat, algorithm visualizers, linear-algebra notebook, and OS assignments. See [Sem 4/README.md](Sem%204/README.md).

Quick start

- Python projects: create a virtualenv and install requirements where present.

```bash
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
.venv\Scripts\activate    # Windows PowerShell
pip install -r "Sem 4/CN/requirements.txt"  # if needed
```

- Node frontends/backends (DAA):

```bash
cd "Sem 4/DAA/<project>/frontend"
npm install
npm run dev
```

- C projects (OS, DSA): build with `make` or `gcc` where Makefile exists.

```bash
cd "Sem 4/OS"
make
./test_objects
```

Repository license

This repository is for academic and learning purposes.
