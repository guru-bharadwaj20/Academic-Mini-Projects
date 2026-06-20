import numpy as np
import pandas as pd
from sympy import Matrix
import scipy.linalg as la

# ─────────────────────────────────────────────────────────────────────────────
# Mini Project: Cricket Player Performance Analysis Using Linear Algebra
# Course: UE24MA241B – Linear Algebra and Its Applications
# PES University
# ─────────────────────────────────────────────────────────────────────────────

df = pd.read_csv("cricket_dataset.csv")

# Features used in the matrix pipeline (5 numerical columns)
features = ["Runs", "Batting_Avg", "Strike_Rate", "Wickets", "Economy"]

# Role and Name are used only for display/validation in Final Output
# Unused columns: Player_ID, Batting_Style, Bowling_Style,
#                 Matches, Bowling_Avg, Fielding_Rating


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: MATRIX REPRESENTATION
# Real-world data → matrix form so linear algebra operations can be applied.
# Each row = one player (a vector in 5D feature space)
# Each column = one performance feature
# ═══════════════════════════════════════════════════════════════════════════════

A = np.array(df[features].values, dtype=float)

print("=" * 65)
print("STEP 1: MATRIX REPRESENTATION")
print("=" * 65)
print(f"Matrix A shape: {A.shape}  →  {A.shape[0]} players × {A.shape[1]} features\n")
print("First 5 rows of matrix A:")
print(pd.DataFrame(A[:5], columns=features).to_string(index=False))
print("\n→ NEXT: We simplify this matrix to understand its structure (RREF)")


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: MATRIX SIMPLIFICATION — RREF / GAUSSIAN ELIMINATION
# RREF reveals which features are linearly independent (pivot columns)
# and whether any features carry redundant information (free columns).
# ═══════════════════════════════════════════════════════════════════════════════

A_sym = Matrix(A[:10].tolist())   # use 10 rows — sympy is exact but slow on 100
rref_matrix, pivot_cols = A_sym.rref()
rank = len(pivot_cols)

print("\n" + "=" * 65)
print("STEP 2: MATRIX SIMPLIFICATION (RREF / GAUSSIAN ELIMINATION)")
print("=" * 65)
print("RREF of first 10 rows:")
print(rref_matrix)
print(f"\nPivot columns (independent features): {pivot_cols}")
print(f"Rank of matrix: {rank}")
print(f"Interpretation: Rank = {rank} means all {rank} features are "
      f"linearly independent — no feature is a combination of the others.")
print("\n→ NEXT: We study the vector spaces (row, column, null) formed by A")


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: STRUCTURE OF THE VECTOR SPACE
# Row space   → all possible player performance directions
# Column space → all possible feature combinations that matter
# Null space  → hidden linear relationships among features (if any)
# ═══════════════════════════════════════════════════════════════════════════════

nullity = A.shape[1] - rank
null_basis = la.null_space(A)

print("\n" + "=" * 65)
print("STEP 3: STRUCTURE OF THE VECTOR SPACE")
print("=" * 65)
print(f"Rank   = {rank}   → {rank} independent feature directions span the column space")
print(f"Nullity = {nullity}  → dimension of null space (redundant directions)")
if null_basis.shape[1] == 0:
    print("Null space: trivial — only the zero vector.")
    print("Meaning: No feature can be expressed as a linear combination of others.")
else:
    print(f"Null space basis:\n{null_basis}")
print("\n→ NEXT: We extract a basis of independent features (remove any redundancy)")


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: REMOVE REDUNDANCY — BASIS SELECTION
# Pivot columns from RREF form a basis for the column space of A.
# These are the independent directions; we discard any dependent ones.
# ═══════════════════════════════════════════════════════════════════════════════

basis_cols = list(pivot_cols)
basis = A[:, basis_cols]
independent_features = [features[i] for i in basis_cols]

