"use strict";

const express = require("express");
const cors = require("cors");
const { optimizePricing, buildDemandModel, PRICE_TIERS } = require("./dp_pricing");

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
// KRUSKAL MODULE
// ============================================================
const kruskalRouter = express.Router();

class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.components = n;
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) return false;

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
}

function kruskal(vertices, edges, cityNames, options = {}) {
  const includeSteps = options.includeSteps !== false;
  const steps = includeSteps ? [] : null;
  const sortedEdges = [...edges].sort((a, b) => a.cost - b.cost);
  const uf = new UnionFind(vertices);
  const mstEdges = [];
  let totalCost = 0;

  let edgesChecked = 0;
  for (const edge of sortedEdges) {
    const { u, v, cost } = edge;
    edgesChecked++;
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
    // Edges the algorithm actually examined before stopping. This used to be
    //     includeSteps ? steps.length : sortedEdges.length
    // so with tracing on it reported edges EXAMINED (the loop breaks once the
    // MST is complete) but with tracing off it reported the TOTAL edge count.
    // The Algorithm tab and the Scalability tab therefore showed the same
    // label for two different quantities, and the scalability figure was
    // always an overcount.
    edgesChecked,
    totalEdges: sortedEdges.length,
  };
}

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

kruskalRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Kruskal MST API running" });
});

kruskalRouter.get("/defaults", (_req, res) => {
  res.json({
    cities: DEFAULT_CITIES,
    edges: DEFAULT_EDGES,
  });
});

