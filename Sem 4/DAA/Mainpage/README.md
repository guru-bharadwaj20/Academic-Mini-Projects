# DSA Algorithm Explorer

## Team Members

1. Guru R Bharadwaj [PES1UG24CS177]
2. Deeptha Shankar [PES1UG24CS144]
3. Diya R Gowda [PES1UG24CS159]
4. Epari Subhranshi [PES1UG24CS161]

A unified portal that combines three algorithm visualizers into one experience:

- Kruskal's MST for network design
- Dijkstra's shortest path routing for traffic navigation
- Dynamic Programming for airline ticket pricing optimization

The portal includes:

- One backend (Express) on port 5000
- One frontend (React + Vite) on port 3000
- One landing page that launches each algorithm UI

## Problem Statements

1. Kruskal's MST
Design a minimum-cost fiber optic network that connects all cities while avoiding cycles. The goal is to compute a Minimum Spanning Tree (MST) using Union-Find and greedy edge selection.

2. Dijkstra's Routing
Find optimal routes in a smart city road network under different optimization goals: shortest distance, fastest travel time, and least congestion score.

3. DP Pricing
Optimize airline ticket prices over a booking horizon with limited seat inventory and price-memory demand effects. Maximize total expected revenue using dynamic programming.

## Project Structure

```text
Mainpage/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── dp_pricing.js
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── kruskal/
│       ├── dijkstra/
│       ├── dp/
│       └── pages/
│           ├── Home.jsx
│           ├── KruskalPage.jsx
│           ├── DijkstraPage.jsx
│           └── DPPage.jsx
└── README.md
```

## Setup and Run

### Backend

```bash
cd backend
npm install
npm start
```

Backend runs on http://localhost:5000.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000.

## Build Check

```bash
cd frontend
npm run build
```

Expected result: successful production build with zero errors.

## API Reference

### Kruskal module

Base: /api/kruskal/*

- GET /api/kruskal/health
- GET /api/kruskal/defaults
- POST /api/kruskal/mst
- GET /api/kruskal/analysis
- POST /api/kruskal/scalability

### Dijkstra module

Base: /api/dijkstra/*

- GET /api/dijkstra/nodes
- GET /api/dijkstra/edges
- POST /api/dijkstra/shortest-path
- POST /api/dijkstra/compare
- GET /api/dijkstra/analysis
- GET /api/dijkstra/all-pairs

### DP module

Base: /api/dp/*

- GET /api/dp/health
- GET /api/dp/defaults
- POST /api/dp/optimize

## Frontend Routes

- / -> Landing page (Algorithm launcher)
- /kruskal -> Kruskal UI
- /dijkstra -> Dijkstra UI
- /dp -> Dynamic Programming UI

Each algorithm page includes a Back to Portal button that routes back to /.

## Design Notes

The landing page implements:

- Strict requested color palette
- Orbitron for headings and Inter for body text
- Animated network SVG background with pulsing nodes and glowing edges
- Particle/dot field background via pure CSS
- Glowing animated title and shimmering divider
- Three interactive algorithm cards with accent-specific hover effects

## Tech Stack

- Frontend: React 18, React Router DOM v6, Vite, Styled Components (Dijkstra UI)
- Backend: Node.js, Express, CORS
- Language: JavaScript (JSX only, no TypeScript)
- Styling: Raw CSS and component-level styles (no CSS framework)

## Notes

- The repository root now contains Mainpage, Question-1, Question-2, and Question-3 as separate top-level folders.
- Unified backend prefixes all previous endpoints by module namespace.
- All fetch calls were updated to use unified API paths.
