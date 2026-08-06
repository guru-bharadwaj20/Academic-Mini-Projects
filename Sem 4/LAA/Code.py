import os
import sys

# This script prints Unicode maths/box-drawing characters (→ × λ █ ─ ✓ ᵀ).
# The default Windows console encoding is cp1252, which cannot encode them,
# so stdout must be switched to UTF-8 before anything is printed.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import numpy as np
import pandas as pd
from sympy import Matrix
import scipy.linalg as la

# ─────────────────────────────────────────────────────────────────────────────
# Mini Project: Cricket Player Performance Analysis Using Linear Algebra
# Course: UE24MA241B – Linear Algebra and Its Applications
# PES University
# ─────────────────────────────────────────────────────────────────────────────

# Resolve the dataset next to this script so the pipeline runs from any
# working directory, not just from inside Sem 4/LAA.
DATASET_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Dataset.csv")

df = pd.read_csv(DATASET_PATH)

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

# RREF on a 10-row SAMPLE, purely to display an exact reduced form (sympy is
# exact but slow on all 100 rows). Its pivot count describes THAT SAMPLE only.
SAMPLE_ROWS = 10
A_sym = Matrix(A[:SAMPLE_ROWS].tolist())
rref_matrix, sample_pivots = A_sym.rref()
sample_rank = len(sample_pivots)

# The rank of the FULL matrix, which is what every later step actually needs.
# `rank` used to be the 10-row sample's pivot count, then reported and reused
# throughout as though it described all 100 players.
rank = int(np.linalg.matrix_rank(A))
pivot_cols = sample_pivots

print("\n" + "=" * 65)
print("STEP 2: MATRIX SIMPLIFICATION (RREF / GAUSSIAN ELIMINATION)")
print("=" * 65)
print(f"RREF of first {SAMPLE_ROWS} rows:")
print(rref_matrix)
print(f"\nPivot columns of the {SAMPLE_ROWS}-row sample: {sample_pivots} (rank {sample_rank})")
print(f"Rank of the FULL {A.shape[0]}x{A.shape[1]} matrix: {rank}")
if rank == A.shape[1]:
    print(f"Interpretation: rank = {rank} = number of features, so all {rank} "
          f"features are linearly independent — none is a combination of the others.")
else:
    print(f"Interpretation: rank = {rank} < {A.shape[1]} features, so "
          f"{A.shape[1] - rank} feature(s) are linearly dependent on the rest.")
print("\n→ NEXT: We study the vector spaces (row, column, null) formed by A")


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: STRUCTURE OF THE VECTOR SPACE
# Row space   → all possible player performance directions
# Column space → all possible feature combinations that matter
# Null space  → hidden linear relationships among features (if any)
# ═══════════════════════════════════════════════════════════════════════════════

# Both now derive from the FULL matrix. `nullity` used to be computed from the
# 10-row sample's rank while `null_basis` came from all 100 rows, so the two
# values printed side by side could contradict each other.
null_basis = la.null_space(A)
nullity = A.shape[1] - rank
assert nullity == null_basis.shape[1], (
    f"rank-nullity mismatch: {nullity} vs {null_basis.shape[1]}")

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
# Report what actually happened instead of printing a fixed conclusion. This
# line asserted "none are redundant" unconditionally, so on a dataset where
# features WERE dropped it directly contradicted the line above it.
if len(basis_cols) == A.shape[1]:
    print(f"\nAll {len(basis_cols)} features retained — none are redundant.")
