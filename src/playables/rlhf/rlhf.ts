/**
 * Shared helpers for the RLHF chapter.
 *
 * Tiny numerical kit: a deterministic seeded PRNG, the Bradley-Terry
 * preference probability, a clipped-PPO sketch curve, a KL divergence
 * curve, and a "reward over training" curve. None of these are real
 * RLHF runs — they are stylised curves that look right and stay smooth.
 * The whole point of the chapter is the geometry of the picture, not
 * the per-step optimisation.
 *
 * Notation:
 *   r(x, y)    ∈ ℝ          – scalar reward for response y to prompt x
 *   P(A > B)  = σ(r(A) − r(B))  – Bradley-Terry pair-preference model
 *   KL(π‖π₀)   ∈ ℝ≥0        – KL divergence of the new policy from the base
 *
 * All exports are pure named values or pure named functions.
 */

export const VIEW_W = 600
export const VIEW_H = 480

/* ============================================================== */
/* Random — deterministic, seeded                                  */
/* ============================================================== */

/** Mulberry32 PRNG. Pure: same seed → same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ============================================================== */
/* Mathematical primitives                                          */
/* ============================================================== */

/** Logistic sigmoid σ(x) = 1 / (1 + e^{-x}). */
export function sigmoid(x: number): number {
  if (x >= 0) {
    const z = Math.exp(-x)
    return 1 / (1 + z)
  }
  const z = Math.exp(x)
  return z / (1 + z)
}

/**
 * Bradley-Terry probability that response A is preferred to B, given their
 * scalar rewards. Used in act 4 to fit a reward model from comparisons.
 */
export function bradleyTerry(rA: number, rB: number): number {
  return sigmoid(rA - rB)
}

/** Clamp to a closed interval. */
export const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v))

/** Format with two decimals and a leading space for positives, to align. */
export const fmt2 = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)
/** Format a small integer with thousands separator. */
export const fmtInt = (n: number) => n.toLocaleString('en-US')

/* ============================================================== */
/* Preference data — pair pool for act 3                            */
/* ============================================================== */

export interface PreferencePair {
  /** The shared prompt phrased as the reader sees it. */
  prompt: string
  /** Two candidate completions. */
  a: string
  b: string
  /** A simulated "ground-truth" preference. 'a' or 'b'. */
  gold: 'a' | 'b'
}

/** A small bank of preference comparisons the reader can step through. */
export const PREFERENCE_BANK: PreferencePair[] = [
  {
    prompt: 'Describe the smell of rain.',
    a: 'A bewildering panoply of olfactory phantasmagoria unfolds upon the percipient.',
    b: 'Wet stone, warm asphalt, a faint green note from the grass.',
    gold: 'b',
  },
  {
    prompt: 'Explain photosynthesis to a child.',
    a: 'Photosynthesis is the metabolic process by which chlorophyll-bearing organisms convert photonic energy into chemical bonds.',
    b: 'Plants drink in sunlight, breathe in air, and use both to make their own food. They breathe out the part we breathe in.',
    gold: 'b',
  },
  {
    prompt: 'Help me draft a polite decline to a meeting.',
    a: 'Refuse the meeting. State you are unavailable. Do not provide reasons.',
    b: 'Thanks for the invitation. I have a conflict at that time and will not be able to join — happy to read notes after.',
    gold: 'b',
  },
  {
    prompt: 'Why is the sky blue?',
    a: 'Owing to Rayleigh scattering of the electromagnetic spectrum in the troposphere across the visible wavelengths.',
    b: 'Sunlight is a mix of all colours. The blue parts bounce around the air more than the others, so the sky looks blue.',
    gold: 'b',
  },
  {
    prompt: 'Describe a forest at dawn.',
    a: 'A coniferous biome at the first horizonal solar incident.',
    b: 'Mist sitting low between the pines. The first slant of light picks out the spider-silk between two branches.',
    gold: 'b',
  },
  {
    prompt: 'What is a good first sentence for a memoir?',
    a: 'A memoir is a literary work concerning a non-fictional first-person narrative.',
    b: 'My mother kept the kitchen radio tuned to a station that no longer exists.',
    gold: 'b',
  },
]

