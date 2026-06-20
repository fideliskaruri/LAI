import { useRef, useCallback } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Act 5 — Multi-head attention.
 *
 * Same six-word input. Three heads, each with a hand-designed attention
 * pattern showing a *different* linguistic role:
 *
 *   Head 1 — subject-verb (cat ↔ sat)
 *   Head 2 — noun-determiner (the ↔ cat ; the ↔ mat)
 *   Head 3 — long-range preposition (sat ↔ mat via on)
 *
 * Left  : the three heads as labelled badges, stacked. The currently
 *         selected head's interpretation card is shown. Click or arrow-key
 *         between heads.
 * Right : the 6×6 heatmap for the selected head.
 *
 * Sync : co-mutating. headIdx lives in both panes' state simultaneously;
 *        whichever side you click, the other side updates.
 */

export interface HeadState {
  headIdx: number
}

export const INITIAL_HEAD: HeadState = { headIdx: 0 }

const TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat']

interface Head {
  name: string
  pattern: string
  description: string
  raw: number[][]
}

// Each head's RAW pattern. Row i = attention from word i.
const HEADS: Head[] = [
  {
    name: 'Head 1',
    pattern: 'subject ↔ verb',
    description: 'cat looks at sat ; sat looks at cat',
    raw: [
      [3, 4, 1, 1, 1, 1],
      [1, 3, 8, 1, 1, 1],
      [1, 8, 3, 1, 1, 1],
      [1, 1, 3, 2, 1, 2],
      [1, 1, 1, 1, 2, 4],
      [1, 1, 3, 1, 1, 4],
    ],
  },
  {
    name: 'Head 2',
    pattern: 'determiner ↔ noun',
    description: 'each the looks at the noun that follows it',
    raw: [
      [1, 7, 1, 1, 1, 1],
      [3, 2, 1, 1, 1, 1],
      [1, 1, 2, 1, 1, 1],
      [1, 1, 1, 2, 1, 1],
      [1, 1, 1, 1, 1, 7],
      [1, 1, 1, 1, 4, 2],
    ],
  },
  {
    name: 'Head 3',
    pattern: 'long-range preposition',
    description: 'sat reaches across on to mat ; mat back to sat',
    raw: [
      [2, 1, 1, 1, 1, 1],
      [1, 2, 1, 1, 1, 1],
      [1, 1, 2, 3, 1, 6],
      [1, 1, 3, 2, 1, 3],
      [1, 1, 1, 1, 2, 1],
      [1, 1, 6, 3, 1, 2],
    ],
  },
]

// Row-normalise each head's pattern.
const HEAD_W: number[][][] = HEADS.map((h) =>
  h.raw.map((row) => {
    const s = row.reduce((a, b) => a + b, 0)
    return row.map((v) => v / s)
  }),
)

const VIEW_W = 600
const VIEW_H = 480

const fmt2 = (n: number) => n.toFixed(2)

function narration(state: HeadState): string {
  const h = HEADS[state.headIdx]
  return `${h.name}: ${h.pattern}. ${h.description}.`
}

/* ============================================================== */
/* LEFT PANE — head selector + interpretation card                 */
/* ============================================================== */

interface LeftProps {
  state: HeadState
  onChange: (next: HeadState) => void
}

