# 📚 Semester-3 Mini Projects

This repository contains three major projects from Semester 3, covering **Automata & Formal Languages**, **Digital Design & Computer Organization**, and **Data Structures & Algorithms**.  
Each project is self-contained with its own source files, test cases, and documentation.

---

## 📁 Project Overview

### 1️⃣ AFLL — *Mini C-Like Parser (PLY)*  
A lightweight lexer + parser for a small C-style programming language, implemented using **PLY (Python Lex-Yacc)**.

#### 🔧 Features
- Supports C-like syntax: `if`, `else`, `while`, `for`, `return`, functions, arrays  
- Full expression grammar  
- Function declarations & statements  
- Clear error handling with line numbers  
- Processes code snippets from `input.txt`

#### ▶️ How to Run
```bash
pip install ply
python main.py
```

#### 📂 Structure
```bash
AFLL/
│── lexer.py      # Token definitions
│── parser.py     # Grammar rules
│── main.py       # Snippet loader
└── input.txt     # Test code snippets
```

---

## 2️⃣ DDCO — *4-bit Sequential Binary Multiplier (Verilog)*

Implements a **4-bit Sequential Binary Multiplier (SBM)** using the **Shift-and-Add algorithm** controlled by a **Finite State Machine (FSM)**.

### 🔧 Features
- FSM with states:
  - `IDLE`
  - `MULT_ADD`
  - `MULT_SHIFT`
  - `DONE`
- Sequential multiplication over 4 cycles
- Adds multiplicand only when product LSB = 1
- Shifts product right every cycle
- Generates correct **8-bit product**
- Includes:
  - RTL design
  - Testbench
  - VCD waveform file
  - GTKWave screenshots

### ▶️ Run Simulation
```bash
iverilog -o test sbm.v sbm_tb.v
vvp test
gtkwave multiplier.vcd
```

#### 📂 Structure
```bash
DDCO/
│── sbm.v                  # RTL: FSM-controlled shift-and-add multiplier
│── sbm_tb.v               # Self-checking testbench (exhaustive 4x4 sweep)
│── Circuit Diagram.jpg    # Block diagram
│── Code Output.png        # Simulation console output
└── GTKWave Screenshot.png # Waveform capture
```

---

### 3️⃣ DSA — *Interactive Disease Symptom Checker (C)*

A terminal-based medical symptom checker that uses **weighted associations** and **merge sort** to determine the most likely diseases.

#### 🔧 Features
- Weighted mapping between symptoms ↔ diseases
- Accepts multiple symptoms per query
- Calculates likelihood scores
- Ranks diseases using Merge Sort
- Provides medication suggestions
- Maintains query history
- Fully CLI-driven

#### ▶️ Compile & Run
```bash
gcc main.c symptom_checker.c -o symptom_checker
./symptom_checker
```

#### 📂 Structure
```bash
DSA/
│── main.c                # CLI & user interaction
│── symptom_checker.c     # Logic, sorting, disease mapping
└── symptom_checker.h     # Data structures & declarations
```

---

## 🧾 Summary

| Project | Domain | Tech Used | Highlights |
|--------|---------|-----------|------------|
| **AFLL** | Automata & Compiler Design | Python, PLY | Mini C parser with Lexer + Parser |
| **DDCO** | Digital Design | Verilog, GTKWave, Icarus Verilog | FSM-based 4-bit sequential multiplier |
| **DSA** | Data Structures | C | Weighted disease prediction + Merge Sort |

---

## 🚀 Future Enhancements

- **AFLL:** Add AST visualization & code generation  
- **DDCO:** Build 8-bit or pipelined multiplier  
- **DSA:** GUI version, file export, improved scoring model  

---

## 📄 License

This repository is for academic and learning purposes.
