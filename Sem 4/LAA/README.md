# Cricket-Analysis-LA

Cricket Player Performance Analysis Using Linear Algebra.

This project applies core linear algebra concepts to a synthetic cricket dataset and builds an end-to-end analytical pipeline from matrix construction to player ranking and role categorization.

## Project Context

This repository corresponds to a mini project for:

- Course: UE24MA241B - Linear Algebra and Its Applications
- Theme: Real-world data analysis through matrix methods
- Dataset scale: 100 players, 13 columns

The workflow is implemented in [Code.py](Code.py) and uses [Dataset.csv](Dataset.csv).

## Objectives

The project demonstrates how to:

1. Represent cricket player statistics as a matrix.
2. Perform RREF/Gaussian elimination to identify independent features.
3. Analyze rank, nullity, and vector-space structure.
4. Construct a basis and orthogonalize vectors using Gram-Schmidt.
5. Project player vectors onto orthogonal directions.
6. Build a least-squares prediction model for performance scoring.
7. Perform eigenvalue/eigenvector analysis on covariance structure.
8. Reduce dimensionality using dominant eigenvectors.
9. Produce practical outputs: rankings, role predictions, and pattern interpretation.

## Repository Structure

- [Code.py](Code.py): Main script containing the full linear algebra pipeline.
- [Dataset.csv](Dataset.csv): Cricket player dataset used for analysis.
- [Report.pdf](Report.pdf): Assignment/report details and expected methodology/output format.
- [README.md](README.md): Project documentation.

## Dataset Description

The dataset includes the following columns:

- Player_ID
- Name
- Role
- Batting_Style
- Bowling_Style
- Matches
- Runs
- Batting_Avg
- Strike_Rate
- Wickets
- Bowling_Avg
- Economy
- Fielding_Rating

The analysis pipeline in [Code.py](Code.py) uses the following numerical feature set for matrix operations:

- Runs
- Batting_Avg
- Strike_Rate
- Wickets
- Economy

## Mathematical Pipeline (Implemented in Code)

The script is organized into nine conceptual steps:

1. Matrix Representation
Convert player features into matrix A where rows represent players and columns represent selected statistics.

2. Matrix Simplification (RREF)
Use SymPy RREF on a subset to detect pivot columns and estimate rank/feature independence.

3. Vector Space Structure
Use rank-nullity ideas and numerical null space to examine redundancy in feature directions.

4. Basis Selection
Retain pivot columns to form a basis for the feature column space.

5. Gram-Schmidt Orthogonalization
Create orthogonal basis vectors to separate independent performance directions.

6. Projection
Project player vectors onto orthogonal basis vectors to quantify directional alignment.

7. Least Squares Prediction
Solve overdetermined system with:

x_hat = (A^T A)^(-1) A^T b

to compute predicted performance scores.

8. Eigenvalue and Eigenvector Analysis
Mean-center data and compute covariance matrix, then eigendecompose it to identify dominant variation patterns.

9. Dimensionality Reduction and Diagonalization
Project onto top-k eigenvectors (k=2) and verify diagonalization-based reconstruction.

## Final Outputs Produced

The script prints:

- Top 10 players by predicted performance score.
- Predicted vs actual category distribution.
- Categorization accuracy.
- Dominant performance patterns from eigenvalue percentages.

## Requirements

Python 3.9+ is recommended.

Install dependencies:

```bash
pip install numpy pandas sympy scipy
```

## How to Run

From the project root directory:

```bash
python Code.py
```

## Important Note About File Name

In [Code.py](Code.py), the dataset is currently loaded with:

```python
df = pd.read_csv("cricket_dataset.csv")
```

But this repository contains [Dataset.csv](Dataset.csv).

To run successfully, use either option:

1. Rename Dataset.csv to cricket_dataset.csv.
2. Or update the line in [Code.py](Code.py) to:

```python
df = pd.read_csv("Dataset.csv")
```

## Assumptions and Limitations

- The target vector b in least squares is a weighted proxy score, not an externally labeled ground-truth metric.
- Rule-based categorization focuses on Runs and Wickets; wicketkeeper-specific behavior is not fully modeled.
- RREF is computed on first 10 rows for computational efficiency with exact symbolic arithmetic.

## Suggested Improvements

Potential next enhancements:

1. Replace manual proxy score with labeled match-impact outcomes.
2. Introduce role-aware or ML-based multiclass classifier for player category prediction.
3. Add visualizations (scree plot, reduced 2D scatter, loadings plot).
4. Modularize [Code.py](Code.py) into reusable functions/classes.
5. Add tests for matrix dimensions, rank checks, and projection consistency.

## Summary

This project links linear algebra theory with sports analytics by turning player statistics into a structured matrix workflow. The result is a transparent pipeline that explains feature independence, extracts dominant performance patterns, and delivers practical ranking and categorization outputs.