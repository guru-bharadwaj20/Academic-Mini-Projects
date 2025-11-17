# Mini C-Like Parser (PLY)

A lightweight lexer + parser for a small C-style language, implemented using **PLY (Python Lex-Yacc)**.  
The project reads code snippets from `input.txt`, tokenizes them using `lexer.py`, parses them using `parser.py`, and prints whether each snippet is **Accepted** or **Rejected** with error details. 

---

## 📦 Features
- C-like syntax support (`if`, `else`, `while`, `for`, `return`, functions, arrays)
- Full expression grammar (arithmetic, logical, relational, unary, increments)
- Function declarations & statements
- Clear error reporting with line numbers
- Snippet-based input via `input.txt`

---

## ▶️ How to Run
1. Install PLY:
   ```bash
   pip install ply
   ```
2. Place your code snippets in input.txt (separated by blank lines).
3. Run:
   ```bash
   python main.py
   ```

---

## 📁 Project Structure
   ```bash
   lexer.py     # Tokenizer definitions
   parser.py    # Grammar rules & AST builder
   main.py      # Snippet loader and executor
   input.txt    # Your test snippets
   ```

---

## 🔧 Requirements
- Python 3.8+
- PLY 3.11