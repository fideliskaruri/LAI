import { useRef, useCallback } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Act 4 — The attention matrix. THE SHOWCASE right-drives-left act.
 *
 * Left  : a six-word sentence stacked vertically: "the · cat · sat · on ·
 *         the · mat". The token corresponding to the hovered row (or
 *         hovered column, see below) on the right pane is highlighted.
 *
 * Right : a 6×6 heatmap of attention weights. Row i = "from word i,
 *         attending to word j", i.e. row i sums to 1. Hover any row;
 *         that row is the *query word*. The left pane lights up that
 *         token. Hover an individual cell to also feel the column word.
 *
 * Sync : right-drives-left. The hovered token index lives in the right's
 *        state; the left pane reads from it via deriveLeft (identity).
 *
 * The heatmap pattern is hand-designed to look like a real attention
 * pattern: diagonal-heavy (each word attends to itself), with bumps at
 * "sat ↔ cat", "mat ↔ sat", "on ↔ mat", and "the ↔ {cat, mat}".
 */

export interface MatrixState {
  /** Token currently being inspected as the query (row). */
  hoveredRow: number | null
  /** Token currently being inspected as the key (column). */
  hoveredCol: number | null
}

export const INITIAL_MATRIX: MatrixState = { hoveredRow: null, hoveredCol: null }

const TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat']
const N = TOKENS.length

// Hand-designed attention pattern. Row i = attention from word i. Each row
// is then normalised below so it sums to 1.
const RAW: number[][] = [
  // from "the" — looks at "cat" (its noun), a little at itself
  [3, 6, 1, 1, 1, 2],
  // from "cat" — looks at itself, and at "sat" (its verb)
  [1, 7, 4, 1, 1, 1],
  // from "sat" — strong subject-verb on "cat" + self
  [1, 5, 4, 1, 1, 1],
  // from "on" — looks at "sat" (verb it modifies) and "mat" (object)
  [1, 1, 3, 2, 1, 4],
  // from "the" (second) — looks at "mat" (its noun)
  [1, 1, 1, 2, 2, 6],
  // from "mat" — looks at itself, at "sat", at "on"
  [1, 2, 4, 3, 1, 5],
]

// Row-normalise: divide by row sum so each row reads directly as a discrete
// distribution. This is not softmax (no exponentiation); just a plain
// normalisation so the visual stays interpretable.
const normalize_rows = (m: number[][]): number[][] =>
  m.map((row) => {
    const s = row.reduce((a, b) => a + b, 0)
    return row.map((v) => v / s)
  })

const W: number[][] = normalize_rows(RAW)

const VIEW_W = 600
const VIEW_H = 480

const fmt2 = (n: number) => n.toFixed(2)

function narrationFor(state: MatrixState): string {
  if (state.hoveredRow == null) {
    return 'A 6×6 attention heatmap. Each row sums to 1 and shows how much one word attends to each of the others. Hover any row to highlight the query word on the left.'
  }
  const w = TOKENS[state.hoveredRow]
  const sortedIdxs = W[state.hoveredRow]
    .map((v, j) => ({ v, j }))
    .sort((a, b) => b.v - a.v)
  const topTwo = sortedIdxs.slice(0, 2).map((s) => TOKENS[s.j]).join(' and ')
  if (state.hoveredCol == null) {
    return `Query word ${w}. It attends most to ${topTwo}.`
  }
  const k = TOKENS[state.hoveredCol]
  return `From ${w} to ${k}: weight ${fmt2(W[state.hoveredRow][state.hoveredCol])}.`
}

/* ============================================================== */
/* LEFT PANE                                                        */
/* ============================================================== */