export function LeftPane({ state, onChange }: LeftProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  const setHead = useCallback(
    (i: number) => {
      const n = HEADS.length
      const idx = ((i % n) + n) % n
      onChange({ headIdx: idx })
    },
    [onChange],
  )

  useKeyNudge(
    svgRef,
    useCallback(
      (_dx: number, dy: number) => {
        if (dy === 0) return
        setHead(state.headIdx - Math.sign(dy))
      },
      [state.headIdx, setHead],
    ),
  )

  const cur = HEADS[state.headIdx]

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration(state)} priority="normal" />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Multi-head attention selector. ${narration(state)}`}
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
          THREE HEADS &middot; THREE PATTERNS
        </text>

        {/* The three head badges */}
        {HEADS.map((h, i) => {
          const cy = 110 + i * 88
          const active = i === state.headIdx
          return (
            <g
              key={i}
              tabIndex={0}
              role="button"
              aria-label={`${h.name}: ${h.pattern}. ${active ? 'Currently selected.' : 'Click to inspect.'}`}
              onClick={() => setHead(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setHead(i)
                }
              }}
              style={{ cursor: 'pointer' }}
              className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
            >
              <rect
                x={80}
                y={cy - 30}
                width={440}
                height={60}
                rx={6}
                fill={active ? 'var(--color-vermilion)' : 'var(--color-cream)'}
                stroke="var(--color-vermilion)"
                strokeWidth={active ? 2 : 1.2}
              />
              <text
                x={100}
                y={cy - 6}
                fontFamily="Inter, sans-serif"
                fontSize="11"
                letterSpacing="0.22em"
                fill={active ? 'var(--color-cream)' : 'var(--color-vermilion)'}
              >
                {h.name.toUpperCase()}
              </text>
              <text
                x={100}
                y={cy + 18}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="15"
                fill={active ? 'var(--color-cream)' : 'var(--color-ink)'}
              >
                {h.pattern}
              </text>
              {active && (
                <circle cx={500} cy={cy} r={6} fill="var(--color-cream)" />
              )}
            </g>
          )
        })}

        {/* Description card under the badges */}
        <line
          x1={80}
          y1={400}
          x2={520}
          y2={400}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />
        <text
          x={VIEW_W / 2}
          y={426}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          {cur.description}
        </text>
        <text
          x={VIEW_W / 2}
          y={452}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          CLICK A HEAD &middot; ARROWS STEP
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4a &mdash; Each head learns a different pattern
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — heatmap for the selected head                      */
/* ============================================================== */

export function RightPane({ state, onChange }: LeftProps) {
  const W = HEAD_W[state.headIdx]
  const h = HEADS[state.headIdx]

  // Also support the user clicking a head badge from the right.
  void onChange

  const CELL = 46
  const GRID_X0 = 110
  const GRID_Y0 = 110

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration(state)} priority="normal" />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Attention heatmap for ${h.name}: ${h.pattern}.`}
      >
        {/* Header */}
        <text
          x={VIEW_W / 2}
          y={56}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          {h.name.toUpperCase()} &middot; {h.pattern.toUpperCase()}
        </text>

        {/* Column labels (keys) */}
        {TOKENS.map((w, j) => (
          <text
            key={`col-${j}`}
            x={GRID_X0 + j * CELL + CELL / 2}
            y={GRID_Y0 - 12}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-dim)"
          >
            {w}
          </text>
        ))}
        {/* Row labels (queries) */}
        {TOKENS.map((w, i) => (
          <text
            key={`row-${i}`}
            x={GRID_X0 - 12}
            y={GRID_Y0 + i * CELL + CELL / 2 + 4}
            textAnchor="end"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-dim)"
          >
            {w}
          </text>
        ))}

        {/* Cells */}
        {W.map((row, i) =>
          row.map((v, j) => {
            const x = GRID_X0 + j * CELL
            const y = GRID_Y0 + i * CELL
            const alpha = 0.08 + 0.92 * v
            return (
              <g key={`cell-${i}-${j}`}>
                <rect
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  fill="var(--color-vermilion)"
                  fillOpacity={alpha}
                  stroke="var(--color-graph-fade)"
                  strokeWidth={0.5}
                />
                {v >= 0.25 && (
                  <text
                    x={x + CELL / 2}
                    y={y + CELL / 2 + 4}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    fill={alpha > 0.55 ? 'var(--color-cream)' : 'var(--color-ink)'}
                  >
                    {fmt2(v)}
                  </text>
                )}
              </g>
            )
          }),
        )}

        {/* Footer */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 28}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          same input &middot; different lens
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4b &mdash; The matrix this head learned
      </figcaption>
    </figure>
  )
}
