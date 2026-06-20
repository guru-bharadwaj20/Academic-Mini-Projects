# Dynamic Programming: Airline Ticket Pricing Optimization

This folder contains:

- A standalone DP script (`dp_pricing.js`)
- A backend API (`backend/`) to run optimization from HTTP requests
- A frontend UI (`frontend/`) to interactively test scenarios

## 1) Problem Formulation

We optimize ticket prices over a booking horizon of `D` days with `S` seats.

### State

`dp[d][s][l]`:

- `d`: current day (0 to `D`)
- `s`: seats left (0 to `S`)
- `l`: index of last day's selected price tier (or sentinel for "no previous price")

Interpretation: maximum revenue achievable from day `d` onward with `s` seats left and previous price state `l`.

### Decisions

On each day `d`, choose one price tier from a finite set `P` (e.g., `[100, 140, 180, 220]`).

### Recurrence

Let `price(p)` be selected price on day `d` and `demand(d, price(p), lastPrice)` be expected demand under the chosen model.

- `sold = min(s, demand(...))`
- `revenueToday = sold * price(p)`

Then:

`dp[d][s][l] = max over p in P { revenueToday + dp[d+1][s-sold][p] }`

Base case:

`dp[D][s][l] = 0` for all `s, l`.

## 2) Dynamic Programming Solution

The implementation uses bottom-up DP:

1. Fill `dp` from day `D-1` down to `0`.
2. For each state `(d, s, l)`, evaluate all possible prices.
3. Store best value and action in a `choice` table.
4. Reconstruct daily pricing policy from `(0, S, none)`.

## 3) Implementation

### Standalone Script

Main file: `dp_pricing.js`

Run:

```bash
node dp_pricing.js
```

### Backend API

Folder: `backend/`

Install and run:

```bash
cd backend
npm install
npm start
```

Server runs on `http://localhost:5001`.

Endpoints:

- `GET /health`
- `GET /defaults`
- `POST /optimize`

Example `POST /optimize` body:

```json
{
	"days": 10,
	"seats": 120,
	"prices": [100, 140, 180, 220],
	"baseDemandByDay": [40, 35, 32, 28, 24, 20, 16, 12, 10, 8],
	"priceSensitivity": 0.03,
	"memoryPenalty": 0.15
}
```

### Frontend UI

Folder: `frontend/`

Install and run:

```bash
cd frontend
npm install
npm run dev
```

UI runs on `http://localhost:3001` and calls backend `http://localhost:5001/optimize`.

## 4) Complexity Analysis

Let:

- `D` = number of days
- `S` = seat inventory
- `P` = number of price tiers

For each state `(d, s, l)`, we try all `P` actions.
Number of states is `D * S * P` (including sentinel variant).

Time complexity: `O(D * S * P^2)`

Space complexity: `O(D * S * P)`

## 5) Experiments and Interpretation

Implemented patterns:

1. Early-demand tapering
2. Late-demand surge
3. Mid-period event spike

General interpretation:

- Early-demand pattern tends to reward higher prices earlier.
- Late-demand pattern may preserve demand with moderate early prices, then increase later.
- Event spikes often justify premium pricing near spike days.

Use the console tables (script) or frontend result table to inspect day-by-day price decisions, expected demand, sold seats, and revenue.
