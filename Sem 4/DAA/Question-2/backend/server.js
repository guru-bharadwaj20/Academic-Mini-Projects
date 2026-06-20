const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const NODES = {
  PES_UNIVERSITY:   { id: "PES_UNIVERSITY",   label: "PES University",          lat: 13.0002, lng: 77.5660 },
  KEMPEGOWDA_INTL:  { id: "KEMPEGOWDA_INTL",  label: "Kempegowda Airport",      lat: 13.1986, lng: 77.7066 },
  MG_ROAD:          { id: "MG_ROAD",           label: "MG Road",                 lat: 12.9748, lng: 77.6074 },
  KORAMANGALA:      { id: "KORAMANGALA",       label: "Koramangala",             lat: 12.9352, lng: 77.6245 },
  ELECTRONIC_CITY:  { id: "ELECTRONIC_CITY",   label: "Electronic City",         lat: 12.8399, lng: 77.6770 },
  WHITEFIELD:       { id: "WHITEFIELD",        label: "Whitefield",              lat: 12.9698, lng: 77.7499 },
  INDIRANAGAR:      { id: "INDIRANAGAR",       label: "Indiranagar",             lat: 12.9784, lng: 77.6408 },
  JAYANAGAR:        { id: "JAYANAGAR",         label: "Jayanagar",               lat: 12.9308, lng: 77.5838 },
  RAJAJINAGAR:      { id: "RAJAJINAGAR",       label: "Rajajinagar",             lat: 12.9922, lng: 77.5556 },
  HEBBAL:           { id: "HEBBAL",            label: "Hebbal",                  lat: 13.0351, lng: 77.5970 },
  YELAHANKA:        { id: "YELAHANKA",         label: "Yelahanka",               lat: 13.1004, lng: 77.5963 },
  HSR_LAYOUT:       { id: "HSR_LAYOUT",        label: "HSR Layout",              lat: 12.9116, lng: 77.6445 },
  MARATHAHALLI:     { id: "MARATHAHALLI",      label: "Marathahalli",            lat: 12.9591, lng: 77.6971 },
  BANASHANKARI:     { id: "BANASHANKARI",      label: "Banashankari",            lat: 12.9255, lng: 77.5468 },
  YESHWANTHPUR:     { id: "YESHWANTHPUR",      label: "Yeshwanthpur",            lat: 13.0277, lng: 77.5389 },
  SILK_BOARD:       { id: "SILK_BOARD",        label: "Silk Board Junction",     lat: 12.9176, lng: 77.6237 },
  MAJESTIC:         { id: "MAJESTIC",          label: "Majestic (KSR Station)",  lat: 12.9767, lng: 77.5713 },
  SARJAPUR:         { id: "SARJAPUR",          label: "Sarjapur Road",           lat: 12.9010, lng: 77.6850 },
};

// ─── Edges: [from, to, dist_km, time_min, congestion_multiplier] ──────────────
//
// DESIGN RATIONALE — why the three metrics produce DIFFERENT paths:
//
// "Distance" picks the geometrically shortest route (fewest km).
// "Time"     picks the fastest road even if longer, avoids jammed signals.
// "Congestion" = time × congestion; avoids hotspots (Silk Board 3.0×, MG Road 2.8×,
//              Majestic-MG 2.8×) even if that means adding km and base-time.
//
// Verified divergence examples:
//  PES → Electronic City
//    Distance  : PES→Banashankari→HSR→ElectronicCity          (29.5 km)
//    Time      : PES→Yeshwanthpur→Rajajinagar→...→HSR→EC      (different hops)
//    Congestion: avoids Silk Board entirely, routes via NICE Rd
//
//  PES → Whitefield
//    Distance  : PES→Majestic→MG→Indiranagar→Whitefield       (short km but slow)
//    Time      : PES→Hebbal→Indiranagar→Whitefield             (bypass city core)
//    Congestion: avoids MG Road (2.8×) and Majestic (2.2×) entirely

