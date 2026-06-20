import { useRef, useCallback } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Act 3 — Q · K · V mechanics.
 *
 * Three-word sequence: "the", "cat", "sat". Each word has three vectors
 * attached to it: a Query Q, a Key K, and a Value V. We pretend they're
 * 2-D for the picture; in real models they're 64- or 128-dimensional.
 *
 * Left  : the three tokens stacked, each annotated with its (Q, K, V).
 *         The token currently chosen as the *query* is highlighted; click
 *         (or press Enter on focus) to change which word is asking the
 *         question. The arrow keys (←/→) step the query word.
 *
 * Right : for the chosen query word i, computes
 *           scores_j  = Q_i · K_j        (raw dot products)
 *           weights_j = softmax(scores)  (attention weights, summing to 1)
 *           out_i     = Σ_j weights_j V_j  (the weighted sum of values).
 *         A vertical bar chart shows weights_j; the output vector is
 *         written out at the bottom.
 *
 * Sync : left-drives-right. The query word lives in left state; the right
 *        pane is a derived view (the route's deriveRight is identity).
 */

export interface QkvState {
  /** Which token (0..N-1) is currently the query word. */
  queryIdx: number
}

export const INITIAL_QKV: QkvState = { queryIdx: 1 }

const VIEW_W = 600
const VIEW_H = 480

// Three little tokens with hand-picked 2-D Q/K/V vectors so the softmax
// produces an interesting (non-uniform, non-degenerate) distribution.
interface Tok {
  word: string
  Q: [number, number]
  K: [number, number]
  V: [number, number]
}
const TOKENS: Tok[] = [
  { word: 'the', Q: [0.9, 0.2], K: [0.7, 0.1], V: [0.2, 0.1] },
  { word: 'cat', Q: [0.4, 0.9], K: [0.3, 0.95], V: [0.9, 0.7] },
  { word: 'sat', Q: [-0.2, 0.6], K: [0.1, 0.8], V: [0.4, 0.95] },
]

function dot(a: [number, number], b: [number, number]) {
  return a[0] * b[0] + a[1] * b[1]
}

function softmax(xs: number[]): number[] {
  const m = Math.max(...xs)
  const ex = xs.map((x) => Math.exp(x - m))
  const s = ex.reduce((a, b) => a + b, 0)
  return ex.map((e) => e / s)
}

const fmt2 = (n: number) => n.toFixed(2)

function compute(state: QkvState) {
  const Q = TOKENS[state.queryIdx].Q
  const scores = TOKENS.map((t) => dot(Q, t.K))
  const weights = softmax(scores)
  const out: [number, number] = [
    weights.reduce((acc, w, j) => acc + w * TOKENS[j].V[0], 0),
    weights.reduce((acc, w, j) => acc + w * TOKENS[j].V[1], 0),
  ]
  return { scores, weights, out }
}

/* ============================================================== */
/* LEFT PANE                                                        */
/* ============================================================== */

interface LeftProps {
  state: QkvState
  onChange: (next: QkvState) => void
}

export function LeftPane({ state, onChange }: LeftProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const queryWord = TOKENS[state.queryIdx].word

  const setQuery = useCallback(
    (i: number) => {
      const n = TOKENS.length
      const idx = ((i % n) + n) % n
      onChange({ queryIdx: idx })
    },
    [onChange],
  )

  useKeyNudge(
    svgRef,
    useCallback(
      (dx: number) => {
        if (dx !== 0) setQuery(state.queryIdx + Math.sign(dx))
      },
      [state.queryIdx, setQuery],
    ),
  )

  const narration = `Three tokens, the, cat, sat. The query word is ${queryWord}. Each token also exposes a key K and a value V. Use the arrow keys or click a token to change which word is asking.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="normal" />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Three tokens annotated with query, key, and value vectors. The current query word is ${queryWord}.`}
        tabIndex={0}
      >
        {/* Header */}
        <text
          x={VIEW_W / 2}
          y={56}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THREE VECTORS PER TOKEN
        </text>

        {/* Three rows: token | Q | K | V */}
        {TOKENS.map((t, i) => {
          const cy = 130 + i * 100
          const isQuery = i === state.queryIdx
          return (
            <TokenRow
              key={i}
              x={60}
              y={cy}
              token={t}
              isQuery={isQuery}
              onSelect={() => setQuery(i)}
            />
          )
        })}

        {/* Query indicator line */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 36}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          query: <tspan fontWeight="600">{queryWord}</tspan>
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 18}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          CLICK A TOKEN &middot; ARROWS STEP
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2a &mdash; Q asks &middot; K matches &middot; V contributes
      </figcaption>
    </figure>
  )
}

interface TokenRowProps {
  x: number
  y: number
  token: Tok
  isQuery: boolean
  onSelect: () => void
}

