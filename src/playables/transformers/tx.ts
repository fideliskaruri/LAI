/**
 * Shared helpers for the Transformers chapter.
 *
 * One canonical 6-token toy sentence ("the cat sat on the mat"), an 8-dim
 * toy embedding bank, sinusoidal positional encodings, and pure functions
 * for scaled dot-product attention and the four "head pattern" archetypes
 * (next-token, previous-token, first-token, diagonal/identity). Every act
 * pulls from the same primitives so the model and the numbers stay
 * consistent across the chapter.
 *
 * Notation (follows MML §2 / Vaswani 2017):
 *   X     ∈ R^{N×d}              – token embeddings + positional encoding
 *   Q, K, V ∈ R^{N×d_k}          – linear projections of X
 *   A     = softmax(Q Kᵀ / √d_k) ∈ R^{N×N}
 *   Z     = A V                  – attention output
 */

export const VIEW_W = 600
export const VIEW_H = 480

/* ============================================================== */
/* The toy sentence                                                 */
/* ============================================================== */

export const TOKENS: string[] = ['the', 'cat', 'sat', 'on', 'the', 'mat']
export const N_TOKENS = TOKENS.length

/** Toy integer ids — vaguely BPE-ish, kept stable across acts. */
export const TOKEN_IDS: number[] = [791, 8415, 7731, 389, 279, 2603]

/* ============================================================== */
/* Embedding bank — 8-dim toy, hand-tuned                          */
/* ============================================================== */

export const D_EMBED = 8

/**
 * Hand-tuned 8-dim embeddings per token. The numbers are pretty rather
 * than learned; what matters is that distinct tokens get distinct vectors
 * and that "the" and " the" share a similar (but not identical) shape.
 */
export const EMBEDDINGS: number[][] = [
  // the
  [0.30, -0.10, 0.05, 0.40, -0.25, 0.10, 0.55, -0.15],
  // cat
  [0.85, 0.62, -0.10, 0.15, -0.40, 0.50, -0.20, 0.30],
  // sat
  [0.12, 0.78, 0.30, -0.40, 0.20, -0.10, 0.55, -0.30],
  // on
  [-0.20, 0.10, 0.45, 0.30, -0.55, 0.20, 0.05, 0.40],
  // the (again — note: very close to first "the", small drift)
  [0.32, -0.08, 0.04, 0.42, -0.27, 0.08, 0.57, -0.18],
  // mat
  [0.70, 0.40, 0.55, -0.20, 0.15, -0.30, 0.45, 0.10],
]

/* ============================================================== */
/* Sinusoidal positional encoding (Vaswani §3.5)                    */
/*                                                                  */
/*   PE(pos, 2i)   = sin( pos / 10000^{2i/d} )                      */
/*   PE(pos, 2i+1) = cos( pos / 10000^{2i/d} )                      */
/* ============================================================== */

export const MAX_PE_FREQ = 10000

/** A single positional encoding scalar at (pos, i). */
export function pe(pos: number, i: number, d: number = D_EMBED): number {
  const power = (2 * Math.floor(i / 2)) / d
  const denom = Math.pow(MAX_PE_FREQ, power)
  return i % 2 === 0 ? Math.sin(pos / denom) : Math.cos(pos / denom)
}

/** Whole d-dim positional encoding vector at one position. */
export function peVec(pos: number, d: number = D_EMBED): number[] {
  return Array.from({ length: d }, (_, i) => pe(pos, i, d))
}

/* ============================================================== */
/* Linear algebra primitives                                        */
/* ============================================================== */

/** Dot product. */
export function dot(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

/** Element-wise add. */
export function add(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i])
}

/** Softmax over a row of scores. Stable wrt large values. */
export function softmax(xs: number[]): number[] {
  const m = Math.max(...xs)
  const exps = xs.map((x) => Math.exp(x - m))
  const z = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / z)
}

/* ============================================================== */
/* Scaled dot-product attention (Vaswani Eq. 1)                     */
/* ============================================================== */

/**
 * Compute the attention pattern row for a single query token, given the
 * full Q and K matrices (rows = tokens, cols = d_k).
 */
export function attentionRow(
  Q: number[][],
  K: number[][],
  queryIndex: number,
  dK: number = Q[0].length,
): number[] {
  const scale = 1 / Math.sqrt(dK)
  const q = Q[queryIndex]
  const scores = K.map((k) => dot(q, k) * scale)
  return softmax(scores)
}

/**
 * Full N×N attention matrix.
 */
export function attentionMatrix(
  Q: number[][],
  K: number[][],
  dK: number = Q[0].length,
): number[][] {
  return Q.map((_, i) => attentionRow(Q, K, i, dK))
}

/* ============================================================== */
/* Toy Q, K, V projections                                          */
/*                                                                  */
/* The "projection matrices" Wq, Wk, Wv would normally be learned;  */
/* here we synthesise something that produces a plausible attention */
/* pattern for the sentence "the cat sat on the mat". Q biases on   */
/* the first half of the embedding; K on the second; V is identity. */
/* ============================================================== */