kruskalRouter.post("/mst", (req, res) => {
  try {
    const { cities = DEFAULT_CITIES, edges = DEFAULT_EDGES } = req.body;

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

kruskalRouter.get("/analysis", (_req, res) => {
  res.json({
    timeComplexity: [
      { operation: "Sort all edges", complexity: "O(E log E)", note: "Bottleneck - TimSort" },
      { operation: "find(x) - single call", complexity: "O(a(n))", note: "Path compression; a(n) <= 4" },
      { operation: "union(x,y) - single", complexity: "O(a(n))", note: "Union by rank" },
      { operation: "All Union-Find ops", complexity: "O(E * a(V))", note: "Effectively O(E)" },
      { operation: "TOTAL", complexity: "O(E log E)", note: "Dominated by sort" },
    ],
    spaceComplexity: "O(V + E)",
    comparison: [
      { algorithm: "Kruskal's", complexity: "O(E log E)", bestFor: "Sparse graphs" },
      { algorithm: "Prim's (bin-heap)", complexity: "O(E log V)", bestFor: "Dense graphs" },
      { algorithm: "Prim's (Fib-heap)", complexity: "O(E + V log V)", bestFor: "Theoretical optimum" },
      { algorithm: "Boruvka's", complexity: "O(E log V)", bestFor: "Parallel/distributed" },
    ],
  });
});

let scalabilityRunning = false;

kruskalRouter.post("/scalability", async (_req, res) => {
  const scenarios = [
    { V: 10, E: 40 },
    { V: 100, E: 500 },
    { V: 1000, E: 8000 },
    { V: 5000, E: 50000 },
    { V: 20000, E: 300000 },
  ];

  // Only one scalability run at a time. Each run is heavy CPU work on the
  // single Node thread, so concurrent invocations queued behind each other
  // and multiplied the stall - and the endpoint is unauthenticated.
  if (scalabilityRunning) {
    return res.status(429).json({ error: "A scalability run is already in progress." });
  }
  scalabilityRunning = true;

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
  for (const { V, E } of scenarios) {
    // Yield to the event loop BEFORE each scenario so pending requests to
    // the other algorithm APIs get served. Previously the largest case
    // (V=20000, E=300000) built and sorted 300k edges synchronously, which
    // froze every other route on the server for the duration.
    await new Promise((resolve) => setImmediate(resolve));
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

    for (let i = 0; i < V - 1; i++) {
      edges.push({ u: nodes[i], v: nodes[i + 1], cost: Math.floor(Math.random() * 490) + 10 });
    }

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
    const result = kruskal(V, edges, cityNames, { includeSteps: false });
    const elapsed = Number(process.hrtime.bigint() - t0) / 1e6;

    const row = {
      cities: V,
      edges: edges.length,
      mstCost: result.totalCost,
      timeMs: parseFloat(elapsed.toFixed(2)),
    };

    res.write(`${JSON.stringify(row)}\n`);
    await new Promise((resolve) => setImmediate(resolve));
  }
  } finally {
    scalabilityRunning = false;
  }

  res.end();
});

// ============================================================
// DIJKSTRA MODULE
// ============================================================
const dijkstraRouter = express.Router();

const NODES = {
  PES_UNIVERSITY: { id: "PES_UNIVERSITY", label: "PES University", lat: 13.0002, lng: 77.5660 },
  KEMPEGOWDA_INTL: { id: "KEMPEGOWDA_INTL", label: "Kempegowda Airport", lat: 13.1986, lng: 77.7066 },
  MG_ROAD: { id: "MG_ROAD", label: "MG Road", lat: 12.9748, lng: 77.6074 },
  KORAMANGALA: { id: "KORAMANGALA", label: "Koramangala", lat: 12.9352, lng: 77.6245 },
  ELECTRONIC_CITY: { id: "ELECTRONIC_CITY", label: "Electronic City", lat: 12.8399, lng: 77.6770 },
  WHITEFIELD: { id: "WHITEFIELD", label: "Whitefield", lat: 12.9698, lng: 77.7499 },
  INDIRANAGAR: { id: "INDIRANAGAR", label: "Indiranagar", lat: 12.9784, lng: 77.6408 },
  JAYANAGAR: { id: "JAYANAGAR", label: "Jayanagar", lat: 12.9308, lng: 77.5838 },
  RAJAJINAGAR: { id: "RAJAJINAGAR", label: "Rajajinagar", lat: 12.9922, lng: 77.5556 },
  HEBBAL: { id: "HEBBAL", label: "Hebbal", lat: 13.0351, lng: 77.5970 },
  YELAHANKA: { id: "YELAHANKA", label: "Yelahanka", lat: 13.1004, lng: 77.5963 },
  HSR_LAYOUT: { id: "HSR_LAYOUT", label: "HSR Layout", lat: 12.9116, lng: 77.6445 },
  MARATHAHALLI: { id: "MARATHAHALLI", label: "Marathahalli", lat: 12.9591, lng: 77.6971 },
  BANASHANKARI: { id: "BANASHANKARI", label: "Banashankari", lat: 12.9255, lng: 77.5468 },
  YESHWANTHPUR: { id: "YESHWANTHPUR", label: "Yeshwanthpur", lat: 13.0277, lng: 77.5389 },
  SILK_BOARD: { id: "SILK_BOARD", label: "Silk Board Junction", lat: 12.9176, lng: 77.6237 },
  MAJESTIC: { id: "MAJESTIC", label: "Majestic (KSR Station)", lat: 12.9767, lng: 77.5713 },
  SARJAPUR: { id: "SARJAPUR", label: "Sarjapur Road", lat: 12.9010, lng: 77.6850 },
};

// NOTE: EDGE_DEFINITIONS must contain each undirected road ONCE.
// buildGraph() pushes BOTH directions for every entry, so a repeated pair
// created parallel edges: the map drew duplicate lines, /analysis reported
// E = 104 for a graph with 44 real edges (so density and average degree were
// both more than 2x wrong), and HEBBAL<->RAJAJINAGAR was listed twice with
// CONTRADICTORY weights (3.2km/17min vs 7.0km/19min), so the distance
// Dijkstra used depended on which copy it relaxed first.
const EDGE_DEFINITIONS = [
  ["PES_UNIVERSITY", "RAJAJINAGAR", 3.2, 10, 1.3],
  ["PES_UNIVERSITY", "YESHWANTHPUR", 4.5, 13, 1.1],
  ["PES_UNIVERSITY", "MAJESTIC", 6.0, 28, 2.2],
  ["PES_UNIVERSITY", "HEBBAL", 9.0, 24, 1.2],
  ["PES_UNIVERSITY", "BANASHANKARI", 8.5, 22, 1.1],
  ["PES_UNIVERSITY", "JAYANAGAR", 11.0, 38, 1.8],
  ["KEMPEGOWDA_INTL", "YELAHANKA", 8.5, 16, 1.0],
  ["KEMPEGOWDA_INTL", "HEBBAL", 20.0, 32, 1.2],
  ["MAJESTIC", "MG_ROAD", 4.5, 30, 2.8],
  ["MAJESTIC", "RAJAJINAGAR", 3.8, 14, 1.5],
  ["MAJESTIC", "YESHWANTHPUR", 4.0, 12, 1.3],
  ["MAJESTIC", "JAYANAGAR", 6.5, 22, 1.6],
  ["MAJESTIC", "BANASHANKARI", 9.0, 28, 1.5],
  ["MG_ROAD", "INDIRANAGAR", 3.0, 24, 2.6],
  ["MG_ROAD", "KORAMANGALA", 5.5, 36, 2.9],
  ["MG_ROAD", "WHITEFIELD", 19.0, 52, 2.1],
  ["INDIRANAGAR", "MARATHAHALLI", 8.0, 20, 1.7],
  ["INDIRANAGAR", "WHITEFIELD", 14.0, 32, 1.8],
  ["INDIRANAGAR", "HEBBAL", 9.5, 22, 1.3],
  ["INDIRANAGAR", "KORAMANGALA", 6.0, 20, 1.8],
  ["KORAMANGALA", "HSR_LAYOUT", 4.5, 14, 1.5],
  ["KORAMANGALA", "SILK_BOARD", 4.0, 32, 3.0],
  ["KORAMANGALA", "ELECTRONIC_CITY", 14.0, 40, 2.0],
  ["KORAMANGALA", "JAYANAGAR", 5.0, 15, 1.4],
  ["KORAMANGALA", "SARJAPUR", 9.0, 25, 1.6],
  ["HSR_LAYOUT", "SILK_BOARD", 3.5, 30, 2.8],
  ["HSR_LAYOUT", "ELECTRONIC_CITY", 9.0, 22, 1.4],
  ["HSR_LAYOUT", "SARJAPUR", 7.0, 18, 1.3],
  ["HSR_LAYOUT", "BANASHANKARI", 7.5, 20, 1.2],
  ["ELECTRONIC_CITY", "SILK_BOARD", 8.0, 36, 2.6],
  ["ELECTRONIC_CITY", "SARJAPUR", 9.5, 24, 1.5],
  ["ELECTRONIC_CITY", "BANASHANKARI", 12.0, 28, 1.2],
  ["WHITEFIELD", "MARATHAHALLI", 8.0, 18, 1.6],
  ["WHITEFIELD", "SARJAPUR", 16.0, 40, 1.7],
  ["HEBBAL", "YELAHANKA", 8.0, 16, 1.1],
  ["HEBBAL", "YESHWANTHPUR", 5.5, 15, 1.2],
  ["HEBBAL", "RAJAJINAGAR", 6.0, 17, 1.3],
  ["YESHWANTHPUR", "RAJAJINAGAR", 3.5, 9, 1.2],
  ["YESHWANTHPUR", "BANASHANKARI", 9.5, 26, 1.3],
  ["JAYANAGAR", "BANASHANKARI", 4.5, 12, 1.2],
  ["JAYANAGAR", "HSR_LAYOUT", 6.5, 18, 1.4],
  ["JAYANAGAR", "SILK_BOARD", 5.0, 28, 2.4],
  ["MARATHAHALLI", "SARJAPUR", 9.0, 22, 1.5],
  ["SILK_BOARD", "SARJAPUR", 7.0, 30, 2.2],
];

function buildGraph(weightType = "distance") {
  const graph = {};
  Object.keys(NODES).forEach((id) => { graph[id] = []; });

  EDGE_DEFINITIONS.forEach(([from, to, dist, time, congestion]) => {
    let weight;
    if (weightType === "distance") weight = dist;
    else if (weightType === "time") weight = time;
    else weight = Math.round(time * congestion * 10) / 10;

    graph[from].push({ node: to, weight, dist, time, congestion });
    graph[to].push({ node: from, weight, dist, time, congestion });
  });
  return graph;
}

class MinHeap {
  constructor() { this.heap = []; }
  push(item) { this.heap.push(item); this._up(this.heap.length - 1); }
  pop() {
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length) {
      this.heap[0] = last;
      this._down(0);
    }
    return min;
  }
  get size() { return this.heap.length; }
  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.heap[p].priority <= this.heap[i].priority) break;
      [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]];
      i = p;
    }
  }
  _down(i) {
    const n = this.heap.length;
    while (true) {
      let s = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.heap[l].priority < this.heap[s].priority) s = l;
      if (r < n && this.heap[r].priority < this.heap[s].priority) s = r;
      if (s === i) break;
      [this.heap[s], this.heap[i]] = [this.heap[i], this.heap[s]];
      i = s;
    }
  }
}

