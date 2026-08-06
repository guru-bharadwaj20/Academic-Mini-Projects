import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}`;

const Grid3 = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Card = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
  animation: ${fadeIn} 0.4s ease;
`;

const PanelTitle = styled.h2`
  font-size: 0.72rem;
  letter-spacing: 0.15em;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  &::after { content:''; flex:1; height:1px; background:var(--border); }
`;

const BigNum = styled.div`
  font-size: 2.2rem;
  font-weight: 800;
  color: ${p => p.$color || "var(--accent)"};
  font-family: 'Space Mono', monospace;
  line-height: 1;
  margin-bottom: 0.3rem;
`;

const SubLabel = styled.div`
  font-size: 0.7rem;
  color: var(--muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const ComplexRow = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr 1fr 1fr;
  gap: 0.5rem;
  align-items: center;
  padding: 0.7rem 0;
  border-bottom: 1px solid rgba(30,45,74,0.5);
  font-size: 0.82rem;

  &:last-child { border-bottom: none; }
`;

const Tag = styled.span`
  background: rgba(249,115,22,0.15);
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
`;

const MatrixWrap = styled.div`
  overflow: auto;
  max-height: 460px;
`;

const MatrixTable = styled.table`
  border-collapse: collapse;
  font-size: 0.68rem;
  font-family: 'Space Mono', monospace;
  white-space: nowrap;

  th, td {
    padding: 0.3rem 0.45rem;
    border: 1px solid var(--border);
    text-align: center;
  }

  th {
    background: var(--surface2);
    color: var(--muted);
    position: sticky;
    top: 0;
    z-index: 2;
  }

  th:first-child {
    left: 0;
    z-index: 3;
  }

  td:first-child {
    background: var(--surface2);
    color: var(--muted);
    font-weight: 700;
    position: sticky;
    left: 0;
  }
`;

function heatColor(val, min, max) {
  if (val === null) return "var(--surface2)";
  if (val === 0) return "rgba(74,222,128,0.25)";
  const t = (val - min) / (max - min);
  const r = Math.round(249 * t + 56 * (1-t));
  const g = Math.round(115 * (1-t) + 189 * (1-t));
  const b = Math.round(22 * (1-t));
  return `rgba(${r},${g},${b},0.3)`;
}

const BarChart = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
`;

const BarLabel = styled.div`
  width: 140px;
  flex-shrink: 0;
  color: var(--text);
  font-family: 'Space Mono', monospace;
  font-size: 0.68rem;
`;

const BarBg = styled.div`
  flex: 1;
  height: 22px;
  background: var(--surface2);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const BarFill = styled.div`
  height: 100%;
  width: ${p => p.$pct}%;
  background: ${p => p.$color || "var(--accent)"};
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding-left: 0.5rem;
  font-size: 0.65rem;
  font-family: 'Space Mono', monospace;
  color: rgba(0,0,0,0.7);
  font-weight: 700;
  transition: width 1s ease;
`;

