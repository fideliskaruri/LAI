/**
 * Shared MLP helpers for the Backprop chapter.
 *
 * A tiny 2 -> 3 -> 1 network with sigmoid activations on both layers, used
 * throughout the chapter so the geometry and the numbers stay consistent
 * across acts. All helpers are pure and side-effect free.
 *
 * Notation matches §7.6 of the plan:
 *   x  ∈ R^2     -- input
 *   W  ∈ R^{3x2} -- input → hidden weights, plus b ∈ R^3 bias
 *   h  = σ(Wx + b)
 *   V  ∈ R^{1x3} -- hidden → output weights, plus c ∈ R   bias
 *   y  = σ(Vh + c)
 *   L  = ½ (y − t)^2   -- MSE on one example
 *
 * Gradients (chain rule, sigmoid derivative σ'(z) = σ(z)(1 − σ(z))):
 *   dL/dy = y − t
 *   dL/dz_out = dL/dy · y(1 − y)
 *   dL/dV     = dL/dz_out · h^T
 *   dL/dc     = dL/dz_out
 *   dL/dh     = dL/dz_out · V^T
 *   dL/dz_hid = dL/dh ⊙ h(1 − h)
 *   dL/dW     = dL/dz_hid · x^T
 *   dL/db     = dL/dz_hid
 */

export const VIEW_W = 600
export const VIEW_H = 480

/** Input dimension. */
export const N_IN = 2
/** Hidden layer width. */
export const N_HID = 3
/** Output dimension. */
export const N_OUT = 1

export interface MlpParams {
  /** Input → hidden weights, row i is the weight vector for h_i (length 2). */
  W: number[][] // 3 x 2
  /** Hidden biases (length 3). */
  b: number[]
  /** Hidden → output weights (length 3, since output is scalar). */
  V: number[]
  /** Output bias (scalar). */
  c: number
}

export interface Forward {
  x: number[] // length 2
  zh: number[] // hidden pre-activations (length 3)
  h: number[] // hidden activations (length 3)
  zo: number // output pre-activation (scalar)
  y: number // output activation (scalar)
}

export interface Grads {
  /** Gradient wrt output (dL/dy). */
  dy: number
  /** Gradient wrt output pre-activation (dL/dz_o). */
  dzo: number
  /** Gradient wrt hidden activations h (length 3). */
  dh: number[]
  /** Gradient wrt hidden pre-activations (length 3). */
  dzh: number[]
  /** Gradient wrt V (length 3). */
  dV: number[]
  /** Gradient wrt c (scalar). */
  dc: number
  /** Gradient wrt W (3 x 2). */
  dW: number[][]
  /** Gradient wrt b (length 3). */
  db: number[]
}

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))
export const dSigmoid = (s: number) => s * (1 - s)

/**
 * Deterministic illustrative parameters used by the static acts (hidden
 * layers / forward pass / loss / chain rule / reverse mode). Hand-picked so
 * the numbers are readable, not so they solve any task.
 */
export const ILLUSTRATIVE_PARAMS: MlpParams = {
  W: [
    [1.4, -0.8],
    [-1.2, 1.6],
    [0.9, 1.1],
  ],
  b: [0.2, -0.1, -0.3],
  V: [1.2, -1.0, 0.8],
  c: 0.1,
}

/** Forward pass on one example. */
export function forward(p: MlpParams, x: number[]): Forward {
  const zh = new Array(N_HID).fill(0)
  const h = new Array(N_HID).fill(0)
  for (let i = 0; i < N_HID; i++) {
    zh[i] = p.W[i][0] * x[0] + p.W[i][1] * x[1] + p.b[i]
    h[i] = sigmoid(zh[i])
  }
  let zo = p.c
  for (let i = 0; i < N_HID; i++) zo += p.V[i] * h[i]
  const y = sigmoid(zo)
  return { x, zh, h, zo, y }
}

/** Mean-squared-error loss for one example (½ for tidy gradients). */
export function mse(y: number, target: number): number {
  return 0.5 * (y - target) ** 2
}

