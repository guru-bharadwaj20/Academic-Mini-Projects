import React, { useMemo, useState } from 'react';

const PRESETS = {
  simple: {
    label: '5 Cities (Simple)',
    cities: ['Alpha', 'Bravo', 'Comet', 'Delta', 'Echo'],
    edges: [
      'Alpha, Bravo, 12',
      'Bravo, Comet, 9',
      'Comet, Delta, 7',
      'Delta, Echo, 11',
      'Alpha, Echo, 15',
      'Alpha, Delta, 10',
    ],
  },
  medium: {
    label: '10 Cities (Medium)',
    cities: ['Aster', 'Beryl', 'Coral', 'Dune', 'Ember', 'Fjord', 'Glade', 'Haven', 'Ion', 'Jade'],
    edges: [
      'Aster, Beryl, 20',
      'Aster, Coral, 11',
      'Beryl, Dune, 14',
      'Coral, Ember, 9',
      'Dune, Ember, 16',
      'Ember, Fjord, 7',
      'Fjord, Glade, 8',
      'Glade, Haven, 12',
      'Haven, Ion, 6',
      'Ion, Jade, 10',
      'Coral, Ion, 13',
      'Aster, Jade, 22',
    ],
  },
  india: {
    label: '8 Cities - India (Default)',
    cities: ['Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bengaluru', 'Hyderabad', 'Pune', 'Ahmedabad'],
    edges: [
      'Delhi, Mumbai, 140',
      'Delhi, Ahmedabad, 90',
      'Mumbai, Ahmedabad, 85',
      'Mumbai, Kolkata, 295',
      'Kolkata, Chennai, 185',
      'Chennai, Bengaluru, 350',
      'Bengaluru, Hyderabad, 130',
      'Hyderabad, Kolkata, 280',
      'Hyderabad, Chennai, 195',
      'Pune, Mumbai, 70',
      'Pune, Ahmedabad, 60',
      'Delhi, Pune, 120',
    ],
  },
};

function parseGraph(citiesRaw, edgesRaw) {
  const cityList = citiesRaw.split(',').map(c => c.trim()).filter(Boolean);
  const lines = edgesRaw.split('\n');

  const parsedEdges = [];
  const lineFeedback = lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return { line, valid: false, message: 'Empty line' };

    const parts = trimmed.split(',').map(p => p.trim());
    if (parts.length !== 3) {
      return { line, valid: false, message: `Line ${idx + 1}: use CityA, CityB, cost` };
    }

    const [a, b, c] = parts;
    const u = cityList.indexOf(a);
    const v = cityList.indexOf(b);
    const cost = Number(c);

    if (u === -1 || v === -1) {
      return { line, valid: false, message: `Line ${idx + 1}: unknown city` };
    }
    if (u === v) {
      return { line, valid: false, message: `Line ${idx + 1}: self-loop not allowed` };
    }
    if (!Number.isFinite(cost) || cost < 0) {
      return { line, valid: false, message: `Line ${idx + 1}: invalid cost` };
    }

    parsedEdges.push({ u, v, cost });
    return { line, valid: true, message: 'Valid edge' };
  });

  return {
    cityList,
    parsedEdges,
    lineFeedback,
    allValid: cityList.length >= 2 && lineFeedback.every(f => f.valid),
  };
}

