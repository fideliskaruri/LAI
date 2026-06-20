/**
 * Shared synthetic dataset for the Linear Regression chapter.
 *
 * Twelve (height, weight) points. Heights centered around 170 cm, weights
 * around 70 kg, with a slope of roughly 0.9 kg/cm and Gaussian-ish jitter.
 * Generated once, by hand, so the data is deterministic across reloads and
 * the reader can re-trace the same dragging exercise the prose describes.
 *
 * Coordinate frame: x = height (cm) − 150, y = weight (kg) − 40. That keeps
 * both axes in a nice 0–40 range so the canvas math doesn't have to fight
 * the SVG viewBox.
 */
export interface Pt {
  x: number
  y: number
}

export const POINTS: Pt[] = [
  { x: 5, y: 8 },
  { x: 9, y: 13 },
  { x: 12, y: 15 },
  { x: 15, y: 21 },
  { x: 18, y: 18 },
  { x: 20, y: 27 },
  { x: 22, y: 24 },
  { x: 25, y: 31 },
  { x: 27, y: 29 },
  { x: 30, y: 35 },
  { x: 33, y: 32 },
  { x: 36, y: 38 },
]

/**
 * Closed-form OLS solution for the dataset above.
 *  beta1 (slope)     ~ 0.929
 *  beta0 (intercept) ~ 4.13
 * Computed once, hardcoded so the "best fit" act doesn't need to recompute.
 */
export function olsFit(pts: Pt[] = POINTS): { slope: number; intercept: number } {
  const n = pts.length
  const mx = pts.reduce((s, p) => s + p.x, 0) / n
  const my = pts.reduce((s, p) => s + p.y, 0) / n
  let num = 0
  let den = 0
  for (const p of pts) {
    num += (p.x - mx) * (p.y - my)
    den += (p.x - mx) * (p.x - mx)
  }
  const slope = den === 0 ? 0 : num / den
  const intercept = my - slope * mx
  return { slope, intercept }
}

/** SSE for a (slope, intercept) line on the dataset. */
export function sse(slope: number, intercept: number, pts: Pt[] = POINTS): number {
  let s = 0
  for (const p of pts) {
    const r = p.y - (slope * p.x + intercept)
    s += r * r
  }
  return s
}

/** Sum of absolute residuals. */
export function sumAbsResiduals(slope: number, intercept: number, pts: Pt[] = POINTS): number {
  let s = 0
  for (const p of pts) {
    s += Math.abs(p.y - (slope * p.x + intercept))
  }
  return s
}

/* ---- SVG layout primitives shared by every 2D pane in this chapter. ---- */

export const VIEW_W = 600
export const VIEW_H = 480

/** Data range. x in 0..40, y in 0..40. */
export const X_MIN = 0
export const X_MAX = 40
export const Y_MIN = 0
export const Y_MAX = 40

/** Pixel padding around the plot area. */
const PAD_L = 64
const PAD_R = 32
const PAD_T = 40
const PAD_B = 56

export const PLOT_X0 = PAD_L
export const PLOT_X1 = VIEW_W - PAD_R
export const PLOT_Y0 = PAD_T
export const PLOT_Y1 = VIEW_H - PAD_B
export const PLOT_W = PLOT_X1 - PLOT_X0
export const PLOT_H = PLOT_Y1 - PLOT_Y0

export const dataToSvgX = (x: number) =>
  PLOT_X0 + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W
export const dataToSvgY = (y: number) =>
  PLOT_Y1 - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H
export const svgYToData = (sy: number) =>
  Y_MIN + ((PLOT_Y1 - sy) / PLOT_H) * (Y_MAX - Y_MIN)
export const svgXToData = (sx: number) =>
  X_MIN + ((sx - PLOT_X0) / PLOT_W) * (X_MAX - X_MIN)

/** "OLS" answer cached for convenience. */
export const OLS = olsFit()
