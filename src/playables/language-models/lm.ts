/**
 * Shared helpers for the Language Models chapter (PLAN §7.6).
 *
 * A tiny five-word vocabulary, a softmax, a temperature knob, the Kaplan
 * scaling curve, an emergence-style step-function family, and a few
 * pre-baked few-shot completions. Every helper is pure; no React.
 *
 * Notation:
 *   logits : ℝ^V — raw scores for each vocabulary item
 *   T      : > 0 — sampling temperature (1 = no rescaling)
 *   p_i    = exp(z_i / T) / Σ_j exp(z_j / T)
 */

export const VIEW_W = 600
export const VIEW_H = 480

/* ============================================================== */
/* Vocabulary + per-vocab logits for "the cat sat on the ___"     */
/* ============================================================== */

export type VocabId = 'mat' | 'dog' | 'end' | 'hat' | 'ball'

export interface VocabItem {
  id: VocabId
  word: string
  /** Raw logit produced by a tiny imagined LM. */
  logit: number
}

/** Five plausible (and one or two implausible) continuations. */
export const VOCAB: VocabItem[] = [
  { id: 'mat', word: 'mat', logit: 4.2 },
  { id: 'dog', word: 'dog', logit: 0.8 },
  { id: 'end', word: 'end', logit: 1.6 },
  { id: 'hat', word: 'hat', logit: 2.4 },
  { id: 'ball', word: 'ball', logit: 1.1 },
]

/* ============================================================== */
/* Softmax with temperature                                        */
/* ============================================================== */

/**
 * Temperature-scaled softmax. T > 1 flattens the distribution; T < 1
 * sharpens it. We subtract the max logit for numerical stability so this
 * is safe across the full UI range (T = 0.3 to T = 2.0).
 */
export function softmax(logits: number[], T = 1): number[] {
  const scaled = logits.map((z) => z / T)
  const m = Math.max(...scaled)
  const exps = scaled.map((z) => Math.exp(z - m))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

/** Entropy in bits of a discrete distribution. */
export function entropyBits(p: number[]): number {
  let H = 0
  for (const pi of p) if (pi > 0) H -= pi * Math.log2(pi)
  return H
}

export const fmt2 = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)
export const fmt1 = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(1)
export const pct = (p: number) => `${(p * 100).toFixed(1)}%`

/* ============================================================== */
/* Pretraining — a loss curve over training tokens                 */
/* ============================================================== */

/**
 * A stylised cross-entropy curve, bits-per-token vs. log-tokens.
 * Anchored so that 1e8 tokens ≈ 5.5 bits, 1e12 tokens ≈ 2.0 bits.
 * Shape: monotone-decreasing, asymptotic to an irreducible-loss floor.
 */
export function lossAtTokens(tokens: number): number {
  const t = Math.max(1, tokens)
  const logT = Math.log10(t)
  // 7.5 bits at logT = 6 (1M tokens), 2.0 at logT = 12 (1T tokens).
  const slope = (7.5 - 2.0) / (6 - 12)
  return Math.max(1.85, 7.5 + slope * (logT - 6))
}

export const PRETRAIN_LOG_T_MIN = 6 // 1e6 tokens
export const PRETRAIN_LOG_T_MAX = 12.5 // ~3e12 tokens

/* ============================================================== */
/* Kaplan scaling laws                                              */
/* ============================================================== */

/**
 * Kaplan et al. 2020 — loss as a function of model parameters N at
 * compute-optimal training. The classic fit is
 *
 *     L(N) = (N_c / N)^α_N
 *
 * with α_N ≈ 0.076 and N_c ≈ 8.8e13 (these are the original Kaplan
 * fit-constants; we render the same shape, the absolute calibration
 * has been simplified for display).
 */
export const KAPLAN_ALPHA = 0.076
export const KAPLAN_NC = 8.8e13

export function kaplanLoss(N: number): number {
  return Math.pow(KAPLAN_NC / Math.max(1, N), KAPLAN_ALPHA)
}

export const PARAMS_LOG_MIN = 6 // 1e6 params
export const PARAMS_LOG_MAX = 13 // 1e13 = 10T params

/** Chinchilla (Hoffmann et al. 2022): 20 training tokens per parameter. */
export const CHINCHILLA_TOKENS_PER_PARAM = 20

export function chinchillaTokens(N: number): number {
  return N * CHINCHILLA_TOKENS_PER_PARAM
}

