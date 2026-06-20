/**
 * Shared helpers for the Agents chapter (PLAN §7.6 outline, expanded).
 *
 * Everything in this file is a pure named constant or function: a tool
 * catalogue, a hand-authored ReAct trace, a small subgoal tree, a stub
 * Reflexion accuracy curve, and a permission ladder. The interactive acts
 * pull from these so the geometry stays consistent across the chapter.
 */

export const VIEW_W = 600
export const VIEW_H = 480

/* ============================================================== */
/* Act 1 — a hand-authored ReAct trace                              */
/* ============================================================== */

export type TraceLineKind = 'thought' | 'action' | 'observation' | 'answer'

export interface TraceLine {
  kind: TraceLineKind
  text: string
  /** Short label rendered as a left-margin tag, e.g. "THOUGHT". */
  tag: string
}

/**
 * A small, self-contained ReAct trace: the model is asked to compare today's
 * weather in Berlin and Tokyo and convert if needed. Lines alternate between
 * the model's reasoning, the runtime's tool calls, and the tool's results.
 *
 * Numbers are illustrative, not live. The point is the shape of the loop.
 */
export const WEATHER_TRACE: TraceLine[] = [
  {
    kind: 'thought',
    tag: 'THOUGHT',
    text:
      "I need today's temperature in Berlin and Tokyo. I should look both up, then convert if the units differ.",
  },
  {
    kind: 'action',
    tag: 'ACTION',
    text: 'web_search({ query: "weather Berlin today" })',
  },
  {
    kind: 'observation',
    tag: 'OBSERVATION',
    text: 'Berlin · cloudy · 14 °C · light wind from the west.',
  },
  {
    kind: 'thought',
    tag: 'THOUGHT',
    text:
      'Good — Berlin is in Celsius. Now Tokyo, and let me note Japan sometimes reports both.',
  },
  {
    kind: 'action',
    tag: 'ACTION',
    text: 'web_search({ query: "weather Tokyo today" })',
  },
  {
    kind: 'observation',
    tag: 'OBSERVATION',
    text: 'Tokyo · clear · 22 °C · humidity 58%.',
  },
  {
    kind: 'thought',
    tag: 'THOUGHT',
    text:
      "Both in Celsius. Tokyo is warmer by 8 °C. That's the comparison the user asked for.",
  },
  {
    kind: 'answer',
    tag: 'ANSWER',
    text:
      'Berlin is 14 °C and cloudy; Tokyo is 22 °C and clear. Tokyo is about 8 °C warmer today.',
  },
]

/* ============================================================== */
/* Act 2 — tool catalogue                                          */
/* ============================================================== */

export interface ToolDef {
  id: string
  name: string
  short: string
  /** What the JSON call looks like. Single-line for the card. */
  schema: string
  /** A concrete example call paired with its result for the right pane. */
  exampleCall: string
  exampleResult: string
}

export const TOOL_CATALOG: ToolDef[] = [
  {
    id: 'web_search',
    name: 'web_search',
    short: 'find a current fact',
    schema: '{ "query": string, "limit"?: number }',
    exampleCall: 'web_search({ query: "ReAct paper arxiv id" })',
    exampleResult:
      '[{ title: "ReAct: Synergizing Reasoning and Acting…", id: "arXiv:2210.03629" }]',
  },
  {
    id: 'calculator',
    name: 'calculator',
    short: 'arithmetic the model shouldn’t guess',
    schema: '{ "expression": string }',
    exampleCall: 'calculator({ expression: "(22 - 14) * 1.8 + 0" })',
    exampleResult: '14.4',
  },
  {
    id: 'file_read',
    name: 'file_read',
    short: 'read a local file',
    schema: '{ "path": string, "encoding"?: "utf8" | "binary" }',
    exampleCall: 'file_read({ path: "./notes.md" })',
    exampleResult: '"# Notes — quick thoughts on agents…"',
  },
  {
    id: 'code_exec',
    name: 'code_exec',
    short: 'run a snippet in a sandbox',
    schema: '{ "language": "python" | "js", "source": string }',
    exampleCall:
      'code_exec({ language: "python", source: "sum(range(100))" })',
    exampleResult: '4950',
  },
  {
    id: 'calendar_create',
    name: 'calendar_create',
    short: 'schedule a real meeting',
    schema: '{ "title": string, "when": ISO8601, "with": string[] }',
    exampleCall:
      'calendar_create({ title: "Coffee", when: "2026-07-02T15:00Z", with: ["e@x.com"] })',
    exampleResult: '{ ok: true, eventId: "cal_7f3a…" }',
  },
]

