import React, { useEffect, useMemo, useRef, useState } from 'react';

const CITY_POSITIONS = {
  Delhi: { x: 0.38, y: 0.08 },
  Mumbai: { x: 0.18, y: 0.45 },
  Kolkata: { x: 0.75, y: 0.3 },
  Chennai: { x: 0.55, y: 0.75 },
  Bengaluru: { x: 0.42, y: 0.82 },
  Hyderabad: { x: 0.52, y: 0.6 },
  Pune: { x: 0.24, y: 0.55 },
  Ahmedabad: { x: 0.22, y: 0.28 },
};

const W = 860;
const H = 520;

function getPos(name, width, height, pad = 70) {
  const p = CITY_POSITIONS[name];
  if (p) return { x: pad + p.x * (width - 2 * pad), y: pad + p.y * (height - 2 * pad) };
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const x = pad + ((hash % 97) / 96) * (width - 2 * pad);
  const y = pad + (((hash * 7) % 89) / 88) * (height - 2 * pad);
  return { x, y };
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export default function GraphView({ result }) {
  const svgRef = useRef(null);
  const animateTimer = useRef(null);

  const [showAll, setShowAll] = useState(true);
  const [positions, setPositions] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [panState, setPanState] = useState(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [highlightedEdgeKey, setHighlightedEdgeKey] = useState(null);
  const [edgeTooltip, setEdgeTooltip] = useState(null);
  const [animatingBuild, setAnimatingBuild] = useState(false);
  const [visibleMstCount, setVisibleMstCount] = useState(null);

  useEffect(() => {
    if (!result) return;
    const nextPos = {};
    result.cities.forEach(city => {
      nextPos[city] = getPos(city, W, H);
    });
    setPositions(nextPos);
    setSelectedNode(null);
    setScale(1);
    setPan({ x: 0, y: 0 });
    setVisibleMstCount(result.mstEdges.length);
  }, [result]);

  useEffect(() => () => clearInterval(animateTimer.current), []);

  // Hooks must run on EVERY render, so this must sit above the `!result`
  // early return below. Calling useMemo after that return changed the hook
  // count between renders once `result` arrived, and React threw "Rendered
  // more hooks than during the previous render" - blanking the whole app,
  // since there is no error boundary above this component. Reproduced by
  // opening the Graph tab before running the MST, then running it.
  const mstSet = useMemo(() => {
    const s = new Set();
    (result?.mstEdges ?? []).forEach(e => {
      const key = `${Math.min(e.u, e.v)}-${Math.max(e.u, e.v)}`;
      s.add(key);
    });
    return s;
  }, [result]);

  if (!result) {
    return (
      <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '3rem' }}>
        Run the MST algorithm first to see the graph.
      </div>
    );
  }

  const { cities, edges, mstEdges } = result;

  function toWorld(clientX, clientY) {
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    return {
      x: (x - pan.x) / scale,
      y: (y - pan.y) / scale,
    };
  }

  function nodeDown(evt, nodeIndex) {
    evt.stopPropagation();
    const startWorld = toWorld(evt.clientX, evt.clientY);
    const city = cities[nodeIndex];
    setDragState({
      nodeIndex,
      city,
      startWorld,
      original: positions[city],
      moved: false,
    });
  }

  function onSvgMouseDown(evt) {
    const start = { x: evt.clientX, y: evt.clientY };
    setPanState({ start, originalPan: pan });
  }

  function onSvgMouseMove(evt) {
    if (dragState) {
      const world = toWorld(evt.clientX, evt.clientY);
      const dx = world.x - dragState.startWorld.x;
      const dy = world.y - dragState.startWorld.y;
      const moved = dragState.moved || Math.hypot(dx, dy) > 2;

      setPositions(prev => ({
        ...prev,
        [dragState.city]: {
          x: clamp(dragState.original.x + dx, 30, W - 30),
          y: clamp(dragState.original.y + dy, 30, H - 30),
        },
      }));
      setDragState(curr => ({ ...curr, moved }));
      return;
    }

    if (panState) {
      const dx = evt.clientX - panState.start.x;
      const dy = evt.clientY - panState.start.y;
      setPan({
        x: panState.originalPan.x + dx,
        y: panState.originalPan.y + dy,
      });
    }
  }

  function onSvgMouseUp() {
    if (dragState && !dragState.moved) {
      setSelectedNode(dragState.nodeIndex);
    }
    setDragState(null);
    setPanState(null);
  }

  function zoomBy(deltaScale, center = { x: W / 2, y: H / 2 }) {
    const nextScale = clamp(scale + deltaScale, 0.5, 2);
    const worldX = (center.x - pan.x) / scale;
    const worldY = (center.y - pan.y) / scale;
    setScale(nextScale);
    setPan({
      x: center.x - worldX * nextScale,
      y: center.y - worldY * nextScale,
    });
  }

  function onWheelZoom(evt) {
    evt.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const center = {
      x: ((evt.clientX - rect.left) / rect.width) * W,
      y: ((evt.clientY - rect.top) / rect.height) * H,
    };
    zoomBy(evt.deltaY > 0 ? -0.12 : 0.12, center);
  }

  function edgeKey(u, v) {
    return `${Math.min(u, v)}-${Math.max(u, v)}`;
  }

  function startBuildAnimation() {
    clearInterval(animateTimer.current);
    setAnimatingBuild(true);
    setVisibleMstCount(0);
    animateTimer.current = setInterval(() => {
      setVisibleMstCount(prev => {
        const next = prev + 1;
        if (next >= mstEdges.length) {
          clearInterval(animateTimer.current);
          setAnimatingBuild(false);
          return mstEdges.length;
        }
        return next;
      });
    }, 600);
  }

  const visibleMstEdges = mstEdges.slice(0, visibleMstCount ?? mstEdges.length);
  const renderEdges = showAll ? edges : mstEdges;

  const nodeInfo = selectedNode === null ? null : {
    city: cities[selectedNode],
    allEdges: edges.filter(e => e.u === selectedNode || e.v === selectedNode),
  };

  const nodeMstContribution = nodeInfo
    ? nodeInfo.allEdges
      .filter(e => mstSet.has(edgeKey(e.u, e.v)))
      .reduce((sum, e) => sum + e.cost, 0)
    : 0;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>
            Network Graph View
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '12px', marginTop: '2px', fontFamily: 'var(--font-secondary)' }}>
            Drag nodes, zoom with wheel, pan by dragging canvas
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {['All Edges', 'MST Only'].map((label, idx) => (
            <button
              key={label}
              onClick={() => setShowAll(idx === 0)}
              style={{
                padding: '6px 13px',
                borderRadius: 6,
                border: `1px solid ${(idx === 0) === showAll ? 'var(--accent)' : 'var(--border)'}`,
                background: (idx === 0) === showAll ? 'var(--accent3)' : 'transparent',
                color: (idx === 0) === showAll ? 'var(--accent)' : 'var(--text3)',
                fontSize: 12,
                fontFamily: 'var(--font-secondary)',
              }}
            >
              {label}
            </button>
          ))}

          <button onClick={() => zoomBy(0.12)} style={miniBtn}>+</button>
          <button onClick={() => zoomBy(-0.12)} style={miniBtn}>-</button>
          <button onClick={startBuildAnimation} style={{ ...miniBtn, width: 'auto', padding: '6px 10px' }}>
            Animate MST Build
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedNode === null ? '1fr' : '1fr 320px', gap: '1rem', alignItems: 'start' }}>
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <svg
            ref={svgRef}
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            onMouseDown={onSvgMouseDown}
            onMouseMove={onSvgMouseMove}
            onMouseUp={onSvgMouseUp}
            onMouseLeave={onSvgMouseUp}
            onWheel={onWheelZoom}
            style={{ display: 'block', maxHeight: 560, cursor: dragState ? 'grabbing' : panState ? 'grabbing' : 'grab' }}
          >
            <defs>
              <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
              </pattern>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.8" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width={W} height={H} fill="url(#grid)" />

            <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
              {renderEdges.map((e, i) => {
                const pu = positions[cities[e.u]];
                const pv = positions[cities[e.v]];
                if (!pu || !pv) return null;
                const key = edgeKey(e.u, e.v);
                const isInMst = mstSet.has(key);
                const isVisibleMst = visibleMstEdges.some(m => edgeKey(m.u, m.v) === key);
                const mx = (pu.x + pv.x) / 2;
                const my = (pu.y + pv.y) / 2;
                const len = Math.hypot(pu.x - pv.x, pu.y - pv.y);
                const isReasonEdge = highlightedEdgeKey === key;

                if (isInMst && !isVisibleMst) return null;

                return (
                  <g
                    key={`edge-${i}-${key}`}
                    onClick={(evt) => {
                      if (!isInMst) return;
                      evt.stopPropagation();
                      setHighlightedEdgeKey(key);
                      setEdgeTooltip({ x: mx, y: my - 12, text: "This edge was selected because it was the cheapest edge that didn't form a cycle" });
                      window.setTimeout(() => setEdgeTooltip(null), 2600);
                    }}
                    style={{ cursor: isInMst ? 'pointer' : 'default' }}
                  >
                    <line
                      x1={pu.x}
                      y1={pu.y}
                      x2={pv.x}
                      y2={pv.y}
                      stroke={isInMst ? '#00e5c4' : '#2a373c'}
                      strokeWidth={isReasonEdge ? 5 : isInMst ? 2.2 : 1.1}
                      strokeDasharray={isInMst ? len : '5 5'}
                      strokeDashoffset={isInMst && animatingBuild ? len : 0}
                      filter={isInMst ? 'url(#glow)' : undefined}
                      style={{
                        opacity: isInMst ? 1 : 0.65,
                        animation: isReasonEdge ? 'pulse 1s infinite' : undefined,
                        transition: 'stroke-width 0.25s ease, opacity 0.25s ease',
                      }}
                    />
                    {isInMst && (
                      <text x={mx} y={my - 6} fill="#00c8ab" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)">
                        ${e.cost}M
                      </text>
                    )}
                  </g>
                );
              })}

              {cities.map((city, i) => {
                const p = positions[city];
                if (!p) return null;
                const selected = selectedNode === i;
                return (
                  <g
                    key={city}
                    onMouseDown={(evt) => nodeDown(evt, i)}
                    style={{ cursor: 'grab' }}
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={selected ? 21 : 18}
                      fill={selected ? 'rgba(0,229,196,0.22)' : 'rgba(0,229,196,0.12)'}
                      stroke={selected ? '#00ffe0' : '#00b89e'}
                      strokeWidth={selected ? 2.2 : 1.5}
                      filter={selected ? 'url(#glow)' : undefined}
                    />
                    <text x={p.x} y={p.y + 4} textAnchor="middle" fill="#c7f8ee" fontSize="10" fontWeight="700" fontFamily="var(--font-mono)">
                      {city.slice(0, 3).toUpperCase()}
                    </text>
                    <text x={p.x} y={p.y + 32} textAnchor="middle" fill="#7fa1a8" fontSize="11" fontFamily="var(--font-secondary)">
                      {city}
                    </text>
                  </g>
                );
              })}
            </g>

            {edgeTooltip && (
              <g transform={`translate(${edgeTooltip.x + pan.x} ${edgeTooltip.y + pan.y})`}>
                <rect x={-180} y={-44} width={360} height={30} rx={6} fill="rgba(9,14,15,0.94)" stroke="rgba(0,229,196,0.34)" />
                <text x={0} y={-24} textAnchor="middle" fill="#9cefe1" fontSize="11" fontFamily="var(--font-secondary)">
                  {edgeTooltip.text}
                </text>
              </g>
            )}
          </svg>
        </div>

        {nodeInfo && (
          <aside style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1rem',
          }}>
            <h3 style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
              {nodeInfo.city}
            </h3>
            <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4, marginBottom: 10, fontFamily: 'var(--font-secondary)' }}>
              Node edge details
            </p>
            <div style={{ display: 'grid', gap: 6 }}>
              {nodeInfo.allEdges.map((e, idx) => {
                const neighborIdx = e.u === selectedNode ? e.v : e.u;
                const mst = mstSet.has(edgeKey(e.u, e.v));
                return (
                  <div
                    key={`${idx}-${e.u}-${e.v}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '7px 9px',
                      borderRadius: 6,
                      border: `1px solid ${mst ? 'rgba(0,229,196,0.24)' : 'var(--border)'}`,
                      background: mst ? 'rgba(0,229,196,0.06)' : 'var(--bg3)',
                    }}
                  >
                    <span style={{ color: 'var(--text2)', fontSize: 12, fontFamily: 'var(--font-secondary)' }}>
                      {nodeInfo.city} ↔ {cities[neighborIdx]}
                    </span>
                    <span style={{ color: mst ? 'var(--accent)' : 'var(--text3)', fontSize: 12 }}>
                      ${e.cost}M {mst ? '• MST' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12, borderTop: '1px dashed var(--border)', paddingTop: 10, fontSize: 12, fontFamily: 'var(--font-secondary)' }}>
              <div style={{ color: 'var(--text2)' }}>Total incident edges: {nodeInfo.allEdges.length}</div>
              <div style={{ color: 'var(--accent)' }}>MST cost contribution: ${nodeMstContribution}M</div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

const miniBtn = {
  width: 34,
  height: 32,
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--bg3)',
  color: 'var(--text2)',
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
};