/** Human-readable parameter-count formatting: 1.2B, 175B, 1.0T. */
export function fmtParams(N: number): string {
  if (N >= 1e12) return `${(N / 1e12).toFixed(1)}T`
  if (N >= 1e9) return `${(N / 1e9).toFixed(1)}B`
  if (N >= 1e6) return `${(N / 1e6).toFixed(0)}M`
  if (N >= 1e3) return `${(N / 1e3).toFixed(0)}K`
  return `${N}`
}

/** Human-readable token count: 200B tokens, 3T tokens, etc. */
export function fmtTokens(t: number): string {
  if (t >= 1e12) return `${(t / 1e12).toFixed(1)}T tokens`
  if (t >= 1e9) return `${(t / 1e9).toFixed(0)}B tokens`
  if (t >= 1e6) return `${(t / 1e6).toFixed(0)}M tokens`
  return `${t.toFixed(0)} tokens`
}

/* ============================================================== */
/* Emergence — capability vs scale                                  */
/* ============================================================== */

export interface EmergenceCurve {
  id: string
  label: string
  /** Roughly the log10(params) at which capability turns on. */
  thresholdLogN: number
  /** Steepness of the sigmoid transition. */
  steepness: number
  /** Maximum accuracy at large scale (asymptote). */
  ceiling: number
}

export const EMERGENCE_CURVES: EmergenceCurve[] = [
  {
    id: 'completion',
    label: 'Text completion',
    thresholdLogN: 7.5,
    steepness: 1.6,
    ceiling: 0.95,
  },
  {
    id: 'qa',
    label: 'Basic Q & A',
    thresholdLogN: 9.0,
    steepness: 1.8,
    ceiling: 0.88,
  },
  {
    id: 'instructions',
    label: 'Following instructions',
    thresholdLogN: 10.0,
    steepness: 2.4,
    ceiling: 0.85,
  },
  {
    id: 'arithmetic',
    label: 'Multi-digit arithmetic',
    thresholdLogN: 10.6,
    steepness: 3.0,
    ceiling: 0.7,
  },
  {
    id: 'cot',
    label: 'Chain-of-thought reasoning',
    thresholdLogN: 11.0,
    steepness: 3.4,
    ceiling: 0.7,
  },
  {
    id: 'agentic',
    label: 'Tool use / agentic',
    thresholdLogN: 11.8,
    steepness: 3.6,
    ceiling: 0.55,
  },
]

/** Sigmoid emergence: y(N) = ceiling / (1 + exp(-k (logN - threshold))). */
export function emergenceAccuracy(curve: EmergenceCurve, logN: number): number {
  const x = curve.steepness * (logN - curve.thresholdLogN)
  return curve.ceiling / (1 + Math.exp(-x))
}

/** Which capability label maps to a given parameter scale. */
export function capabilityAtScale(logN: number): string {
  if (logN < 8) return 'memorises n-grams; rambles on completion.'
  if (logN < 9) return 'completes coherent text; no instruction following.'
  if (logN < 10) return 'answers simple questions; arithmetic shaky.'
  if (logN < 10.6) return 'follows instructions; tool use is hit-and-miss.'
  if (logN < 11.2) return 'chain-of-thought reasoning emerges.'
  if (logN < 12) return 'reliable multi-step reasoning; coding.'
  return 'sustained agentic behaviour; planning across many steps.'
}

/* ============================================================== */
/* In-context learning — pre-baked few-shot examples               */
/* ============================================================== */

export type ShotDeck = 'animals' | 'countries' | 'math'

export interface FewShotExample {
  prompt: string
  examples: Array<{ q: string; a: string }>
  query: string
  expected: string
}

export const FEW_SHOT_DECKS: Record<ShotDeck, FewShotExample> = {
  animals: {
    prompt: 'French to English, one word at a time.',
    examples: [
      { q: 'fr: chien', a: 'en: dog' },
      { q: 'fr: chat', a: 'en: cat' },
    ],
    query: 'fr: oiseau',
    expected: 'en: bird',
  },
  countries: {
    prompt: 'Capital cities.',
    examples: [
      { q: 'France', a: 'Paris' },
      { q: 'Japan', a: 'Tokyo' },
    ],
    query: 'Brazil',
    expected: 'Brasília',
  },
  math: {
    prompt: 'Double the number.',
    examples: [
      { q: '3', a: '6' },
      { q: '7', a: '14' },
    ],
    query: '11',
    expected: '22',
  },
}

