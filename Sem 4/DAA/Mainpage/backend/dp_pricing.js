"use strict";

/**
 * Dynamic Programming model for airline ticket pricing with inventory and demand memory.
 *
 * State:
 *   dp[day][seatsLeft][lastPriceIndex] = max revenue from 'day' to end.
 *
 * Decision:
 *   Choose one price tier p on current day.
 *
 * Transition:
 *   expectedDemand = demandModel(day, p, lastPrice)
 *   ticketsSold = min(seatsLeft, expectedDemand)
 *   revenueToday = ticketsSold * prices[p]
 *   dp = max over p of (revenueToday + dp[nextDay][seatsLeft - ticketsSold][p])
 */

const PRICE_TIERS = [100, 140, 180, 220];

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

/**
 * Build demand model from base demand pattern and price sensitivity.
 * Also includes price-memory behavior: sudden price hikes reduce demand.
 */
function buildDemandModel({
  baseDemandByDay,
  priceSensitivity = 0.03,
  memoryPenalty = 0.15,
  prices = PRICE_TIERS,
}) {
  // Anchor the model to the price list actually being optimised.
  //
  // This used to read the module-level PRICE_TIERS directly, while
  // optimizePricing() was handed whatever `prices` the caller supplied - and
  // the API accepts an arbitrary list. So a custom set was scored against a
  // reference price of 100 no matter what: with tiers of [1000..2200] every
  // priceFactor pinned to its 0.1 floor and demand at price 1000 came out as
  // 4 instead of the base 40, making the whole schedule meaningless.
  const referencePrice = Math.min(...prices);

  return (day, currentPrice, lastPrice) => {
    const base = baseDemandByDay[day];

    // Higher prices reduce demand proportionally.
    const priceFactor = clamp(1 - priceSensitivity * (currentPrice - referencePrice), 0.1, 1.2);

    // If current price > last price, apply memory penalty (customers react negatively).
    const penalty = lastPrice !== null && currentPrice > lastPrice ? (1 - memoryPenalty) : 1;

    const expected = base * priceFactor * penalty;
    return Math.max(0, Math.floor(expected));
  };
}

/**
 * Compute optimal revenue and policy by bottom-up dynamic programming.
 */
function optimizePricing({ days, seats, prices, demandModel }) {
  const nPrices = prices.length;

  // lastPriceIndex in [0..nPrices-1] plus one sentinel index nPrices for "no last price".
  const NONE = nPrices;

  // 3D table: (days+1) x (seats+1) x (nPrices+1)
  const dp = Array.from({ length: days + 1 }, () =>
    Array.from({ length: seats + 1 }, () => Array(nPrices + 1).fill(0))
  );

  const choice = Array.from({ length: days }, () =>
    Array.from({ length: seats + 1 }, () => Array(nPrices + 1).fill(-1))
  );

  for (let day = days - 1; day >= 0; day--) {
    for (let seatsLeft = 0; seatsLeft <= seats; seatsLeft++) {
      for (let lastIndex = 0; lastIndex <= nPrices; lastIndex++) {
        let best = -Infinity;
        let bestP = -1;

        const lastPrice = lastIndex === NONE ? null : prices[lastIndex];

        for (let p = 0; p < nPrices; p++) {
          const expectedDemand = demandModel(day, prices[p], lastPrice);
          const sold = Math.min(seatsLeft, expectedDemand);
          const revenueToday = sold * prices[p];
          const future = dp[day + 1][seatsLeft - sold][p];
          const total = revenueToday + future;

          if (total > best) {
            best = total;
            bestP = p;
          }
        }

        dp[day][seatsLeft][lastIndex] = best;
        choice[day][seatsLeft][lastIndex] = bestP;
      }
    }
  }

  // Reconstruct chosen policy starting from day 0, full seats, no last price.
  let seatsLeft = seats;
  let lastIndex = NONE;
  const policy = [];
  let totalRevenue = 0;

  for (let day = 0; day < days; day++) {
    const p = choice[day][seatsLeft][lastIndex];
    const lastPrice = lastIndex === NONE ? null : prices[lastIndex];
    const expectedDemand = demandModel(day, prices[p], lastPrice);
    const sold = Math.min(seatsLeft, expectedDemand);
    const revenue = sold * prices[p];

    policy.push({
      day: day + 1,
      price: prices[p],
      expectedDemand,
      sold,
      revenue,
      seatsLeftAfter: seatsLeft - sold,
    });

    totalRevenue += revenue;
    seatsLeft -= sold;
    lastIndex = p;
  }

  return {
    maxRevenue: dp[0][seats][NONE],
    reconstructedRevenue: totalRevenue,
    policy,
    complexity: {
      time: `O(D * S * P^2) with D=${days}, S=${seats}, P=${nPrices}`,
      space: `O(D * S * P) for dp and choice tables`,
    },
  };
}

function printExperiment(name, params) {
  console.log(`\n=== ${name} ===`);
  const result = optimizePricing(params);

  console.log(`Max revenue (DP): ${result.maxRevenue}`);
  console.log(`Reconstructed revenue: ${result.reconstructedRevenue}`);
  console.log(`Complexity: time ${result.complexity.time}, space ${result.complexity.space}`);
  console.log("Policy by day:");
  console.table(result.policy);

  return result;
}

function run() {
  const days = 10;
  const seats = 120;

  // Pattern 1: Early high demand that tapers off.
  const demandEarly = [40, 35, 32, 28, 24, 20, 16, 12, 10, 8];

  // Pattern 2: Last-minute rush.
  const demandLate = [8, 10, 12, 14, 18, 24, 30, 36, 42, 48];

  // Pattern 3: Event spike around mid-period.
  const demandEvent = [14, 16, 18, 20, 45, 50, 30, 22, 18, 14];

  const baseParams = {
    days,
    seats,
    prices: PRICE_TIERS,
  };

  const r1 = printExperiment("Pattern A: Early Demand", {
    ...baseParams,
    demandModel: buildDemandModel({
      baseDemandByDay: demandEarly,
      priceSensitivity: 0.02,
      memoryPenalty: 0.12,
    }),
  });

  const r2 = printExperiment("Pattern B: Late Demand", {
    ...baseParams,
    demandModel: buildDemandModel({
      baseDemandByDay: demandLate,
      priceSensitivity: 0.03,
      memoryPenalty: 0.18,
    }),
  });

  const r3 = printExperiment("Pattern C: Event Spike", {
    ...baseParams,
    demandModel: buildDemandModel({
      baseDemandByDay: demandEvent,
      priceSensitivity: 0.025,
      memoryPenalty: 0.10,
    }),
  });

  console.log("\n=== Interpretation Summary ===");
  console.log(`Pattern A revenue: ${r1.maxRevenue}`);
  console.log(`Pattern B revenue: ${r2.maxRevenue}`);
  console.log(`Pattern C revenue: ${r3.maxRevenue}`);

  console.log(
    "Insights: early-demand markets favor relatively higher initial prices; late-demand patterns often keep prices competitive early and raise later; event spikes justify higher prices near spike windows."
  );
}

if (require.main === module) {
  run();
}

module.exports = {
  optimizePricing,
  buildDemandModel,
  PRICE_TIERS,
};
