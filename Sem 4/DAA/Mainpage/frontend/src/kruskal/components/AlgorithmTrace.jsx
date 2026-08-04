import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function AlgorithmTrace({ result }) {
  const [playIndex, setPlayIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const intervalRef = useRef(null);
  const rowRefs = useRef([]);

  useEffect(() => {
    if (!playing || !result) return undefined;
    intervalRef.current = setInterval(() => {
      setPlayIndex(prev => {
        if (prev >= result.steps.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(intervalRef.current);
  }, [playing, speed, result]);

  useEffect(() => {
    if (playIndex < 0) return;
    const row = rowRefs.current[playIndex];
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [playIndex]);

  useEffect(() => {
    function onKeyDown(evt) {
      if (!result) return;
      if (evt.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(evt.target.tagName)) return;

      if (evt.key === 'ArrowLeft') {
        evt.preventDefault();
        setPlayIndex(prev => Math.max(-1, prev - 1));
      } else if (evt.key === 'ArrowRight') {
        evt.preventDefault();
        setPlayIndex(prev => Math.min(result.steps.length - 1, prev + 1));
      } else if (evt.code === 'Space') {
        evt.preventDefault();
        setPlaying(prev => !prev);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [result]);

  // Everything hook-based must run on EVERY render, so it has to sit above
  // the `!result` early return below. Calling useMemo after that return
  // changed the hook count between renders once `result` arrived, and React
  // threw "Rendered more hooks than during the previous render", blanking
  // the whole app (there is no error boundary above this component).
  const steps = result?.steps ?? [];
  const cities = result?.cities ?? [];
  const activeSteps = playIndex === -1 ? [] : steps.slice(0, playIndex + 1);

  const components = useMemo(() => {
    const n = cities.length;
    const parent = Array.from({ length: n }, (_, i) => i);

    function find(x) {
      if (parent[x] !== x) parent[x] = find(parent[x]);
      return parent[x];
    }

    function union(a, b) {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent[rb] = ra;
    }

    activeSteps.filter(s => s.accepted).forEach(s => union(s.u, s.v));

    const map = new Map();
    for (let i = 0; i < n; i += 1) {
      const root = find(i);
      if (!map.has(root)) map.set(root, []);
      map.get(root).push(i);
    }
    return [...map.values()].sort((a, b) => b.length - a.length);
    // `activeSteps` is a fresh array on every render, so depending on it
    // defeated memoisation entirely. `result` + `playIndex` are the real,
    // stable inputs it is derived from.
  }, [result, playIndex]);

  if (!result) {
    return <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '3rem' }}>Run MST first.</div>;
  }

  const accepted = activeSteps.filter(s => s.accepted).length;
  const rejected = activeSteps.filter(s => !s.accepted).length;
  const runningCost = activeSteps.filter(s => s.accepted).reduce((sum, e) => sum + e.cost, 0);

  const currentStepNumber = playIndex === -1 ? 0 : playIndex + 1;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>
          Algorithm Step-by-Step Trace
        </h2>
        <p style={{ color: 'var(--text3)', fontSize: '12px', marginTop: '2px', fontFamily: 'var(--font-secondary)' }}>
          Watch Kruskal's algorithm process each edge in sorted order
        </p>
      </div>

      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1rem 1.4rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <button onClick={() => { setPlayIndex(-1); setPlaying(false); }} style={btnStyle('var(--border)', 'var(--text2)')}>⏮ Reset</button>
        <button onClick={() => setPlayIndex(Math.max(-1, playIndex - 1))} style={btnStyle('var(--border)', 'var(--text2)')}>⏪ Prev</button>
        <button
          onClick={() => {
            if (!playing && playIndex >= steps.length - 1) setPlayIndex(-1);
            setPlaying(p => !p);
          }}
          style={btnStyle(playing ? 'rgba(248,113,113,0.3)' : 'var(--accent3)', playing ? 'var(--red)' : 'var(--accent)')}
        >
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button onClick={() => setPlayIndex(Math.min(steps.length - 1, playIndex + 1))} style={btnStyle('var(--border)', 'var(--text2)')}>⏩ Next</button>
        <button onClick={() => setPlayIndex(steps.length - 1)} style={btnStyle('var(--border)', 'var(--text2)')}>⏭ End</button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text3)', fontSize: '11px', fontFamily: 'var(--font-secondary)' }}>Speed:</span>
          {[['Fast', 300], ['Normal', 800], ['Slow', 1500]].map(([label, ms]) => (
            <button key={label} onClick={() => setSpeed(ms)} style={btnStyle(
              speed === ms ? 'var(--accent3)' : 'transparent',
              speed === ms ? 'var(--accent)' : 'var(--text3)',
              `1px solid ${speed === ms ? 'rgba(0,229,196,0.3)' : 'var(--border)'}`
            )}>{label}</button>
          ))}
        </div>
        <span style={{ color: 'var(--text3)', fontSize: '11px', fontFamily: 'var(--font-secondary)' }}>[← → Space]</span>
      </div>

      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1rem 1.4rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ color: 'var(--text2)', fontSize: '12px', fontFamily: 'var(--font-secondary)' }}>
            Step {currentStepNumber} / {steps.length}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '12px' }}>
            <span style={{ color: 'var(--accent)' }}>✓ {accepted} added</span>
            <span style={{ color: 'var(--red)' }}>✗ {rejected} rejected</span>
            <span style={{ color: 'var(--amber)' }}>Cost: ${runningCost}M</span>
          </div>
        </div>
        <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(currentStepNumber / Math.max(steps.length, 1)) * 100}%`,
            background: 'linear-gradient(90deg, var(--accent2), var(--accent))',
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '50px 1fr 1fr 80px 80px 1fr',
          padding: '10px 16px',
          background: 'var(--bg3)',
          borderBottom: '1px solid var(--border)',
          color: 'var(--text3)',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 700,
          fontFamily: 'var(--font-secondary)',
        }}>
          <span>#</span><span>From</span><span>To</span><span>Cost</span><span>Result</span><span>Decision</span>
        </div>
        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {steps.map((step, i) => {
            const active = i === playIndex;
            const visible = playIndex === -1 || i <= playIndex;
            return (
              <div
                key={i}
                ref={el => { rowRefs.current[i] = el; }}
                onClick={() => setPlayIndex(i)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '50px 1fr 1fr 80px 80px 1fr',
                  padding: '9px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: active ? 'rgba(0,229,196,0.08)' : 'transparent',
                  borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                  opacity: visible ? 1 : 0.25,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: 'var(--text3)' }}>{i + 1}</span>
                <span style={{ color: 'var(--text)' }}>{step.nameU}</span>
                <span style={{ color: 'var(--text)' }}>{step.nameV}</span>
                <span style={{ color: 'var(--accent)' }}>${step.cost}M</span>
                <span style={{ color: step.accepted ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                  {step.accepted ? '✓ ADD' : '✗ SKIP'}
                </span>
                <span style={{ color: step.accepted ? 'var(--green)' : 'var(--red)', fontSize: '11px', fontFamily: 'var(--font-secondary)' }}>
                  {step.decision}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1.4rem',
      }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: 'var(--text)', marginBottom: '1rem' }}>
          Kruskal's Pseudocode
        </h3>
        <pre style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          lineHeight: '1.8',
          color: 'var(--text2)',
          background: 'var(--bg3)',
          borderRadius: '8px',
          padding: '1rem',
          overflow: 'auto',
        }}>{`function KRUSKAL(G = (V, E)):
  sort E by weight ascending          // O(E log E)
  uf = UnionFind(|V|)                 // O(V)
  MST = {}

  for each edge (u, v, w) in E:
    if uf.find(u) ≠ uf.find(v):      // no cycle
      MST.add((u, v, w))
      uf.union(u, v)                  // merge components
      if |MST| == |V| - 1: break     // MST complete

  return MST                          // O(E · α(V)) total`}</pre>

        <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', marginTop: '1rem', marginBottom: '0.75rem', fontSize: '13px' }}>
          Union-Find Tree Visualizer
        </h4>
        <UnionFindTree components={components} cities={cities} />
      </div>
    </div>
  );
}

function UnionFindTree({ components, cities }) {
  const width = 900;
  const rowGap = 70;
  const height = Math.max(120, components.length * rowGap + 40);

  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)', padding: 8, overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        {components.map((comp, idx) => {
          const y = 38 + idx * rowGap;
          const startX = 36;
          const spacing = Math.min(100, Math.max(60, 760 / Math.max(comp.length, 1)));
          return (
            <g key={`component-${idx}`}>
              <rect
                x={16}
                y={y - 24}
                width={Math.max(180, comp.length * spacing + 30)}
                height={42}
                rx={8}
                fill="rgba(0,229,196,0.04)"
                stroke="rgba(0,229,196,0.2)"
                strokeDasharray="4 4"
              />
              {comp.map((nodeIdx, local) => {
                const x = startX + local * spacing;
                if (local > 0) {
                  const prevX = startX + (local - 1) * spacing;
                  return (
                    <g key={`node-${idx}-${nodeIdx}`}>
                      <line x1={prevX + 14} y1={y - 3} x2={x - 14} y2={y - 3} stroke="rgba(0,229,196,0.5)" strokeWidth="1.5" />
                      <circle cx={x} cy={y - 3} r={13} fill="rgba(0,229,196,0.2)" stroke="#00e5c4" strokeWidth="1.5" />
                      <text x={x} y={y + 1} textAnchor="middle" fontSize="9" fill="#ccfff6" fontFamily="var(--font-mono)">{cities[nodeIdx].slice(0, 3).toUpperCase()}</text>
                    </g>
                  );
                }
                return (
                  <g key={`node-${idx}-${nodeIdx}`}>
                    <circle cx={x} cy={y - 3} r={13} fill="rgba(0,229,196,0.2)" stroke="#00e5c4" strokeWidth="1.5" />
                    <text x={x} y={y + 1} textAnchor="middle" fontSize="9" fill="#ccfff6" fontFamily="var(--font-mono)">{cities[nodeIdx].slice(0, 3).toUpperCase()}</text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function btnStyle(bg, color, border = '1px solid var(--border)') {
  return {
    background: bg,
    color,
    border,
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  };
}
