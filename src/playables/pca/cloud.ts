/**
 * Shared data for the PCA chapter — one deterministic correlated cloud,
 * reused across acts so the eigenvectors, projections, and reconstructions
 * line up from picture to picture.
 *
 * The cloud is centered at the origin. The sampling distribution is a
 * tilted bivariate Gaussian: standard deviations of MAJOR and MINOR along
 * a 30° axis, then rotated into world coordinates.
 */

export interface Pt {
  x: number
  y: number
}

// Mulberry32 — deterministic, no external deps.
function mulberry32(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussian(rng: () => number) {
  const u1 = Math.max(1e-9, rng())
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

export const MAJOR_SD = 1.6
export const MINOR_SD = 0.55
export const TILT_RADIANS = Math.PI / 6 // 30°

export function makeCloud(n: number, seed: number): Pt[] {
  const rng = mulberry32(seed)
  const c = Math.cos(TILT_RADIANS)
  const s = Math.sin(TILT_RADIANS)
  const pts: Pt[] = []
  for (let i = 0; i < n; i++) {
    const a = gaussian(rng) * MAJOR_SD
    const b = gaussian(rng) * MINOR_SD
    pts.push({
      x: c * a - s * b,
      y: s * a + c * b,
    })
  }
  return pts
}

/** Empirical covariance of a point set, returned as the three unique
 *  entries of the symmetric 2×2 matrix [[a,b],[b,c]]. */
export function covariance(pts: Pt[]): { a: number; b: number; c: number; meanX: number; meanY: number } {
  let sx = 0
  let sy = 0
  for (const p of pts) {
    sx += p.x
    sy += p.y
  }
  const meanX = sx / pts.length
  const meanY = sy / pts.length
  let a = 0
  let b = 0
  let c = 0
  for (const p of pts) {
    const dx = p.x - meanX
    const dy = p.y - meanY
    a += dx * dx
    b += dx * dy
    c += dy * dy
  }
  return {
    a: a / pts.length,
    b: b / pts.length,
    c: c / pts.length,
    meanX,
    meanY,
  }
}

/** Closed-form 2×2 eigendecomposition of a symmetric matrix [[a,b],[b,c]].
 *  Returns eigenvalues sorted l1 ≥ l2 and unit eigenvectors v1 ⊥ v2. */
export function eigenSym(a: number, b: number, c: number) {
  const tr = a + c
  const det = a * c - b * b
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det))
  const l1 = tr / 2 + disc
  const l2 = tr / 2 - disc
  const eps = 1e-9
  let v1: Pt
  if (Math.abs(b) > eps) {
    v1 = { x: b, y: l1 - a }
  } else {
    v1 = a >= c ? { x: 1, y: 0 } : { x: 0, y: 1 }
  }
  const n1 = Math.hypot(v1.x, v1.y) || 1
  v1 = { x: v1.x / n1, y: v1.y / n1 }
  // Choose v1 in the upper-right half-plane so the picture is stable.
  if (v1.x < 0 || (v1.x === 0 && v1.y < 0)) v1 = { x: -v1.x, y: -v1.y }
  const v2: Pt = { x: -v1.y, y: v1.x }
  return { l1, l2, v1, v2 }
}

/** Variance of the data projected onto a unit direction (cos θ, sin θ).
 *  Closed-form: u·Σu where Σ is the covariance. */
export function projectedVariance(
  theta: number,
  cov: { a: number; b: number; c: number },
): number {
  const ux = Math.cos(theta)
  const uy = Math.sin(theta)
  return cov.a * ux * ux + 2 * cov.b * ux * uy + cov.c * uy * uy
}
