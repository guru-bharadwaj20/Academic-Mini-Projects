# 🚦 Namma Route — Bangalore Smart Routing System
### Dijkstra's Algorithm — Smart Transportation Routing (MERN Stack)

---

## 📋 Overview

A full-stack interactive Bangalore traffic routing system built with:
- **Backend**: Node.js + Express (Dijkstra's algorithm engine)
- **Frontend**: React + Vite + Styled Components
- **Data**: 18 real Bangalore locations including PES University, with 35+ road edges

---

## 🗺 Locations Included

| Node | Location |
|------|----------|
| **PES_UNIVERSITY** | **PES University** (Ring Road, Banashankari) |
| KEMPEGOWDA_INTL | Kempegowda International Airport |
| MG_ROAD | MG Road |
| KORAMANGALA | Koramangala |
| ELECTRONIC_CITY | Electronic City |
| WHITEFIELD | Whitefield |
| INDIRANAGAR | Indiranagar |
| JAYANAGAR | Jayanagar |
| RAJAJINAGAR | Rajajinagar |
| HEBBAL | Hebbal |
| YELAHANKA | Yelahanka |
| HSR_LAYOUT | HSR Layout |
| MARATHAHALLI | Marathahalli |
| BANASHANKARI | Banashankari |
| YESHWANTHPUR | Yeshwanthpur |
| SILK_BOARD | Silk Board Junction |
| MAJESTIC | Majestic (KSR Station) |
| SARJAPUR | Sarjapur Road |

---

## 🚀 Setup & Run

### Prerequisites
- Node.js v18+
- npm or yarn

### 1. Backend

```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3000
```

---

## 🔌 API Endpoints

### `GET /api/nodes`
Returns all 18 Bangalore location nodes with coordinates.

### `GET /api/edges`
Returns all road segment edges with distance, time, and congestion data.

### `POST /api/shortest-path`
Compute shortest path using Dijkstra's algorithm.

**Body:**
```json
{
  "source": "PES_UNIVERSITY",
  "target": "ELECTRONIC_CITY",
  "weightType": "distance"  // "distance" | "time" | "congestion"
}
```

**Response:**
```json
{
  "path": ["PES_UNIVERSITY", "MAJESTIC", "KORAMANGALA", "ELECTRONIC_CITY"],
  "pathLabels": ["PES University", "Majestic", "Koramangala", "Electronic City"],
  "totalDist": 24.5,
  "totalTime": 68,
  "iterations": 12,
  "executionMicroseconds": 45,
  "steps": [...],
  "edges": [...]
}
```

### `GET /api/analysis`
Graph statistics, complexity analysis, and runtime benchmarks.

### `GET /api/all-pairs`
All-pairs shortest distance matrix (runs Dijkstra from every source).

---

## ⚙ Algorithm Details

### Dijkstra's Implementation
- **Data structure**: Binary Min-Heap (priority queue)
- **Time complexity**: O((V + E) log V)
- **Space complexity**: O(V + E)
- **Lazy deletion**: Stale heap entries skipped via visited set

### Weight Modes
| Mode | Description |
|------|-------------|
| Distance | Minimize total km |
| Time | Minimize travel minutes |
| Congestion | Minimize `time × congestion_factor` |

### Edge Data
Each road segment has:
- `dist` — distance in km
- `time` — travel time in minutes  
- `congestion` — multiplier (1.0 = free flow, 2.2 = heavy traffic)

---

## 📊 Features

1. **Route Finder Tab** — Select source/destination, choose optimization metric, view path with step-by-step algorithm trace
2. **Graph View Tab** — Interactive SVG visualization of the road network, click nodes to see connections
3. **Analysis Tab** — Complexity comparison, runtime benchmarks, all-pairs heatmap matrix
4. **Algorithm Tab** — Pseudocode, step-by-step explanation, correctness proof, heap operations

---

## 🏗 MERN Stack Integration

To integrate with MongoDB:
```js
// Store route history
const Route = mongoose.model('Route', {
  source: String, target: String,
  path: [String], totalDist: Number,
  computedAt: { type: Date, default: Date.now }
});
```

To add authentication with JWT, traffic data from MongoDB, or real-time congestion via WebSockets — the Express backend is structured for easy extension.

---

## 📚 References

- Dijkstra, E. W. (1959). "A note on two problems in connexion with graphs"
- CLRS: Introduction to Algorithms, Chapter 24 (Single-Source Shortest Paths)
- Graph density formula: `2E / (V(V-1))`
