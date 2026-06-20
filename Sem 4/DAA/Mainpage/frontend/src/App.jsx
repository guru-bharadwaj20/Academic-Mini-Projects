import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import KruskalPage from "./pages/KruskalPage.jsx";
import DijkstraPage from "./pages/DijkstraPage.jsx";
import DPPage from "./pages/DPPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/kruskal" element={<KruskalPage />} />
      <Route path="/dijkstra" element={<DijkstraPage />} />
      <Route path="/dp" element={<DPPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