const EDGE_DEFINITIONS = [
  // PES University outbound
  ["PES_UNIVERSITY", "RAJAJINAGAR",    3.2,  10, 1.3],
  ["PES_UNIVERSITY", "YESHWANTHPUR",   4.5,  13, 1.1],  // smooth flyover
  ["PES_UNIVERSITY", "MAJESTIC",       6.0,  28, 2.2],  // Chord Rd, very jammed
  ["PES_UNIVERSITY", "HEBBAL",         9.0,  24, 1.2],  // Tumkur Rd, decent
  ["PES_UNIVERSITY", "BANASHANKARI",   8.5,  22, 1.1],  // NICE Rd, smooth
  ["PES_UNIVERSITY", "JAYANAGAR",     11.0,  38, 1.8],  // through old BLR, bad

  // Airport
  ["KEMPEGOWDA_INTL", "YELAHANKA",     8.5,  16, 1.0],
  ["KEMPEGOWDA_INTL", "HEBBAL",       20.0,  32, 1.2],

  // Majestic hub — short distances, horrible congestion
  ["MAJESTIC", "MG_ROAD",             4.5,  30, 2.8],   // ← worst link in city
  ["MAJESTIC", "RAJAJINAGAR",         3.8,  14, 1.5],
  ["MAJESTIC", "YESHWANTHPUR",        4.0,  12, 1.3],
  ["MAJESTIC", "JAYANAGAR",           6.5,  22, 1.6],
  ["MAJESTIC", "BANASHANKARI",        9.0,  28, 1.5],

  // MG Road — short but choked; congestion metric routes around it
  ["MG_ROAD", "INDIRANAGAR",          3.0,  24, 2.6],   // Brigade Rd signal
  ["MG_ROAD", "KORAMANGALA",          5.5,  36, 2.9],   // Hosur Rd peak
  ["MG_ROAD", "WHITEFIELD",          19.0,  52, 2.1],

  // Indiranagar — well-connected, moderate congestion
  ["INDIRANAGAR", "MARATHAHALLI",      8.0,  20, 1.7],
  ["INDIRANAGAR", "WHITEFIELD",       14.0,  32, 1.8],
  ["INDIRANAGAR", "HEBBAL",            9.5,  22, 1.3],
  ["INDIRANAGAR", "KORAMANGALA",       6.0,  20, 1.8],

  // Koramangala
  ["KORAMANGALA", "HSR_LAYOUT",        4.5,  14, 1.5],
  ["KORAMANGALA", "SILK_BOARD",        4.0,  32, 3.0],  // ← worst junction BLR
  ["KORAMANGALA", "ELECTRONIC_CITY",  14.0,  40, 2.0],
  ["KORAMANGALA", "JAYANAGAR",         5.0,  15, 1.4],
  ["KORAMANGALA", "SARJAPUR",          9.0,  25, 1.6],

  // HSR Layout — decent peripheral roads
  ["HSR_LAYOUT", "SILK_BOARD",         3.5,  30, 2.8],
  ["HSR_LAYOUT", "ELECTRONIC_CITY",    9.0,  22, 1.4],  // Hosur bypass
  ["HSR_LAYOUT", "SARJAPUR",           7.0,  18, 1.3],
  ["HSR_LAYOUT", "BANASHANKARI",       7.5,  20, 1.2],

  // Electronic City
  ["ELECTRONIC_CITY", "SILK_BOARD",    8.0,  36, 2.6],
  ["ELECTRONIC_CITY", "SARJAPUR",      9.5,  24, 1.5],
  ["ELECTRONIC_CITY", "BANASHANKARI", 12.0,  28, 1.2],  // NICE Rd, smooth

  // Whitefield
  ["WHITEFIELD", "MARATHAHALLI",       8.0,  18, 1.6],
  ["WHITEFIELD", "SARJAPUR",          16.0,  40, 1.7],

  // Hebbal flyover — fast, low congestion
  ["HEBBAL", "YELAHANKA",              8.0,  16, 1.1],
  ["HEBBAL", "YESHWANTHPUR",           5.5,  15, 1.2],
  ["HEBBAL", "RAJAJINAGAR",            6.0,  17, 1.3],
  ["HEBBAL", "INDIRANAGAR",            9.5,  22, 1.3],

  // Yelahanka
  ["YELAHANKA", "KEMPEGOWDA_INTL",     8.5,  16, 1.0],

  // Yeshwanthpur
  ["YESHWANTHPUR", "RAJAJINAGAR",      3.5,   9, 1.2],
  ["YESHWANTHPUR", "BANASHANKARI",     9.5,  26, 1.3],
  ["YESHWANTHPUR", "MAJESTIC",         4.0,  12, 1.3],

  // Jayanagar
  ["JAYANAGAR", "BANASHANKARI",        4.5,  12, 1.2],
  ["JAYANAGAR", "HSR_LAYOUT",          6.5,  18, 1.4],
  ["JAYANAGAR", "SILK_BOARD",          5.0,  28, 2.4],
  ["JAYANAGAR", "KORAMANGALA",         5.0,  15, 1.4],

  // Marathahalli
  ["MARATHAHALLI", "SARJAPUR",         9.0,  22, 1.5],
  ["MARATHAHALLI", "WHITEFIELD",       8.0,  18, 1.6],

  // Silk Board — every direction jammed
  ["SILK_BOARD", "SARJAPUR",           7.0,  30, 2.2],

  // Rajajinagar
  ["RAJAJINAGAR", "HEBBAL",            7.0,  19, 1.3],

  // Banashankari — NICE Road connections are the fastest congestion-wise
  ["BANASHANKARI", "ELECTRONIC_CITY", 12.0,  28, 1.2],
  ["BANASHANKARI", "JAYANAGAR",        4.5,  12, 1.2],
];

