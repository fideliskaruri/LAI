/**
 * Shared dataset + math for the Perceptron chapter.
 *
 * Two-class data on [−1, 1]² so the weight vector and the decision line
 * both read at human scale. The bias term is folded into the weight as
 * w = (w0, w1, w2) with a synthetic "1" prepended to every input. The
 * decision function is the classic Rosenblatt step:
 *
 *     ŷ = step(w · x) = 1 if w · x ≥ 0, else 0
 *
 * The learning rule is also classic:
 *
 *     w ← w + η (y − ŷ) x
 *
 * applied online, one misclassified point at a time. For the linearly
 * separable dataset Rosenblatt's 1962 theorem guarantees convergence in
 * a finite number of steps. For XOR we'll watch it spin forever.
 */

export interface Pt {
  x: number
  y: number
}

export interface LabeledPt extends Pt {
  /** 0 = blue (negative class), 1 = red (positive class) */
  y_label: 0 | 1
}

/* ---- SVG layout primitives, shared across every pane. ---- */

export const VIEW_W = 600
export const VIEW_H = 480

/** Data range — symmetric so the origin is in the centre. */
export const X_MIN = -1
export const X_MAX = 1
export const Y_MIN = -1
export const Y_MAX = 1

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
export const svgXToData = (px: number) =>
  X_MIN + ((px - PLOT_X0) / PLOT_W) * (X_MAX - X_MIN)
export const svgYToData = (py: number) =>
  Y_MIN + ((PLOT_Y1 - py) / PLOT_H) * (Y_MAX - Y_MIN)

/* ---- The data. ---- */

/**
 * Linearly separable two-class data. Twenty points, ten blue (label 0) in the
 * lower-left, ten red (label 1) in the upper-right, with a healthy margin.
 * Hand-picked so the cleanest separator is roughly the diagonal y = −x.
 */
export const SEPARABLE_POINTS: LabeledPt[] = [
  // Class 0 — blue, lower-left
  { x: -0.85, y: -0.55, y_label: 0 },
  { x: -0.70, y: -0.20, y_label: 0 },
  { x: -0.55, y: -0.75, y_label: 0 },
  { x: -0.40, y: -0.40, y_label: 0 },
  { x: -0.65, y: 0.05, y_label: 0 },
  { x: -0.30, y: -0.65, y_label: 0 },
  { x: -0.15, y: -0.85, y_label: 0 },
  { x: -0.90, y: -0.30, y_label: 0 },
  { x: -0.20, y: -0.30, y_label: 0 },
  { x: -0.50, y: -0.10, y_label: 0 },
  // Class 1 — red, upper-right
  { x: 0.85, y: 0.55, y_label: 1 },
  { x: 0.70, y: 0.20, y_label: 1 },
  { x: 0.55, y: 0.75, y_label: 1 },
  { x: 0.40, y: 0.40, y_label: 1 },
  { x: 0.65, y: -0.05, y_label: 1 },
  { x: 0.30, y: 0.65, y_label: 1 },
  { x: 0.15, y: 0.85, y_label: 1 },
  { x: 0.90, y: 0.30, y_label: 1 },
  { x: 0.20, y: 0.30, y_label: 1 },
  { x: 0.50, y: 0.10, y_label: 1 },
]

/**
 * The XOR pattern — the famous Minsky-Papert counterexample. Four clusters,
 * one in each corner of the unit square (scaled). Diagonal corners share a
 * label, so no straight line can separate them.
 */
export const XOR_POINTS: LabeledPt[] = [
  // Positive class — (0,0)-ish and (1,1)-ish corners (in our [−1,1] frame:
  // lower-left and upper-right corners).
  { x: -0.75, y: -0.75, y_label: 1 },
  { x: -0.60, y: -0.85, y_label: 1 },
  { x: -0.85, y: -0.60, y_label: 1 },
  { x: -0.70, y: -0.70, y_label: 1 },
  { x: 0.75, y: 0.75, y_label: 1 },
  { x: 0.60, y: 0.85, y_label: 1 },
  { x: 0.85, y: 0.60, y_label: 1 },
  { x: 0.70, y: 0.70, y_label: 1 },
  // Negative class — (0,1)-ish and (1,0)-ish corners (upper-left, lower-right).
  { x: -0.75, y: 0.75, y_label: 0 },
  { x: -0.60, y: 0.85, y_label: 0 },
  { x: -0.85, y: 0.60, y_label: 0 },
  { x: -0.70, y: 0.70, y_label: 0 },
  { x: 0.75, y: -0.75, y_label: 0 },
  { x: 0.60, y: -0.85, y_label: 0 },
  { x: 0.85, y: -0.60, y_label: 0 },
  { x: 0.70, y: -0.70, y_label: 0 },
]