/* ============================================================== */
/* Instruction tuning — paired completions                          */
/* ============================================================== */

export interface CompletionPair {
  prompt: string
  base: string[]
  tuned: string[]
}

export const PHOTOSYNTHESIS_COMPLETION: CompletionPair = {
  prompt: 'Explain photosynthesis to a 10-year-old.',
  base: [
    'Explain photosynthesis to a 10-year-old.',
    'Explain photosynthesis to a 12-year-old.',
    'Explain mitosis to a 10-year-old.',
    'Explain the water cycle to a 10-year-old.',
    'Explain gravity to a 10-year-old.',
    '— from "Common biology questions, vol. 3."',
  ],
  tuned: [
    'Plants are like tiny solar-powered kitchens.',
    'They take three free ingredients — sunlight, water,',
    'and the carbon dioxide you breathe out — and use them',
    'to make sugar, which is their food. The leftover bit',
    'is oxygen, which they puff back into the air. That is',
    'why a forest feels easier to breathe in.',
  ],
}

/* ============================================================== */
/* Closing constellation — 2020s models                             */
/* ============================================================== */

export interface ModelStop {
  id: string
  label: string
  year: number
  params: number
  /** Brief vendor / lab tag for the tooltip line. */
  lab: string
}

export const MODEL_CONSTELLATION: ModelStop[] = [
  { id: 'gpt3', label: 'GPT-3', year: 2020, params: 175e9, lab: 'OpenAI' },
  { id: 'codex', label: 'Codex', year: 2021, params: 12e9, lab: 'OpenAI' },
  { id: 'chinchilla', label: 'Chinchilla', year: 2022, params: 70e9, lab: 'DeepMind' },
  { id: 'palm', label: 'PaLM', year: 2022, params: 540e9, lab: 'Google' },
  { id: 'chatgpt', label: 'ChatGPT', year: 2022, params: 175e9, lab: 'OpenAI' },
  { id: 'gpt4', label: 'GPT-4', year: 2023, params: 1.0e12, lab: 'OpenAI' },
  { id: 'claude', label: 'Claude', year: 2023, params: 80e9, lab: 'Anthropic' },
  { id: 'llama2', label: 'Llama 2', year: 2023, params: 70e9, lab: 'Meta' },
  { id: 'gemini', label: 'Gemini', year: 2023, params: 1.5e12, lab: 'Google' },
  { id: 'claude3', label: 'Claude 3', year: 2024, params: 5e11, lab: 'Anthropic' },
  { id: 'llama3', label: 'Llama 3', year: 2024, params: 405e9, lab: 'Meta' },
  { id: 'gpt4o', label: 'GPT-4o', year: 2024, params: 1.2e12, lab: 'OpenAI' },
]

/* ============================================================== */
/* Pretraining corpus — short scrolling slab                        */
/* ============================================================== */

export const PRETRAIN_CORPUS: string[] = [
  'In 1848 Claude Shannon was twelve years old.',
  'function softmax(logits, T) { return logits.map(z => Math.exp(z / T)); }',
  'The capital of France is Paris.',
  'BREAKING — markets fell on Thursday as the Federal Reserve signalled a pause.',
  'def fibonacci(n): return n if n < 2 else fibonacci(n-1) + fibonacci(n-2)',
  'Yesterday upon the stair I met a man who wasn’t there.',
  'For each i in 1..N, accumulate the gradient and step the parameters.',
  'The mitochondria, often called the powerhouse of the cell,',
  '<html><head><title>Welcome</title></head><body><h1>Hello, world.</h1></body></html>',
  'In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole,',
  '@misc{shannon1948, author = {Shannon, C. E.}, title = {A Mathematical Theory of Communication}, year = {1948}}',
  'The quick brown fox jumps over the lazy dog.',
  'Pour faire la mayonnaise, il faut un jaune d’œuf, une cuillere de moutarde,',
  'Two roads diverged in a yellow wood, and sorry I could not travel both',
  'SELECT user_id, COUNT(*) FROM events WHERE event_type = ‘click’ GROUP BY user_id;',
  'Newton, twenty-three, was sent home from Cambridge by the plague.',
  'console.log("the loss is now " + loss.toFixed(4));',
  'Wikipedia is a free, multilingual, online encyclopedia written and maintained',
  'On the origin of species by means of natural selection, or the preservation',
  'def attention(q, k, v): return softmax(q @ k.T / sqrt(d)) @ v',
]