else:
    dropped = [features[i] for i in range(A.shape[1]) if i not in basis_cols]
    print(f"\n{len(basis_cols)} of {A.shape[1]} features retained; "
          f"dropped as linearly dependent: {dropped}")
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
    Modified Gram-Schmidt orthogonalization.

    Input:  array of row vectors (same length)
    Output: array of mutually orthogonal vectors spanning the same space

    This was CLASSICAL Gram-Schmidt, which subtracted the projection of the
    ORIGINAL vector v:

        w -= (np.dot(v, u) / np.dot(u, u)) * u        # v, not w

    Classical GS loses orthogonality badly once the inputs are poorly scaled,
    and these are raw cricket statistics where Runs is in the thousands while
    Economy is around 5. Projecting the progressively updated w instead
    (modified GS) subtracts each component against the residual actually
    remaining, which is far more numerically stable at no extra cost.
    """
    orthogonal = []
    for v in vectors:
        w = v.copy().astype(float)
        for u in orthogonal:
            # Project the RUNNING residual w, not the original v.
            w = w - (np.dot(w, u) / np.dot(u, u)) * u
        # Scale the drop-threshold to the input, so it means "negligible
        # relative to where we started" rather than an absolute 1e-10.
        if np.linalg.norm(w) > 1e-10 * max(np.linalg.norm(v), 1.0):
            orthogonal.append(w)
    return np.array(orthogonal)

# Seed the orthogonalisation from Step 4's selected-feature matrix, so the
# basis actually spans the retained feature space and Step 4's work is used.
#
# This used to be `gram_schmidt(A[:5])`, which read from the FULL feature set
# regardless of what Step 4 selected: `basis` and `independent_features` were
# computed, printed, and then never referenced again. Whenever Step 4 dropped
# a dependent feature, Step 5 silently orthogonalised a different space from
# the one Step 4 had just established.
#
# Seeds are player rows restricted to the selected columns, so these vectors
# live in the selected-feature space - which is what Step 6 projects players
# onto. Taking as many seeds as there are dimensions is what lets the result
# span that space.
n_dims = len(basis_cols)
ortho_basis = gram_schmidt(basis[:n_dims])

print("\n" + "=" * 65)
print("STEP 5: ORTHOGONALIZATION — GRAM–SCHMIDT")
print("=" * 65)
print(f"Number of orthogonal basis vectors produced: {len(ortho_basis)}\n")
print("Orthogonal basis vectors (first 5 values shown per vector):")
for i, vec in enumerate(ortho_basis):
    print(f"  u{i+1}: {np.round(vec[:5], 4)}")

# Check EVERY pair, and derive the verdict from the numbers.
#
# This block used to hardcode three "✓" marks in the format strings, so it
# printed a pass regardless of what the dot products actually were. It also
# indexed ortho_basis[0..2] unconditionally, which raises IndexError whenever
# gram_schmidt drops a near-dependent vector and returns fewer than three.
#
# The tolerance is relative: these vectors are unnormalised and their
# magnitudes span several orders of magnitude, so a fixed absolute epsilon
# would be meaningless.
print("\nVerification — all pairwise dot products must be ≈ 0:")
max_relative_overlap = 0.0
n_vectors = len(ortho_basis)
if n_vectors < 2:
    print(f"  Only {n_vectors} vector(s) produced — nothing to cross-check.")
else:
    for i in range(n_vectors):
        for j in range(i + 1, n_vectors):
            dot = float(np.dot(ortho_basis[i], ortho_basis[j]))
            scale = np.linalg.norm(ortho_basis[i]) * np.linalg.norm(ortho_basis[j])
            relative = abs(dot) / scale if scale > 0 else 0.0
            max_relative_overlap = max(max_relative_overlap, relative)
            status = "ok" if relative < 1e-8 else "NOT ORTHOGONAL"
            print(f"  u{i+1} · u{j+1} = {dot:>14.8f}   relative = {relative:.2e}  {status}")

    if max_relative_overlap < 1e-8:
        print(f"\nOrthogonal basis verified — largest relative overlap "
              f"{max_relative_overlap:.2e} across all {n_vectors * (n_vectors - 1) // 2} pairs.")
    else:
        print(f"\nWARNING: basis is NOT orthogonal to tolerance — largest relative "
              f"overlap {max_relative_overlap:.2e}.")
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
    # Restricted to the selected features, matching ortho_basis' space.
    player_vec = basis[i]
    scalars = project_onto_basis(player_vec, ortho_basis)
    role = df["Role"].iloc[i]
    print(f"  Player {i+1} ({role}):")
    for j, s in enumerate(scalars):
        print(f"    onto u{j+1}: {s:.6f}")
    print()

# Projection coordinates for every player in the orthogonal basis.
#
# The old comment claimed "(used in Step 9)", but Step 9 reduces dimensions
# with A_centered @ top_eigvecs and never touched this array - it was computed
# for all 100 players on every run and then discarded. It is now actually
# consumed: reported here, and cross-checked in Step 9 against the eigenvector
# projection so the two representations cannot silently diverge.
all_projections = np.array([project_onto_basis(basis[i], ortho_basis)
                            for i in range(len(basis))])

print(f"Projection matrix computed for all {all_projections.shape[0]} players "
      f"({all_projections.shape[1]} coordinates each).")
reconstructed = all_projections @ ortho_basis
projection_error = float(np.max(np.abs(reconstructed - basis)))
print(f"Reconstruction check: max |players - projections @ basis| = "
      f"{projection_error:.2e}  "
      f"{'(exact, basis spans the space)' if projection_error < 1e-6 else '(BASIS DOES NOT SPAN)'}")

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

# The target.
#
# This was a fixed linear combination of the SAME five columns that make up A:
#
#     b = 0.4*Runs + 0.2*Batting_Avg + 0.1*Strike_Rate + 0.2*Wickets - 0.1*Economy
#
# b therefore lay exactly in the column space of A, the system had an exact
# zero-residual solution, and least squares simply recovered the five weights
# written on this line. The "Optimal coefficient weights per feature" output
# was a restatement of the input, and the demonstration was circular - it
# could not fail, and showed nothing about fitting.
#
# Kept as the reference target for continuity with the report, but the
# circularity is now measured and stated rather than hidden, and the fit is
# also evaluated on a held-out split so the reported error means something.
TARGET_WEIGHTS = {"Runs": 0.4, "Batting_Avg": 0.2, "Strike_Rate": 0.1,
                  "Wickets": 0.2, "Economy": -0.1}
b = sum(df[feat] * w for feat, w in TARGET_WEIGHTS.items()).values

# lstsq solves the least-squares problem directly via QR/SVD.
#
# The old `np.linalg.inv(A.T @ A) @ A.T @ b` forms the normal equations
# explicitly, which SQUARES the condition number of A, and raises LinAlgError
# outright if A.T @ A is singular - with no guard, on data whose rank the
# script had just finished measuring.
x_hat, residuals, lstsq_rank, singular_values = np.linalg.lstsq(A, b, rcond=None)
predicted_scores = A @ x_hat
df["Performance_Score"] = predicted_scores

# Honest error reporting, in-sample and held-out.
train_error = float(np.sqrt(np.mean((A @ x_hat - b) ** 2)))
split = int(0.7 * len(A))
x_train, _, _, _ = np.linalg.lstsq(A[:split], b[:split], rcond=None)
holdout_error = float(np.sqrt(np.mean((A[split:] @ x_train - b[split:]) ** 2)))
condition_number = float(np.linalg.cond(A))

print("\n" + "=" * 65)
print("STEP 7: PREDICTION — LEAST SQUARES SOLUTION")
print("=" * 65)
print("Solved with np.linalg.lstsq (QR/SVD), not the normal equations.\n")
print("Fitted coefficient weights, against the weights used to build b:")
print(f"  {'feature':15s} {'fitted':>12s} {'target':>10s} {'error':>12s}")
print("  " + "-" * 52)
for feat, coef in zip(features, x_hat):
    target = TARGET_WEIGHTS[feat]
    print(f"  {feat:15s} {coef:12.6f} {target:10.4f} {abs(coef - target):12.2e}")

print(f"\nPredicted scores range: {predicted_scores.min():.2f} to {predicted_scores.max():.2f}")
print(f"Condition number of A     : {condition_number:.2e}")
print(f"In-sample RMSE            : {train_error:.2e}")
print(f"Held-out RMSE (30% split) : {holdout_error:.2e}")
print(f"Effective rank from SVD   : {lstsq_rank}")

# State the circularity outright rather than presenting a tautology as a result.
if train_error < 1e-6:
    print("\nNOTE: b was constructed as a fixed linear combination of these same")
    print("five columns, so it lies exactly in the column space of A. The system")
    print("has an exact solution, least squares recovers the defining weights to")
    print("machine precision, and the residual is zero by construction. This")
    print("demonstrates that the solver is correct - it does NOT demonstrate")
    print("predictive power. A genuine evaluation needs a target measured")
    print("independently of these features, such as expert ratings or match")
    print("outcomes.")
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

# STANDARDISE, not just centre.
#
# Centring alone leaves each feature on its own scale, and these scales differ
# by orders of magnitude: Runs is in the thousands, Economy is around 5. The
# covariance matrix is then dominated by whichever column happens to carry the
# largest units, so "Pattern 1 is driven almost entirely by Runs" was not a
# discovery about cricket - it was a restatement of the fact that Runs has the
# biggest numbers. On the raw covariance, Pattern 1 absorbed 99.7% of variance.
#
# Dividing by the per-feature standard deviation makes the analysis
# scale-invariant: this is PCA on the CORRELATION matrix, which is the correct
# choice whenever features are measured in different units.
A_std = A.std(axis=0, ddof=1)
A_std_safe = np.where(A_std > 0, A_std, 1.0)   # guard constant columns
A_scaled = A_centered / A_std_safe
C = (A_scaled.T @ A_scaled) / (n - 1)          # correlation matrix (5×5)

# eigh, not eig.
#
# C is symmetric by construction. np.linalg.eig is the general solver: it
# returns complex dtype (so the old code stripped `.real` without ever checking
# the imaginary parts were negligible) and does not guarantee orthonormal
# eigenvectors - which the C = P D Pᵀ reconstruction in Step 9 silently
# depends on, and which fails for repeated eigenvalues. eigh exploits the
# symmetry: real eigenvalues, guaranteed orthonormal eigenvectors, ascending
# order, and it is faster.
eigenvalues, eigenvectors = np.linalg.eigh(C)

# eigh returns ascending; flip to descending (largest = most dominant pattern)
sorted_idx = np.argsort(eigenvalues)[::-1]
eigenvalues  = eigenvalues[sorted_idx]
eigenvectors = eigenvectors[:, sorted_idx]

print("\n" + "=" * 65)
print("STEP 8: PATTERN DISCOVERY — EIGENVALUES & EIGENVECTORS")
print("=" * 65)
print("Correlation matrix C = standardised(A)ᵀ standardised(A) / (n−1)  [5×5]:")
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
# Describe the pattern the eigenvector ACTUALLY has. This used to be the fixed
# sentence "Pattern 1 is driven almost entirely by Runs -> batting volume is the
# single strongest differentiator", printed regardless of the numbers. It was
# only ever true because the features were unstandardised; on the correlation
# matrix Pattern 1 turns out to load on Wickets and Economy, not Runs.
def describe_pattern(vec, feature_names, threshold=0.35):
    """Name the features a component actually loads on, with direction."""
    strong = [(feature_names[i], vec[i]) for i in range(len(vec))
              if abs(vec[i]) >= threshold]
    strong.sort(key=lambda kv: -abs(kv[1]))
    if not strong:
        return "no single feature dominates (all loadings below threshold)"
    return ", ".join(f"{name} ({'+' if val > 0 else '-'}{abs(val):.2f})"
                     for name, val in strong)


print(f"\nPattern 1 loads on: {describe_pattern(eigenvectors[:, 0], features)}")
print(f"It accounts for {100 * eigenvalues[0] / total_var:.1f}% of the standardised variance.")
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
A_reduced   = A_scaled @ top_eigvecs      # 100 x 2  (reduced player space)
# Projects the STANDARDISED data, matching the correlation matrix the
# eigenvectors came from. Using A_centered here would have mixed a raw-scale
# projection with a standardised basis.

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
# eigh guarantees an orthonormal P, so P·D·Pᵀ is exact here. With the old
# np.linalg.eig this identity held only by luck - eig does not promise
# orthonormal eigenvectors, and it breaks for repeated eigenvalues.
_diag_ok = reconstruction_error < 1e-8
print(f"  Max reconstruction error: {reconstruction_error:.2e}  "
      f"{'(≈ 0, C is diagonalisable and P is orthonormal)' if _diag_ok else '(TOO LARGE - P is not orthonormal)'}")
print(f"  Orthonormality of P: max |PᵀP - I| = {np.max(np.abs(P.T @ P - np.eye(len(P)))):.2e}")
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

# Accuracy against the Role column (actual labels in dataset).
#
# categorize_player can only ever return Bowler, Batsman or All-rounder, but
# the dataset also contains Wicketkeepers. Every wicketkeeper was therefore
# guaranteed wrong, and the single headline "accuracy" was capped below 100%
# by construction - it silently conflated "the rules are inaccurate" with
# "the rules have no branch for this class at all".
#
# Report both: accuracy over the roles the rules can actually emit, and the
# uncovered rows separately.
PREDICTABLE_ROLES = {"Batsman", "Bowler", "All-rounder"}
coverable = df["Role"].isin(PREDICTABLE_ROLES)

correct_overall = int((df["Predicted_Category"] == df["Role"]).sum())
accuracy = 100 * correct_overall / len(df)

n_coverable = int(coverable.sum())
correct_coverable = int(
    (df.loc[coverable, "Predicted_Category"] == df.loc[coverable, "Role"]).sum())
accuracy_coverable = 100 * correct_coverable / n_coverable if n_coverable else 0.0
n_uncovered = len(df) - n_coverable

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
print(f"\n  Accuracy on classifiable roles : {accuracy_coverable:.1f}%  "
      f"({correct_coverable}/{n_coverable})")
print(f"  Accuracy over the whole dataset: {accuracy:.1f}%  "
      f"({correct_overall}/{len(df)})")
if n_uncovered:
    uncovered_roles = ", ".join(sorted(set(df.loc[~coverable, "Role"])))
    print(f"  Not classifiable by these rules : {n_uncovered} row(s) "
          f"({uncovered_roles})")
    print("  Those rows are wrong by construction — the rule set has no branch")
    print("  that can emit them — so the whole-dataset figure understates the")
    print("  rules and can never reach 100%. Classifying them needs a feature")
    print("  the rules do not have, such as a fielding or dismissals column.")

print("\n3. DOMINANT PERFORMANCE PATTERNS (from eigenvalue analysis):")
# Label each pattern from its own loadings. These labels used to be the fixed
# strings "dominant batting pattern" and "bowling/batting contrast", attached to
# components 1 and 2 by position no matter what those components contained.
for i in range(len(eigenvalues)):
    pct = 100 * eigenvalues[i] / total_var
    print(f"  Pattern {i+1}: {pct:5.1f}% of variance  <- "
          f"{describe_pattern(eigenvectors[:, i], features)}")

print(f"\n  Top 2 patterns together explain "
      f"{100 * eigenvalues[:2].sum() / total_var:.1f}% of all variation.")

# Conclusion derived from the leading component rather than asserted.
lead_order = np.argsort(-np.abs(eigenvectors[:, 0]))
primary, secondary = features[lead_order[0]], features[lead_order[1]]
print(f"\n  Conclusion: the strongest axis of variation is driven mainly by "
      f"{primary} and {secondary}.")
print("  This is computed on STANDARDISED features, so it reflects genuine")
print("  correlation structure rather than differences in the units each")
print("  statistic happens to be measured in.")
print("\n" + "=" * 65)
print("Pipeline complete: Real-world data → Matrix → RREF → Vector Spaces")
print("→ Basis → Gram–Schmidt → Projection → Least Squares → Eigenvalues")
print("→ Diagonalization → Player Rankings + Categories + Patterns")
print("=" * 65)
