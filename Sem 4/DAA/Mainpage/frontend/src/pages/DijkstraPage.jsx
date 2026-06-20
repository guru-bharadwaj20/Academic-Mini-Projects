import { Link } from "react-router-dom";
import DijkstraApp from "../dijkstra/DijkstraApp.jsx";

const dijkstraTheme = {
  "--bg": "#0a0e1a",
  "--surface": "#111827",
  "--surface2": "#1a2235",
  "--border": "#1e2d4a",
  "--accent": "#f97316",
  "--accent2": "#38bdf8",
  "--accent3": "#4ade80",
  "--danger": "#f43f5e",
  "--text": "#e2e8f0",
  "--muted": "#64748b",
  "--highlight": "#fbbf24",
};

export default function DijkstraPage() {
  return (
    <div style={{ ...dijkstraTheme, background: "var(--bg)", minHeight: "100vh" }}>
      <Link to="/" className="back-portal-btn">
        &larr; Back to Portal
      </Link>
      <DijkstraApp />
    </div>
  );
}
