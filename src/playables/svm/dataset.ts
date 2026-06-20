/**
 * Shared synthetic data + plot primitives for the Support Vector Machines
 * chapter. Two-class points in a 600×480 SVG viewBox.
 *
 * Coordinate frame: math-space x in 0..40, y in 0..40. The data is laid out so
 * the +1 class sits upper-right and the −1 class sits lower-left, with a wide
 * empty band between them — the band is what the max-margin solver fills.
 *
 * Three datasets live here:
 *   1. SEPARABLE_POINTS   — wide gap, used by acts 2–4
 *   2. OVERLAP_POINTS     — the two classes overlap, used by act 5
 *   3. RING_POINTS        — class +1 inside a ring of class −1, used by act 6
 */

export type Label = -1 | 1

export interface Pt {
  x: number
  y: number
  label: Label
}

/* ============================================================ */
/* Plot frame — shared with every 2D pane in this chapter        */
/* ============================================================ */

export const VIEW_W = 600
export const VIEW_H = 480

export const X_MIN = 0
export const X_MAX = 40
export const Y_MIN = 0
export const Y_MAX = 40

const PAD_L = 56
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

/* ============================================================ */
/* Dataset 1 — separable                                         */
/* ============================================================ */

/**
 * Two clouds with a clean, wide diagonal gap. Hand-tuned so the support
 * vectors are obvious: a few points sit just on the inside edge of the gap,
 * everything else lives well clear of the margin. 25 points per class.
 */
export const SEPARABLE_POINTS: Pt[] = [
  // Class +1 — upper-right
  { x: 22, y: 30, label: 1 },
  { x: 24, y: 34, label: 1 },
  { x: 26, y: 28, label: 1 },
  { x: 28, y: 32, label: 1 },
  { x: 30, y: 36, label: 1 },
  { x: 32, y: 30, label: 1 },
  { x: 33, y: 34, label: 1 },
  { x: 35, y: 31, label: 1 },
  { x: 36, y: 36, label: 1 },
  { x: 27, y: 38, label: 1 },
  { x: 31, y: 26, label: 1 }, // a candidate support vector — near the gap
  { x: 25, y: 26, label: 1 }, // another candidate SV
  { x: 29, y: 24, label: 1 }, // and another
  { x: 34, y: 28, label: 1 },
  { x: 23, y: 32, label: 1 },
  { x: 30, y: 32, label: 1 },
  { x: 25, y: 36, label: 1 },
  { x: 33, y: 38, label: 1 },
  { x: 37, y: 33, label: 1 },
  { x: 28, y: 28, label: 1 },
  { x: 32, y: 24, label: 1 }, // closest to boundary
  { x: 26, y: 32, label: 1 },
  { x: 29, y: 35, label: 1 },
  { x: 35, y: 25, label: 1 },
  { x: 22, y: 34, label: 1 },

  // Class −1 — lower-left
  { x: 6, y: 8, label: -1 },
  { x: 9, y: 12, label: -1 },
  { x: 4, y: 14, label: -1 },
  { x: 12, y: 6, label: -1 },
  { x: 8, y: 4, label: -1 },
  { x: 14, y: 10, label: -1 },
  { x: 11, y: 16, label: -1 },
  { x: 5, y: 10, label: -1 },
  { x: 7, y: 16, label: -1 },
  { x: 10, y: 8, label: -1 },
  { x: 16, y: 14, label: -1 }, // candidate SV
  { x: 14, y: 18, label: -1 }, // candidate SV
  { x: 18, y: 12, label: -1 }, // closest to boundary
  { x: 13, y: 4, label: -1 },
  { x: 3, y: 8, label: -1 },
  { x: 9, y: 6, label: -1 },
  { x: 15, y: 6, label: -1 },
  { x: 6, y: 16, label: -1 },
  { x: 11, y: 12, label: -1 },
  { x: 4, y: 4, label: -1 },
  { x: 17, y: 8, label: -1 },
  { x: 12, y: 14, label: -1 },
  { x: 8, y: 14, label: -1 },
  { x: 16, y: 4, label: -1 },
  { x: 7, y: 11, label: -1 },
]

/* ============================================================ */
/* Dataset 2 — overlapping (act 5, soft margin)                  */
/* ============================================================ */

/**
 * The two classes spill into each other. No straight line perfectly
 * separates them — the prose names that explicitly. 20 points per class.
 */
