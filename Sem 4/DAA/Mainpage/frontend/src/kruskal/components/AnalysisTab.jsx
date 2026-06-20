import React, { useState, useEffect } from 'react';
import { Card } from '../KruskalApp.jsx';

export default function AnalysisTab({ api }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${api}/analysis`).then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div style={{ color: 'var(--text3)', padding: '2rem' }}>Loading analysis...</div>;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>
          Complexity Analysis
        </h2>
        <p style={{ color: 'var(--text3)', fontSize: '12px', marginTop: '2px' }}>
          Time & space complexity breakdown with algorithm comparisons
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Time Complexity */}
        <Card title="Time Complexity Breakdown">
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Operation', 'Complexity', 'Notes'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text3)', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.timeComplexity.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i === data.timeComplexity.length - 1 ? 'var(--accent3)' : 'transparent' }}>
                  <td style={{ padding: '8px 8px', color: 'var(--text)' }}>{row.operation}</td>
                  <td style={{ padding: '8px 8px' }}>
                    <code style={{
                      background: i === data.timeComplexity.length - 1 ? 'transparent' : 'var(--bg3)',
                      color: i === data.timeComplexity.length - 1 ? 'var(--accent)' : 'var(--amber)',
                      padding: '2px 6px', borderRadius: '4px', fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: i === data.timeComplexity.length - 1 ? 700 : 400,
                    }}>{row.complexity}</code>
                  </td>
                  <td style={{ padding: '8px 8px', color: 'var(--text3)', fontSize: '11px' }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{
            marginTop: '1rem',
            padding: '10px 12px',
            background: 'var(--bg3)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}>
            <div style={{ color: 'var(--text3)', fontSize: '11px', marginBottom: '4px' }}>Space Complexity</div>
            <code style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>O(V + E)</code>
            <span style={{ color: 'var(--text3)', fontSize: '11px', marginLeft: '10px' }}>O(E) for edges + O(V) for Union-Find</span>
          </div>
        </Card>

        {/* Algorithm Comparison */}
        <Card title="MST Algorithm Comparison">
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Algorithm', 'Complexity', 'Best For'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text3)', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.comparison.map((row, i) => (
                <tr key={i} style={{
                  borderBottom: '1px solid var(--border)',
                  background: i === 0 ? 'var(--accent3)' : 'transparent',
                  borderLeft: i === 0 ? '3px solid var(--accent)' : '3px solid transparent',
                }}>
                  <td style={{ padding: '8px 8px', color: i === 0 ? 'var(--accent)' : 'var(--text)', fontWeight: i === 0 ? 700 : 400 }}>
                    {row.algorithm} {i === 0 && '★'}
                  </td>
                  <td style={{ padding: '8px 8px' }}>
                    <code style={{
                      background: 'var(--bg3)',
                      color: i === 0 ? 'var(--accent)' : 'var(--amber)',
                      padding: '2px 6px', borderRadius: '4px', fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                    }}>{row.complexity}</code>
                  </td>
                  <td style={{ padding: '8px 8px', color: 'var(--text3)', fontSize: '11px' }}>{row.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Union-Find explanation */}
      <Card title="Union-Find (Disjoint Set) — How it Works">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
          <div>
            <h4 style={{ color: 'var(--accent)', fontSize: '12px', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '8px' }}>
              Path Compression
            </h4>
            <p style={{ color: 'var(--text2)', fontSize: '12px', lineHeight: 1.7 }}>
              When calling <code style={{ color: 'var(--amber)', background: 'var(--bg3)', padding: '1px 5px', borderRadius: '3px' }}>find(x)</code>, every node on the path to the root is directly attached to the root. This flattens the tree and makes future lookups nearly O(1).
            </p>
            <pre style={{ marginTop: '10px', background: 'var(--bg3)', borderRadius: '6px', padding: '10px', fontSize: '11px', color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>{`find(x):
  if parent[x] != x:
    parent[x] = find(parent[x])  // compress
  return parent[x]`}</pre>
          </div>
          <div>
            <h4 style={{ color: 'var(--accent)', fontSize: '12px', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '8px' }}>
              Union by Rank
            </h4>
            <p style={{ color: 'var(--text2)', fontSize: '12px', lineHeight: 1.7 }}>
              When merging two sets, always attach the shorter tree under the taller one. This keeps tree height bounded at O(log n), preventing degenerate chains.
            </p>
            <pre style={{ marginTop: '10px', background: 'var(--bg3)', borderRadius: '6px', padding: '10px', fontSize: '11px', color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>{`union(x, y):
  rx, ry = find(x), find(y)
  if rank[rx] < rank[ry]:
    swap(rx, ry)
  parent[ry] = rx           // attach smaller
  if rank[rx] == rank[ry]:
    rank[rx]++`}</pre>
          </div>
        </div>
        <div style={{
          marginTop: '1rem',
          padding: '12px 14px',
          background: 'var(--bg3)',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          fontSize: '12px',
          color: 'var(--text2)',
          lineHeight: 1.7,
        }}>
          <strong style={{ color: 'var(--accent)' }}>Combined result:</strong> Both optimizations together yield amortized{' '}
          <code style={{ color: 'var(--amber)', background: 'rgba(251,191,36,0.1)', padding: '1px 5px', borderRadius: '3px' }}>O(α(n))</code>{' '}
          per operation, where α is the inverse Ackermann function — effectively constant (≤4) for all practical input sizes. The total Union-Find overhead across all E edges is{' '}
          <code style={{ color: 'var(--amber)', background: 'rgba(251,191,36,0.1)', padding: '1px 5px', borderRadius: '3px' }}>O(E·α(V))</code>,
          which is negligible compared to the O(E log E) sort.
        </div>
      </Card>

      {/* Practical limitations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Card title="✅ Kruskal's Strengths">
          <ul style={{ marginTop: '0.8rem', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              'Optimal for sparse graphs (fiber networks, roads)',
              'Simple, elegant greedy approach',
              'Easy to parallelize edge sorting',
              'Works on disconnected graphs (returns forest)',
              'Union-Find overhead is negligible vs sort',
              'Guaranteed minimum spanning tree (correctness proven)',
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text2)' }}>
                <span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="⚠ Practical Limitations">
          <ul style={{ marginTop: '0.8rem', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              'Static graph — re-run needed for topology changes',
              'Single cost metric — ignores terrain, permits, latency',
              'No built-in parallelism (use Borůvka for distributed)',
              '~24 bytes/edge → ~2.4 GB for 100M edges',
              'Disconnected graphs produce spanning forest, not tree',
              'Not suited for dense graphs (Prim\'s preferred then)',
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text2)' }}>
                <span style={{ color: 'var(--red)', flexShrink: 0 }}>✗</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