/** Full reverse-mode pass producing every gradient at once. */
export function backward(p: MlpParams, f: Forward, target: number): Grads {
  const dy = f.y - target // dL/dy for ½(y−t)²
  const dzo = dy * dSigmoid(f.y) // dL/dz_o
  const dV = new Array(N_HID).fill(0)
  for (let i = 0; i < N_HID; i++) dV[i] = dzo * f.h[i]
  const dc = dzo

  const dh = new Array(N_HID).fill(0)
  for (let i = 0; i < N_HID; i++) dh[i] = dzo * p.V[i]
  const dzh = new Array(N_HID).fill(0)
  for (let i = 0; i < N_HID; i++) dzh[i] = dh[i] * dSigmoid(f.h[i])

  const dW: number[][] = []
  for (let i = 0; i < N_HID; i++) dW.push([dzh[i] * f.x[0], dzh[i] * f.x[1]])
  const db = dzh.slice()
  return { dy, dzo, dh, dzh, dV, dc, dW, db }
}

/** Apply one SGD step in-place-free fashion: returns new params. */
export function sgdStep(p: MlpParams, g: Grads, eta: number): MlpParams {
  const W = p.W.map((row, i) => [row[0] - eta * g.dW[i][0], row[1] - eta * g.dW[i][1]])
  const b = p.b.map((v, i) => v - eta * g.db[i])
  const V = p.V.map((v, i) => v - eta * g.dV[i])
  const c = p.c - eta * g.dc
  return { W, b, V, c }
}

export const fmt2 = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)
export const fmt3 = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(3)

/** The four XOR examples — the dataset the perceptron couldn't solve. */
export const XOR_DATA: { x: [number, number]; t: number }[] = [
  { x: [0, 0], t: 0 },
  { x: [0, 1], t: 1 },
  { x: [1, 0], t: 1 },
  { x: [1, 1], t: 0 },
]

/** Total loss across XOR for a given parameter set. */
export function xorLoss(p: MlpParams): number {
  let L = 0
  for (const ex of XOR_DATA) {
    const f = forward(p, ex.x)
    L += mse(f.y, ex.t)
  }
  return L
}

/** Initialise weights from a deterministic LCG so demos reproduce. */
let SEED = 0x9e3779b9
function lcg(): number {
  SEED = (SEED * 1664525 + 1013904223) & 0x7fffffff
  return SEED / 0x7fffffff
}
export function reseed(seed: number) {
  SEED = seed
}
export function randomParams(scale = 1.5): MlpParams {
  const r = () => (lcg() * 2 - 1) * scale
  return {
    W: [
      [r(), r()],
      [r(), r()],
      [r(), r()],
    ],
    b: [r(), r(), r()],
    V: [r(), r(), r()],
    c: r(),
  }
}

/** Training step over all 4 XOR examples (batch gradient). */
export function xorBatchStep(p: MlpParams, eta: number): { params: MlpParams; loss: number } {
  // Accumulate gradients across all 4 examples.
  let totalLoss = 0
  const acc: Grads = {
    dy: 0,
    dzo: 0,
    dh: [0, 0, 0],
    dzh: [0, 0, 0],
    dV: [0, 0, 0],
    dc: 0,
    dW: [
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    db: [0, 0, 0],
  }
  for (const ex of XOR_DATA) {
    const f = forward(p, ex.x)
    totalLoss += mse(f.y, ex.t)
    const g = backward(p, f, ex.t)
    for (let i = 0; i < N_HID; i++) {
      acc.dV[i] += g.dV[i]
      acc.dW[i][0] += g.dW[i][0]
      acc.dW[i][1] += g.dW[i][1]
      acc.db[i] += g.db[i]
    }
    acc.dc += g.dc
  }
  return { params: sgdStep(p, acc, eta), loss: totalLoss }
}

/** Predict y in [0,1] for a given (x1, x2). */
export function predict(p: MlpParams, x1: number, x2: number): number {
  return forward(p, [x1, x2]).y
}