function dijkstra(graph, source, target = null) {
  const t0 = process.hrtime.bigint();
  const dist = {};
  const prev = {};
  const visited = new Set();
  const edgeDetail = {};
  const steps = [];

  Object.keys(graph).forEach((n) => {
    dist[n] = Infinity;
    prev[n] = null;
  });
  dist[source] = 0;

  const pq = new MinHeap();
  pq.push({ node: source, priority: 0 });
  let iterations = 0;

  while (pq.size > 0) {
    const { node: u } = pq.pop();
    if (visited.has(u)) continue;
    visited.add(u);
    iterations++;
    steps.push({ step: iterations, visiting: u, distances: { ...dist } });
    if (target && u === target) break;

    for (const edge of graph[u]) {
      const v = edge.node;
      if (visited.has(v)) continue;
      const nd = dist[u] + edge.weight;
      if (nd < dist[v]) {
        dist[v] = nd;
        prev[v] = u;
        edgeDetail[v] = edge;
        pq.push({ node: v, priority: nd });
      }
    }
  }

  const execNs = Number(process.hrtime.bigint() - t0);

  function getPath(t) {
    if (!t || dist[t] === Infinity) return { path: [], edges: [] };
    const path = [];
    const edges = [];
    let cur = t;
    while (cur) {
      path.unshift(cur);
      if (prev[cur]) edges.unshift(edgeDetail[cur]);
      cur = prev[cur];
    }
    return { path, edges };
  }

  return { dist, prev, steps, iterations, execNs, getPath };
}

