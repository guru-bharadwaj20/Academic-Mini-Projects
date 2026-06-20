import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../dp/dp.css";

const API = "/api/dp";

const SCENARIOS = {
  early: "40,35,32,28,24,20,16,12,10,8",
  late: "8,10,12,14,18,24,30,36,42,48",
  event: "14,16,18,20,45,50,30,22,18,14",
};

const SCENARIO_LABELS = {
  early: "Early Demand",
  late: "Late Demand",
  event: "Event Spike",
};

function parseNumbers(input) {
  return input
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((x) => !Number.isNaN(x));
}

export default function DPPage() {
  const [days, setDays] = useState(10);
  const [seats, setSeats] = useState(120);
  const [prices, setPrices] = useState("100,140,180,220");
  const [scenario, setScenario] = useState("early");
  const [demand, setDemand] = useState(SCENARIOS.early);
  const [priceSensitivity, setPriceSensitivity] = useState(0.03);
  const [memoryPenalty, setMemoryPenalty] = useState(0.15);

  const [summary, setSummary] = useState("");
  const [policy, setPolicy] = useState([]);
  const [compareRows, setCompareRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);

  const complexity = useMemo(() => {
    const D = Math.max(0, Number(days) || 0);
    const S = Math.max(0, Number(seats) || 0);
    const P = Math.max(0, parseNumbers(prices).length);
    return {
      time: `O(D * S * P^2) => O(${D} * ${S} * ${P}^2)`,
      space: `O(D * S * P) => O(${D} * ${S} * ${P})`,
      states: (D * (S + 1) * (P + 1)).toLocaleString(),
      transitions: (D * (S + 1) * (P + 1) * P).toLocaleString(),
    };
  }, [days, seats, prices]);

  function createPayload(customDemand) {
    return {
      days: Number(days),
      seats: Number(seats),
      prices: parseNumbers(prices),
      baseDemandByDay: customDemand || parseNumbers(demand),
      priceSensitivity: Number(priceSensitivity),
      memoryPenalty: Number(memoryPenalty),
    };
  }

  async function requestOptimization(payload) {
    const response = await fetch(`${API}/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data.output;
  }

  async function optimizeSelected(event) {
    event.preventDefault();
    setLoading(true);
    setSummary("Running optimization...");
    setCompareRows([]);

    try {
      const result = await requestOptimization(createPayload());
      setSummary(`Max Revenue: ${result.maxRevenue} | Complexity: ${result.complexity.time}, ${result.complexity.space}`);
      setPolicy(result.policy || []);
    } catch (error) {
      setSummary(`Network error: ${error.message}`);
      setPolicy([]);
    } finally {
      setLoading(false);
    }
  }

  async function compareAllScenarios() {
    setComparing(true);
    setSummary("");
    setPolicy([]);

    try {
      const rows = [];
      for (const [key, demandText] of Object.entries(SCENARIOS)) {
        const scenarioDemand = parseNumbers(demandText);
        const result = await requestOptimization(createPayload(scenarioDemand));
        const totalSold = (result.policy || []).reduce((sum, item) => sum + item.sold, 0);

        rows.push({
          scenario: SCENARIO_LABELS[key],
          maxRevenue: result.maxRevenue,
          firstDayPrice: result.policy?.[0]?.price ?? "-",
          totalSold,
        });
      }

      rows.sort((a, b) => b.maxRevenue - a.maxRevenue);
      setCompareRows(rows);
    } catch (error) {
      setCompareRows([{ scenario: `Error: ${error.message}`, maxRevenue: "-", firstDayPrice: "-", totalSold: "-" }]);
    } finally {
      setComparing(false);
    }
  }

  return (
    <div className="dp-page">
      <Link to="/" className="back-portal-btn">
        &larr; Back to Portal
      </Link>

      <div className="bg-orb bg-orb-a" />
      <div className="bg-orb bg-orb-b" />

      <main className="app">
        <header className="hero card reveal">
          <p className="eyebrow">Dynamic Programming Assignment</p>
          <h1>Airline Ticket Pricing Optimization</h1>
          <p>
            This dashboard is split into 5 sections that exactly match the assignment tasks:
            formulation, DP design, implementation, complexity, and experiments.
          </p>
        </header>

        <nav className="task-nav card reveal delay-1">
          <a href="#task1">Task 1</a>
          <a href="#task2">Task 2</a>
          <a href="#task3">Task 3</a>
          <a href="#task4">Task 4</a>
          <a href="#task5">Task 5</a>
        </nav>

        <section id="task1" className="card reveal delay-1">
          <p className="eyebrow">Task 1</p>
          <h2>Problem Formulation</h2>
          <div className="two-col">
            <article className="mini-panel"><h3>State</h3><p><code>dp[d][s][l]</code> represents max future revenue from day <code>d</code> with <code>s</code> seats left and previous price index <code>l</code>.</p></article>
            <article className="mini-panel"><h3>Decision</h3><p>Each day selects one price tier from the available options such as 100, 140, 180, or 220.</p></article>
            <article className="mini-panel"><h3>Transition</h3><p>Sold seats are minimum of inventory and demand affected by today price and price memory.</p></article>
            <article className="mini-panel"><h3>Recurrence</h3><p><code>dp[d][s][l] = max_p(revenueToday + dp[d+1][s-sold][p])</code> with base case <code>dp[D][s][l] = 0</code>.</p></article>
          </div>
        </section>

        <section id="task2" className="card reveal delay-2">
          <p className="eyebrow">Task 2</p>
          <h2>Dynamic Programming Design</h2>
          <ol className="steps">
            <li>Create 3D DP table for day, seats left, and previous-price memory.</li>
            <li>Fill from last day to first day using all possible prices at each state.</li>
            <li>Store best action in a choice table for policy reconstruction.</li>
            <li>Reconstruct optimal daily pricing policy from day 1 with full seats.</li>
          </ol>
        </section>

        <section id="task3" className="card reveal delay-2">
          <p className="eyebrow">Task 3</p>
          <h2>Implementation Coverage</h2>
          <div className="status-grid">
            <article className="mini-panel"><h3>Core Algorithm</h3><p>Implemented in <code>dp_pricing.js</code> with reusable functions for demand and optimization.</p></article>
            <article className="mini-panel"><h3>Backend API</h3><p>Runs on port 5000 under <code>/api/dp/*</code> for this unified portal.</p></article>
            <article className="mini-panel"><h3>Frontend UI</h3><p>This interface collects inputs, calls backend optimization, and shows policy tables.</p></article>
          </div>
        </section>

        <section id="task4" className="card reveal delay-3">
          <p className="eyebrow">Task 4</p>
          <h2>Complexity Analysis</h2>
          <div className="complexity-grid">
            <article className="complexity-box"><h3>Asymptotic Time</h3><p className="mono">{complexity.time}</p></article>
            <article className="complexity-box"><h3>Asymptotic Space</h3><p className="mono">{complexity.space}</p></article>
            <article className="complexity-box"><h3>Approximate States</h3><p className="mono">{complexity.states}</p></article>
            <article className="complexity-box"><h3>Approximate Transitions</h3><p className="mono">{complexity.transitions}</p></article>
          </div>
        </section>

        <section id="task5" className="card reveal delay-3">
          <p className="eyebrow">Task 5</p>
          <h2>Experiments and Interpretation</h2>
          <p>Run one scenario or compare all demand patterns with your current pricing parameters.</p>

          <form id="optimizer-form" onSubmit={optimizeSelected}>
            <div className="grid">
              <label>Days<input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} required /></label>
              <label>Seats<input type="number" min="0" value={seats} onChange={(e) => setSeats(e.target.value)} required /></label>
              <label>Prices (comma-separated)<input type="text" value={prices} onChange={(e) => setPrices(e.target.value)} required /></label>
              <label>Scenario
                <select value={scenario} onChange={(e) => { setScenario(e.target.value); setDemand(SCENARIOS[e.target.value] || demand); }}>
                  <option value="early">Early Demand</option>
                  <option value="late">Late Demand</option>
                  <option value="event">Event Spike</option>
                </select>
              </label>
              <label>Base Demand by Day (comma-separated)<input type="text" value={demand} onChange={(e) => setDemand(e.target.value)} required /></label>
              <label>Price Sensitivity<input type="number" min="0" step="0.001" value={priceSensitivity} onChange={(e) => setPriceSensitivity(e.target.value)} required /></label>
              <label>Memory Penalty (0-1)<input type="number" min="0" max="1" step="0.01" value={memoryPenalty} onChange={(e) => setMemoryPenalty(e.target.value)} required /></label>
            </div>

            <div className="actions">
              <button type="submit" disabled={loading}>{loading ? "Running..." : "Optimize Selected Scenario"}</button>
              <button type="button" className="ghost" disabled={comparing} onClick={compareAllScenarios}>{comparing ? "Comparing..." : "Compare All Scenarios"}</button>
            </div>
          </form>

          {summary && (
            <section className="result-area">
              <h3>Selected Scenario Result</h3>
              <p>{summary}</p>
              <div className="table-wrap">
                <table id="policy-table">
                  <thead><tr><th>Day</th><th>Price</th><th>Expected Demand</th><th>Sold</th><th>Revenue</th><th>Seats Left After</th></tr></thead>
                  <tbody>
                    {policy.map((row) => (
                      <tr key={`p-${row.day}`}>
                        <td>{row.day}</td><td>{row.price}</td><td>{row.expectedDemand}</td><td>{row.sold}</td><td>{row.revenue}</td><td>{row.seatsLeftAfter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {!!compareRows.length && (
            <section className="result-area">
              <h3>Scenario Comparison</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Scenario</th><th>Max Revenue</th><th>First Day Price</th><th>Total Seats Sold</th></tr></thead>
                  <tbody>
                    {compareRows.map((row, idx) => (
                      <tr key={`c-${idx}`}>
                        <td>{row.scenario}</td><td>{row.maxRevenue}</td><td>{row.firstDayPrice}</td><td>{row.totalSold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}
