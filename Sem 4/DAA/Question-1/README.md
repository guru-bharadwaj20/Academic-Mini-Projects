# 🕸 FiberNet MST — Kruskal's Algorithm
### Minimum Spanning Tree · Fiber Optic Network Deployment (MERN-style Stack)

---

## 📋 Overview

A full-stack interactive fiber optic network planning tool built with:
- **Backend**: Node.js + Express (Kruskal's algorithm engine + Union-Find)
- **Frontend**: React + Vite
- **Data**: 8 Indian cities with 15 possible connections (real cost model)

---

## 🏙 Cities Included

| Node | City |
|------|------|
| 0 | Delhi |
| 1 | Mumbai |
| 2 | Kolkata |
| 3 | Chennai |
| 4 | Bengaluru |
| 5 | Hyderabad |
| 6 | Pune |
| 7 | Ahmedabad |

---

## 🚀 Setup & Run

### Prerequisites
- Node.js v18+
- npm

### 1. Backend

```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5002
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3002
```

---

## 🔌 API Endpoints

### `GET /health`
Returns server status.

### `GET /defaults`
Returns default graph (8 Indian cities, 15 edges).

### `POST /mst`
Run Kruskal's algorithm on a graph.

**Body:**
```json
{
  "cities": ["Delhi", "Mumbai", ...],
  "edges": [{ "u": 0, "v": 1, "cost": 140 }, ...]
}
```

**Response:**
```json
{
  "mstEdges": [{ "u": 6, "v": 7, "cost": 60 }, ...],
  "totalCost": 730,
  "steps": [...],
  "isComplete": true,
  "edgesChecked": 12
}
```

### `GET /analysis`
Returns complexity breakdown and algorithm comparison table.

### `POST /scalability`
Benchmarks Kruskal's on 5 randomly generated graphs (10 to 20,000 cities).

---

## ⚙ Algorithm Details

### Kruskal's Implementation
- **Step 1**: Sort all edges by cost — O(E log E)
- **Step 2**: Use Union-Find to greedily add cheapest non-cycle edge
- **Stop**: When V−1 edges are added (MST complete)

### Union-Find Optimizations
| Optimization | Effect |
|---|---|
| Path Compression | find() flattens tree → O(α(n)) amortized |
| Union by Rank | Attaches smaller tree under larger → O(log n) height |
| Combined | Nearly O(1) per operation for all practical n |

### Total Time Complexity
```
O(E log E)   ← bottleneck is the sort
O(E · α(V))  ← Union-Find (effectively O(E))
O(V + E)     ← space
```

---

## 📊 Features

1. **MST Finder Tab** — Run Kruskal's on default or custom graph, view MST edges and total cost
2. **Graph View Tab** — Interactive SVG visualization of all edges, highlight MST in teal
3. **Algorithm Trace Tab** — Animated step-by-step playback with speed control
4. **Complexity Tab** — Time/space complexity tables, Union-Find explainer, strengths vs limitations
5. **Scalability Tab** — Benchmark on 5 graph sizes up to 20K cities / 300K edges with bar chart

---

## 📚 References

- Kruskal, J. B. (1956). "On the shortest spanning subtree of a graph"
- CLRS: Introduction to Algorithms, Chapter 23 (Minimum Spanning Trees)
- Tarjan, R. E. (1975). "Efficiency of a Good But Not Linear Set Union Algorithm"