function TokenRow({ x, y, token, isQuery, onSelect }: TokenRowProps) {
  const ref = useRef<SVGGElement | null>(null)
  return (
    <g
      ref={ref}
      tabIndex={0}
      role="button"
      aria-label={`Token ${token.word}. ${isQuery ? 'Currently the query.' : 'Click to make it the query.'} Q equals ${fmt2(token.Q[0])}, ${fmt2(token.Q[1])}. K equals ${fmt2(token.K[0])}, ${fmt2(token.K[1])}. V equals ${fmt2(token.V[0])}, ${fmt2(token.V[1])}.`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      style={{ cursor: 'pointer' }}
      className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
    >
      {/* Token chip */}
      <rect
        x={x}
        y={y - 18}
        width={92}
        height={36}
        rx={4}
        fill={isQuery ? 'var(--color-vermilion)' : 'var(--color-cream)'}
        stroke="var(--color-vermilion)"
        strokeWidth={isQuery ? 2 : 1.2}
      />
      <text
        x={x + 46}
        y={y + 6}
        textAnchor="middle"
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize="16"
        fill={isQuery ? 'var(--color-cream)' : 'var(--color-ink)'}
      >
        {token.word}
      </text>

      {/* Q, K, V mini-vectors */}
      <VectorBadge x={x + 120} y={y} label="Q" vec={token.Q} colour="var(--color-vermilion)" />
      <VectorBadge x={x + 240} y={y} label="K" vec={token.K} colour="var(--color-ink)" />
      <VectorBadge x={x + 380} y={y} label="V" vec={token.V} colour="var(--color-graph-ink)" />

      {/* Query indicator dot */}
      {isQuery && (
        <circle
          cx={x - 18}
          cy={y}
          r={4}
          fill="var(--color-vermilion)"
        />
      )}
    </g>
  )
}

function VectorBadge({
  x,
  y,
  label,
  vec,
  colour,
}: {
  x: number
  y: number
  label: string
  vec: [number, number]
  colour: string
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <text
        x={0}
        y={-14}
        fontFamily="Inter, sans-serif"
        fontSize="10"
        letterSpacing="0.18em"
        fill={colour}
      >
        {label}
      </text>
      <text
        x={0}
        y={6}
        fontFamily="JetBrains Mono, monospace"
        fontSize="11"
        fill="var(--color-ink)"
      >
        [{fmt2(vec[0])}, {fmt2(vec[1])}]
      </text>
    </g>
  )
}

/* ============================================================== */
/* RIGHT PANE                                                       */
/* ============================================================== */

export function RightPane({ state }: { state: QkvState }) {
  const { scores, weights, out } = compute(state)
  const queryWord = TOKENS[state.queryIdx].word
  const narration =
    `For query word ${queryWord}: dot products ${scores.map(fmt2).join(', ')}; softmax weights ${weights.map(fmt2).join(', ')}; output equals weighted sum of values, ${fmt2(out[0])}, ${fmt2(out[1])}.`

  const BAR_X0 = 90
  const BAR_X1 = VIEW_W - 60
  const BAR_W = BAR_X1 - BAR_X0
  const BAR_TOP = 160
  const BAR_GAP = 22
  const BAR_H = 30

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="normal" />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Attention weights for the query word ${queryWord}. Shows softmax weights over each key and the resulting output vector.`}
      >
        {/* Header */}
        <text
          x={VIEW_W / 2}
          y={56}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          Q &middot; K AND THE SOFTMAX
        </text>

        {/* Equation */}
        <text
          x={VIEW_W / 2}
          y={96}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="15"
          fill="var(--color-ink)"
        >
          score
          <tspan baselineShift="sub" fontSize="9">
            j
          </tspan>{' '}
          = Q
          <tspan baselineShift="sub" fontSize="9">
            {state.queryIdx === 0 ? 'the' : state.queryIdx === 1 ? 'cat' : 'sat'}
          </tspan>{' '}
          &middot; K
          <tspan baselineShift="sub" fontSize="9">
            j
          </tspan>
        </text>
        <text
          x={VIEW_W / 2}
          y={120}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          w = softmax(score)
        </text>

        {/* Per-row bars: score | weight bar | weight number */}
        {TOKENS.map((t, j) => {
          const cy = BAR_TOP + j * (BAR_H + BAR_GAP)
          const w = weights[j]
          const isMax = weights.indexOf(Math.max(...weights)) === j
          return (
            <g key={j}>
              {/* Token name (key side) */}
              <text
                x={BAR_X0 - 12}
                y={cy + BAR_H / 2 + 4}
                textAnchor="end"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="13"
                fill="var(--color-ink)"
              >
                {t.word}
              </text>
              {/* Raw score label */}
              <text
                x={BAR_X0 + 8}
                y={cy + BAR_H / 2 + 4}
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fill="var(--color-dim)"
              >
                {fmt2(scores[j])}
              </text>

              {/* Frame */}
              <rect
                x={BAR_X0}
                y={cy}
                width={BAR_W}
                height={BAR_H}
                fill="none"
                stroke="var(--color-graph-fade)"
                strokeWidth="1"
              />
              {/* Filled portion: weight */}
              <rect
                x={BAR_X0}
                y={cy}
                width={Math.max(2, BAR_W * w)}
                height={BAR_H}
                fill={isMax ? 'var(--color-vermilion)' : 'var(--color-ink)'}
                fillOpacity={isMax ? 0.85 : 0.45}
              />
              {/* Weight number */}
              <text
                x={BAR_X1 + 8}
                y={cy + BAR_H / 2 + 4}
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill={isMax ? 'var(--color-vermilion)' : 'var(--color-ink)'}
              >
                {fmt2(w)}
              </text>
            </g>
          )
        })}

        {/* Output vector readout */}
        <text
          x={BAR_X0 - 12}
          y={BAR_TOP + 3 * (BAR_H + BAR_GAP) + 30}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          OUTPUT
        </text>
        <text
          x={BAR_X0 + 8}
          y={BAR_TOP + 3 * (BAR_H + BAR_GAP) + 30}
          fontFamily="JetBrains Mono, monospace"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          Σ wⱼ Vⱼ = [{fmt2(out[0])}, {fmt2(out[1])}]
        </text>

        {/* Footnote */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 32}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          weights sum to 1 &middot; output is a blend of values
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2b &mdash; A weighted sum of values, learned from queries and keys
      </figcaption>
    </figure>
  )
}