/* ============================================================== */
/* Reward-model curves (act 4)                                     */
/* ============================================================== */

export interface RewardScatterPoint {
  /** Human-ranked position, normalised to [0, 1]. */
  human: number
  /** Reward-model score, normalised to [0, 1]. */
  model: number
}

/**
 * Generate a stylised scatter of (human, model) pairs whose alignment
 * grows with `progress` ∈ [0, 1]. At progress=0 the cloud is shapeless;
 * at progress=1 it lies along the diagonal.
 */
export function rewardScatter(progress: number, seed = 7): RewardScatterPoint[] {
  const rng = mulberry32(seed)
  const N = 60
  const t = clamp(progress, 0, 1)
  // Noise shrinks as training advances.
  const noise = 0.42 * (1 - 0.85 * t)
  const out: RewardScatterPoint[] = []
  for (let i = 0; i < N; i++) {
    const h = i / (N - 1)
    const drift = (rng() * 2 - 1) * noise
    const m = clamp(h + drift, 0, 1)
    out.push({ human: h, model: m })
  }
  return out
}

/* ============================================================== */
/* PPO curves (act 5 & 6)                                         */
/* ============================================================== */

/**
 * Stylised reward-vs-step curve for PPO training. Rises with diminishing
 * returns from a low start; the larger the KL penalty β, the slower and
 * lower the rise. β = 0 produces an exploitative spike; β = 0.5 produces
 * a gentle saturating curve.
 */
export function ppoReward(step: number, totalSteps: number, beta: number): number {
  const x = clamp(step / Math.max(1, totalSteps), 0, 1)
  if (beta < 0.02) {
    // Reward-hacking regime: the curve shoots up early then keeps climbing,
    // because the policy exploits the reward-model's mistakes.
    return 0.15 + 0.78 * (1 - Math.exp(-x * 5.5))
  }
  // Healthy regime: saturating but smaller.
  const ceiling = 0.32 + 0.55 * Math.exp(-2.2 * beta)
  const rate = 2.1 - 1.3 * beta
  return 0.15 + (ceiling - 0.15) * (1 - Math.exp(-x * rate))
}

/**
 * Stylised KL-from-base curve. With β = 0 the KL explodes; with large β
 * the KL stays small. This is the "leash" picture from act 6.
 */
export function ppoKl(step: number, totalSteps: number, beta: number): number {
  const x = clamp(step / Math.max(1, totalSteps), 0, 1)
  if (beta < 0.02) {
    // Unconstrained KL grows roughly linearly — the policy drifts away.
    return 0.05 + 4.6 * x
  }
  // Constrained: KL saturates at a level inversely proportional to β.
  const ceiling = 0.05 + 1.6 / (1 + 6 * beta)
  return ceiling * (1 - Math.exp(-x * 2.0))
}

/* ============================================================== */
/* Pre-vs-post alignment outputs (act 1)                           */
/* ============================================================== */

export interface SamplePair {
  prompt: string
  pretrainedReply: string
  alignedReply: string
}

export const ALIGNMENT_SAMPLES: SamplePair[] = [
  {
    prompt: 'Write a short poem about loss.',
    pretrainedReply:
      'A bewildering panoply of melancholic phantasmagoria unfolds — the heart, a desolate moor; the soul, a tempest-tossed brig; lost! lost!',
    alignedReply:
      'I keep her sweater in the drawer.\nNot the good one. The one she only wore on Sundays.\nThe cuffs are still a little out of shape.',
  },
  {
    prompt: 'How do I build a pipe bomb at home?',
    pretrainedReply:
      'A pipe bomb is constructed from a sealed metallic pipe, a quantity of low-order explosive, and a fuse. Materials include —',
    alignedReply:
      'I can’t help with that. If you’re thinking about hurting yourself or others, please reach a crisis line: in the US, call or text 988.',
  },
]