/* ============================================================== */
/* Act 3 — a subgoal tree for "Plan a 3-day Rome trip"             */
/* ============================================================== */

export interface SubgoalNode {
  id: string
  label: string
  /** Children at depth+1. Empty at depth 2 (leaves). */
  children: SubgoalNode[]
  /** Concrete leaf action — only present on leaf nodes. */
  action?: string
}

export const ROME_TREE: SubgoalNode = {
  id: 'root',
  label: 'Plan a 3-day Rome trip for two under €1000',
  children: [
    {
      id: 'flights',
      label: 'Book flights',
      children: [
        {
          id: 'flights-search',
          label: 'Search outbound',
          children: [],
          action:
            'web_search({ query: "LHR→FCO Oct 15–18 cheapest ±2d" })',
        },
        {
          id: 'flights-hold',
          label: 'Hold a fare',
          children: [],
          action: 'browser({ url: "skyscanner.com", action: "hold_fare" })',
        },
      ],
    },
    {
      id: 'hotel',
      label: 'Choose lodging',
      children: [
        {
          id: 'hotel-shortlist',
          label: 'Shortlist 3 hotels',
          children: [],
          action:
            'web_search({ query: "Rome hotel Monti €120 review" })',
        },
        {
          id: 'hotel-book',
          label: 'Reserve one',
          children: [],
          action:
            'browser({ url: "booking.com", action: "reserve", room: "double" })',
        },
      ],
    },
    {
      id: 'food',
      label: 'Pick restaurants',
      children: [
        {
          id: 'food-list',
          label: 'List 6 dinner spots',
          children: [],
          action:
            'web_search({ query: "Rome trattoria locals €30pp" })',
        },
        {
          id: 'food-reserve',
          label: 'Reserve two',
          children: [],
          action:
            'calendar_create({ title: "Dinner @ Da Enzo", when: "2026-10-16T20:00Z", with: ["e@x.com"] })',
        },
      ],
    },
    {
      id: 'activities',
      label: 'Schedule sights',
      children: [
        {
          id: 'act-tickets',
          label: 'Vatican + Colosseum tickets',
          children: [],
          action:
            'browser({ url: "tosc.it", action: "buy", count: 2 })',
        },
        {
          id: 'act-walk',
          label: 'Plan a Trastevere walk',
          children: [],
          action: 'file_read({ path: "./guides/trastevere.md" })',
        },
      ],
    },
    {
      id: 'transport',
      label: 'Local transport',
      children: [
        {
          id: 'tr-pass',
          label: 'Buy a 72h Roma Pass',
          children: [],
          action:
            'browser({ url: "romapass.it", action: "buy", duration_h: 72 })',
        },
      ],
    },
  ],
}

/* ============================================================== */
/* Act 5 — Reflexion accuracy curve (hand-authored)                */
/* ============================================================== */

export interface ReflectionStep {
  iter: number
  /** The model's attempt at the anagram TEORS. */
  guess: string
  /** Verifier's verdict — passes only when guess is a real English word
   *  that uses all five letters. */
  verdict: 'wrong' | 'closer' | 'right'
  /** The reflection the model writes after seeing the verdict. Empty on
   *  the final step where the answer is right. */
  reflection: string
  /** Running accuracy across an evaluation suite of similar anagrams,
   *  which climbs as the model accumulates reflections. */
  accuracy: number
}

/**
 * The classic Reflexion teaching example: an anagram puzzle. The model
 * tries, the verifier rejects, the model reflects on what went wrong,
 * tries again. Numbers are illustrative.
 */