export default function CustomGraph({ open, onClose, onRun, defaults }) {
  const [cities, setCities] = useState('');
  const [edges, setEdges] = useState('');
  const [error, setError] = useState('');

  const parsed = useMemo(() => parseGraph(cities, edges), [cities, edges]);

  function applyPreset(preset) {
    setCities(preset.cities.join(', '));
    setEdges(preset.edges.join('\n'));
    setError('');
  }

  function loadDefault() {
    if (!defaults) return;
    setCities(defaults.cities.join(', '));
    const lines = defaults.edges.map(e => `${defaults.cities[e.u]}, ${defaults.cities[e.v]}, ${e.cost}`);
    setEdges(lines.join('\n'));
    setError('');
  }

  function submit() {
    if (!parsed.allValid) {
      setError('Please fix invalid edge lines before running MST.');
      return;
    }
    setError('');
    onRun(parsed.cityList, parsed.parsedEdges);
  }

  const previewW = 330;
  const previewH = 210;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(8,12,13,0.5)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s ease',
          zIndex: 109,
        }}
      />
      <aside style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: 'min(620px, 100vw)',
        background: 'var(--card)',
        borderLeft: '1px solid var(--border)',
        transform: open ? 'translateX(0)' : 'translateX(102%)',
        transition: 'transform 0.28s ease',
        zIndex: 110,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          borderBottom: '1px solid var(--border)',
          padding: '1rem 1.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)' }}>Custom Graph Builder</h3>
            <p style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-secondary)' }}>Live validated input + mini preview</p>
          </div>
          <button onClick={onClose} style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', borderRadius: 6, padding: '6px 10px' }}>
            Close
          </button>
        </div>

        <div style={{ padding: '1rem 1.2rem', overflowY: 'auto', display: 'grid', gap: '0.95rem' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.values(PRESETS).map(preset => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset)}
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg3)',
                  color: 'var(--text2)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 12,
                  fontFamily: 'var(--font-secondary)',
                }}
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={loadDefault}
              style={{
                border: '1px solid rgba(0,229,196,0.3)',
                background: 'var(--accent3)',
                color: 'var(--accent)',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
                fontFamily: 'var(--font-secondary)',
              }}
            >
              Load Current Default
            </button>
          </div>

          <div>
            <label style={labelStyle}>Cities (comma-separated)</label>
            <input
              value={cities}
              onChange={evt => setCities(evt.target.value)}
              placeholder="Delhi, Mumbai, Chennai"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Edges (one per line: CityA, CityB, cost)</label>
            <textarea
              value={edges}
              onChange={evt => setEdges(evt.target.value)}
              rows={8}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder={'Delhi, Mumbai, 140\nMumbai, Pune, 70'}
            />

            <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
              {parsed.lineFeedback.slice(0, 8).map((line, i) => (
                <div
                  key={`${line.line}-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                    padding: '4px 8px',
                    borderRadius: 5,
                    border: `1px solid ${line.valid ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.35)'}`,
                    color: line.valid ? 'var(--green)' : 'var(--red)',
                    background: line.valid ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.08)',
                    fontFamily: 'var(--font-secondary)',
                  }}
                >
                  <span>{line.valid ? '✓' : '⚠'}</span>
                  <span>{line.message}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, background: 'var(--bg3)' }}>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 8, fontFamily: 'var(--font-secondary)' }}>Mini Graph Preview</div>
            <svg width="100%" viewBox={`0 0 ${previewW} ${previewH}`}>
              {parsed.parsedEdges.map((edge, idx) => {
                const total = Math.max(1, parsed.cityList.length - 1);
                const pu = {
                  x: 28 + (edge.u / total) * (previewW - 56),
                  y: 40 + ((edge.u * 19) % 5) * 32,
                };
                const pv = {
                  x: 28 + (edge.v / total) * (previewW - 56),
                  y: 40 + ((edge.v * 19) % 5) * 32,
                };
                return (
                  <line key={`edge-${idx}`} x1={pu.x} y1={pu.y} x2={pv.x} y2={pv.y} stroke="rgba(0,229,196,0.65)" strokeWidth="1.4" />
                );
              })}

              {parsed.cityList.map((city, idx) => {
                const total = Math.max(1, parsed.cityList.length - 1);
                const p = {
                  x: 28 + (idx / total) * (previewW - 56),
                  y: 40 + ((idx * 19) % 5) * 32,
                };
                return (
                  <g key={`node-${city}-${idx}`}>
                    <circle cx={p.x} cy={p.y} r={11} fill="rgba(0,229,196,0.16)" stroke="#00e5c4" strokeWidth="1.2" />
                    <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize="8" fill="#ccfff6" fontFamily="var(--font-mono)">
                      {city.slice(0, 2).toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              color: 'var(--red)',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            onClick={submit}
            style={{
              background: 'var(--accent3)',
              color: 'var(--accent)',
              border: '1px solid rgba(0,229,196,0.3)',
              borderRadius: '7px',
              padding: '9px 16px',
              fontSize: '13px',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
            }}
          >
            ▶ Run MST
          </button>
        </div>
      </aside>
    </>
  );
}

const labelStyle = {
  color: 'var(--text3)',
  fontSize: '11px',
  display: 'block',
  marginBottom: '6px',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-secondary)',
};

const inputStyle = {
  width: '100%',
  background: 'var(--bg3)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  padding: '8px 12px',
  color: 'var(--text)',
  fontSize: '12px',
  outline: 'none',
};
