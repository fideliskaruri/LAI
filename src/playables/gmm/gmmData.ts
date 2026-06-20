/**
 * Shared math + data for the Gaussian Mixture Models chapter.
 *
 * We reuse the same thirty-point scatter from the K-means chapter so the
 * reader sees the "same Bell Labs cluster" — only now the assignment is
 * soft instead of hard. Three Gaussian components, full 2x2 covariance
 * matrices (so the contours can tilt and stretch), mixing weights π_k.
 *
 * Units: math-space coords, same convention as scatterData.ts.
 *   x_pixel = ORIGIN_X + x * UNIT
 *   y_pixel = ORIGIN_Y - y * UNIT
 *
 * MML chapter 11 + Bishop §9.2 give the canonical math. We keep things
 * numerically friendly: cap σ floors at 0.15, regularize det Σ.
 */

import { POINTS, type Pt } from '../clustering/scatterData'

export { POINTS }
export type { Pt }

export const K = 3

/**
 * Palette must match the K-means chapter so cross-chapter narration
 * lines up ("the vermilion cluster on the left").
 */
export const COMPONENT_COLORS = [
  'var(--color-vermilion)',
  '#3a6f8c', // muted blue
  '#7a8a3a', // muted olive
] as const

/** Same as scatterData.CLUSTER_RGB — needed for color mixing. */
export const COMPONENT_RGB = [
  [192, 67, 42], // vermilion
  [58, 111, 140], // blue
  [122, 138, 58], // olive
] as const

/**
 * A 2x2 symmetric positive-definite covariance matrix:
 *   [ a  b ]
 *   [ b  c ]
 */
export interface Cov2 {
  a: number
  b: number
  c: number
}

export interface Gaussian2 {
  mean: Pt
  cov: Cov2
}

export interface MixtureComponent extends Gaussian2 {
  /** Mixing weight π_k ∈ [0,1], sums to 1 across the mixture. */
  pi: number
}

/**
 * Initial mixture for the responsibilities / E-step acts.
 *
 * Hand-tuned so the picture starts in an INTERESTING but WRONG state —
 * the means are near (but not at) the true cluster centers, the covariances
 * are oversized (so contours overlap and several points genuinely sit
 * between two components), mixing weights uniform. One E-step + one M-step
 * already produces a visible improvement. Five iterations converge.
 */
export const INITIAL_MIXTURE: MixtureComponent[] = [
  // Component 0 — near cluster A (lower-left)
  {
    mean: { x: -1.8, y: -0.4 },
    cov: { a: 1.6, b: 0.1, c: 1.2 },
    pi: 1 / 3,
  },
  // Component 1 — near cluster B (upper)
  {
    mean: { x: 0.5, y: 0.9 },
    cov: { a: 1.4, b: -0.2, c: 1.4 },
    pi: 1 / 3,
  },
  // Component 2 — near cluster C (lower-right)
  {
    mean: { x: 1.9, y: -0.3 },
    cov: { a: 1.8, b: 0.0, c: 1.0 },
    pi: 1 / 3,
  },
]

/** Tighter, well-fit mixture — used by the closing act as the "converged" pose. */
export const CONVERGED_MIXTURE: MixtureComponent[] = [
  {
    mean: { x: -2.67, y: -1.21 },
    cov: { a: 0.18, b: 0.0, c: 0.16 },
    pi: 1 / 3,
  },
  {
    mean: { x: 0.17, y: 1.91 },
    cov: { a: 0.16, b: 0.0, c: 0.07 },
    pi: 1 / 3,
  },
  {
    mean: { x: 2.75, y: -1.06 },
    cov: { a: 0.1, b: 0.0, c: 0.13 },
    pi: 1 / 3,
  },
]

// ---------- linear algebra helpers ----------

export function detCov(s: Cov2): number {
  return s.a * s.c - s.b * s.b
}

/**
 * Returns the inverse of a 2x2 cov matrix and its determinant.
 * Adds a tiny ridge if the matrix is near-singular (a common EM failure mode
 * — one component shrinks onto a single point).
 */
export function invCov(s: Cov2): { inv: Cov2; det: number } {
  const RIDGE = 1e-4
  let det = detCov(s)
  if (det < RIDGE) {
    // Regularize: add ridge to the diagonal
    const reg = { a: s.a + RIDGE, b: s.b, c: s.c + RIDGE }
    det = detCov(reg)
    return {
      det,
      inv: { a: reg.c / det, b: -reg.b / det, c: reg.a / det },
    }
  }
  return {
    det,
    inv: { a: s.c / det, b: -s.b / det, c: s.a / det },
  }
}

/**
 * 2D Gaussian PDF evaluated at point p, centered at mean, with cov.
 *   N(p | μ, Σ) = (1/(2π√|Σ|)) exp(-½ (p-μ)ᵀ Σ⁻¹ (p-μ))
 */
export function gaussianPdf(p: Pt, g: Gaussian2): number {
  const { inv, det } = invCov(g.cov)
  const dx = p.x - g.mean.x
  const dy = p.y - g.mean.y
  // (p-μ)ᵀ Σ⁻¹ (p-μ)
  const m = inv.a * dx * dx + 2 * inv.b * dx * dy + inv.c * dy * dy
  return Math.exp(-0.5 * m) / (2 * Math.PI * Math.sqrt(Math.max(det, 1e-12)))
}

