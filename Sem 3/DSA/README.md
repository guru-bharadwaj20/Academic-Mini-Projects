# Interactive Disease Symptom Checker  
### SEM-3 Mini Project – DSA

This project is an **interactive, terminal-based Symptom Checker** implemented in C.  
It allows users to input multiple symptoms and returns a ranked list of possible medical conditions along with suggested medications.  
The system uses a weighted graph-like structure to map symptoms to diseases and applies **merge sort** to rank conditions by likelihood.

---

## 🧠 Features

- Add weighted associations between symptoms and diseases  
- Accept multiple symptoms per user  
- Compute disease likelihood scores based on cumulative weights  
- Sort suggestions using Merge Sort  
- Provide medication recommendations  
- Maintain history of previous queries  
- Interactive CLI-based user experience  

---

## ⚙️ How It Works

### 1. **Symptom–Disease Mapping**
Each symptom stores a linked list of associated diseases with a likelihood weight.

### 2. **User Input**
Users can enter up to 10 symptoms.  
Typing `done` stops input.

### 3. **Likelihood Calculation**
For each symptom entered:
- Associated diseases' weights are added cumulatively  
- Combined scores are sorted in descending order  

### 4. **Output**
- **Top predicted condition**
- List of all matching conditions with scores
- Recommended medication
- Query history

---

## 🗂️ File Descriptions

### **main.c**
- Handles user interaction  
- Displays available symptoms  
- Collects user input  
- Calls the symptom checker  
- Stores and prints history  

### **symptom_checker.h**
Contains all type definitions and function declarations:
- `SymptomChecker_t`
- `DiseaseNode_t`
- `Suggestion_t`
- Core functions: `initializeChecker`, `addAssociation`, `checkSymptoms`, `mergeSort`, `printMedication`, `freeChecker`

### **symptom_checker.c**
Implements:
- Symptom lookup and association insertion  
- Merge Sort for ranked output  
- Symptom checking logic  
- Medication suggestions  
- Memory cleanup  

---

## ▶️ How to Compile & Run

```bash
gcc main.c symptom_checker.c -o symptom_checker
./symptom_checker
```

---

## 🧹 Memory Management

- Dynamic memory is allocated for user-entered symptoms  
- Disease associations are stored in dynamically allocated linked lists  
- All allocated memory is released using the `freeChecker()` function  

---

## 🚀 Future Enhancements

- Add more symptoms and diseases  
- Add an option to export user history to a file  
- Develop a GUI version to replace the CLI  
- Normalize and scale likelihood scores for improved prediction accuracy  
- Introduce conflict detection for contradictory symptoms  
