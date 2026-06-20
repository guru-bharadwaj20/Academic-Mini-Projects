import React, { useMemo, useState } from 'react';
import { Card } from '../App.jsx';

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ScalabilityTab({ api }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function runBenchmark() {
    setLoading(true);
    setResults([]);

    try {
      const res = await fetch(`${api}/scalability`, { method: 'POST' });

      if (!res.body) {
        const fallback = await res.json();
        setResults(fallback.results || []);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        lines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed) return;
          try {
            const row = JSON.parse(trimmed);
            setResults(prev => [...prev, row]);
          } catch {
            // ignore malformed partial lines
          }
        });
      }

      if (buffer.trim()) {
        try {
          const row = JSON.parse(buffer.trim());
          setResults(prev => [...prev, row]);
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const maxTime = results.length ? Math.max(...results.map(r => r.timeMs)) : 1;

  const chartModel = useMemo(() => {
    if (!results.length) return null;
    const padding = { left: 42, right: 20, top: 16, bottom: 30 };
    const width = 760;
    const height = 250;
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const bars = results.map((row, i) => {
      const step = innerW / results.length;
      const barW = step * 0.52;
      const x = padding.left + i * step + step * 0.24;
      const barH = Math.max(4, (row.timeMs / maxTime) * innerH);
      const y = padding.top + innerH - barH;
      return { ...row, x, y, barW, barH };
    });

    const theoreticalValues = results.map(r => r.edges * Math.log2(Math.max(2, r.edges)));
    const maxTheo = Math.max(...theoreticalValues);

    const path = results.map((row, i) => {
      const step = innerW / results.length;
      const x = padding.left + i * step + step * 0.5;
      const scaled = (theoreticalValues[i] / maxTheo) * maxTime;
      const y = padding.top + innerH - (scaled / maxTime) * innerH;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return { width, height, padding, innerW, innerH, bars, path };
  }, [results, maxTime]);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>
            Scalability Evaluation
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '12px', marginTop: '2px', fontFamily: 'var(--font-secondary)' }}>
            Streaming benchmark results as each graph size completes
          </p>
        </div>
        <button onClick={runBenchmark} disabled={loading} style={{
          background: loading ? 'var(--bg3)' : 'var(--accent3)',
          color: loading ? 'var(--text3)' : 'var(--accent)',
          border: `1px solid ${loading ? 'var(--border)' : 'rgba(0,229,196,0.3)'}`,
          borderRadius: '8px',
          padding: '8px 20px',
          fontSize: '13px',
          fontFamily: 'var(--font-secondary)',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {loading ? (
            <>
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--border2)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Running Stream...
            </>
          ) : '▶ Run Benchmark'}
        </button>
      </div>

      {!results.length && !loading && (
        <div style={{
          background: 'var(--card)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius)',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text3)',
          fontFamily: 'var(--font-secondary)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <p>Click "Run Benchmark" to test scalability across 5 graph sizes</p>
          <p style={{ fontSize: '11px', marginTop: '4px' }}>Rows will appear progressively as backend NDJSON chunks arrive</p>
        </div>
      )}

      {!!results.length && (
        <>
          <Card title="Benchmark Results" subtitle="Rows stream in completion order as they finish on backend">
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Cities (V)', 'Edges (E)', 'MST Cost', 'Time (ms)', 'Memory Estimate', 'Performance'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text3)', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => {
                  const memoryBytes = row.edges * 24;
                  return (
                    <tr key={`${row.cities}-${i}`} className="slide-in" style={{ animationDelay: `${i * 0.08}s`, borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 10px', color: 'var(--text)', fontWeight: 700 }}>{row.cities.toLocaleString()}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{row.edges.toLocaleString()}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--amber)' }}>${row.mstCost.toLocaleString()}M</td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ color: row.timeMs < 10 ? 'var(--green)' : row.timeMs < 100 ? 'var(--amber)' : 'var(--red)', fontWeight: 700 }}>
                          {row.timeMs.toFixed(2)}ms
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text2)', fontFamily: 'var(--font-secondary)' }}>
                        {formatBytes(memoryBytes)}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3 }}>
                            <div style={{
                              height: '100%',
                              width: `${(row.timeMs / maxTime) * 100}%`,
                              background: row.timeMs < 10 ? 'var(--green)' : row.timeMs < 100 ? 'var(--amber)' : 'var(--red)',
                              borderRadius: 3,
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {chartModel && (
            <Card title="Execution Time vs Graph Size" subtitle="Bars = measured runtime, dashed teal curve = normalized O(E log E)">
              <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
                <svg viewBox={`0 0 ${chartModel.width} ${chartModel.height}`} width="100%" height={chartModel.height}>
                  <line
                    x1={chartModel.padding.left}
                    y1={chartModel.height - chartModel.padding.bottom}
                    x2={chartModel.width - chartModel.padding.right}
                    y2={chartModel.height - chartModel.padding.bottom}
                    stroke="var(--border)"
                  />

                  {chartModel.bars.map((bar, i) => (
                    <g key={`bar-${bar.cities}-${i}`}>
                      <rect
                        x={bar.x}
                        y={bar.y}
                        width={bar.barW}
                        height={bar.barH}
                        rx="4"
                        fill="url(#barGrad)"
                        opacity="0.84"
                      />
                      <text x={bar.x + bar.barW / 2} y={bar.y - 6} textAnchor="middle" fontSize="10" fill="var(--accent)">
                        {bar.timeMs.toFixed(1)}ms
                      </text>
                      <text
                        x={bar.x + bar.barW / 2}
                        y={chartModel.height - chartModel.padding.bottom + 16}
                        textAnchor="middle"
                        fontSize="10"
                        fill="var(--text3)"
                        fontFamily="var(--font-secondary)"
                      >
                        {bar.cities >= 1000 ? `${bar.cities / 1000}K` : bar.cities}
                      </text>
                    </g>
                  ))}

                  <path
                    d={chartModel.path}
                    fill="none"
                    stroke="#22d3c5"
                    strokeWidth="2"
                    strokeDasharray="7 6"
                  />

                  <text
                    x={chartModel.width - chartModel.padding.right - 8}
                    y={chartModel.padding.top + 12}
                    textAnchor="end"
                    fontSize="10"
                    fill="#22d3c5"
                    fontFamily="var(--font-secondary)"
                  >
                    O(E log E)
                  </text>

                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" />
                      <stop offset="100%" stopColor="var(--accent2)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