dijkstraRouter.get("/nodes", (_req, res) => res.json(Object.values(NODES)));

dijkstraRouter.get("/edges", (_req, res) =>
  res.json(EDGE_DEFINITIONS.map(([from, to, dist, time, congestion]) => ({
    from,
    to,
    dist,
    time,
    congestion,
    fromLabel: NODES[from].label,
    toLabel: NODES[to].label,
  })))
);

dijkstraRouter.post("/shortest-path", (req, res) => {
  const { source, target, weightType = "distance" } = req.body;
  if (!NODES[source] || !NODES[target]) {
    return res.status(400).json({ error: "Invalid source or target" });
  }

  const graph = buildGraph(weightType);
  const result = dijkstra(graph, source, target);
  const { path, edges } = result.getPath(target);

  if (!path.length) {
    return res.status(404).json({ error: "No path found between these locations" });
  }

  const totalDist = edges.reduce((s, e) => s + e.dist, 0);
  const totalTime = edges.reduce((s, e) => s + e.time, 0);
  const avgCong = edges.length ? edges.reduce((s, e) => s + e.congestion, 0) / edges.length : 0;
  const congScore = edges.reduce((s, e) => s + e.time * e.congestion, 0);

  res.json({
    source,
    target,
    weightType,
    path,
    pathLabels: path.map((id) => NODES[id].label),
    pathCoords: path.map((id) => ({ ...NODES[id] })),
    edges,
    totalWeight: Math.round(result.dist[target] * 10) / 10,
    totalDist: Math.round(totalDist * 10) / 10,
    totalTime: Math.round(totalTime),
    avgCongestion: Math.round(avgCong * 100) / 100,
    congestionScore: Math.round(congScore),
    iterations: result.iterations,
    executionMicroseconds: Math.round(result.execNs / 1000),
    steps: result.steps,
    nodesExplored: result.iterations,
    totalNodes: Object.keys(NODES).length,
  });
});

