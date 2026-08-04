# 📚 Semester-4 Mini Projects

This folder contains Semester-4 course projects covering Computer Networks, Design and Analysis of Algorithms, Linear Algebra Applications, and Operating Systems. Each project is grouped in its own subfolder with source files, configuration, and instructions to run locally.

---

## Project Overview

### 1️⃣ CN — *Simple Encrypted Chat (Python)*
A lightweight client-server chat implementation with TLS certificates and a simple message protocol.

🔧 Features
- TCP-based client and server
- TLS certificate helpers in `certs/` (shell script to generate certs)
- Simple message protocol utilities under `utils/`
- Basic persistent store / user handling in `server/`

▶️ How to Run
```bash
# install dependencies
pip install -r requirements.txt

# start server (on server host)
python run_server.py

# start client (on client host)
python run_client.py
```

📂 Structure
```
CN/
│── requirements.txt
│── run_server.py
│── run_client.py
│── certs/              # cert generation helper
│── client/             # chat client implementation
│── server/             # server, handlers, database
└── utils/              # message protocol helpers
```

---

### 2️⃣ DAA — *Algorithm Visualizations & Demos (Node + React/Vite)*
A collection of interactive frontend demos and small backend servers used to visualize algorithms (Dijkstra, Kruskal, dynamic programming pricing, etc.). Several subprojects exist: `Mainpage` (multi-algo UI) and `Question-1/2/3` (separate assignments).

🔧 Features
- Interactive Dijkstra and Kruskal visualizers
- Dynamic programming pricing demo
- Frontend built with Vite + React, small Node.js backends for API endpoints

▶️ How to Run (general)
```bash
# Frontend
cd <project>/frontend
npm install
npm run dev

# Backend (if present)
cd <project>/backend
npm install
node server.js
```

📂 Notable Subfolders
```
DAA/Mainpage/        # multi-algo frontend + backend
DAA/Question-1/      # frontend + backend for assignment 1
DAA/Question-2/      # frontend + backend for assignment 2
DAA/Question-3/      # dp pricing demo (frontend + backend)
```

---

### 3️⃣ LAA — *Linear Algebra Applications (Python / Notebook)*
Jupyter notebook and Python code for experiments and analysis on datasets.

🔧 Features
- `LAA.ipynb` for interactive analysis
- `Code.py` with helper scripts
- `Dataset.csv` used by notebook and scripts

▶️ How to Run
```bash
# optional: create virtualenv
pip install -r requirements.txt  # if a requirements file is present

# open notebook
jupyter notebook LAA.ipynb

# or run helper script
python Code.py
```

📂 Structure
```
LAA/
│── LAA.ipynb
│── Code.py
└── Dataset.csv
```

---

### 4️⃣ OS — *Operating Systems Assignments & Utilities (C)*
Collection of C source files and tests for OS coursework: indexing, object storage, trees, and test harnesses.

🔧 Features
- Multiple C modules with a `Makefile`
- Unit/phase tests: `test_objects.c`, `test_tree.c`, `test_sequence.sh`
- Tools for building and running integration tests

▶️ How to Build / Test
```bash
# build (uses Makefile)
make

# run tests (examples)
./test_objects
./test_tree
bash test_sequence.sh
```

📂 Structure
```
OS/
│── Makefile
│── index.c, index.h
│── object.c, object.h
│── commit.c, commit.h
│── tree.c, tree.h
│── test_objects.c
│── test_tree.c
│── test_sequence.sh
└── Screenshots/
```

---

## 🧾 Summary

| Project | Domain | Tech Used | Highlights |
|--------|---------|-----------|------------|
| **CN** | Computer Networks | Python, TLS | Encrypted chat server + client |
| **DAA** | Algorithms | Node.js, React, Vite | Interactive algorithm visualizations |
| **LAA** | Linear Algebra | Python, Jupyter | Notebook + dataset experiments |
| **OS**  | Operating Systems | C, Make | C implementations + test harnesses |

---

## 🚀 Future Enhancements

- **CN:** Add end-to-end tests, docker-compose for easy local launch
- **DAA:** Consolidate run scripts and add README in each subproject with exact npm scripts
- **LAA:** Add `requirements.txt` and short usage examples for `Code.py`
- **OS:** Improve test automation and add CI config for running tests

---

## 📄 License
This folder is for academic and learning purposes.
