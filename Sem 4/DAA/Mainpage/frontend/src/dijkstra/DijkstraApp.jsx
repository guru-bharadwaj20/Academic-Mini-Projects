import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import RouteFinderTab from "./components/RouteFinderTab";
import GraphTab from "./components/GraphTab";
import AnalysisTab from "./components/AnalysisTab";
import AlgorithmTab from "./components/AlgorithmTab";

const API = "/api/dijkstra";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background: linear-gradient(135deg, #0d1424 0%, #111827 100%);
  border-bottom: 1px solid var(--border);
  padding: 0 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 32px rgba(0,0,0,0.4);
`;

const HeaderInner = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 2rem;
  height: 64px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
`;

const LogoIcon = styled.div`
  width: 36px;
  height: 36px;
  background: var(--accent);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
`;

const LogoText = styled.div`
  h1 { font-size: 1rem; font-weight: 800; letter-spacing: 0.05em; color: var(--text); }
  span { font-size: 0.7rem; color: var(--muted); font-family: 'Space Mono', monospace; letter-spacing: 0.1em; }
`;

const LiveBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-family: 'Space Mono', monospace;
  color: var(--accent3);
  letter-spacing: 0.1em;
  margin-left: auto;

  &::before {
    content: '';
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--accent3);
    animation: ${pulse} 2s infinite;
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: 0.25rem;
  margin-left: 2rem;
`;

const NavBtn = styled.button`
  padding: 0.4rem 1rem;
  border-radius: 6px;
  border: none;
  background: ${p => p.$active ? "var(--accent)" : "transparent"};
  color: ${p => p.$active ? "#000" : "var(--muted)"};
  font-family: 'Syne', sans-serif;
  font-weight: ${p => p.$active ? "700" : "500"};
  font-size: 0.82rem;
  letter-spacing: 0.05em;
  transition: all 0.2s;

  &:hover {
    background: ${p => p.$active ? "var(--accent)" : "var(--surface2)"};
    color: ${p => p.$active ? "#000" : "var(--text)"};
  }
`;

const Main = styled.main`
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
`;

const TABS = [
  { id: "route",     label: "🗺  Route Finder" },
  { id: "graph",     label: "🕸  Graph View" },
  { id: "analysis",  label: "📊 Analysis" },
  { id: "algorithm", label: "⚙  Algorithm" },
];

export default function App() {
  const [tab,   setTab]   = useState("route");
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  // Surfaces a failed graph load instead of leaving the UI silently empty.
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetch(`${API}/nodes`)
      .then((r) => { if (!r.ok) throw new Error(`nodes: HTTP ${r.status}`); return r.json(); })
      .then(setNodes)
      .catch((err) => { console.error(err); setLoadError(String(err.message || err)); });
    fetch(`${API}/edges`)
      .then((r) => { if (!r.ok) throw new Error(`edges: HTTP ${r.status}`); return r.json(); })
      .then(setEdges)
      .catch((err) => { console.error(err); setLoadError(String(err.message || err)); });
  }, []);

  // Surface a failed graph load; previously the fetch rejected silently
  // and the UI just stayed empty with no explanation.
  if (loadError) {
    return (
      <div style={{ padding: '2rem', color: '#f87171', fontFamily: 'system-ui, sans-serif' }}>
        Could not reach the routing API: {loadError}. Is the backend running?
      </div>
    );
  }


  return (
    <Shell>
      <Header>
        <HeaderInner>
          <Logo>
            <LogoIcon>🚦</LogoIcon>
            <LogoText>
              <h1>NAMMA ROUTE</h1>
              <span>BANGALORE SMART ROUTING SYSTEM</span>
            </LogoText>
          </Logo>

          <Nav>
            {TABS.map(t => (
              <NavBtn key={t.id} $active={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
              </NavBtn>
            ))}
          </Nav>

          <LiveBadge>DIJKSTRA LIVE</LiveBadge>
        </HeaderInner>
      </Header>

      <Main>
        {tab === "route"     && <RouteFinderTab nodes={nodes} api={API} />}
        {tab === "graph"     && <GraphTab nodes={nodes} edges={edges} api={API} />}
        {tab === "analysis"  && <AnalysisTab api={API} />}
        {tab === "algorithm" && <AlgorithmTab />}
      </Main>
    </Shell>
  );
}