dijkstraRouter.post("/compare", (req, res) => {
  const { source, target } = req.body;
  if (!NODES[source] || !NODES[target]) {
    return res.status(400).json({ error: "Invalid nodes" });
  }

  const out = {};
  for (const wt of ["distance", "time", "congestion"]) {
    const graph = buildGraph(wt);
    const r = dijkstra(graph, source, target);
    const { path, edges } = r.getPath(target);
    out[wt] = {
      path,
      pathLabels: path.map((id) => NODES[id].label),
      totalDist: Math.round(edges.reduce((s, e) => s + e.dist, 0) * 10) / 10,
      totalTime: Math.round(edges.reduce((s, e) => s + e.time, 0)),
      congScore: Math.round(edges.reduce((s, e) => s + e.time * e.congestion, 0)),
      hops: path.length - 1,
    };
  }
  res.json({ source, target, results: out });
});

dijkstraRouter.get("/analysis", (_req, res) => {
  const V = Object.keys(NODES).length;
  const E = EDGE_DEFINITIONS.length * 2;
  const graph = buildGraph("distance");
  const times = Object.keys(NODES).map((src) => {
    const t0 = process.hrtime.bigint();
    dijkstra(graph, src);
    return Number(process.hrtime.bigint() - t0) / 1000;
  });

  res.json({
    graphStats: { nodes: V, edges: E, density: (2 * E) / (V * (V - 1)), avgDegree: (2 * E) / V },
    complexity: {
      arrayBased: { time: "O(V^2)", space: "O(V)", best: "Dense graphs" },
      heapBased: { time: "O((V+E) log V)", space: "O(V+E)", best: "Sparse graphs" },
      fibHeapBased: { time: "O(E + V log V)", space: "O(V+E)", best: "Large sparse" },
    },
    benchmark: {
      avgExecutionMicros: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      totalRuns: times.length,
      minMicros: Math.round(Math.min(...times)),
      maxMicros: Math.round(Math.max(...times)),
    },
    recommendation: E > (V * (V - 1)) / 4 ? "Array-based" : "Heap-based (sparse graph)",
  });
});

dijkstraRouter.get("/all-pairs", (_req, res) => {
  const graph = buildGraph("distance");
  const nodes = Object.keys(NODES);
  const matrix = {};

  nodes.forEach((src) => {
    const r = dijkstra(graph, src);
    matrix[src] = {};
    nodes.forEach((tgt) => {
      matrix[src][tgt] = r.dist[tgt] === Infinity ? null : Math.round(r.dist[tgt] * 10) / 10;
    });
  });

  res.json({ matrix, nodes, nodeLabels: Object.fromEntries(nodes.map((id) => [id, NODES[id].label])) });
});

// ============================================================
// DP MODULE
// ============================================================
const dpRouter = express.Router();

function toNumberArray(value) {
  if (Array.isArray(value)) {
    return value.map((n) => Number(n));
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => !Number.isNaN(v));
  }

  return [];
}

// Bounds on the DP problem size. optimizePricing allocates two dense
// (days+1) x (seats+1) x (priceTiers+1) tables, so an unbounded `seats` or
// `days` let a single small JSON body exhaust the heap and kill the server
// (e.g. {"seats": 10000000} allocated tens of millions of arrays).
const MAX_DAYS = 60;
const MAX_SEATS = 1000;
const MAX_PRICE_TIERS = 12;
const MAX_DP_CELLS = 2_000_000;

