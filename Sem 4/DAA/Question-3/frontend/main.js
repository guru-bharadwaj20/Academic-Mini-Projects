const scenarioEl = document.querySelector("#scenario");
const demandEl = document.querySelector("#demand");
const formEl = document.querySelector("#optimizer-form");
const resultCardEl = document.querySelector("#result-card");
const compareCardEl = document.querySelector("#compare-card");
const summaryEl = document.querySelector("#summary");
const tableBodyEl = document.querySelector("#policy-table tbody");
const compareBtnEl = document.querySelector("#compare-scenarios");
const compareTableBodyEl = document.querySelector("#compare-table-body");
const daysEl = document.querySelector("#days");
const seatsEl = document.querySelector("#seats");
const pricesEl = document.querySelector("#prices");
const complexityTimeEl = document.querySelector("#complexity-time");
const complexitySpaceEl = document.querySelector("#complexity-space");
const stateCountEl = document.querySelector("#state-count");
const transitionCountEl = document.querySelector("#transition-count");

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

scenarioEl.addEventListener("change", () => {
  demandEl.value = SCENARIOS[scenarioEl.value] || demandEl.value;
});

function parseNumbers(input) {
  return input
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((x) => !Number.isNaN(x));
}

function createPayload(customDemand) {
  return {
    days: Number(daysEl.value),
    seats: Number(seatsEl.value),
    prices: parseNumbers(pricesEl.value),
    baseDemandByDay: customDemand || parseNumbers(demandEl.value),
    priceSensitivity: Number(document.querySelector("#priceSensitivity").value),
    memoryPenalty: Number(document.querySelector("#memoryPenalty").value),
  };
}

function updateComplexityPanel() {
  const D = Math.max(0, Number(daysEl.value) || 0);
  const S = Math.max(0, Number(seatsEl.value) || 0);
  const P = Math.max(0, parseNumbers(pricesEl.value).length);

  complexityTimeEl.textContent = `O(D * S * P^2) => O(${D} * ${S} * ${P}^2)`;
  complexitySpaceEl.textContent = `O(D * S * P) => O(${D} * ${S} * ${P})`;

  const states = D * (S + 1) * (P + 1);
  const transitions = D * (S + 1) * (P + 1) * P;
  stateCountEl.textContent = states.toLocaleString();
  transitionCountEl.textContent = transitions.toLocaleString();
}

async function requestOptimization(payload) {
  const response = await fetch("http://localhost:5001/optimize", {
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

function renderPolicy(policy) {
  tableBodyEl.innerHTML = "";

  for (const row of policy) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.day}</td>
      <td>${row.price}</td>
      <td>${row.expectedDemand}</td>
      <td>${row.sold}</td>
      <td>${row.revenue}</td>
      <td>${row.seatsLeftAfter}</td>
    `;
    tableBodyEl.appendChild(tr);
  }
}

function renderCompare(rows) {
  compareTableBodyEl.innerHTML = "";

  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.scenario}</td>
      <td>${row.maxRevenue}</td>
      <td>${row.firstDayPrice}</td>
      <td>${row.totalSold}</td>
    `;
    compareTableBodyEl.appendChild(tr);
  }

  compareCardEl.hidden = false;
}

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    summaryEl.textContent = "Running optimization...";
    resultCardEl.hidden = false;
    const payload = createPayload();
    const result = await requestOptimization(payload);

    summaryEl.textContent = `Max Revenue: ${result.maxRevenue} | Complexity: ${result.complexity.time}, ${result.complexity.space}`;
    renderPolicy(result.policy);
  } catch (error) {
    summaryEl.textContent = `Network error: ${error.message}`;
    tableBodyEl.innerHTML = "";
  }
});

compareBtnEl.addEventListener("click", async () => {
  compareBtnEl.disabled = true;
  compareBtnEl.textContent = "Comparing...";

  try {
    const rows = [];

    for (const [key, demandText] of Object.entries(SCENARIOS)) {
      const demand = parseNumbers(demandText);
      const result = await requestOptimization(createPayload(demand));
      const totalSold = result.policy.reduce((sum, item) => sum + item.sold, 0);

      rows.push({
        scenario: SCENARIO_LABELS[key],
        maxRevenue: result.maxRevenue,
        firstDayPrice: result.policy[0]?.price ?? "-",
        totalSold,
      });
    }

    rows.sort((a, b) => b.maxRevenue - a.maxRevenue);
    renderCompare(rows);
  } catch (error) {
    compareCardEl.hidden = false;
    compareTableBodyEl.innerHTML = `<tr><td colspan="4">Error: ${error.message}</td></tr>`;
  } finally {
    compareBtnEl.disabled = false;
    compareBtnEl.textContent = "Compare All Scenarios";
  }
});

daysEl.addEventListener("input", updateComplexityPanel);
seatsEl.addEventListener("input", updateComplexityPanel);
pricesEl.addEventListener("input", updateComplexityPanel);

updateComplexityPanel();