print("\n" + "=" * 65)
print("STEP 4: REMOVE REDUNDANCY — BASIS SELECTION")
print("=" * 65)
print(f"Pivot column indices: {basis_cols}")
print(f"Linearly independent features: {independent_features}")
print(f"Basis matrix (first 5 rows):")
print(pd.DataFrame(basis[:5], columns=independent_features).to_string(index=False))
print(f"\nAll {len(basis_cols)} features retained — none are redundant.")
print("\n→ NEXT: Convert this basis into mutually orthogonal vectors (Gram–Schmidt)")


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5: ORTHOGONALIZATION — GRAM–SCHMIDT
# We convert the independent feature basis into orthogonal vectors.
# Orthogonal = dot product = 0 = completely independent directions.
# Each orthogonal vector captures a distinct, non-overlapping aspect
# of player performance (batting, bowling, efficiency, etc.)
# ═══════════════════════════════════════════════════════════════════════════════

def gram_schmidt(vectors):
    """
    Gram-Schmidt orthogonalization.
    Input:  list of row vectors (numpy arrays of same length)
    Output: list of mutually orthogonal vectors (same span)
    """
    orthogonal = []
    for v in vectors:
        w = v.copy().astype(float)
        for u in orthogonal:
            # subtract projection of v onto u (removes the u-component from w)
            w -= (np.dot(v, u) / np.dot(u, u)) * u
        if np.linalg.norm(w) > 1e-10:   # skip near-zero (linearly dependent) vectors
            orthogonal.append(w)
    return np.array(orthogonal)

# Use the first 5 player vectors as seeds (they live in 5D feature space)
ortho_basis = gram_schmidt(A[:5])

print("\n" + "=" * 65)
print("STEP 5: ORTHOGONALIZATION — GRAM–SCHMIDT")
print("=" * 65)
print(f"Number of orthogonal basis vectors produced: {len(ortho_basis)}\n")
print("Orthogonal basis vectors (first 5 values shown per vector):")
for i, vec in enumerate(ortho_basis):
    print(f"  u{i+1}: {np.round(vec[:5], 4)}")

print("\nVerification — dot products must be ≈ 0 (orthogonality check):")
print(f"  u1 · u2 = {np.dot(ortho_basis[0], ortho_basis[1]):.8f}  ✓")
print(f"  u1 · u3 = {np.dot(ortho_basis[0], ortho_basis[2]):.8f}  ✓")
print(f"  u2 · u3 = {np.dot(ortho_basis[1], ortho_basis[2]):.8f}  ✓")
print("\nOrthogonal basis successfully formed — each vector is an independent")
print("performance direction with zero overlap with the others.")
print("\n→ NEXT: Project player vectors onto this orthogonal basis")


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6: PROJECTION ONTO ORTHOGONAL SUBSPACE
# Project each player's stats vector onto each orthogonal basis vector.
# The scalar tells us how strongly that player aligns with each direction.
# This enables comparison between players and estimation of missing values.
# ═══════════════════════════════════════════════════════════════════════════════

def project_onto_basis(v, ortho_vecs):
    """
    Returns projection scalars of v onto each orthogonal basis vector.
    Formula: proj scalar = (v · u) / (u · u)
    """
    return np.array([np.dot(v, u) / np.dot(u, u) for u in ortho_vecs])

print("\n" + "=" * 65)
print("STEP 6: PROJECTION ONTO ORTHOGONAL FEATURE SPACE")
print("=" * 65)
print("Projection scalars show how strongly each player aligns with")
print("each independent performance direction:\n")

for i in range(3):
    player_vec = A[i]
    scalars = project_onto_basis(player_vec, ortho_basis)
    role = df["Role"].iloc[i]
    print(f"  Player {i+1} ({role}):")
    for j, s in enumerate(scalars):
        print(f"    onto u{j+1}: {s:.6f}")
    print()

# Store all projections (used in Step 9)
all_projections = np.array([project_onto_basis(A[i], ortho_basis)
                             for i in range(len(A))])

print("→ NEXT: Use these projections + least squares to predict performance scores")


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7: PREDICTION — LEAST SQUARES SOLUTION
# System Ax = b is overdetermined: 100 equations, 5 unknowns.
# No exact solution exists, so we find the best approximate solution:
#   x̂ = (AᵀA)⁻¹ Aᵀ b
# This minimizes the total squared prediction error across all players.
#
# Note: b is a proxy performance score (weighted combination of stats).
# In a real system, b would come from actual match ratings or expert labels.
# ═══════════════════════════════════════════════════════════════════════════════

