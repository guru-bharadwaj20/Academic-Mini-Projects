import React, { useEffect, useMemo, useRef, useState } from 'react';
import GraphView from './components/GraphView.jsx';
import AlgorithmTrace from './components/AlgorithmTrace.jsx';
import AnalysisTab from './components/AnalysisTab.jsx';
import ScalabilityTab from './components/ScalabilityTab.jsx';
import CustomGraph from './components/CustomGraph.jsx';

const API = '/api/kruskal';

const TABS = [
  { id: 'mst', label: '⬡ MST Finder' },
  { id: 'graph', label: '⬡ Graph View' },
  { id: 'trace', label: '⬡ Algorithm Trace' },
  { id: 'analysis', label: '⬡ Complexity' },
  { id: 'scalability', label: '⬡ Scalability' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('mst');
  const [defaults, setDefaults] = useState(null);
  const [graphData, setGraphData] = useState({ cities: [], edges: [] });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    fetch(`${API}/defaults`)
      .then(r => r.json())
      .then(d => {
        setDefaults(d);
        const seeded = {
          cities: d.cities,
          edges: d.edges.map(e => ({ ...e, enabled: true })),
        };
        setGraphData(seeded);
        runMST(seeded.cities, seeded.edges);
      })
      .catch(() => setError('Cannot reach backend. Start the server on port 5000.'));
  }, []);

  async function runMST(cities, rawEdges) {
    setLoading(true);
    setError(null);
    try {
      const payloadEdges = rawEdges
        .filter(e => e.enabled !== false)
        .map(({ u, v, cost }) => ({ u, v, cost: Number(cost) }));

      const res = await fetch(`${API}/mst`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cities, edges: payloadEdges }),
      });

      const data = await res.json();
      setResult(data);
    } catch {
      setError('Backend connection failed.');
    } finally {
      setLoading(false);
    }
  }

  function updateGraph(updater) {
    setGraphData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      runMST(next.cities, next.edges);
      return next;
    });
  }

  function applyCustomGraph(cities, edges) {
    const next = {
      cities,
      edges: edges.map(e => ({ ...e, enabled: true })),
    };
    setGraphData(next);
    runMST(next.cities, next.edges);
    setBuilderOpen(false);
    setActiveTab('mst');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Header onOpenBuilder={() => setBuilderOpen(true)} />
      <nav style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        padding: '0 2rem',
        display: 'flex',
        gap: '0',
        overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text2)',
              padding: '1rem 1.4rem',
              fontFamily: 'var(--font-display)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '13px',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid rgba(248,113,113,0.3)',
          color: 'var(--red)',
          padding: '0.8rem 2rem',
          fontSize: '13px',
        }}>
          ⚠ {error}
        </div>
      )}

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {loading && activeTab === 'mst' && <Loader />}

        {activeTab === 'mst' && !loading && (
          <MSTTab
            result={result}
            graphData={graphData}
            onUpdateGraph={updateGraph}
          />
        )}
        {activeTab === 'graph' && (
          <GraphView result={result} />
        )}
        {activeTab === 'trace' && (
          <AlgorithmTrace result={result} />
        )}
        {activeTab === 'analysis' && (
          <AnalysisTab api={API} />
        )}
        {activeTab === 'scalability' && (
          <ScalabilityTab api={API} />
        )}
      </main>

      <CustomGraph
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onRun={applyCustomGraph}
        defaults={defaults}
      />

      <button
        onClick={() => setInfoOpen(true)}
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '1px solid rgba(0,229,196,0.45)',
          background: 'var(--accent3)',
          color: 'var(--accent)',
          fontSize: '24px',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          boxShadow: 'var(--glow)',
          zIndex: 120,
        }}
        title="Algorithm Info"
      >
        ?
      </button>
      <AlgorithmInfoDrawer open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}

function Header({ onOpenBuilder }) {
  return (
    <header style={{
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      padding: '1.2rem 2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      flexWrap: 'wrap',
    }}>
      <div style={{
        width: 44,
        height: 44,
        background: 'var(--accent3)',
        border: '1px solid var(--accent)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        boxShadow: 'var(--glow)',
      }}>⬡</div>
      <div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '1.35rem',
          color: 'var(--text)',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
        }}>
          FiberNet <span style={{ color: 'var(--accent)' }}>MST</span>
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: '13px', fontFamily: 'var(--font-secondary)' }}>
          Kruskal's Algorithm · Fiber Optic Network Deployment
        </p>
      </div>
      <button
        onClick={onOpenBuilder}
        style={{
          marginLeft: 'auto',
          background: 'var(--accent3)',
          color: 'var(--accent)',
          border: '1px solid rgba(0,229,196,0.3)',
          borderRadius: '8px',
          padding: '8px 14px',
          fontSize: '13px',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}
      >
        Build Custom Graph →
      </button>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <Stat label="Algorithm" value="Kruskal's" />
        <Stat label="Data Structure" value="Union-Find" />
        <Stat label="Complexity" value="O(E log E)" accent />
      </div>
    </header>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ color: 'var(--text3)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-secondary)' }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '13px',
        color: accent ? 'var(--accent)' : 'var(--text)',
        marginTop: '1px',
      }}>{value}</div>
    </div>
  );
}