/* ---- The perceptron. ---- */

/** A perceptron's parameters: bias w0, then weights w1, w2 for x and y. */
export interface PerceptronWeights {
  w0: number // bias
  w1: number // weight on x
  w2: number // weight on y
}

/** A modest non-zero start so the boundary draws somewhere visible. */
export const INITIAL_WEIGHTS: PerceptronWeights = {
  w0: 0.1,
  w1: -0.6,
  w2: 0.4,
}

/** Pre-activation score z = w0 + w1·x + w2·y. */
export function preActivation(w: PerceptronWeights, p: Pt): number {
  return w.w0 + w.w1 * p.x + w.w2 * p.y
}

/** Hard step (Heaviside). Output is 1 if z ≥ 0, else 0. */
export function step(z: number): 0 | 1 {
  return z >= 0 ? 1 : 0
}

/** Forward pass: ŷ = step(w · x). */
export function predict(w: PerceptronWeights, p: Pt): 0 | 1 {
  return step(preActivation(w, p))
}

/** Count of misclassified points under the current weights. */
export function misclassifiedCount(
  w: PerceptronWeights,
  pts: LabeledPt[],
): number {
  let n = 0
  for (const p of pts) if (predict(w, p) !== p.y_label) n++
  return n
}

/**
 * One online perceptron update on a single point.
 *
 *     w ← w + η (y − ŷ) x
 *
 * With ŷ ∈ {0,1} and y ∈ {0,1}, the term (y − ŷ) is in {−1, 0, +1}:
 *   - 0 when correct: no update
 *   - +1 when the model said 0 but the truth is 1: push w toward x
 *   - −1 when the model said 1 but the truth is 0: push w away from x
 *
 * Returns the updated weights AND the sign of the update (0 if no update).
 */
export function perceptronStep(
  w: PerceptronWeights,
  p: LabeledPt,
  eta: number,
): { w: PerceptronWeights; delta: -1 | 0 | 1 } {
  const yhat = predict(w, p)
  const err = p.y_label - yhat // in {−1, 0, +1}
  if (err === 0) return { w, delta: 0 }
  return {
    w: {
      w0: w.w0 + eta * err * 1, // bias x0 = 1
      w1: w.w1 + eta * err * p.x,
      w2: w.w2 + eta * err * p.y,
    },
    delta: err as -1 | 1,
  }
}

/**
 * One full epoch — cycle through every point once in order, applying the
 * update rule at each misclassified point. Returns the final weights and a
 * count of how many updates were performed.
 */
export function perceptronEpoch(
  w: PerceptronWeights,
  pts: LabeledPt[],
  eta: number,
): { w: PerceptronWeights; updates: number; lastIndex: number | null } {
  let cur = w
  let updates = 0
  let lastIndex: number | null = null
  for (let i = 0; i < pts.length; i++) {
    const r = perceptronStep(cur, pts[i], eta)
    cur = r.w
    if (r.delta !== 0) {
      updates += 1
      lastIndex = i
    }
  }
  return { w: cur, updates, lastIndex }
}

/**
 * Endpoints of the decision line, clipped to the plot rectangle in DATA
 * coordinates. The line is the locus w0 + w1·x + w2·y = 0.
 *
 * We parameterise by x ∈ [X_MIN, X_MAX] when w2 ≠ 0 (line is y = …),
 * otherwise by y when w1 ≠ 0 (line is x = …). If both weights are zero
 * there's no boundary; we return null.
 */
export function boundaryEndpoints(
  w: PerceptronWeights,
): { x1: number; y1: number; x2: number; y2: number } | null {
  if (Math.abs(w.w1) < 1e-9 && Math.abs(w.w2) < 1e-9) return null
  if (Math.abs(w.w2) >= Math.abs(w.w1)) {
    // y = -(w0 + w1·x) / w2
    const yAt = (x: number) => -(w.w0 + w.w1 * x) / w.w2
    return { x1: X_MIN, y1: yAt(X_MIN), x2: X_MAX, y2: yAt(X_MAX) }
  } else {
    const xAt = (y: number) => -(w.w0 + w.w2 * y) / w.w1
    return { x1: xAt(Y_MIN), y1: Y_MIN, x2: xAt(Y_MAX), y2: Y_MAX }
  }
}

/** Default learning rate. */
export const ETA = 0.4