export default function AnalysisTab({ api }) {
  const [analysis, setAnalysis] = useState(null);
  const [matrix,   setMatrix]   = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${api}/analysis`).then((r) => { if (!r.ok) throw new Error(`analysis: HTTP ${r.status}`); return r.json(); }),
      fetch(`${api}/all-pairs`).then((r) => { if (!r.ok) throw new Error(`all-pairs: HTTP ${r.status}`); return r.json(); }),
    ]).then(([a, m]) => {
      setAnalysis(a);
      setMatrix(m);
      setLoading(false);
    });
  }, [api]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "4rem", color: "var(--muted)" }}>
      <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚙</div>
      Running benchmarks…
    </div>
  );

  const { graphStats, complexity, benchmark, recommendation } = analysis;

  // Flatten matrix values for min/max
  const matVals = matrix ? matrix.nodes.flatMap(r =>
    matrix.nodes.map(c => matrix.matrix[r][c]).filter(v => v !== null && v > 0)
  ) : [];
  const matMin = Math.min(...matVals), matMax = Math.max(...matVals);

  // Short labels for matrix
  const shortLabel = id => id.split("_").slice(0,2).join(" ").slice(0, 10);

  return (
    <div>
      {/* Stats row */}
      <Grid3>
        <Card>
          <BigNum $color="var(--accent)">{graphStats.nodes}</BigNum>
          <SubLabel>Graph Nodes (Locations)</SubLabel>
        </Card>
        <Card>
          <BigNum $color="var(--accent2)">{graphStats.edges}</BigNum>
          <SubLabel>Directed Edges (Road Segments)</SubLabel>
        </Card>
        <Card>
          <BigNum $color="var(--accent3)">{(graphStats.density * 100).toFixed(1)}%</BigNum>
          <SubLabel>Graph Density</SubLabel>
        </Card>
      </Grid3>

      <Grid2 style={{ marginBottom: "1.5rem" }}>
        {/* Complexity Analysis */}
        <Card>
          <PanelTitle>Time Complexity Comparison</PanelTitle>
          <ComplexRow style={{ color: "var(--muted)", fontSize: "0.68rem", letterSpacing: "0.1em" }}>
            <div>IMPLEMENTATION</div>
            <div>TIME</div>
            <div>SPACE</div>
            <div>BEST FOR</div>
          </ComplexRow>
          {Object.entries(complexity).map(([impl, c]) => (
            <ComplexRow key={impl}>
              <div style={{ fontWeight: 700, color: "var(--text)" }}>
                {impl === "arrayBased" ? "Array" : impl === "heapBased" ? "Min-Heap" : "Fibonacci Heap"}
              </div>
              <Tag>{c.time}</Tag>
              <span style={{ color: "var(--accent2)", fontFamily: "Space Mono", fontSize: "0.75rem" }}>{c.space}</span>
              <span style={{ color: "var(--muted)", fontSize: "0.72rem" }}>{c.best}</span>
            </ComplexRow>
          ))}

          <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(249,115,22,0.1)", borderRadius: 8, border: "1px solid rgba(249,115,22,0.3)", fontSize: "0.78rem" }}>
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>Recommendation for this graph: </span>
            <span style={{ color: "var(--text)" }}>{recommendation}</span>
            <div style={{ marginTop: "0.3rem", fontSize: "0.7rem", color: "var(--muted)" }}>
              Density = {(graphStats.density * 100).toFixed(1)}% → {graphStats.density < 0.25 ? "Sparse → Heap wins" : "Dense → Array competitive"}
            </div>
          </div>
        </Card>

        {/* Benchmark */}
        <Card>
          <PanelTitle>Runtime Benchmark (All-Source Dijkstra)</PanelTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
            {[
              ["Avg", benchmark.avgExecutionMicros, "var(--accent)"],
              ["Min", benchmark.minMicros, "var(--accent3)"],
              ["Max", benchmark.maxMicros, "var(--danger)"],
              ["Runs", benchmark.totalRuns, "var(--accent2)"],
            ].map(([lbl, val, color]) => (
              <div key={lbl} style={{ background: "var(--surface2)", borderRadius: 8, padding: "0.75rem", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "Space Mono", color }}>{val}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{lbl} {lbl !== "Runs" ? "µs" : "sources"}</div>
              </div>
            ))}
          </div>

          <PanelTitle>Theoretical Ops Count (this graph)</PanelTitle>
          <BarChart>
            {[
              ["Array O(V²)",          Math.pow(graphStats.nodes,2),                   "var(--danger)"],
              ["Heap O((V+E)log V)",   (graphStats.nodes + graphStats.edges) * Math.log2(graphStats.nodes), "var(--accent)"],
              ["FibHeap O(E+V log V)", graphStats.edges + graphStats.nodes * Math.log2(graphStats.nodes), "var(--accent3)"],
            ].map(([lbl, val, color]) => {
              const maxOps = Math.pow(graphStats.nodes,2);
              return (
                <BarRow key={lbl}>
                  <BarLabel>{lbl}</BarLabel>
                  <BarBg>
                    <BarFill $pct={Math.round(val/maxOps*100)} $color={color}>
                      {Math.round(val)} ops
                    </BarFill>
                  </BarBg>
                </BarRow>
              );
            })}
          </BarChart>
        </Card>
      </Grid2>

      {/* All-pairs distance matrix */}
      {matrix && (
        <Card>
          <PanelTitle>All-Pairs Shortest Distance Matrix (km) — Heat Map</PanelTitle>
          <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginBottom: "0.85rem" }}>
            Computed by running Dijkstra from every source node. Green = short, Red = long, Grey = unreachable.
          </div>
          <MatrixWrap>
            <MatrixTable>
              <thead>
                <tr>
                  <th>FROM ↓ / TO →</th>
                  {matrix.nodes.map(id => <th key={id}>{shortLabel(id)}</th>)}
                </tr>
              </thead>
              <tbody>
                {matrix.nodes.map(row => (
                  <tr key={row}>
                    <td>{shortLabel(row)}</td>
                    {matrix.nodes.map(col => {
                      const val = matrix.matrix[row][col];
                      return (
                        <td key={col}
                          style={{ background: heatColor(val, matMin, matMax), color: val === 0 ? "var(--accent3)" : "var(--text)" }}
                          title={`${matrix.nodeLabels[row]} → ${matrix.nodeLabels[col]}: ${val ?? "∞"} km`}
                        >
                          {val === 0 ? "—" : val ?? "∞"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </MatrixTable>
          </MatrixWrap>
        </Card>
      )}
    </div>
  );
}