export function LeftPane({ state }: { state: MatrixState }) {
  const ROW_H = 48
  const TOP = 96
  const COL_X = 220

  const narration = narrationFor(state)

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="normal" />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Source sentence with one word highlighted. ${narration}`}
      >
        <text
          x={VIEW_W / 2}
          y={56}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE QUERY WORD
        </text>
        <text
          x={VIEW_W / 2}
          y={76}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          the cat sat on the mat
        </text>

        {TOKENS.map((w, i) => {
          const cy = TOP + i * ROW_H
          const isRow = i === state.hoveredRow
          const isCol = i === state.hoveredCol
          const active = isRow || isCol
          return (
            <g key={i}>
              {/* Row marker arrow */}
              {isRow && (
                <polygon
                  points={`${COL_X - 26},${cy - 8} ${COL_X - 12},${cy} ${COL_X - 26},${cy + 8}`}
                  fill="var(--color-vermilion)"
                />
              )}
              <rect
                x={COL_X}
                y={cy - 18}
                width={160}
                height={36}
                rx={4}
                fill={isRow ? 'var(--color-vermilion)' : 'var(--color-cream)'}
                stroke={
                  active
                    ? 'var(--color-vermilion)'
                    : 'var(--color-graph-ink)'
                }
                strokeWidth={active ? 2 : 1.2}
                opacity={isCol && !isRow ? 0.5 : 1}
              />
              <text
                x={COL_X + 80}
                y={cy + 5}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="16"
                fill={isRow ? 'var(--color-cream)' : 'var(--color-ink)'}
              >
                {w}
              </text>
              {/* Index */}
              <text
                x={COL_X - 38}
                y={cy + 5}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-dim)"
              >
                {i}
              </text>
            </g>
          )
        })}

        {/* Bottom caption */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 28}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE RIGHT PANE DRIVES THE HIGHLIGHT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3a &mdash; The token under inspection
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE                                                       */
/* ============================================================== */

interface RightProps {
  state: MatrixState
  onChange: (next: MatrixState) => void
}

export function RightPane({ state, onChange }: RightProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Layout: 6×6 grid centred. Each cell ~46px wide. Row labels on left,
  // column labels on top.
  const CELL = 46
  const GRID_X0 = 110
  const GRID_Y0 = 110
  const GRID_X1 = GRID_X0 + N * CELL

  const setHover = useCallback(
    (row: number | null, col: number | null) => onChange({ hoveredRow: row, hoveredCol: col }),
    [onChange],
  )

  // Arrow keys step the row (dy) and column (dx); clamp at edges.
  useKeyNudge(
    svgRef,
    useCallback(
      (dx: number, dy: number) => {
        if (dx === 0 && dy === 0) return
        const curRow = state.hoveredRow ?? 0
        const curCol = state.hoveredCol ?? 0
        const nextRow =
          dy !== 0
            ? Math.max(0, Math.min(N - 1, curRow - Math.sign(dy)))
            : curRow
        const nextCol =
          dx !== 0
            ? Math.max(0, Math.min(N - 1, curCol + Math.sign(dx)))
            : curCol
        setHover(nextRow, nextCol)
      },
      [state.hoveredRow, state.hoveredCol, setHover],
    ),
  )

  const narration = narrationFor(state)

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="normal" />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Attention weight heatmap, 6 by 6. Rows are query words, columns are key words. ${narration}`}
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
          ATTENTION MATRIX &middot; ROWS SUM TO 1
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
            fill={j === state.hoveredCol ? 'var(--color-vermilion)' : 'var(--color-dim)'}
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
            fill={i === state.hoveredRow ? 'var(--color-vermilion)' : 'var(--color-dim)'}
          >
            {w}
          </text>
        ))}

        {/* Axis tags */}
        <text
          x={GRID_X0 - 12}
          y={GRID_Y0 - 24}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          FROM
        </text>
        <text
          x={(GRID_X0 + GRID_X1) / 2}
          y={GRID_Y0 - 30}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TO
        </text>

        {/* Cells */}
        {W.map((row, i) =>
          row.map((v, j) => {
            const x = GRID_X0 + j * CELL
            const y = GRID_Y0 + i * CELL
            const isRowHover = i === state.hoveredRow
            const isCellHover = isRowHover && j === state.hoveredCol
            const alpha = 0.08 + 0.92 * v // 0..1
            return (
              <g
                key={`cell-${i}-${j}`}
                onMouseEnter={() => setHover(i, j)}
                onMouseLeave={() => setHover(null, null)}
                onFocus={() => setHover(i, j)}
                onBlur={() => setHover(null, null)}
                tabIndex={0}
                role="button"
                aria-label={`Attention weight from ${TOKENS[i]} to ${TOKENS[j]}: ${fmt2(v)}.`}
                style={{ cursor: 'pointer' }}
                className="focus-visible:outline-none"
              >
                <rect
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  fill="var(--color-vermilion)"
                  fillOpacity={alpha}
                  stroke={
                    isCellHover
                      ? 'var(--color-ink)'
                      : isRowHover
                        ? 'var(--color-vermilion)'
                        : 'var(--color-graph-fade)'
                  }
                  strokeWidth={isCellHover ? 2 : isRowHover ? 1.5 : 0.5}
                />
                {v >= 0.2 && (
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
          HOVER A ROW &middot; LEFT PANE FOLLOWS
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3b &mdash; The pattern of focus
      </figcaption>
    </figure>
  )
}
