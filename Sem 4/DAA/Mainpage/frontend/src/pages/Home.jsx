import { Link } from "react-router-dom";

const cards = [
  {
    route: "/kruskal",
    accent: "#2ec45a",
    title: "Kruskal's Algorithm",
    subtitle: "Minimum Spanning Tree for fiber optic network deployment",
    complexity: "O(E log E)",
  },
  {
    route: "/dijkstra",
    accent: "#f4c542",
    title: "Dijkstra's Algorithm",
    subtitle: "Shortest path routing for smart city traffic navigation",
    complexity: "O((V + E) log V)",
  },
  {
    route: "/dp",
    accent: "#e63946",
    title: "Dynamic Programming",
    subtitle: "Optimal airline ticket pricing over a dynamic booking horizon",
    complexity: "O(D x S x P^2)",
  },
];

const nodes = [
  [80, 50], [180, 95], [290, 70], [390, 110], [520, 85],
  [620, 150], [710, 95], [130, 210], [260, 175], [355, 225],
  [470, 195], [575, 250], [685, 210], [225, 300], [425, 310],
];

const edges = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 6], [3, 5], [5, 6],
  [1, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12],
  [2, 8], [3, 9], [4, 10], [5, 11], [8, 13], [9, 14], [10, 14],
  [13, 14], [0, 7], [6, 12],
];

export default function Home() {
  return (
    <div className="portal-home">
      <section className="hero">
        <div className="hero-network-wrap" aria-hidden="true">
          <svg className="hero-network" viewBox="0 0 800 360" preserveAspectRatio="xMidYMid slice">
            <g className="network-drift">
              {edges.map(([a, b], i) => (
                <line
                  key={`e-${i}`}
                  x1={nodes[a][0]}
                  y1={nodes[a][1]}
                  x2={nodes[b][0]}
                  y2={nodes[b][1]}
                  className="network-edge"
                  style={{ animationDelay: `${i * 0.11}s` }}
                />
              ))}
              {nodes.map(([x, y], i) => (
                <circle
                  key={`n-${i}`}
                  cx={x}
                  cy={y}
                  r="4"
                  className="network-node"
                  style={{ animationDelay: `${i * 0.22}s` }}
                />
              ))}
            </g>
          </svg>
        </div>

        <div className="hero-content">
          <h1>DSA Algorithm Explorer</h1>
          <p>Three algorithms. Three real-world problems. One interface.</p>
        </div>

        <div className="shimmer-divider" />

        <div className="cards-row">
          {cards.map((card) => (
            <article key={card.route} className="algo-card" style={{ "--accent": card.accent }}>
              <div className="top-accent" />
              <h2>{card.title}</h2>
              <p>{card.subtitle}</p>
              <div className="card-actions">
                <span className="complexity-pill">{card.complexity}</span>
                <Link to={card.route} className="launch-btn">
                  Launch -&gt;
                </Link>
              </div>
              <span className="hover-fill" />
            </article>
          ))}
        </div>

        <div className="home-footer">Built with React · Express · Vite</div>
      </section>

      <footer className="main-fixed-footer">
        <span>Made with </span>
        <span className="heart">♥</span>
        <span> by Deeptha, Guru, Diya and Subhransi</span>
      </footer>
    </div>
  );
}
