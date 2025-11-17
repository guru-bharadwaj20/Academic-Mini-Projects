# 🔢 4-bit Sequential Binary Multiplier (SBM)

This project implements a **4-bit Sequential Binary Multiplier** in Verilog using the classic **Shift-and-Add** algorithm.  
The design uses a **Finite State Machine (FSM)** and produces an 8-bit output.  
A testbench is included, along with terminal output and GTKWave waveform screenshots.

---

## 📘 Overview

A binary multiplier performs repeated addition and shifting to generate the final product.  
This design multiplies:

- **Multiplicand** → 4 bits  
- **Multiplier** → 4 bits  
- **Product** → 8 bits  

The operation executes sequentially over **4 clock cycles** based on the multiplier bits.

---

## 🧩 Block Diagram

<p align="center">
	<img src="https://github.com/guru-bharadwaj20/Sem-3-Mini-Projects/blob/main/DDCO/Circuit%20Diagram.jpg" alt="Circuit Diagram" style="max-width:100%;border-radius:8px;box-shadow:0 8px 24px rgba(11,61,145,0.12)" />
</p>

---

## 🛠️ Features

- FSM-based design with states:
  - `IDLE`
  - `MULT_ADD`
  - `MULT_SHIFT`
  - `DONE`
- Adds multiplicand only when LSB of product is `1`
- Right shifts product every cycle
- Generates correct 8-bit product
- Fully testbench-driven simulation

---

## 📂 Files Included

| File | Description |
|------|-------------|
| `sbm.v` | RTL code for Sequential Binary Multiplier |
| `sbm_tb.v` | Testbench for simulation |
| `multiplier.vcd` | Generated waveform file |
| GTKWave screenshots | Visualization of signals |

---

## ▶️ Simulation Output (Icarus Verilog)

The console output clearly shows clock cycles and intermediate values during multiplication.

<p align="center">
	<img src="https://github.com/guru-bharadwaj20/Sem-3-Mini-Projects/blob/main/DDCO/Code%20Output.png" alt="SImulation Output" style="max-width:100%;border-radius:8px;box-shadow:0 8px 24px rgba(11,61,145,0.12)" />
</p>

---

## 📊 GTKWave Waveform

The VCD waveform shows:
- Clock
- Reset
- Start signal
- Multiplicand
- Multiplier
- Product evolution
- Done signal assertion

<p align="center">
	<img src="https://github.com/guru-bharadwaj20/Sem-3-Mini-Projects/blob/main/DDCO/GTKWave%20Screenshot.png" alt="GTKWave Waveform" style="max-width:100%;border-radius:8px;box-shadow:0 8px 24px rgba(11,61,145,0.12)" />
</p>

---

## 🚀 How to Run

### **1. Compile**
```bash
iverilog -o test sbm.v sbm_tb.v
```
### 2. Run
```bash
vvp test
```
### 3. View Waveforms
```bash
gtkwave multiplier.vcd
```

---

## 📌 Example

For:
- Multiplicand = 3
- Multiplier = 2

Expected product = 6

The simulation and waveform both confirm correct operation.

---

## 🏁 Conclusion

This project demonstrates a fully working sequential 4-bit binary multiplier with FSM control, simulation logs, and waveform analysis.
It is ideal for digital design, computer architecture, and hardware verification practice.