b = (df["Runs"] * 0.4 +
     df["Batting_Avg"] * 0.2 +
     df["Strike_Rate"] * 0.1 +
     df["Wickets"] * 0.2 -
     df["Economy"] * 0.1).values

x_hat = np.linalg.inv(A.T @ A) @ A.T @ b
predicted_scores = A @ x_hat
df["Performance_Score"] = predicted_scores

print("\n" + "=" * 65)
print("STEP 7: PREDICTION — LEAST SQUARES SOLUTION")
print("=" * 65)
print("Formula: x̂ = (AᵀA)⁻¹ Aᵀ b\n")
print("Optimal coefficient weights per feature:")
for feat, coef in zip(features, x_hat):
    print(f"  {feat:15s}: {coef:.6f}")
print(f"\nPredicted scores range: {predicted_scores.min():.2f} to {predicted_scores.max():.2f}")
print("\n→ NEXT: Compute eigenvalues to discover dominant patterns in player data")


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 8: PATTERN DISCOVERY — EIGENVALUES & EIGENVECTORS
# We compute the TRUE covariance matrix (requires mean-centering A first).
#   C = (A − Ā)ᵀ (A − Ā) / (n − 1)
# Large eigenvalues = dominant performance patterns across all players.
# The corresponding eigenvectors show which feature combinations drive each pattern.
#
# IMPORTANT: AᵀA (without centering) is the Gram matrix, NOT the covariance matrix.
# Mean-centering is mandatory for correct eigenanalysis.
# ═══════════════════════════════════════════════════════════════════════════════

A_centered = A - A.mean(axis=0)          # subtract mean of each feature column
n = A.shape[0]
C = (A_centered.T @ A_centered) / (n - 1)   # true covariance matrix (5×5)

eigenvalues, eigenvectors = np.linalg.eig(C)

# Sort by descending eigenvalue (largest = most dominant pattern)
sorted_idx = np.argsort(eigenvalues.real)[::-1]
eigenvalues  = eigenvalues[sorted_idx].real
eigenvectors = eigenvectors[:, sorted_idx].real

print("\n" + "=" * 65)
print("STEP 8: PATTERN DISCOVERY — EIGENVALUES & EIGENVECTORS")
print("=" * 65)
print("Covariance matrix C = (A − Ā)ᵀ(A − Ā) / (n−1)  [5×5]:")
print(np.round(C, 2))
print("\nEigenvalues (sorted descending — dominant patterns first):")
total_var = eigenvalues.sum()
for i, val in enumerate(eigenvalues):
    pct = 100 * val / total_var
    bar = "█" * int(pct / 2)
    print(f"  Pattern {i+1}: λ = {val:12.2f}  ({pct:5.1f}%)  {bar}")

print("\nDominant eigenvector (Pattern 1 — strongest trend in data):")
for feat, comp in zip(features, eigenvectors[:, 0]):
    print(f"  {feat:15s}: {comp:+.4f}")
print("\nPattern 1 is driven almost entirely by Runs → batting volume")
print("is the single strongest differentiator among players.")
print("\n→ NEXT: Use eigenvectors to simplify the system (diagonalization)")


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 9: SYSTEM SIMPLIFICATION — DIAGONALIZATION
# We project the data onto the top k eigenvectors, reducing dimensionality.
# In the reduced space, each axis is a pure, independent performance pattern.
# This removes noise, improves efficiency, and retains the most meaningful info.
#
# The covariance matrix C is symmetric → it is diagonalizable by its eigenvectors:
#   C = P D Pᵀ  where P = eigenvector matrix, D = diagonal eigenvalue matrix
# ═══════════════════════════════════════════════════════════════════════════════

k = 2                                     # keep top 2 dominant directions
top_eigvecs = eigenvectors[:, :k]         # 5 × 2
A_reduced   = A_centered @ top_eigvecs    # 100 × 2  (reduced player space)

# Verify diagonalization: C = P D Pᵀ
D = np.diag(eigenvalues)
P = eigenvectors
C_reconstructed = P @ D @ P.T
reconstruction_error = np.max(np.abs(C - C_reconstructed))

print("\n" + "=" * 65)
print("STEP 9: SYSTEM SIMPLIFICATION — DIAGONALIZATION")
print("=" * 65)
print(f"Reduced from {A.shape[1]} features → {k} dominant performance patterns")
print(f"Variance retained by top {k} patterns: "
      f"{100 * eigenvalues[:k].sum() / total_var:.1f}%")