function validateInput(body) {
  const days = Number(body.days);
  const seats = Number(body.seats);
  const prices = toNumberArray(body.prices);
  const baseDemandByDay = toNumberArray(body.baseDemandByDay);
  const priceSensitivity = Number(body.priceSensitivity);
  const memoryPenalty = Number(body.memoryPenalty);

  if (!Number.isInteger(days) || days <= 0) {
    return { error: "'days' must be a positive integer." };
  }

  if (days > MAX_DAYS) {
    return { error: `'days' must not exceed ${MAX_DAYS}.` };
  }

  if (!Number.isInteger(seats) || seats < 0) {
    return { error: "'seats' must be a non-negative integer." };
  }

  if (seats > MAX_SEATS) {
    return { error: `'seats' must not exceed ${MAX_SEATS}.` };
  }

  if (!prices.length || prices.some((p) => !Number.isFinite(p) || p <= 0)) {
    return { error: "'prices' must be a non-empty array of positive numbers." };
  }

  if (prices.length > MAX_PRICE_TIERS) {
    return { error: `'prices' must not contain more than ${MAX_PRICE_TIERS} tiers.` };
  }

  // Belt-and-braces: reject anything that would allocate an oversized table
  // even if the individual limits above are later relaxed.
  const cells = (days + 1) * (seats + 1) * (prices.length + 1);
  if (cells > MAX_DP_CELLS) {
    return {
      error:
        `Requested problem is too large (${cells.toLocaleString()} DP states, ` +
        `limit ${MAX_DP_CELLS.toLocaleString()}). Reduce days, seats or price tiers.`,
    };
  }

  if (baseDemandByDay.length !== days || baseDemandByDay.some((d) => !Number.isFinite(d) || d < 0)) {
    return { error: "'baseDemandByDay' must have exactly 'days' non-negative numbers." };
  }

  if (!Number.isFinite(priceSensitivity) || priceSensitivity < 0) {
    return { error: "'priceSensitivity' must be a non-negative number." };
  }

  if (!Number.isFinite(memoryPenalty) || memoryPenalty < 0 || memoryPenalty > 1) {
    return { error: "'memoryPenalty' must be between 0 and 1." };
  }

  return {
    days,
    seats,
    prices,
    baseDemandByDay,
    priceSensitivity,
    memoryPenalty,
  };
}

dpRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

dpRouter.get("/defaults", (_req, res) => {
  res.json({
    days: 10,
    seats: 120,
    prices: PRICE_TIERS,
    scenarios: {
      early: [40, 35, 32, 28, 24, 20, 16, 12, 10, 8],
      late: [8, 10, 12, 14, 18, 24, 30, 36, 42, 48],
      event: [14, 16, 18, 20, 45, 50, 30, 22, 18, 14],
    },
  });
});

dpRouter.post("/optimize", (req, res) => {
  const parsed = validateInput(req.body || {});
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  const demandModel = buildDemandModel({
    baseDemandByDay: parsed.baseDemandByDay,
    priceSensitivity: parsed.priceSensitivity,
    memoryPenalty: parsed.memoryPenalty,
    // Pass the tiers being optimised, so the demand model is anchored to
    // them rather than to the module's default PRICE_TIERS.
    prices: parsed.prices,
  });

  const result = optimizePricing({
    days: parsed.days,
    seats: parsed.seats,
    prices: parsed.prices,
    demandModel,
  });

  return res.json({
    input: parsed,
    output: result,
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "DSA portal unified backend running" });
});

app.use("/api/kruskal", kruskalRouter);
app.use("/api/dijkstra", dijkstraRouter);
app.use("/api/dp", dpRouter);

// The other three backends all honour process.env.PORT; this one did not,
// and its hardcoded 5000 is the same default Question-2 uses - so the two
// could never run at the same time and the failure was a bare EADDRINUSE.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`DSA portal backend running on http://localhost:${PORT}`);
});
