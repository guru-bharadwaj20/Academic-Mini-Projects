import { useState, useRef, useEffect } from "react";
import styled from "styled-components";

const Wrap = styled.div`
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 1.5rem;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Panel = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
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

const NodeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.78rem;
  transition: background 0.15s;
  background: ${p => p.$active ? "rgba(249,115,22,0.15)" : "transparent"};
  border: 1px solid ${p => p.$active ? "var(--accent)" : "transparent"};
  color: ${p => p.$active ? "var(--accent)" : "var(--text)"};

  &:hover { background: var(--surface2); }

  .dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: ${p => p.$active ? "var(--accent)" : "var(--border)"};
    flex-shrink: 0;
  }
`;

const Legend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  color: var(--muted);
`;

const NodeInfoBox = styled.div`
  margin-top: 1rem;
  padding: 0.85rem;
  background: var(--surface2);
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 0.78rem;

  h3 { color: var(--accent); font-size: 0.88rem; margin-bottom: 0.5rem; }
  .row { display: flex; justify-content: space-between; margin-bottom: 0.3rem; color: var(--muted); }
  .val { color: var(--text); font-family: 'Space Mono', monospace; }
`;

// Fixed layout positions for Bangalore nodes (approximate relative positions)
const NODE_POS = {
  PES_UNIVERSITY:   { x: 0.25, y: 0.40 },
  KEMPEGOWDA_INTL:  { x: 0.80, y: 0.05 },
  MG_ROAD:          { x: 0.52, y: 0.52 },
  KORAMANGALA:      { x: 0.58, y: 0.68 },
  ELECTRONIC_CITY:  { x: 0.62, y: 0.92 },
  WHITEFIELD:       { x: 0.82, y: 0.58 },
  INDIRANAGAR:      { x: 0.65, y: 0.50 },
  JAYANAGAR:        { x: 0.40, y: 0.72 },
  RAJAJINAGAR:      { x: 0.28, y: 0.38 },
  HEBBAL:           { x: 0.45, y: 0.22 },
  YELAHANKA:        { x: 0.52, y: 0.10 },
  HSR_LAYOUT:       { x: 0.60, y: 0.78 },
  MARATHAHALLI:     { x: 0.75, y: 0.60 },
  BANASHANKARI:     { x: 0.32, y: 0.78 },
  YESHWANTHPUR:     { x: 0.28, y: 0.28 },
  SILK_BOARD:       { x: 0.52, y: 0.80 },
  MAJESTIC:         { x: 0.38, y: 0.50 },
  SARJAPUR:         { x: 0.70, y: 0.88 },
};

export default function GraphTab({ nodes, edges }) {
  const [selected, setSelected] = useState(null);
  const [hovered,  setHovered]  = useState(null);
  const svgRef = useRef(null);

  const W = 760, H = 560;
  const pad = 40;

  function nx(id) { return (NODE_POS[id]?.x ?? 0.5) * (W - 2*pad) + pad; }
  function ny(id) { return (NODE_POS[id]?.y ?? 0.5) * (H - 2*pad) + pad; }

  const activeId  = hovered || selected;
  const connectedIds = activeId
    ? new Set(edges.flatMap(e => e.from === activeId || e.to === activeId ? [e.from, e.to] : []))
    : null;

  const nodeInfo = activeId ? nodes.find(n => n.id === activeId) : null;
  const nodeEdges = activeId ? edges.filter(e => e.from === activeId || e.to === activeId) : [];

  return (
    <Wrap>
      {/* SVG graph */}
      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "0.85rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.72rem", letterSpacing: "0.15em", color: "var(--muted)", textTransform: "uppercase" }}>
            Road Network Graph — {nodes.length} Nodes, {edges.length / 2} Edges
          </span>
          {activeId && (
            <span style={{ fontSize: "0.72rem", color: "var(--accent)", fontWeight: 700 }}>
              {nodeInfo?.label}
            </span>
          )}
        </div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block", cursor: "default" }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.4" strokeOpacity="0.5" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#grid)" />

          {/* Edges */}
          {edges.map((e, i) => {
            const isConn = connectedIds && (connectedIds.has(e.from) && connectedIds.has(e.to));
            const x1 = nx(e.from), y1 = ny(e.from);
            const x2 = nx(e.to),   y2 = ny(e.to);
            const cx = (x1+x2)/2, cy = (y1+y2)/2;
            const congColor = e.congestion > 1.8 ? "#f43f5e" : e.congestion > 1.4 ? "#fbbf24" : "#4ade80";

            return (
              <g key={i}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isConn ? congColor : "var(--border)"}
                  strokeWidth={isConn ? 2.5 : 1}
                  strokeOpacity={activeId ? (isConn ? 1 : 0.2) : 0.6}
                />
                {isConn && (
                  <text x={cx} y={cy-5} textAnchor="middle" fill={congColor} fontSize="9" fontFamily="Space Mono">
                    {e.dist}km
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const x = nx(n.id), y = ny(n.id);
            const isSelected = selected === n.id;
            const isHovered  = hovered  === n.id;
            const isConn     = connectedIds?.has(n.id);
            const isPES      = n.id === "PES_UNIVERSITY";

            const r = isPES ? 14 : isSelected || isHovered ? 12 : 9;
            const fill = isSelected ? "var(--accent)" : isHovered ? "var(--accent2)" : isPES ? "var(--highlight)" : isConn ? "var(--accent2)" : "var(--surface2)";
            const stroke = isSelected ? "var(--accent)" : isPES ? "var(--highlight)" : isConn ? "var(--accent2)" : "var(--border)";

            return (
              <g key={n.id}
                onClick={() => setSelected(selected === n.id ? null : n.id)}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                {(isSelected || isHovered) && (
                  <circle cx={x} cy={y} r={r+8} fill={fill} fillOpacity="0.12" />
                )}
                <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth="1.5"
                  fillOpacity={activeId && !isConn && !isSelected ? 0.3 : 1}
                />
                {isPES && <text x={x} y={y+4} textAnchor="middle" fill="#000" fontSize="9" fontWeight="800">PES</text>}
                <text
                  x={x} y={y + r + 12}
                  textAnchor="middle"
                  fill={isSelected ? "var(--accent)" : isConn ? "var(--accent2)" : "var(--text)"}
                  fontSize={isPES ? "10" : "9"}
                  fontFamily="Syne"
                  fontWeight={isPES || isSelected ? "800" : "600"}
                  fillOpacity={activeId && !isConn && !isSelected ? 0.3 : 1}
                >
                  {n.label.split(" ").slice(0,2).join(" ")}
                </text>
              </g>
            );
          })}
        </svg>
      </Panel>

      {/* Right panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Panel>
          <PanelTitle>Locations</PanelTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxHeight: 280, overflowY: "auto" }}>
            {nodes.map(n => (
              <NodeItem key={n.id} $active={selected === n.id}
                onClick={() => setSelected(selected === n.id ? null : n.id)}>
                <div className="dot" />
                {n.label}
                {n.id === "PES_UNIVERSITY" && <span style={{ marginLeft: "auto", fontSize: "0.6rem", color: "var(--highlight)", fontWeight: 700 }}>PES</span>}
              </NodeItem>
            ))}
          </div>

          <Legend>
            <LegendItem><div style={{ width:12,height:12,borderRadius:2,background:"var(--highlight)" }} /> PES University</LegendItem>
            <LegendItem><div style={{ width:12,height:3,background:"var(--accent3)" }} /> Low congestion</LegendItem>
            <LegendItem><div style={{ width:12,height:3,background:"var(--highlight)" }} /> Medium congestion</LegendItem>
            <LegendItem><div style={{ width:12,height:3,background:"var(--danger)" }} /> High congestion</LegendItem>
          </Legend>
        </Panel>

        {nodeInfo && (
          <NodeInfoBox>
            <h3>{nodeInfo.label}</h3>
            <div className="row"><span>Connections</span><span className="val">{nodeEdges.length}</span></div>
            <div className="row"><span>Avg distance</span>
              <span className="val">
                {(nodeEdges.reduce((s,e)=>s+e.dist,0)/nodeEdges.length).toFixed(1)} km
              </span>
            </div>
            <div className="row"><span>Avg time</span>
              <span className="val">
                {Math.round(nodeEdges.reduce((s,e)=>s+e.time,0)/nodeEdges.length)} min
              </span>
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.68rem", color: "var(--muted)" }}>Connected to:</div>
            {nodeEdges.map((e, i) => {
              const peer = e.from === nodeInfo.id ? e.to : e.from;
              const peerLabel = e.from === nodeInfo.id ? e.toLabel : e.fromLabel;
              return (
                <div key={i} style={{ fontSize: "0.72rem", color: "var(--accent2)", padding: "0.2rem 0" }}>
                  → {peerLabel} <span style={{ color: "var(--muted)" }}>({e.dist} km / {e.time} min)</span>
                </div>
              );
            })}
          </NodeInfoBox>
        )}
      </div>
    </Wrap>
  );
}