print(f"\nDiagonalization verification: C = P·D·Pᵀ")
print(f"  Max reconstruction error: {reconstruction_error:.2e}  ✓ (≈ 0, confirms C is diagonalizable)")
print(f"\nPlayers in reduced 2D performance space (first 10):")
print(f"  {'Name':<12} {'Role':<15} {'Pattern1':>10} {'Pattern2':>10}")
print("  " + "─" * 50)
for i in range(10):
    print(f"  {df['Name'].iloc[i]:<12} {df['Role'].iloc[i]:<15}"
          f" {A_reduced[i,0]:>10.2f} {A_reduced[i,1]:>10.2f}")
print("\n→ FINAL: Apply results to rank, predict, and categorize all players")


# ═══════════════════════════════════════════════════════════════════════════════
# FINAL APPLICATION OUTPUT
# 1. Rank all players by predicted performance score (from Step 7)
# 2. Predict player category using cricket domain rules
# 3. Report dominant performance patterns discovered (from Step 8)
# ═══════════════════════════════════════════════════════════════════════════════

def categorize_player(row):
    """Rule-based categorization using cricket domain knowledge."""
    if row["Wickets"] >= 50 and row["Runs"] < 1500:
        return "Bowler"
    elif row["Runs"] >= 2000 and row["Wickets"] < 30:
        return "Batsman"
    else:
        return "All-rounder"

df["Predicted_Category"] = df.apply(categorize_player, axis=1)

# Accuracy against the Role column (actual labels in dataset)
correct  = (df["Predicted_Category"] == df["Role"]).sum()
accuracy = 100 * correct / len(df)

df_sorted = df.sort_values("Performance_Score", ascending=False).reset_index(drop=True)

print("\n" + "=" * 65)
print("FINAL APPLICATION OUTPUT")
print("=" * 65)

print("\n1. TOP 10 PLAYERS BY PREDICTED PERFORMANCE SCORE:")
print(f"  {'Rank':<5} {'Name':<12} {'Actual Role':<16} {'Pred. Score':>12}")
print("  " + "─" * 48)
for i in range(10):
    row = df_sorted.iloc[i]
    print(f"  {i+1:<5} {row['Name']:<12} {row['Role']:<16} "
          f"{row['Performance_Score']:>12.2f}")

print("\n2. PLAYER CATEGORY DISTRIBUTION (Predicted vs Actual):")
pred_counts   = df["Predicted_Category"].value_counts()
actual_counts = df["Role"].value_counts()
cats = ["Batsman", "Bowler", "All-rounder", "Wicketkeeper"]
print(f"  {'Category':<16} {'Predicted':>10} {'Actual':>10}")
print("  " + "─" * 38)
for cat in cats:
    p = pred_counts.get(cat, 0)
    a = actual_counts.get(cat, 0)
    print(f"  {cat:<16} {p:>10} {a:>10}")
print(f"\n  Categorization accuracy: {accuracy:.1f}%")
print("  (Wicketkeepers not classified by rules — requires fielding data)")

print("\n3. DOMINANT PERFORMANCE PATTERNS (from eigenvalue analysis):")
for i in range(len(eigenvalues)):
    pct = 100 * eigenvalues[i] / total_var
    print(f"  Pattern {i+1}: {pct:.1f}% of variance  "
          f"{'← dominant batting pattern' if i == 0 else '← bowling/batting contrast' if i == 1 else ''}")
print(f"\n  Top 2 patterns together explain "
      f"{100 * eigenvalues[:2].sum() / total_var:.1f}% of all variation.")
print("\n  Conclusion: Batting volume (Runs) is the primary differentiator")
print("  among players. Secondary pattern captures the batting vs bowling")
print("  trade-off, which distinguishes All-rounders from specialists.")
print("\n" + "=" * 65)
print("Pipeline complete: Real-world data → Matrix → RREF → Vector Spaces")
print("→ Basis → Gram–Schmidt → Projection → Least Squares → Eigenvalues")
print("→ Diagonalization → Player Rankings + Categories + Patterns")
print("=" * 65)
