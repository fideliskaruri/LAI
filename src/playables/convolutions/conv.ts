/**
 * Shared helpers for the Convolutions chapter.
 *
 * A small hand-drawn 12×12 grayscale "digit 3" image, a 3×3 kernel library,
 * and pure functions for the convolution and 2×2 max-pool operations. Every
 * act in the chapter pulls from the same image and the same kernel bank so
 * the geometry stays consistent across the eight acts.
 *
 * Notation:
 *   img   ∈ R^{H×W}       – grayscale intensities in [0, 1]
 *   K     ∈ R^{kH×kW}     – kernel (3×3 here)
 *   conv  out_{i,j} = Σ_{u,v} K_{u,v} · img_{i+u, j+v}
 *
 * Output is "valid" (no padding), so an HxW input with a kxk kernel produces
 * an (H−k+1)x(W−k+1) feature map.
 */

export const VIEW_W = 600
export const VIEW_H = 480

/** Image grid size used throughout the chapter. */
export const IMG_SIZE = 12

/* ============================================================== */
/* The image — a small hand-drawn "3" on a 12x12 grid              */
/* ============================================================== */

// 12x12, values in [0, 1]. 0 = paper, 1 = ink. Drawn by hand to read as a "3".
// prettier-ignore
const RAW_THREE: number[][] = [
  [0.0,0.0,0.0,0.1,0.4,0.7,0.8,0.7,0.4,0.0,0.0,0.0],
  [0.0,0.0,0.2,0.6,0.9,1.0,1.0,1.0,0.9,0.6,0.1,0.0],
  [0.0,0.0,0.3,0.5,0.2,0.0,0.0,0.4,0.9,0.9,0.3,0.0],
  [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.6,1.0,0.8,0.2,0.0],
  [0.0,0.0,0.0,0.0,0.0,0.2,0.7,1.0,0.9,0.3,0.0,0.0],
  [0.0,0.0,0.0,0.0,0.3,0.8,1.0,0.9,0.5,0.0,0.0,0.0],
  [0.0,0.0,0.0,0.0,0.3,0.7,1.0,0.9,0.5,0.0,0.0,0.0],
  [0.0,0.0,0.0,0.0,0.0,0.0,0.2,0.7,1.0,0.6,0.1,0.0],
  [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.3,0.9,0.9,0.4,0.0],
  [0.0,0.0,0.4,0.5,0.0,0.0,0.3,0.8,1.0,0.7,0.2,0.0],
  [0.0,0.0,0.2,0.7,0.9,1.0,1.0,0.9,0.5,0.1,0.0,0.0],
  [0.0,0.0,0.0,0.1,0.4,0.6,0.6,0.4,0.1,0.0,0.0,0.0],
]

export const IMAGE_THREE: number[][] = RAW_THREE

/* ============================================================== */
/* Kernel library — four classic 3×3 detectors                    */
/* ============================================================== */

export type KernelId = 'edge-vertical' | 'edge-horizontal' | 'blur' | 'sharpen'

export interface NamedKernel {
  id: KernelId
  name: string
  short: string
  K: number[][]
  /** Pretty bias to align feature-map range to [0,1] for display. */
  bias?: number
  /** Multiplier applied to the raw convolution output before clamping. */
  scale?: number
}

export const KERNELS: NamedKernel[] = [
  {
    id: 'edge-vertical',
    name: 'Sobel · vertical edges',
    short: 'vertical edges',
    K: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ],
    bias: 0.5,
    scale: 0.18,
  },
  {
    id: 'edge-horizontal',
    name: 'Sobel · horizontal edges',
    short: 'horizontal edges',
    K: [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ],
    bias: 0.5,
    scale: 0.18,
  },
  {
    id: 'blur',
    name: 'Box blur',
    short: 'blur',
    K: [
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
    ],
    scale: 1,
  },
  {
    id: 'sharpen',
    name: 'Sharpen',
    short: 'sharpen',
    K: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
    scale: 1,
  },
]

export const KERNEL_BY_ID: Record<KernelId, NamedKernel> = Object.fromEntries(
  KERNELS.map((k) => [k.id, k]),
) as Record<KernelId, NamedKernel>

/* ============================================================== */
/* Pure ops                                                         */
/* ============================================================== */

/** Compute one output pixel of a valid convolution at (row, col). */
export function convAt(img: number[][], K: number[][], row: number, col: number): number {
  const kH = K.length
  const kW = K[0].length
  let s = 0
  for (let u = 0; u < kH; u++) {
    for (let v = 0; v < kW; v++) {
      s += K[u][v] * img[row + u][col + v]
    }
  }
  return s
}

/** Valid convolution producing the full feature map. */
export function convolve(img: number[][], K: number[][]): number[][] {
  const H = img.length
  const W = img[0].length
  const kH = K.length
  const kW = K[0].length
  const outH = H - kH + 1
  const outW = W - kW + 1
  const out: number[][] = []
  for (let r = 0; r < outH; r++) {
    const row: number[] = []
    for (let c = 0; c < outW; c++) row.push(convAt(img, K, r, c))
    out.push(row)
  }
  return out
}

/** Normalise a feature map for display: scale + bias, clamped to [0, 1]. */
export function presentFeatureMap(
  raw: number[][],
  scale: number = 1,
  bias: number = 0,
): number[][] {
  return raw.map((row) => row.map((v) => Math.max(0, Math.min(1, v * scale + bias))))
}

/** 2×2 max-pool with stride 2. Returns ceil(H/2) x ceil(W/2). */
export function maxPool2x2(map: number[][]): number[][] {
  const H = map.length
  const W = map[0].length
  const oH = Math.floor(H / 2)
  const oW = Math.floor(W / 2)
  const out: number[][] = []
  for (let r = 0; r < oH; r++) {
    const row: number[] = []
    for (let c = 0; c < oW; c++) {
      const a = map[2 * r][2 * c]
      const b = map[2 * r][2 * c + 1]
      const cc = map[2 * r + 1][2 * c]
      const d = map[2 * r + 1][2 * c + 1]
      row.push(Math.max(a, b, cc, d))
    }
    out.push(row)
  }
  return out
}

export const fmt2 = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)
export const fmt1 = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(1)

/** Map a value in [0, 1] to a CSS color for pixel rendering. */
export function pixelFill(v: number): string {
  // Cream → ink ramp. v=0 → cream paper; v=1 → near-black ink.
  const c = Math.round(255 - v * 220)
  return `rgb(${c}, ${c - 8}, ${c - 16})`
}

/** Vermilion-tinted ramp for feature maps. */
export function featureFill(v: number): string {
  // v=0 cream, v=1 saturated vermilion.
  const r = Math.round(248 - v * 50)
  const g = Math.round(238 - v * 170)
  const b = Math.round(225 - v * 180)
  return `rgb(${r}, ${g}, ${b})`
}
