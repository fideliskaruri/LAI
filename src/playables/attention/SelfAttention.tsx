import { useRef, useCallback } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Act 6 — Self-attention.
 *
 * Same six-word sentence. *Q, K, V all come from the same sequence.*
 * Every word attends to every other word, including itself. This is
 * what a transformer block actually does, layer after layer.
 *
 * Left  : the sentence as a horizontal row of tokens. Hover (or tab to)
 *         any token to inspect its attention pattern. The arcs above
 *         the row visualise the attention weights — thicker = stronger.
 *
 * Right : a small bar-chart of that token's attention weights over the
 *         whole sentence, with the resulting context vector at the
 *         bottom. The "context" caption makes the point: this is what
 *         the model sees in place of the token after one self-attention
 *         step — a blended vector.
 *
 * Sync : left-drives-right.
 */

export interface SelfState {
  /** Token index currently selected as the query. */
  queryIdx: number
}

export const INITIAL_SELF: SelfState = { queryIdx: 2 } // "sat"

const TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat']
const N = TOKENS.length

// The same attention matrix as act 4 — this *is* self-attention.
const RAW: number[][] = [
  [3, 6, 1, 1, 1, 2],
  [1, 7, 4, 1, 1, 1],
  [1, 5, 4, 1, 1, 1],
  [1, 1, 3, 2, 1, 4],
  [1, 1, 1, 2, 2, 6],
  [1, 2, 4, 3, 1, 5],
]
const W: number[][] = RAW.map((row) => {
  const s = row.reduce((a, b) => a + b, 0)
  return row.map((v) => v / s)
})

// Hand-picked "value" vectors so we can show a context vector at the bottom.
const VALUES: [number, number][] = [
  [0.2, 0.1],
  [0.9, 0.7], // cat
  [0.4, 0.95], // sat
  [-0.2, 0.3],
  [0.2, 0.1],
  [0.6, -0.2], // mat
]

const VIEW_W = 600
const VIEW_H = 480

const fmt2 = (n: number) => n.toFixed(2)

function contextVector(weights: number[]): [number, number] {
  let x = 0,
    y = 0
  for (let j = 0; j < N; j++) {
    x += weights[j] * VALUES[j][0]
    y += weights[j] * VALUES[j][1]
  }
  return [x, y]
}