export const OVERLAP_POINTS: Pt[] = [
  // +1 — broadly upper-right but with several stragglers low-left
  { x: 24, y: 28, label: 1 },
  { x: 27, y: 32, label: 1 },
  { x: 30, y: 26, label: 1 },
  { x: 33, y: 30, label: 1 },
  { x: 35, y: 34, label: 1 },
  { x: 28, y: 34, label: 1 },
  { x: 22, y: 26, label: 1 },
  { x: 32, y: 36, label: 1 },
  { x: 36, y: 28, label: 1 },
  { x: 25, y: 34, label: 1 },
  // The overlappers — sit in the middle/lower-left
  { x: 18, y: 20, label: 1 },
  { x: 20, y: 16, label: 1 },
  { x: 15, y: 22, label: 1 },
  { x: 22, y: 18, label: 1 },
  { x: 16, y: 14, label: 1 },
  { x: 31, y: 22, label: 1 },
  { x: 19, y: 26, label: 1 },
  { x: 24, y: 22, label: 1 },
  { x: 29, y: 18, label: 1 },
  { x: 26, y: 16, label: 1 },

  // −1 — broadly lower-left but with several stragglers up-right
  { x: 8, y: 10, label: -1 },
  { x: 12, y: 14, label: -1 },
  { x: 6, y: 16, label: -1 },
  { x: 14, y: 8, label: -1 },
  { x: 10, y: 6, label: -1 },
  { x: 4, y: 12, label: -1 },
  { x: 16, y: 12, label: -1 },
  { x: 9, y: 18, label: -1 },
  { x: 13, y: 4, label: -1 },
  { x: 7, y: 8, label: -1 },
  // The overlappers
  { x: 22, y: 22, label: -1 },
  { x: 26, y: 24, label: -1 },
  { x: 18, y: 26, label: -1 },
  { x: 24, y: 20, label: -1 },
  { x: 30, y: 20, label: -1 },
  { x: 20, y: 24, label: -1 },
  { x: 17, y: 18, label: -1 },
  { x: 28, y: 28, label: -1 },
  { x: 21, y: 30, label: -1 },
  { x: 25, y: 26, label: -1 },
]

/* ============================================================ */
/* Dataset 3 — ring (act 6, kernel trick)                        */
/* ============================================================ */

/**
 * The inner class (+1) is a tight blob near the centre; the outer class (−1)
 * is a ring around it. No straight line separates them; a polynomial /
 * RBF lift to 3D puts the inner blob below the outer ring on the lifted axis.
 *
 * Centred at (20, 20).
 */
export const RING_POINTS: Pt[] = (() => {
  const pts: Pt[] = []
  const CX = 20
  const CY = 20

  // +1 — inner blob, radius < 5
  // Deterministic pseudo-random angle/radius pairs so the layout doesn't
  // change between renders.
  const innerSeeds = [
    [0.1, 1.6], [0.7, 3.2], [1.3, 2.4], [2.0, 3.8], [2.6, 1.8],
    [3.2, 3.4], [3.8, 2.0], [4.4, 3.6], [5.0, 2.6], [5.6, 1.4],
    [0.4, 4.0], [1.0, 1.0], [1.7, 4.2], [2.3, 2.8], [3.0, 0.6],
  ]
  for (const [ang, r] of innerSeeds) {
    pts.push({ x: CX + r * Math.cos(ang), y: CY + r * Math.sin(ang), label: 1 })
  }

  // −1 — outer ring, radius ~ 11..14
  const outerSeeds = [
    [0.2, 11.5], [0.6, 12.4], [1.0, 13.0], [1.4, 11.8], [1.8, 12.6],
    [2.2, 13.5], [2.6, 11.6], [3.0, 12.8], [3.4, 13.2], [3.8, 11.7],
    [4.2, 12.5], [4.6, 13.4], [5.0, 12.0], [5.4, 13.0], [5.8, 11.6],
    [0.4, 13.6], [1.2, 11.4], [2.0, 14.0], [2.8, 12.2], [3.6, 13.8],
    [4.4, 11.5], [5.2, 12.6], [0.8, 14.2], [3.2, 11.4], [4.8, 13.6],
  ]
  for (const [ang, r] of outerSeeds) {
    pts.push({ x: CX + r * Math.cos(ang), y: CY + r * Math.sin(ang), label: -1 })
  }

  return pts
})()

/* ============================================================ */
/* Hyperplane math                                               */
/* ============================================================ */

/**
 * A 2D hyperplane parameterized by w·x + b = 0, where w = (wx, wy). For the
 * playables we represent it instead by two endpoints (yLeft at x=X_MIN,
 * yRight at x=X_MAX) — same information, much easier to drag.
 */
export interface Line2D {
  yLeft: number
  yRight: number
}

/** Convert (yLeft, yRight) to slope+intercept form. */
export function lineSlopeIntercept(l: Line2D): { slope: number; intercept: number } {
  const slope = (l.yRight - l.yLeft) / (X_MAX - X_MIN)
  const intercept = l.yLeft - slope * X_MIN
  return { slope, intercept }
}

