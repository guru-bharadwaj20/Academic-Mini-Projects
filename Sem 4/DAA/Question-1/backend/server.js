const express = require("express");
const cors = require("cors");

const app = express();
// Restrict CORS to the local dev frontends. `cors()` with no options
// reflects whatever Origin the caller sends, so ANY website the developer
// happened to visit could call these APIs from the browser.
// Override with CORS_ORIGINS="http://host:port,..." when needed.
const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGINS ||
  [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
  ].join(",")
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // No Origin header => not a browser cross-origin request (curl, tests,
    // server-to-server). Those are unaffected by CORS, so allow them.
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    // Omit the CORS headers rather than throwing: the browser blocks the
    // response cleanly instead of the app returning a 500.
    return callback(null, false);
  },
};

app.use(cors(corsOptions));
app.use(express.json());

// ============================================================
// Union-Find (Disjoint Set) with Path Compression + Union by Rank
// ============================================================
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.components = n;
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // path compression
    }
    return this.parent[x];
  }

  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) return false; // cycle detected

    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }
    this.components--;
    return true;
  }

  connected(x, y) {
    return this.find(x) === this.find(y);
  }
}

// ============================================================
// Kruskal's Algorithm
// ============================================================
function kruskal(vertices, edges, cityNames, options = {}) {
  const includeSteps = options.includeSteps !== false;
  const steps = includeSteps ? [] : null;
  const sortedEdges = [...edges].sort((a, b) => a.cost - b.cost);
  const uf = new UnionFind(vertices);
  const mstEdges = [];
  let totalCost = 0;

  for (const edge of sortedEdges) {
    const { u, v, cost } = edge;
    const accepted = uf.union(u, v);
    if (includeSteps) {
      const step = {
        u,
        v,
        cost,
        nameU: cityNames[u],
        nameV: cityNames[v],
        accepted,
        decision: accepted ? "ADDED (no cycle)" : "REJECTED (cycle detected)",
        mstSoFar: accepted ? [...mstEdges, { u, v, cost }] : [...mstEdges],
      };
      steps.push(step);
    }
    if (accepted) {
      mstEdges.push({ u, v, cost });
      totalCost += cost;
    }
    if (mstEdges.length === vertices - 1) break;
  }

  const isComplete = mstEdges.length === vertices - 1;
  return {
    mstEdges,
    totalCost,
    steps: includeSteps ? steps : [],
    isComplete,
    edgesChecked: includeSteps ? steps.length : sortedEdges.length,
  };
}

// ============================================================
// Default graph: 8 Indian cities
// ============================================================
const DEFAULT_CITIES = [
  "Delhi", "Mumbai", "Kolkata", "Chennai",
  "Bengaluru", "Hyderabad", "Pune", "Ahmedabad"
];

const DEFAULT_EDGES = [
  { u: 0, v: 1, cost: 140 },
  { u: 0, v: 7, cost: 90 },
  { u: 1, v: 7, cost: 85 },
  { u: 1, v: 2, cost: 295 },
  { u: 2, v: 3, cost: 185 },
  { u: 3, v: 4, cost: 350 },
  { u: 4, v: 5, cost: 130 },
  { u: 5, v: 2, cost: 280 },
  { u: 5, v: 3, cost: 195 },
  { u: 6, v: 1, cost: 70 },
  { u: 6, v: 7, cost: 60 },
  { u: 0, v: 6, cost: 120 },
  { u: 4, v: 6, cost: 370 },
  { u: 3, v: 5, cost: 245 },
  { u: 1, v: 4, cost: 430 },
];

// ============================================================
// Routes
// ============================================================

// GET /health
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Kruskal MST API running" });
});

// GET /defaults — return default graph data
app.get("/defaults", (req, res) => {
  res.json({
    cities: DEFAULT_CITIES,
    edges: DEFAULT_EDGES,
  });
});

// POST /mst — run Kruskal's on provided or default graph
app.post("/mst", (req, res) => {
  try {
    const {
      cities = DEFAULT_CITIES,
      edges = DEFAULT_EDGES,
    } = req.body;

    const result = kruskal(cities.length, edges, cities);
    res.json({
      cities,
      edges,
      ...result,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /analysis — complexity info
app.get("/analysis", (req, res) => {
  res.json({
    timeComplexity: [
      { operation: "Sort all edges", complexity: "O(E log E)", note: "Bottleneck — TimSort" },
      { operation: "find(x) — single call", complexity: "O(α(n))", note: "Path compression; α(n) ≤ 4" },
      { operation: "union(x,y) — single", complexity: "O(α(n))", note: "Union by rank" },
      { operation: "All Union-Find ops", complexity: "O(E · α(V))", note: "Effectively O(E)" },
      { operation: "TOTAL", complexity: "O(E log E)", note: "Dominated by sort" },
    ],
    spaceComplexity: "O(V + E)",
    comparison: [
      { algorithm: "Kruskal's", complexity: "O(E log E)", bestFor: "Sparse graphs" },
      { algorithm: "Prim's (bin-heap)", complexity: "O(E log V)", bestFor: "Dense graphs" },
      { algorithm: "Prim's (Fib-heap)", complexity: "O(E + V log V)", bestFor: "Theoretical optimum" },
      { algorithm: "Borůvka's", complexity: "O(E log V)", bestFor: "Parallel/distributed" },
    ],
  });
});

// POST /scalability — benchmark on random graphs
app.post("/scalability", async (req, res) => {
  const scenarios = [
    { V: 10, E: 40 },
    { V: 100, E: 500 },
    { V: 1000, E: 8000 },
    { V: 5000, E: 50000 },
    { V: 20000, E: 300000 },
  ];

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  for (const { V, E } of scenarios) {
    const edges = [];

    // Fisher-Yates. The previous `.sort(() => Math.random() - 0.5)` is the
    // textbook-wrong shuffle: the comparator is inconsistent, which is
    // undefined behaviour per the ECMAScript spec, and the permutation it
    // produces is heavily biased. At V = 20000 it also burned ~280k
    // comparisons to do a job that is O(n) swaps.
    const nodes = Array.from({ length: V }, (_, i) => i);
    for (let i = nodes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
    }

    // Ensure connectivity via a chain
    for (let i = 0; i < V - 1; i++) {
      edges.push({ u: nodes[i], v: nodes[i + 1], cost: Math.floor(Math.random() * 490) + 10 });
    }

    // Extra random edges
    // Retry on a self-loop instead of skipping. The old loop simply dropped
    // the iteration when u === v, so the generated graph always had fewer
    // edges than the scenario asked for - and the shortfall grew as V shrank.
    let extra = E - (V - 1);
    while (extra > 0) {
      const u = Math.floor(Math.random() * V);
      const v = Math.floor(Math.random() * V);
      if (u === v) continue;
      edges.push({ u, v, cost: Math.floor(Math.random() * 490) + 10 });
      extra--;
    }

    const cityNames = Array.from({ length: V }, (_, i) => `C${i}`);
    const t0 = process.hrtime.bigint();
    // Avoid trace capture for large benchmark graphs to prevent OOM.
    const result = kruskal(V, edges, cityNames, { includeSteps: false });
    const elapsed = Number(process.hrtime.bigint() - t0) / 1e6;

    const row = {
      cities: V,
      edges: edges.length,
      mstCost: result.totalCost,
      timeMs: parseFloat(elapsed.toFixed(2)),
    };

    res.write(`${JSON.stringify(row)}\n`);
    await new Promise(resolve => setTimeout(resolve, 120));
  }

  res.end();
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Kruskal MST server running on http://localhost:${PORT}`));
