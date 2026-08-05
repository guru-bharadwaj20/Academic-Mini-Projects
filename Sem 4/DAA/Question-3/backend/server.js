"use strict";

const express = require("express");
const cors = require("cors");
const { optimizePricing, buildDemandModel, PRICE_TIERS } = require("../dp_pricing");

const app = express();
const PORT = process.env.PORT || 5001;

// Restrict CORS to the local dev frontends. `cors()` with no options
// reflects whatever Origin the caller sends, so ANY website the developer
// happened to visit could call these APIs from the browser.
// Override with CORS_ORIGINS="http://host:port,..." when needed.
const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGINS ||
  [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
  ].join(",")
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // No Origin header => not a browser cross-origin request (curl, tests,
    // server-to-server). Those are unaffected by CORS, so allow them.
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    // Omit the CORS headers rather than throwing: the browser blocks the
    // response cleanly instead of the app returning a 500.
    return callback(null, false);
  },
};

app.use(cors(corsOptions));
app.use(express.json());

function toNumberArray(value) {
  if (Array.isArray(value)) {
    return value.map((n) => Number(n));
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => !Number.isNaN(v));
  }

  return [];
}

// Bounds on the DP problem size. optimizePricing allocates two dense
// (days+1) x (seats+1) x (priceTiers+1) tables, so an unbounded `seats` or
// `days` let a single small JSON body exhaust the heap and kill the server
// (e.g. {"seats": 10000000} allocated tens of millions of arrays).
const MAX_DAYS = 60;
const MAX_SEATS = 1000;
const MAX_PRICE_TIERS = 12;
const MAX_DP_CELLS = 2_000_000;

function validateInput(body) {
  const days = Number(body.days);
  const seats = Number(body.seats);
  const prices = toNumberArray(body.prices);
  const baseDemandByDay = toNumberArray(body.baseDemandByDay);
  const priceSensitivity = Number(body.priceSensitivity);
  const memoryPenalty = Number(body.memoryPenalty);

  if (!Number.isInteger(days) || days <= 0) {
    return { error: "'days' must be a positive integer." };
  }

  if (days > MAX_DAYS) {
    return { error: `'days' must not exceed ${MAX_DAYS}.` };
  }

  if (!Number.isInteger(seats) || seats < 0) {
    return { error: "'seats' must be a non-negative integer." };
  }

  if (seats > MAX_SEATS) {
    return { error: `'seats' must not exceed ${MAX_SEATS}.` };
  }

  if (!prices.length || prices.some((p) => !Number.isFinite(p) || p <= 0)) {
    return { error: "'prices' must be a non-empty array of positive numbers." };
  }

  if (prices.length > MAX_PRICE_TIERS) {
    return { error: `'prices' must not contain more than ${MAX_PRICE_TIERS} tiers.` };
  }

  // Belt-and-braces: reject anything that would allocate an oversized table
  // even if the individual limits above are later relaxed.
  const cells = (days + 1) * (seats + 1) * (prices.length + 1);
  if (cells > MAX_DP_CELLS) {
    return {
      error:
        `Requested problem is too large (${cells.toLocaleString()} DP states, ` +
        `limit ${MAX_DP_CELLS.toLocaleString()}). Reduce days, seats or price tiers.`,
    };
  }

  if (baseDemandByDay.length !== days || baseDemandByDay.some((d) => !Number.isFinite(d) || d < 0)) {
    return { error: "'baseDemandByDay' must have exactly 'days' non-negative numbers." };
  }

  if (!Number.isFinite(priceSensitivity) || priceSensitivity < 0) {
    return { error: "'priceSensitivity' must be a non-negative number." };
  }

  if (!Number.isFinite(memoryPenalty) || memoryPenalty < 0 || memoryPenalty > 1) {
    return { error: "'memoryPenalty' must be between 0 and 1." };
  }

  return {
    days,
    seats,
    prices,
    baseDemandByDay,
    priceSensitivity,
    memoryPenalty,
  };
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/defaults", (_req, res) => {
  res.json({
    days: 10,
    seats: 120,
    prices: PRICE_TIERS,
    scenarios: {
      early: [40, 35, 32, 28, 24, 20, 16, 12, 10, 8],
      late: [8, 10, 12, 14, 18, 24, 30, 36, 42, 48],
      event: [14, 16, 18, 20, 45, 50, 30, 22, 18, 14],
    },
  });
});

app.post("/optimize", (req, res) => {
  const parsed = validateInput(req.body || {});
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  const demandModel = buildDemandModel({
    baseDemandByDay: parsed.baseDemandByDay,
    priceSensitivity: parsed.priceSensitivity,
    memoryPenalty: parsed.memoryPenalty,
    // Pass the tiers being optimised, so the demand model is anchored to
    // them rather than to the module's default PRICE_TIERS.
    prices: parsed.prices,
  });

  const result = optimizePricing({
    days: parsed.days,
    seats: parsed.seats,
    prices: parsed.prices,
    demandModel,
  });

  return res.json({
    input: parsed,
    output: result,
  });
});

app.listen(PORT, () => {
  console.log(`Airline DP backend running on :${PORT}`);
});
