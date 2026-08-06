import { Link } from "react-router-dom";
import ErrorBoundary from "../ErrorBoundary.jsx";
import KruskalApp from "../kruskal/KruskalApp.jsx";

const kruskalTheme = {
  "--bg": "#0a0e0f",
  "--bg2": "#0f1517",
  "--bg3": "#141c1e",
  "--card": "#161e20",
  "--card2": "#1c2628",
  "--border": "#243035",
  "--border2": "#2e3c40",
  "--accent": "#00e5c4",
  "--accent2": "#00b89e",
  "--accent3": "rgba(0, 229, 196, 0.08)",
  "--accent4": "rgba(0, 229, 196, 0.15)",
  "--green": "#4ade80",
  "--red": "#f87171",
  "--amber": "#fbbf24",
  "--text": "#e8f0f2",
  "--text2": "#8fa8ae",
  "--text3": "#5a7278",
  "--font-display": "Orbitron, sans-serif",
  "--font-mono": "Inter, monospace",
  "--font-secondary": "Inter, sans-serif",
  "--radius": "10px",
  "--shadow": "0 4px 24px rgba(0,0,0,0.4)",
  "--glow": "0 0 20px rgba(0, 229, 196, 0.12)",
};

export default function KruskalPage() {
  return (
    <div style={{ ...kruskalTheme, background: "var(--bg)", minHeight: "100vh" }}>
      <Link to="/" className="back-portal-btn">
        &larr; Back to Portal
      </Link>
      <ErrorBoundary label="KruskalApp"><KruskalApp /></ErrorBoundary>
    </div>
  );
}