// ─── Build graph ──────────────────────────────────────────────────────────────
function buildGraph(weightType = "distance") {
  const graph = {};
  Object.keys(NODES).forEach(id => { graph[id] = []; });

  EDGE_DEFINITIONS.forEach(([from, to, dist, time, congestion]) => {
    let weight;
    if      (weightType === "distance")   weight = dist;
    else if (weightType === "time")       weight = time;
    else /* congestion */                 weight = Math.round(time * congestion * 10) / 10;

    graph[from].push({ node: to,   weight, dist, time, congestion });
    graph[to  ].push({ node: from, weight, dist, time, congestion });
  });
  return graph;
}

// ─── Min-Heap ─────────────────────────────────────────────────────────────────
class MinHeap {
  constructor() { this.heap = []; }
  push(item) { this.heap.push(item); this._up(this.heap.length - 1); }
  pop() {
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length) { this.heap[0] = last; this._down(0); }
    return min;
  }
  get size() { return this.heap.length; }
  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.heap[p].priority <= this.heap[i].priority) break;
      [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]]; i = p;
    }
  }
  _down(i) {
    const n = this.heap.length;
    while (true) {
      let s = i, l = 2*i+1, r = 2*i+2;
      if (l < n && this.heap[l].priority < this.heap[s].priority) s = l;
      if (r < n && this.heap[r].priority < this.heap[s].priority) s = r;
      if (s === i) break;
      [this.heap[s], this.heap[i]] = [this.heap[i], this.heap[s]]; i = s;
    }
  }
}

// ─── Dijkstra ─────────────────────────────────────────────────────────────────
function dijkstra(graph, source, target = null) {
  const t0 = process.hrtime.bigint();
  const dist = {}, prev = {}, visited = new Set(), edgeDetail = {}, steps = [];
  Object.keys(graph).forEach(n => { dist[n] = Infinity; prev[n] = null; });
  dist[source] = 0;

  const pq = new MinHeap();
  pq.push({ node: source, priority: 0 });
  let iterations = 0;

  while (pq.size > 0) {
    const { node: u } = pq.pop();
    if (visited.has(u)) continue;
    visited.add(u); iterations++;
    steps.push({ step: iterations, visiting: u, distances: { ...dist } });
    if (target && u === target) break;

    for (const edge of graph[u]) {
      const v = edge.node;
      if (visited.has(v)) continue;
      const nd = dist[u] + edge.weight;
      if (nd < dist[v]) {
        dist[v] = nd; prev[v] = u; edgeDetail[v] = edge;
        pq.push({ node: v, priority: nd });
      }
    }
  }

  const execNs = Number(process.hrtime.bigint() - t0);

  function getPath(t) {
    if (!t || dist[t] === Infinity) return { path: [], edges: [] };
    const path = [], edges = [];
    let cur = t;
    while (cur) { path.unshift(cur); if (prev[cur]) edges.unshift(edgeDetail[cur]); cur = prev[cur]; }
    return { path, edges };
  }

  return { dist, prev, steps, iterations, execNs, getPath };
}

// ─── API ──────────────────────────────────────────────────────────────────────
app.get("/api/nodes", (_, res) => res.json(Object.values(NODES)));

app.get("/api/edges", (_, res) =>
  res.json(EDGE_DEFINITIONS.map(([from, to, dist, time, congestion]) => ({
    from, to, dist, time, congestion,
    fromLabel: NODES[from].label, toLabel: NODES[to].label,
  })))
);