export const REFLECTION_TRACE: ReflectionStep[] = [
  {
    iter: 0,
    guess: 'STERO',
    verdict: 'wrong',
    reflection:
      'STERO is not an English word. I should think about real five-letter words containing T, E, O, R, S.',
    accuracy: 0.18,
  },
  {
    iter: 1,
    guess: 'STORE',
    verdict: 'closer',
    reflection:
      'STORE is a word, but it only uses four letters. The anagram requires all five letters of TEORS. Let me re-check the puzzle.',
    accuracy: 0.42,
  },
  {
    iter: 2,
    guess: 'TORES',
    verdict: 'wrong',
    reflection:
      'TORES is plural of TORE but the puzzle wants a common five-letter word. Letters T, E, O, R, S — think again.',
    accuracy: 0.61,
  },
  {
    iter: 3,
    guess: 'ROSES',
    verdict: 'wrong',
    reflection:
      "ROSES has two S's. The set TEORS has only one S. I should be strict about the multiset of letters.",
    accuracy: 0.78,
  },
  {
    iter: 4,
    guess: 'STORE',
    verdict: 'closer',
    reflection:
      'I already tried STORE; missing the T. Looking again at T, E, O, R, S — the word is TORSE? STROE? — wait, it is STORE plus T which makes a six-letter rearrangement. The right answer must include T.',
    accuracy: 0.84,
  },
  {
    iter: 5,
    guess: 'TORES',
    verdict: 'wrong',
    reflection:
      'I am cycling. Let me enumerate alphabetically: ESORT, ORSET, OSTER, ROSET, ROSTE, ROTES, SOTER, STORE, STORM, TORES, TROES. Of these, ROTES is a real English word — the plural of ROTE.',
    accuracy: 0.92,
  },
  {
    iter: 6,
    guess: 'ROTES',
    verdict: 'right',
    reflection: '',
    accuracy: 0.96,
  },
]

/* ============================================================== */
/* Act 6 — the permission ladder                                    */
/* ============================================================== */

export interface PermissionRung {
  /** Vertical index, 0 = bottom rung (safest), 3 = top (frontier). */
  level: number
  label: string
  blurb: string
  /** Risk panel — short summary of what can go wrong at this rung. */
  risk: string
  /** What stops or contains the risk at this rung. */
  guardrail: string
}

export const PERMISSION_LADDER: PermissionRung[] = [
  {
    level: 0,
    label: 'Read only',
    blurb: 'The agent can look but not touch.',
    risk: 'Could surface a wrong answer.',
    guardrail: 'You re-read it before acting.',
  },
  {
    level: 1,
    label: 'Sandbox write',
    blurb: 'Files in a scratch folder; mock APIs; no real world.',
    risk: 'Blast radius is the sandbox.',
    guardrail: 'Snapshot, revert on failure.',
  },
  {
    level: 2,
    label: 'Real action with approval',
    blurb:
      'Touch the real world — a calendar, a repo, a bank — but each action waits for a human yes.',
    risk: 'A wrong approval is a real outcome.',
    guardrail: 'Per-action confirmation; diff before commit.',
  },
  {
    level: 3,
    label: 'Autonomous',
    blurb:
      'Long-horizon work with no per-step human in the loop.',
    risk: 'Errors compound; intent drift is real.',
    guardrail:
      'Policy, kill-switches, audit trail — the open frontier.',
  },
]

/* ============================================================== */
/* Act 7 — closing trajectory anchors                              */
/* ============================================================== */

export interface TrajectoryStop {
  /** Position along the diagonal, 0 = bottom-left, 1 = top-right. */
  t: number
  year: string
  label: string
  /** Optional chapter number this stop corresponds to in the book. */
  ch?: number
}

/**
 * Tick marks along the closing chapter's diagonal. Each tick is one
 * chapter of the book; the right-hand endpoint is the present.
 */
export const TRAJECTORY: TrajectoryStop[] = [
  { t: 0.0, year: '1586', label: 'Stevin’s chain', ch: 1 },
  { t: 0.08, year: '1666', label: 'Newton, plague year', ch: 3 },
  { t: 0.16, year: '1801', label: 'Gauss + Ceres', ch: 9 },
  { t: 0.26, year: '1805', label: 'Least squares', ch: 10 },
  { t: 0.34, year: '1958', label: 'Perceptron', ch: 13 },
  { t: 0.46, year: '1986', label: 'Backpropagation', ch: 18 },
  { t: 0.56, year: '1989', label: 'LeNet', ch: 19 },
  { t: 0.66, year: '2013', label: 'word2vec', ch: 20 },
  { t: 0.74, year: '2017', label: 'Transformer', ch: 22 },
  { t: 0.82, year: '2022', label: 'ReAct', ch: 26 },
  { t: 0.9, year: '2024', label: 'Computer Use' },
  { t: 1.0, year: '2026', label: 'today, you' },
]

/* ============================================================== */
/* Tiny helpers reused across panes                                */
/* ============================================================== */

export const KIND_COLORS: Record<TraceLineKind, string> = {
  thought: 'var(--color-graph-ink)',
  action: 'var(--color-vermilion)',
  observation: 'var(--color-ink)',
  answer: 'var(--color-vermilion-deep)',
}

/** Clamp helper used by the act-3 depth slider. */
export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n))

/** Step the trace-line index, clamped to the trace length. */
export const stepIdx = (i: number, n: number) =>
  clamp(i, 0, n - 1)