function MSTTab({ result, graphData, onUpdateGraph }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [draftCost, setDraftCost] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [flashUpdated, setFlashUpdated] = useState(false);
  const [newEdge, setNewEdge] = useState({ u: '0', v: '1', cost: '100' });
  const prevMstSignature = useRef('');

  useEffect(() => {
    if (!result) return;
    const signature = result.mstEdges
      .map(e => [Math.min(e.u, e.v), Math.max(e.u, e.v), e.cost].join('-'))
      .sort()
      .join('|');
    if (prevMstSignature.current && prevMstSignature.current !== signature) {
      setFlashUpdated(true);
      const timer = setTimeout(() => setFlashUpdated(false), 1000);
      return () => clearTimeout(timer);
    }
    prevMstSignature.current = signature;
  }, [result]);

  if (!result || graphData.cities.length === 0) return <Loader />;

  const { cities, mstEdges, totalCost, isComplete, edgesChecked } = result;
  const sortedEdges = graphData.edges
    .map((e, index) => ({ ...e, index }))
    .sort((a, b) => a.cost - b.cost);

  const enabledEdges = graphData.edges.filter(e => e.enabled !== false);
  const theoreticalMax = Math.max(1, enabledEdges.reduce((sum, e) => sum + Number(e.cost || 0), 0));
  const costPct = Math.min(100, (totalCost / theoreticalMax) * 100);

  function inMST(edge) {
    return mstEdges.some(m =>
      (m.u === edge.u && m.v === edge.v) || (m.u === edge.v && m.v === edge.u)
    );
  }

  function startEdit(edge) {
    setEditingIndex(edge.index);
    setDraftCost(String(edge.cost));
  }

  function saveCost(index) {
    const parsed = Number(draftCost);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setEditingIndex(null);
      return;
    }
    onUpdateGraph(prev => ({
      ...prev,
      edges: prev.edges.map((e, i) => i === index ? { ...e, cost: parsed } : e),
    }));
    setEditingIndex(null);
  }

  function toggleEdge(index, checked) {
    onUpdateGraph(prev => ({
      ...prev,
      edges: prev.edges.map((e, i) => i === index ? { ...e, enabled: checked } : e),
    }));
  }

  function addEdge() {
    const u = Number(newEdge.u);
    const v = Number(newEdge.v);
    const cost = Number(newEdge.cost);
    if (u === v || !Number.isFinite(cost) || cost < 0) return;

    onUpdateGraph(prev => ({
      ...prev,
      edges: [...prev.edges, { u, v, cost, enabled: true }],
    }));
    setNewEdge(curr => ({ ...curr, cost: String(Math.max(10, Number(curr.cost) || 10)) }));
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Cities', value: cities.length, icon: '🏙' },
          { label: 'Total Edges', value: graphData.edges.length, icon: '🔗' },
          { label: 'MST Edges', value: mstEdges.length, icon: '✅' },
          { label: 'Edges Checked', value: edgesChecked, icon: '🔍' },
          { label: 'Total Cost', value: `$${totalCost}M`, icon: '💰', accent: true },
          { label: 'MST Status', value: isComplete ? 'Complete' : 'Forest', icon: isComplete ? '✅' : '⚠' },
        ].map(s => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '1.5rem' }}>
        <Card title="Minimum Spanning Tree" subtitle={`${mstEdges.length} connections · $${totalCost}M total`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '0.8rem' }}>
            {mstEdges.map((e, i) => (
              <div key={i} className="slide-in" style={{
                animationDelay: `${i * 0.05}s`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderLeft: '3px solid var(--accent)',
                borderRadius: '6px',
                padding: '8px 12px',
              }}>
                <span style={{ color: 'var(--text)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{cities[e.u]}</span>
                  <span style={{ color: 'var(--text3)', margin: '0 6px' }}>↔</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{cities[e.v]}</span>
                </span>
                <span style={{
                  background: 'var(--accent3)',
                  border: '1px solid rgba(0,229,196,0.2)',
                  color: 'var(--accent)',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}>${e.cost}M</span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: '1rem',
            padding: '10px 14px',
            background: 'var(--accent3)',
            border: '1px solid rgba(0,229,196,0.25)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ color: 'var(--text2)', fontSize: '12px', fontFamily: 'var(--font-secondary)' }}>MINIMUM TOTAL FIBER COST</span>
            <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px' }}>${totalCost}M</span>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text2)', fontFamily: 'var(--font-secondary)' }}>Cost Efficiency</span>
              <span style={{ color: 'var(--accent)' }}>${totalCost}M / ${theoreticalMax}M</span>
            </div>
            <div style={{ height: 10, background: 'var(--bg3)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{
                width: `${costPct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent2), var(--accent))',
                transition: 'width 0.35s ease',
              }} />
            </div>
          </div>
        </Card>

        <Card title="All Possible Connections" subtitle={`${sortedEdges.length} edges sorted by cost`}>
          <div style={{
            opacity: flashUpdated ? 1 : 0,
            transition: 'opacity 0.25s ease',
            color: 'var(--green)',
            fontFamily: 'var(--font-secondary)',
            fontSize: '13px',
            marginTop: '0.4rem',
            minHeight: '20px',
          }}>
            MST Updated
          </div>

          <div style={{ maxHeight: '325px', overflowY: 'auto', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {sortedEdges.map((e) => {
              const active = e.enabled !== false;
              const isInMst = active && inMST(e);
              return (
                <div
                  key={e.index}
                  onMouseEnter={() => setHoveredIndex(e.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr auto auto',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 10px',
                    borderRadius: '5px',
                    background: isInMst ? 'rgba(0,229,196,0.07)' : 'var(--bg3)',
                    border: `1px solid ${isInMst ? 'rgba(0,229,196,0.22)' : 'var(--border)'}`,
                    opacity: active ? 1 : 0.5,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(evt) => toggleEdge(e.index, evt.target.checked)}
                  />

                  <span style={{
                    fontSize: '12px',
                    color: 'var(--text2)',
                    textDecoration: active ? 'none' : 'line-through',
                    fontFamily: 'var(--font-secondary)',
                  }}>
                    {cities[e.u]} — {cities[e.v]}
                  </span>

                  {editingIndex === e.index ? (
                    <input
                      type="number"
                      value={draftCost}
                      autoFocus
                      onChange={(evt) => setDraftCost(evt.target.value)}
                      onBlur={() => saveCost(e.index)}
                      onKeyDown={(evt) => {
                        if (evt.key === 'Enter') saveCost(e.index);
                        if (evt.key === 'Escape') setEditingIndex(null);
                      }}
                      style={{
                        width: 78,
                        background: 'var(--bg)',
                        border: '1px solid rgba(0,229,196,0.35)',
                        borderRadius: '5px',
                        color: 'var(--accent)',
                        padding: '4px 6px',
                        fontSize: '12px',
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '12px', color: isInMst ? 'var(--accent)' : 'var(--text3)' }}>${e.cost}M</span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isInMst && <span style={{ fontSize: '10px', color: 'var(--accent)' }}>✓ MST</span>}
                    <button
                      onClick={() => startEdit(e)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text3)',
                        opacity: hoveredIndex === e.index ? 1 : 0,
                        transition: 'opacity 0.15s ease',
                        fontSize: '13px',
                        padding: 0,
                      }}
                      title="Edit edge cost"
                    >
                      ✏
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '0.9rem', borderTop: '1px dashed var(--border)', paddingTop: '0.9rem' }}>
            <div style={{ color: 'var(--text3)', fontSize: '11px', marginBottom: '8px', fontFamily: 'var(--font-secondary)' }}>ADD NEW EDGE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px auto', gap: '8px' }}>
              <select value={newEdge.u} onChange={(e) => setNewEdge(curr => ({ ...curr, u: e.target.value }))}>
                {cities.map((city, index) => <option key={city} value={index}>{city}</option>)}
              </select>
              <select value={newEdge.v} onChange={(e) => setNewEdge(curr => ({ ...curr, v: e.target.value }))}>
                {cities.map((city, index) => <option key={city} value={index}>{city}</option>)}
              </select>
              <input type="number" value={newEdge.cost} onChange={(e) => setNewEdge(curr => ({ ...curr, cost: e.target.value }))} />
              <button
                onClick={addEdge}
                style={{
                  background: 'var(--accent3)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(0,229,196,0.3)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                }}
              >
                Add Edge
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: `1px solid ${accent ? 'rgba(0,229,196,0.3)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '1rem 1.2rem',
      boxShadow: accent ? 'var(--glow)' : 'none',
    }}>
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: '1.4rem',
        color: accent ? 'var(--accent)' : 'var(--text)',
        lineHeight: 1.1,
      }}>{value}</div>
      <div style={{
        color: 'var(--text3)',
        fontSize: '11px',
        marginTop: '4px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-secondary)',
      }}>{label}</div>
    </div>
  );
}

export function Card({ title, subtitle, children, style }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '1.4rem',
      ...style,
    }}>
      <div style={{ marginBottom: subtitle ? '4px' : '0' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '14px',
          color: 'var(--text)',
          letterSpacing: '0.02em',
        }}>{title}</h3>
        {subtitle && <p style={{ color: 'var(--text3)', fontSize: '12px', marginTop: '2px', fontFamily: 'var(--font-secondary)' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function AlgorithmInfoDrawer({ open, onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5,8,9,0.52)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
          zIndex: 130,
        }}
      />
      <aside style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: 'min(560px, 95vw)',
        background: 'var(--card)',
        borderLeft: '1px solid var(--border)',
        transform: open ? 'translateX(0)' : 'translateX(102%)',
        transition: 'transform 0.28s ease',
        zIndex: 140,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '1rem 1.2rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', fontSize: '18px', fontWeight: 800 }}>
            Algorithm Info
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 6, padding: '4px 10px' }}>
            Close
          </button>
        </div>
        <div style={{ padding: '1.1rem 1.2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <section>
            <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 6, color: 'var(--text)' }}>Kruskal in Plain English</h4>
            <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, fontFamily: 'var(--font-secondary)' }}>
              Sort every possible cable connection from cheapest to most expensive. Keep adding the next cheapest connection only if it joins two different groups of cities. Skip any edge that creates a loop. Once you have exactly V - 1 accepted edges, you have the minimum-cost fully connected network.
            </p>
          </section>

          <section>
            <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 6, color: 'var(--text)' }}>Greedy Proof (3 points)</h4>
            <ul style={{ listStyle: 'none', display: 'grid', gap: 6, fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--font-secondary)' }}>
              <li>1. Cut property: for any partition of vertices, the cheapest edge crossing that cut is safe to include in an MST.</li>
              <li>2. Kruskal always picks globally cheapest safe edges, so each choice can be part of some optimal tree.</li>
              <li>3. Repeating safe choices until V - 1 edges yields an acyclic connected graph with minimum total cost.</li>
            </ul>
          </section>

          <section>
            <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 8, color: 'var(--text)' }}>Kruskal vs Prim</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={cellHeader}>Scenario</th>
                  <th style={cellHeader}>Pick</th>
                  <th style={cellHeader}>Why</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={cellBody}>Sparse graph, edge list input</td>
                  <td style={cellBodyAccent}>Kruskal</td>
                  <td style={cellBody}>Sort once, cheap Union-Find cycle checks</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={cellBody}>Dense graph, adjacency structure</td>
                  <td style={cellBodyAccent}>Prim</td>
                  <td style={cellBody}>Priority queue growth is typically more practical</td>
                </tr>
                <tr>
                  <td style={cellBody}>Need early local expansion</td>
                  <td style={cellBodyAccent}>Prim</td>
                  <td style={cellBody}>Builds one tree frontier from a start node</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 6, color: 'var(--text)' }}>Did You Know?</h4>
            <ul style={{ listStyle: 'none', display: 'grid', gap: 6, color: 'var(--text2)', fontSize: 13, fontFamily: 'var(--font-secondary)' }}>
              <li>• Fiber providers often compute MST-like backbones first, then add redundant links only where reliability targets require them.</li>
              <li>• Real trenching projects use weighted costs that include terrain, permits, and right-of-way fees, not just cable length.</li>
              <li>• Even tiny percentage savings in large metro rollouts can mean millions of dollars in capex reduction.</li>
            </ul>
          </section>
        </div>
      </aside>
    </>
  );
}

const cellHeader = {
  textAlign: 'left',
  padding: '7px 8px',
  color: 'var(--text3)',
  fontSize: '10px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-secondary)',
};

const cellBody = {
  padding: '8px',
  color: 'var(--text2)',
  fontFamily: 'var(--font-secondary)',
};

const cellBodyAccent = {
  ...cellBody,
  color: 'var(--accent)',
  fontWeight: 700,
};

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '12px' }}>
      <div style={{
        width: 20, height: 20,
        border: '2px solid var(--border2)',
        borderTop: '2px solid var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-secondary)' }}>Computing MST...</span>
    </div>
  );
}