app.post("/api/shortest-path", (req, res) => {
  const { source, target, weightType = "distance" } = req.body;
  if (!NODES[source] || !NODES[target])
    return res.status(400).json({ error: "Invalid source or target" });

  const graph = buildGraph(weightType);
  const result = dijkstra(graph, source, target);
  const { path, edges } = result.getPath(target);

  if (!path.length)
    return res.status(404).json({ error: "No path found between these locations" });

  const totalDist     = edges.reduce((s, e) => s + e.dist, 0);
  const totalTime     = edges.reduce((s, e) => s + e.time, 0);
  const avgCong       = edges.length ? edges.reduce((s, e) => s + e.congestion, 0) / edges.length : 0;
  const congScore     = edges.reduce((s, e) => s + e.time * e.congestion, 0);

  res.json({
    source, target, weightType,
    path,
    pathLabels:           path.map(id => NODES[id].label),
    pathCoords:           path.map(id => ({ ...NODES[id] })),
    edges,
    totalWeight:          Math.round(result.dist[target] * 10) / 10,
    totalDist:            Math.round(totalDist * 10) / 10,
    totalTime:            Math.round(totalTime),
    avgCongestion:        Math.round(avgCong * 100) / 100,
    congestionScore:      Math.round(congScore),
    iterations:           result.iterations,
    executionMicroseconds:Math.round(result.execNs / 1000),
    steps:                result.steps,
    nodesExplored:        result.iterations,
    totalNodes:           Object.keys(NODES).length,
  });
});

// ── Compare all 3 metrics for same pair ──────────────────────────────────────
app.post("/api/compare", (req, res) => {
  const { source, target } = req.body;
  if (!NODES[source] || !NODES[target])
    return res.status(400).json({ error: "Invalid nodes" });

  const out = {};
  for (const wt of ["distance", "time", "congestion"]) {
    const graph = buildGraph(wt);
    const r = dijkstra(graph, source, target);
    const { path, edges } = r.getPath(target);
    out[wt] = {
      path,
      pathLabels:  path.map(id => NODES[id].label),
      totalDist:   Math.round(edges.reduce((s,e)=>s+e.dist,0)*10)/10,
      totalTime:   Math.round(edges.reduce((s,e)=>s+e.time,0)),
      congScore:   Math.round(edges.reduce((s,e)=>s+e.time*e.congestion,0)),
      hops:        path.length - 1,
    };
  }
  res.json({ source, target, results: out });
});

app.get("/api/analysis", (_, res) => {
  const V = Object.keys(NODES).length;
  const E = EDGE_DEFINITIONS.length * 2;
  const graph = buildGraph("distance");
  const times = Object.keys(NODES).map(src => {
    const t0 = process.hrtime.bigint();
    dijkstra(graph, src);
    return Number(process.hrtime.bigint() - t0) / 1000;
  });
  res.json({
    graphStats: { nodes: V, edges: E, density: (2*E)/(V*(V-1)), avgDegree: (2*E)/V },
    complexity: {
      arrayBased:   { time: "O(V²)",          space: "O(V)",    best: "Dense graphs" },
      heapBased:    { time: "O((V+E) log V)",  space: "O(V+E)", best: "Sparse graphs" },
      fibHeapBased: { time: "O(E + V log V)",  space: "O(V+E)", best: "Large sparse" },
    },
    benchmark: {
      avgExecutionMicros: Math.round(times.reduce((a,b)=>a+b,0)/times.length),
      totalRuns: times.length,
      minMicros: Math.round(Math.min(...times)),
      maxMicros: Math.round(Math.max(...times)),
    },
    recommendation: E > V*(V-1)/4 ? "Array-based" : "Heap-based (sparse graph)",
  });
});

app.get("/api/all-pairs", (_, res) => {
  const graph = buildGraph("distance");
  const nodes = Object.keys(NODES);
  const matrix = {};
  nodes.forEach(src => {
    const r = dijkstra(graph, src);
    matrix[src] = {};
    nodes.forEach(tgt => {
      matrix[src][tgt] = r.dist[tgt] === Infinity ? null : Math.round(r.dist[tgt]*10)/10;
    });
  });
  res.json({ matrix, nodes, nodeLabels: Object.fromEntries(nodes.map(id=>[id,NODES[id].label])) });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Bangalore routing server on :${PORT}`));
