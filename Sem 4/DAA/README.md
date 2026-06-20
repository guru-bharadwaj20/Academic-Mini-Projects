# DAA Workspace Repository

## Team Members

1. Guru R Bharadwaj [PES1UG24CS177]
2. Deeptha Shankar [PES1UG24CS144]
3. Diya R Gowda [PES1UG24CS159]
4. Epari Subhransi [PES1UG24CS161]

## Repository Overview

This repository contains a cleaned final workspace for three core Design and Analysis of Algorithms implementations:

- Kruskal's Minimum Spanning Tree
- Dijkstra's Shortest Path Routing
- Dynamic Programming for Airline Ticket Pricing

The repository is organized into one integrated portal and three assignment folders.

## Final Repository Structure

DAA/
|- Mainpage/
|- Question-1/
|- Question-2/
\- Question-3/

## Folder Purpose

### Mainpage

Mainpage is the unified application that combines all three algorithm experiences into one platform.

- Backend: Express server with namespaced APIs
- Frontend: React + Vite multi-page UI with landing portal
- Landing route links to all three algorithm modules

### Question-1

Standalone project for Kruskal's Algorithm with MST visualization and analysis support.

### Question-2

Standalone project for Dijkstra's Algorithm with smart routing features and graph exploration.

### Question-3

Standalone project for Dynamic Programming airline pricing optimization, including script, backend API, and frontend UI.

## Mainpage Architecture

### Backend

- Runtime: Node.js + Express
- Default port: 5000
- Unified API namespaces:
	- /api/kruskal/*
	- /api/dijkstra/*
	- /api/dp/*

### Frontend

- Runtime: React + Vite
- Default port: 3000
- Routes:
	- / (Landing page)
	- /kruskal
	- /dijkstra
	- /dp

## Mainpage API Reference

### Kruskal Endpoints

- GET /api/kruskal/health
- GET /api/kruskal/defaults
- POST /api/kruskal/mst
- GET /api/kruskal/analysis
- POST /api/kruskal/scalability

### Dijkstra Endpoints

- GET /api/dijkstra/nodes
- GET /api/dijkstra/edges
- POST /api/dijkstra/shortest-path
- POST /api/dijkstra/compare
- GET /api/dijkstra/analysis
- GET /api/dijkstra/all-pairs

### Dynamic Programming Endpoints

- GET /api/dp/health
- GET /api/dp/defaults
- POST /api/dp/optimize

## How To Run

### 1) Run Mainpage Backend

From DAA/Mainpage/backend:

- npm install
- npm start

Server URL: http://localhost:5000

### 2) Run Mainpage Frontend

From DAA/Mainpage/frontend:

- npm install
- npm run dev

App URL: http://localhost:3000

### 3) Production Build Check

From DAA/Mainpage/frontend:

- npm run build

Expected result: successful build with zero compile errors.

## Tech Stack

- Languages: JavaScript, JSX
- Frontend: React, Vite, React Router DOM, Styled Components (for Dijkstra module styling)
- Backend: Node.js, Express, CORS
- Data Handling: In-memory graph and DP model datasets

## Algorithm Summary

### Kruskal's MST

- Uses greedy edge sorting plus Union-Find
- Time complexity dominated by sorting: O(E log E)
- Useful for minimum-cost network design

### Dijkstra's Routing

- Uses priority queue based shortest path expansion
- Time complexity: O((V + E) log V)
- Supports distance, time, and congestion optimization modes

### Dynamic Programming Pricing

- State-based optimization over days, seats, and previous pricing memory
- Time complexity: O(D x S x P^2)
- Produces optimal day-wise pricing policy and expected revenue

## Notes For Evaluators

- Repository has already been cleaned to remove duplicate parent folders.
- Only the required final top-level folders are retained.
- Mainpage acts as the consolidated demo for all three algorithm problems.

## Quick Navigation

- Main integrated app documentation: Mainpage/README.md
- Standalone Kruskal project: Question-1/README.md
- Standalone Dijkstra project: Question-2/README.md
- Standalone DP project: Question-3/README.md
