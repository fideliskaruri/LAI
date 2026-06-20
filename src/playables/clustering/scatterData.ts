/**
 * Shared dataset for the K-means chapter.
 *
 * 30 points in math coordinates (origin at center, units of 1 = 50 px in SVG).
 * Three clusters a human sees instantly: lower-left, upper, lower-right.
 * Hand-tuned so that a sloppy random initialization can plausibly split one
 * cluster between two centroids — the init-sensitivity teaching depends on it.
 *
 * All scenes import POINTS from here so the layout is identical across acts.
 */

export interface Pt {
  x: number
  y: number
}

// Three clusters, ten points each. Coords are math-space (y up).
export const POINTS: Pt[] = [
  // Cluster A — lower-left, centered near (-2.6, -1.2)
  { x: -3.2, y: -1.4 },
  { x: -2.9, y: -1.0 },
  { x: -2.4, y: -1.5 },
  { x: -2.0, y: -0.9 },
  { x: -2.7, y: -0.6 },
  { x: -3.1, y: -1.8 },
  { x: -2.3, y: -1.1 },
  { x: -2.6, y: -1.4 },
  { x: -3.0, y: -0.7 },
  { x: -2.5, y: -1.7 },

  // Cluster B — upper, centered near (0.2, 1.9)
  { x: -0.3, y: 1.6 },
  { x: 0.1, y: 2.1 },
  { x: 0.5, y: 1.8 },
  { x: -0.1, y: 2.3 },
  { x: 0.4, y: 1.5 },
  { x: 0.6, y: 2.0 },
  { x: 0.0, y: 1.9 },
  { x: -0.4, y: 2.0 },
  { x: 0.7, y: 1.7 },
  { x: 0.2, y: 2.2 },

  // Cluster C — lower-right, centered near (2.7, -1.0)
  { x: 2.3, y: -0.8 },
  { x: 2.8, y: -1.3 },
  { x: 3.1, y: -0.9 },
  { x: 2.6, y: -0.5 },
  { x: 3.0, y: -1.5 },
  { x: 2.4, y: -1.2 },
  { x: 2.9, y: -0.7 },
  { x: 3.2, y: -1.1 },
  { x: 2.5, y: -1.6 },
  { x: 2.7, y: -1.0 },
]

export const K = 3

/** Stable, deterministic palette for the K=3 clusters. */
export const CLUSTER_COLORS = [
  'var(--color-vermilion)',
  '#3a6f8c', // muted blue
  '#7a8a3a', // muted olive
] as const

/**
 * Initial centroid positions for RandomInit. Hand-picked rather than RNG-based
 * so the scene loads in the same state every time and the prose can refer to
 * what the reader is looking at.
 */
export const RANDOM_INIT_CENTROIDS: Pt[] = [
  { x: -1.6, y: 1.0 },
  { x: 1.2, y: -1.8 },
  { x: 2.0, y: 1.4 },
]

/**
 * A handful of pre-baked "different random init" sets for InitSensitivity.
 * The third one deliberately drops two centroids inside cluster B (the upper
 * group) so that cluster ends up split between two centroids and clusters A
 * and C get assigned to a single centroid — the failure mode the prose names.
 */
export const SENSITIVITY_INITS: Pt[][] = [
  // Decent init — converges to the three true clusters.
  [
    { x: -2.0, y: 1.0 },
    { x: 0.5, y: -1.5 },
    { x: 2.5, y: 1.5 },
  ],
  // Edge-of-good — slow but correct.
  [
    { x: -0.5, y: 0.5 },
    { x: 1.5, y: 0.5 },
    { x: -2.5, y: -1.5 },
  ],
  // Bad init — two centroids inside cluster B, the lower clusters merge.
  [
    { x: -0.4, y: 1.6 },
    { x: 0.5, y: 2.2 },
    { x: 0.0, y: -1.2 },
  ],
  // Another bad init — two centroids on the left, cluster C alone takes one.
  [
    { x: -3.0, y: -1.5 },
    { x: -2.0, y: -0.5 },
    { x: 2.7, y: -1.0 },
  ],
]

/** Compute Euclidean distance in math-space. */
export function dist(a: Pt, b: Pt): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/** Assign each point to the index of the closest centroid. */
export function assign(points: Pt[], centroids: Pt[]): number[] {
  return points.map((p) => {
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < centroids.length; i++) {
      const d = dist(p, centroids[i])
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    return best
  })
}

/**
 * Move each centroid to the mean of its assigned points. Returns the new
 * centroid array AND the total drift (sum of per-centroid distances moved).
 * Empty assignment? Leave the centroid where it is.
 */
export function updateCentroids(
  points: Pt[],
  assignments: number[],
  centroids: Pt[],
): { next: Pt[]; drift: number } {
  const next: Pt[] = centroids.map((c) => ({ ...c }))
  for (let i = 0; i < centroids.length; i++) {
    let sx = 0
    let sy = 0
    let n = 0
    for (let j = 0; j < points.length; j++) {
      if (assignments[j] === i) {
        sx += points[j].x
        sy += points[j].y
        n++
      }
    }
    if (n > 0) {
      next[i] = { x: sx / n, y: sy / n }
    }
  }
  let drift = 0
  for (let i = 0; i < centroids.length; i++) {
    drift += dist(centroids[i], next[i])
  }
  return { next, drift }
}