/** Signed perpendicular distance from a point to a line. Positive means the
 *  point sits above the line (in math-space, y up). */
export function signedDistance(p: { x: number; y: number }, l: Line2D): number {
  const { slope, intercept } = lineSlopeIntercept(l)
  // Line: slope·x − y + intercept = 0  ⇒  (a, b, c) = (slope, −1, intercept)
  const a = slope
  const b = -1
  const c = intercept
  return (a * p.x + b * p.y + c) / Math.sqrt(a * a + b * b)
}

/** The margin width for a candidate line, on a labeled dataset. Defined as
 *  the minimum perpendicular distance from any point to the line. The sign
 *  is dropped — we just want the gap. */
export function marginWidth(line: Line2D, pts: Pt[] = SEPARABLE_POINTS): number {
  let min = Infinity
  for (const p of pts) {
    const d = Math.abs(signedDistance(p, line))
    if (d < min) min = d
  }
  return min
}

/**
 * Is the line a valid separator? Every +1 point must sit on the positive side
 * and every −1 on the negative side (or vice versa — we accept either sign
 * convention).
 */
export function isSeparator(line: Line2D, pts: Pt[] = SEPARABLE_POINTS): boolean {
  let posIs1 = 0
  let posIsMinus1 = 0
  for (const p of pts) {
    const s = signedDistance(p, line)
    if (s > 0) {
      if (p.label === 1) posIs1++
      else posIsMinus1++
    } else {
      if (p.label === -1) posIs1++
      else posIsMinus1++
    }
  }
  return posIs1 === pts.length || posIsMinus1 === pts.length
}

/**
 * Count misclassified points — used by the soft-margin act.
 * "Misclassified" means the point sits on the wrong side of the line, where
 * "the wrong side" is whichever side has more points of the opposite label.
 */
export function misclassified(line: Line2D, pts: Pt[] = OVERLAP_POINTS): number {
  // Figure out the convention — which sign is +1?
  let posPlus = 0
  let negPlus = 0
  for (const p of pts) {
    const s = signedDistance(p, line)
    if (p.label === 1) {
      if (s > 0) posPlus++
      else negPlus++
    }
  }
  const plusSign: 1 | -1 = posPlus >= negPlus ? 1 : -1
  let wrong = 0
  for (const p of pts) {
    const s = signedDistance(p, line)
    const side: 1 | -1 = s >= 0 ? 1 : -1
    const predicted = side * plusSign
    if (predicted !== p.label) wrong++
  }
  return wrong
}

/* ============================================================ */
/* The "true" max-margin line — cached, for the support-vector  */
/* and quality-score readouts                                   */
/* ============================================================ */

/**
 * Closed-form max-margin separator for SEPARABLE_POINTS. Hand-fit by
 * inspection of the candidate support vectors, then refined by an explicit
 * search below to whatever precision the canvas can display.
 */
function computeMaxMargin(pts: Pt[]): Line2D {
  // Grid search over (yLeft, yRight). The data is bounded in 0..40, so try
  // every endpoint in that range at 0.25-unit resolution and keep the line
  // with the widest margin that still separates the classes.
  let best: Line2D = { yLeft: 18, yRight: 18 }
  let bestMargin = -1
  for (let yL = 5; yL <= 35; yL += 0.25) {
    for (let yR = 5; yR <= 35; yR += 0.25) {
      const l = { yLeft: yL, yRight: yR }
      if (!isSeparator(l, pts)) continue
      const m = marginWidth(l, pts)
      if (m > bestMargin) {
        bestMargin = m
        best = l
      }
    }
  }
  return best
}

export const MAX_MARGIN_LINE: Line2D = computeMaxMargin(SEPARABLE_POINTS)
export const MAX_MARGIN_WIDTH: number = marginWidth(MAX_MARGIN_LINE, SEPARABLE_POINTS)

/** Points that touch the margin boundary — the support vectors. A point is
 *  a support vector if its perpendicular distance to the line is within a
 *  small tolerance of the margin width. */
export function supportVectors(
  line: Line2D,
  pts: Pt[] = SEPARABLE_POINTS,
  tol = 0.6,
): Pt[] {
  const m = marginWidth(line, pts)
  return pts.filter((p) => Math.abs(Math.abs(signedDistance(p, line)) - m) < tol)
}

/* ============================================================ */
/* Plot helpers — axes, scatter, hyperplane drawing              */
/* ============================================================ */

/** Class colors — vermilion for +1, ink for −1. Kept as CSS vars so the
 *  global palette swap (cream / midnight) Just Works. */
export const COLOR_PLUS = 'var(--color-vermilion)'
export const COLOR_MINUS = 'var(--color-ink)'

export function classColor(label: Label): string {
  return label === 1 ? COLOR_PLUS : COLOR_MINUS
}