export const D_K = 4

/** Toy: take the first d_k dims, scale lightly. */
export function projectQ(x: number[]): number[] {
  return x.slice(0, D_K).map((v) => v * 1.1)
}

/** Toy: take the last d_k dims, scale lightly. */
export function projectK(x: number[]): number[] {
  return x.slice(D_EMBED - D_K).map((v) => v * 1.1)
}

/** Toy: identity projection for V. */
export function projectV(x: number[]): number[] {
  return [...x]
}

export function makeQKV(X: number[][]): {
  Q: number[][]
  K: number[][]
  V: number[][]
} {
  return {
    Q: X.map(projectQ),
    K: X.map(projectK),
    V: X.map(projectV),
  }
}

/* ============================================================== */
/* Head archetypes — four hand-baked patterns                       */
/*                                                                  */
/* For the multi-head act, we don't show genuinely learned heads.   */
/* Instead we show four illustrative archetypes that real heads     */
/* (in BERT, GPT, etc.) have been found to specialise in. Each is   */
/* a closed-form N×N matrix that sums to 1 along each row.          */
/* ============================================================== */

export type HeadId = 'diagonal' | 'previous' | 'next' | 'first'

export interface HeadDef {
  id: HeadId
  label: string
  short: string
  /** A one-line story about what real heads of this shape have been observed to do. */
  story: string
}

export const HEAD_DEFS: HeadDef[] = [
  {
    id: 'diagonal',
    label: 'Identity · self-attending',
    short: 'self',
    story: 'Each token attends to itself. Useful for preserving content through a block.',
  },
  {
    id: 'previous',
    label: 'Previous-token',
    short: 'prev',
    story: 'Each token attends to the token just before it. Picks up local context.',
  },
  {
    id: 'next',
    label: 'Next-token',
    short: 'next',
    story: 'Each token attends to the next token. Useful for syntactic continuation.',
  },
  {
    id: 'first',
    label: 'First-token (CLS-like)',
    short: 'first',
    story: 'Every token attends to the first token. The first slot becomes a summary.',
  },
]

/** Build an N×N attention matrix for one of the head archetypes. */
export function headPattern(head: HeadId, n: number = N_TOKENS): number[][] {
  const M: number[][] = []
  const eps = 0.05 // a little leak to neighbours, makes the visuals less stark
  for (let i = 0; i < n; i++) {
    const row = new Array(n).fill(eps / Math.max(1, n - 1))
    let target = i
    if (head === 'diagonal') target = i
    else if (head === 'previous') target = Math.max(0, i - 1)
    else if (head === 'next') target = Math.min(n - 1, i + 1)
    else if (head === 'first') target = 0
    // Concentrate mass on target.
    row[target] = 1 - eps + eps / Math.max(1, n - 1)
    // Renormalise to ensure rows sum to 1 exactly.
    const s = row.reduce((a, b) => a + b, 0)
    M.push(row.map((v) => v / s))
  }
  return M
}

/* ============================================================== */
/* Cross-attention — translation toy                                */
/* ============================================================== */

/**
 * EN→FR pseudo-translation. Used by the encoder-decoder walkthrough.
 * The "cross-attention" matrix says, for each step of the French output,
 * which English token the decoder is attending to. Hand-baked so the
 * pattern reads as "le · chat · est · sur · le · tapis".
 */
export const SRC_EN: string[] = ['the', 'cat', 'sat', 'on', 'the', 'mat']
export const TGT_FR: string[] = ['le', 'chat', 'était', 'sur', 'le', 'tapis']

/**
 * cross[i][j] = how much French output position i attends to English
 * source position j. Rows sum to 1.
 */
export function crossAttention(): number[][] {
  const M: number[][] = []
  const align = [0, 1, 2, 3, 4, 5] // a clean one-to-one alignment
  const n = TGT_FR.length
  for (let i = 0; i < n; i++) {
    const row = new Array(SRC_EN.length).fill(0)
    const target = align[i]
    // Mass concentrated on target; some leak to neighbours.
    for (let j = 0; j < SRC_EN.length; j++) {
      const d = Math.abs(j - target)
      row[j] = Math.exp(-d * 1.4)
    }
    const s = row.reduce((a, b) => a + b, 0)
    M.push(row.map((v) => v / s))
  }
  return M
}

/* ============================================================== */
/* Display helpers                                                  */
/* ============================================================== */

export const fmt2 = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)
export const fmt1 = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(1)

/** Map a value in [-1, 1] to a cream→vermilion fill opacity. */
export function vermilionAlpha(v: number, max: number = 1): number {
  return Math.max(0, Math.min(1, (v + max) / (2 * max)))
}

/** Map a value in [0, 1] directly to attention-cell alpha. */
export function attentionAlpha(v: number): number {
  return Math.max(0, Math.min(1, v)) * 0.85 + 0.05
}