function narration(state: SelfState): string {
  const w = TOKENS[state.queryIdx]
  const ws = W[state.queryIdx]
  const top = ws
    .map((v, j) => ({ v, j }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 2)
    .map((s) => TOKENS[s.j])
    .join(' and ')
  return `Selected token ${w}. It attends most to ${top}. Q, K, and V all come from the same sentence.`
}

/* ============================================================== */
/* LEFT PANE — the sentence with arcs                              */
/* ============================================================== */

interface LeftProps {
  state: SelfState
  onChange: (next: SelfState) => void
}

export function LeftPane({ state, onChange }: LeftProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  const setQuery = useCallback(
    (i: number) => {
      const idx = ((i % N) + N) % N
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

  const weights = W[state.queryIdx]

  // Token layout along a horizontal axis.
  const TOK_Y = 360
  const TOK_W = 70
  const TOK_GAP = 16
  const TOTAL_W = N * TOK_W + (N - 1) * TOK_GAP
  const X0 = (VIEW_W - TOTAL_W) / 2

  const tokX = (i: number) => X0 + i * (TOK_W + TOK_GAP) + TOK_W / 2

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration(state)} priority="normal" />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Self-attention picture. ${narration(state)}`}
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
          ATTENTION TO YOURSELF
        </text>
        <text
          x={VIEW_W / 2}
          y={78}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          Q, K, V all from the same sentence
        </text>

        {/* Arcs from the query token to each other token */}
        {weights.map((w, j) => {
          const x1 = tokX(state.queryIdx)
          const x2 = tokX(j)
          if (j === state.queryIdx) {
            // self-loop: small arc above the token
            return (
              <path
                key={j}
                d={`M ${x1 - 14} ${TOK_Y - 22} q 14 -32 28 0`}
                fill="none"
                stroke="var(--color-vermilion)"
                strokeWidth={1 + 4 * w}
                strokeOpacity={0.3 + 0.7 * w}
              />
            )
          }
          const dx = x2 - x1
          const ax = (x1 + x2) / 2
          const ay = TOK_Y - 30 - Math.min(180, 24 + Math.abs(dx) * 0.7)
          return (
            <path
              key={j}
              d={`M ${x1} ${TOK_Y - 24} Q ${ax} ${ay} ${x2} ${TOK_Y - 24}`}
              fill="none"
              stroke="var(--color-vermilion)"
              strokeWidth={1 + 4 * w}
              strokeOpacity={0.2 + 0.8 * w}
            />
          )
        })}

        {/* Token boxes */}
        {TOKENS.map((w, i) => {
          const cx = tokX(i)
          const active = i === state.queryIdx
          return (
            <g
              key={i}
              tabIndex={0}
              role="button"
              aria-label={`Token ${w}. ${active ? 'Currently the query token.' : 'Hover or click to make it the query.'}`}
              onMouseEnter={() => setQuery(i)}
              onClick={() => setQuery(i)}
              onFocus={() => setQuery(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setQuery(i)
                }
              }}
              style={{ cursor: 'pointer' }}
              className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
            >
              <rect
                x={cx - TOK_W / 2}
                y={TOK_Y - 16}
                width={TOK_W}
                height={36}
                rx={4}
                fill={active ? 'var(--color-vermilion)' : 'var(--color-cream)'}
                stroke="var(--color-vermilion)"
                strokeWidth={active ? 2 : 1.2}
              />
              <text
                x={cx}
                y={TOK_Y + 6}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="14"
                fill={active ? 'var(--color-cream)' : 'var(--color-ink)'}
              >
                {w}
              </text>
            </g>
          )
        })}

        {/* Footer hint */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 28}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          HOVER A TOKEN &middot; ARROWS STEP
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5a &mdash; Every word looks at every other word
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — weight bars + context vector                        */
/* ============================================================== */

export function RightPane({ state }: { state: SelfState }) {
  const weights = W[state.queryIdx]
  const ctx = contextVector(weights)
  const queryWord = TOKENS[state.queryIdx]

  const BAR_X0 = 110
  const BAR_X1 = VIEW_W - 80
  const BAR_W_PX = BAR_X1 - BAR_X0
  const BAR_TOP = 130
  const BAR_GAP = 16
  const BAR_H = 22

  const maxIdx = weights.indexOf(Math.max(...weights))

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration(state)} priority="normal" />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Attention weights from ${queryWord} to each token in the sentence, and the resulting context vector.`}
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
          ATTENTION FROM
        </text>
        <text
          x={VIEW_W / 2}
          y={96}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="20"
          fontWeight="600"
          fill="var(--color-vermilion)"
        >
          {queryWord}
        </text>

        {TOKENS.map((w, j) => {
          const cy = BAR_TOP + j * (BAR_H + BAR_GAP)
          const wt = weights[j]
          const isMax = j === maxIdx
          return (
            <g key={j}>
              <text
                x={BAR_X0 - 12}
                y={cy + BAR_H / 2 + 4}
                textAnchor="end"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="13"
                fill="var(--color-ink)"
              >
                {w}
              </text>
              <rect
                x={BAR_X0}
                y={cy}
                width={BAR_W_PX}
                height={BAR_H}
                fill="none"
                stroke="var(--color-graph-fade)"
                strokeWidth="1"
              />
              <rect
                x={BAR_X0}
                y={cy}
                width={Math.max(2, BAR_W_PX * wt)}
                height={BAR_H}
                fill={isMax ? 'var(--color-vermilion)' : 'var(--color-ink)'}
                fillOpacity={isMax ? 0.85 : 0.4}
              />
              <text
                x={BAR_X1 + 8}
                y={cy + BAR_H / 2 + 4}
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill={isMax ? 'var(--color-vermilion)' : 'var(--color-dim)'}
              >
                {fmt2(wt)}
              </text>
            </g>
          )
        })}

        {/* Context vector */}
        <line
          x1={BAR_X0}
          y1={BAR_TOP + N * (BAR_H + BAR_GAP) + 16}
          x2={BAR_X1}
          y2={BAR_TOP + N * (BAR_H + BAR_GAP) + 16}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />
        <text
          x={BAR_X0 - 12}
          y={BAR_TOP + N * (BAR_H + BAR_GAP) + 42}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          CONTEXT
        </text>
        <text
          x={BAR_X0 + 8}
          y={BAR_TOP + N * (BAR_H + BAR_GAP) + 42}
          fontFamily="JetBrains Mono, monospace"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          Σ wⱼ Vⱼ = [{fmt2(ctx[0])}, {fmt2(ctx[1])}]
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 28}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          the new vector the model uses in place of {queryWord}
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5b &mdash; The context vector for {queryWord}
      </figcaption>
    </figure>
  )
}