/** Total mixture density: Σ_k π_k N(p | μ_k, Σ_k). */
export function mixturePdf(p: Pt, mixture: MixtureComponent[]): number {
  let s = 0
  for (const c of mixture) s += c.pi * gaussianPdf(p, c)
  return s
}

/**
 * E-step: per-point responsibilities γ_ik = π_k N(x_i|μ_k,Σ_k) / Σ_j π_j N(x_i|μ_j,Σ_j).
 * Returns a length-N array of length-K probability vectors.
 */
export function responsibilities(
  points: Pt[],
  mixture: MixtureComponent[],
): number[][] {
  return points.map((p) => {
    const weights = mixture.map((c) => c.pi * gaussianPdf(p, c))
    const sum = weights.reduce((a, b) => a + b, 0)
    if (sum === 0) {
      // Numerical underflow — return uniform
      return weights.map(() => 1 / mixture.length)
    }
    return weights.map((w) => w / sum)
  })
}

/**
 * M-step: given responsibilities, update means, covariances, mixing weights.
 *   N_k = Σ_i γ_ik
 *   π_k = N_k / N
 *   μ_k = (1/N_k) Σ_i γ_ik x_i
 *   Σ_k = (1/N_k) Σ_i γ_ik (x_i - μ_k)(x_i - μ_k)ᵀ
 */
export function mStep(
  points: Pt[],
  gammas: number[][],
): MixtureComponent[] {
  const K_ = gammas[0]?.length ?? 0
  const N = points.length
  const out: MixtureComponent[] = []
  for (let k = 0; k < K_; k++) {
    let Nk = 0
    let sx = 0
    let sy = 0
    for (let i = 0; i < N; i++) {
      const g = gammas[i][k]
      Nk += g
      sx += g * points[i].x
      sy += g * points[i].y
    }
    // Floor Nk to avoid divide-by-zero when a component is empty
    const safeNk = Math.max(Nk, 1e-6)
    const mx = sx / safeNk
    const my = sy / safeNk

    let a = 0
    let b = 0
    let c = 0
    for (let i = 0; i < N; i++) {
      const g = gammas[i][k]
      const dx = points[i].x - mx
      const dy = points[i].y - my
      a += g * dx * dx
      b += g * dx * dy
      c += g * dy * dy
    }
    a = a / safeNk
    b = b / safeNk
    c = c / safeNk

    // Floor variance so components don't collapse to a point
    const SIGMA_FLOOR = 0.04 // i.e. σ ≈ 0.2
    if (a < SIGMA_FLOOR) a = SIGMA_FLOOR
    if (c < SIGMA_FLOOR) c = SIGMA_FLOOR

    out.push({
      mean: { x: mx, y: my },
      cov: { a, b, c },
      pi: Nk / N,
    })
  }
  return out
}

/** Total log-likelihood Σ_i log Σ_k π_k N(x_i|μ_k,Σ_k). */
export function logLikelihood(
  points: Pt[],
  mixture: MixtureComponent[],
): number {
  let ll = 0
  for (const p of points) {
    ll += Math.log(Math.max(mixturePdf(p, mixture), 1e-300))
  }
  return ll
}

/**
 * Mix RGB by responsibilities — returns a CSS rgb() string.
 * Used everywhere we paint a point in its blended-membership color.
 */
export function mixColor(probs: number[]): string {
  let r = 0
  let g = 0
  let b = 0
  for (let i = 0; i < probs.length; i++) {
    r += COMPONENT_RGB[i][0] * probs[i]
    g += COMPONENT_RGB[i][1] * probs[i]
    b += COMPONENT_RGB[i][2] * probs[i]
  }
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}

/**
 * Sample points on the ellipse {x : (x-μ)ᵀ Σ⁻¹ (x-μ) = c²} via
 * eigendecomposition of the 2x2 cov. We return an SVG `points`-style array
 * in math-space coords. nLevels iso-curves at Mahalanobis distances 1, 2.
 */
export function covEllipse(
  g: Gaussian2,
  level: number,
  nSegments = 64,
): Pt[] {
  const { a, b, c } = g.cov
  // Eigendecomp of 2x2 symmetric
  const tr = a + c
  const det = a * c - b * b
  const disc = Math.sqrt(Math.max(tr * tr / 4 - det, 0))
  const lam1 = tr / 2 + disc
  const lam2 = tr / 2 - disc
  // Eigenvector for lam1
  let vx = 1
  let vy = 0
  if (Math.abs(b) > 1e-9) {
    vx = lam1 - c
    vy = b
    const n = Math.sqrt(vx * vx + vy * vy)
    vx /= n
    vy /= n
  } else if (c > a) {
    vx = 0
    vy = 1
  }
  const s1 = level * Math.sqrt(Math.max(lam1, 1e-9))
  const s2 = level * Math.sqrt(Math.max(lam2, 1e-9))
  const pts: Pt[] = []
  for (let i = 0; i <= nSegments; i++) {
    const t = (i / nSegments) * 2 * Math.PI
    const ex = s1 * Math.cos(t)
    const ey = s2 * Math.sin(t)
    // Rotate by eigenvector frame
    pts.push({
      x: g.mean.x + vx * ex - vy * ey,
      y: g.mean.y + vy * ex + vx * ey,
    })
  }
  return pts
}
