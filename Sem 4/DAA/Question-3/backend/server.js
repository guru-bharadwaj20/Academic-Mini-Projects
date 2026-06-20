"use strict";

const express = require("express");
const cors = require("cors");
const { optimizePricing, buildDemandModel, PRICE_TIERS } = require("../dp_pricing");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
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

  if (!Number.isInteger(seats) || seats < 0) {
    return { error: "'seats' must be a non-negative integer." };
  }

  if (!prices.length || prices.some((p) => !Number.isFinite(p) || p <= 0)) {
    return { error: "'prices' must be a non-empty array of positive numbers." };
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
