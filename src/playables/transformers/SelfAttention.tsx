import { useRef, useCallback } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  EMBEDDINGS,
  makeQKV,
  attentionMatrix,
  attentionAlpha,
  D_K,
} from './tx'

/**
 * Act 3 — Self-attention with Q, K, V.
 *
 *  Left  : a row of 5 tokens. The selected token highlights; under each
 *          token a small 3-cell column shows the Q, K, V projections, with
 *          the selected Q lit up.
 *  Right : the 5x5 softmax(Q Kᵀ / √d_k) attention matrix. The selected
 *          query's row is bordered in vermilion. Bars below the matrix
 *          show how the value vectors are weighted for the selected query.
 *
 * Sync : left-drives-right.
 */

const TOKS_5 = ['the', 'cat', 'sat', 'on', 'mat']
const N5 = TOKS_5.length
// Pull five embeddings from the chapter bank (skip the second "the").
const EMB_5 = [
  EMBEDDINGS[0],
  EMBEDDINGS[1],
  EMBEDDINGS[2],
  EMBEDDINGS[3],
  EMBEDDINGS[5],
]
const { Q: Q5, K: K5, V: V5 } = makeQKV(EMB_5)
const A5 = attentionMatrix(Q5, K5)

export interface SaState {
  selected: number
}

export const INITIAL_SA: SaState = { selected: 1 }

interface LeftProps {
  state: SaState
  onChange: (next: SaState) => void
}

const fmt2 = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2)

export function LeftPane({ state, onChange }: LeftProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const setSelected = useCallback(
    (i: number) => onChange({ selected: ((i % N5) + N5) % N5 }),
    [onChange],
  )

  useKeyNudge(
    svgRef,
    useCallback(
      (dx: number) => {
        if (dx !== 0) setSelected(state.selected + Math.sign(dx))
      },
      [state.selected, setSelected],
    ),
  )

  const sel = state.selected
  const w = TOKS_5[sel]

  const COL_W = 88
  const COL_GAP = 14
  const total = N5 * COL_W + (N5 - 1) * COL_GAP
  const X0 = (VIEW_W - total) / 2
  const TOK_Y = 130
  const QKV_TOP = 200
  const ROW_H = 36

  const narration = `Five tokens. Selected query: ${w}. Below each token, its Q, K, and V vectors. The query's row in the attention matrix on the right shows where it looks.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="normal" />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Five tokens with Q, K, V projections; selected token ${w}.`}
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
          QUERY · KEY · VALUE
        </text>
        <text
          x={VIEW_W / 2}
          y={84}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          each token spawns three short vectors
        </text>

        {/* Token chips */}
        {TOKS_5.map((t, i) => {
          const x = X0 + i * (COL_W + COL_GAP)
          const active = i === sel
          return (
            <g
              key={i}
              tabIndex={0}
              role="button"
              aria-label={`Token ${t}. ${active ? 'Selected query.' : 'Click to select.'}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => setSelected(i)}
              onFocus={() => setSelected(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelected(i)
                }
              }}
              style={{ cursor: 'pointer' }}
              className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
            >
              <rect
                x={x}
                y={TOK_Y - 20}
                width={COL_W}
                height={40}
                rx={3}
                fill={active ? 'var(--color-vermilion)' : 'var(--color-cream)'}
                stroke="var(--color-vermilion)"
                strokeWidth={active ? 2 : 1.2}
              />
              <text
                x={x + COL_W / 2}
                y={TOK_Y + 4}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="15"
                fill={active ? 'var(--color-cream)' : 'var(--color-ink)'}
              >
                {t}
              </text>
            </g>
          )
        })}

        {/* Q, K, V rows */}
        {(['Q', 'K', 'V'] as const).map((label, li) => {
          const yBase = QKV_TOP + li * ROW_H
          const accent = label === 'Q'
          return (
            <g key={label}>
              <text
                x={X0 - 12}
                y={yBase + 4}
                textAnchor="end"
                fontFamily="Inter, sans-serif"
                fontSize="11"
                letterSpacing="0.18em"
                fill={accent ? 'var(--color-vermilion)' : 'var(--color-dim)'}
              >
                {label}
              </text>
              {TOKS_5.map((_, i) => {
                const active = i === sel
                const x = X0 + i * (COL_W + COL_GAP)
                const vec = label === 'Q' ? Q5[i] : label === 'K' ? K5[i] : V5[i]
                return (
                  <g key={`${label}-${i}`}>
                    <rect
                      x={x + 4}
                      y={yBase - 12}
                      width={COL_W - 8}
                      height={24}
                      rx={2}
                      fill={
                        active && accent
                          ? 'var(--color-vermilion)'
                          : 'var(--color-cream)'
                      }
                      fillOpacity={active && accent ? 0.95 : 1}
                      stroke={accent ? 'var(--color-vermilion)' : 'var(--color-ink)'}
                      strokeWidth={active ? 1.6 : 0.8}
                    />
                    {/* Tiny per-dim bars */}
                    {vec.slice(0, D_K).map((v, j) => {
                      const cellW = (COL_W - 12) / D_K
                      const bx = x + 6 + j * cellW
                      const a = Math.max(0, Math.min(1, (v + 1) / 2))
                      return (
                        <rect
                          key={j}
                          x={bx + 0.5}
                          y={yBase - 10}
                          width={cellW - 1}
                          height={20}
                          fill={
                            accent
                              ? 'var(--color-vermilion)'
                              : 'var(--color-graph-ink)'
                          }
                          fillOpacity={
                            active && accent ? 0.7 : 0.18 + a * 0.5
                          }
                        />
                      )
                    })}
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* Q/K/V dim label */}
        <text
          x={VIEW_W / 2}
          y={QKV_TOP + 3 * ROW_H + 32}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          d
          <tspan baselineShift="sub" fontSize="10">k</tspan> = {D_K} · GPT-2:
          d
          <tspan baselineShift="sub" fontSize="10">k</tspan> = 64
        </text>

        {/* Highlight selected Q */}
        <text
          x={VIEW_W / 2}
          y={QKV_TOP + 3 * ROW_H + 60}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          query <tspan fill="var(--color-vermilion)" fontWeight="600">Q
          <tspan baselineShift="sub" fontSize="10">{sel + 1}</tspan>
          </tspan>{' '}
          will be compared to every K
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 14}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TAP A TOKEN · ARROWS STEP
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3a &mdash; Three vectors per token
      </figcaption>
    </figure>
  )
}

export function RightPane({ state }: { state: SaState }) {
  const sel = state.selected
  const w = TOKS_5[sel]
  const row = A5[sel]

  const narration = `Attention matrix row for query ${w}. Distribution: ${row.map((v) => v.toFixed(2)).join(', ')}.`

  // Matrix layout
  const CELL = 44
  const GRID_X = (VIEW_W - N5 * CELL) / 2
  const GRID_Y = 110

  // Bar chart below: weighted V contribution.
  const BAR_TOP = GRID_Y + N5 * CELL + 60
  const BAR_W = CELL
  const BAR_MAX = 60

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="normal" />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Five-by-five attention matrix; the row for query ${w} is highlighted.`}
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
          softmax(Q K&#x1d40; / &radic;d&#x2096;)
        </text>

        {/* Column labels (keys) */}
        {TOKS_5.map((t, j) => (
          <text
            key={`col-${j}`}
            x={GRID_X + j * CELL + CELL / 2}
            y={GRID_Y - 8}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            {t}
          </text>
        ))}
        {/* Row labels (queries) */}
        {TOKS_5.map((t, i) => (
          <text
            key={`row-${i}`}
            x={GRID_X - 8}
            y={GRID_Y + i * CELL + CELL / 2 + 4}
            textAnchor="end"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill={i === sel ? 'var(--color-vermilion)' : 'var(--color-dim)'}
          >
            {t}
          </text>
        ))}

        {/* Matrix cells */}
        {A5.map((rowVals, i) =>
          rowVals.map((v, j) => {
            const x = GRID_X + j * CELL
            const y = GRID_Y + i * CELL
            const isSelRow = i === sel
            return (
              <g key={`${i}-${j}`}>
                <rect
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  fill="var(--color-vermilion)"
                  fillOpacity={attentionAlpha(v)}
                  stroke="var(--color-graph-fade)"
                  strokeWidth={0.5}
                />
                <text
                  x={x + CELL / 2}
                  y={y + CELL / 2 + 4}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="11"
                  fill={v > 0.4 ? 'var(--color-cream)' : 'var(--color-ink)'}
                  fillOpacity={isSelRow ? 1 : 0.75}
                >
                  {v.toFixed(2)}
                </text>
              </g>
            )
          }),
        )}

        {/* Vermilion border around the selected row */}
        <rect
          x={GRID_X - 1}
          y={GRID_Y + sel * CELL - 1}
          width={N5 * CELL + 2}
          height={CELL + 2}
          fill="none"
          stroke="var(--color-vermilion)"
          strokeWidth={2.4}
        />

        {/* Bars: weighted V contribution per token */}
        <text
          x={VIEW_W / 2}
          y={BAR_TOP - 26}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          weight · V<tspan baselineShift="sub" fontSize="9">j</tspan> for query {w}
        </text>
        {row.map((wt, j) => {
          const x = GRID_X + j * CELL
          const h = BAR_MAX * wt
          return (
            <g key={`bar-${j}`}>
              <rect
                x={x + 4}
                y={BAR_TOP + (BAR_MAX - h)}
                width={BAR_W - 8}
                height={h}
                fill="var(--color-vermilion)"
                fillOpacity={0.4 + wt * 0.55}
              />
              <text
                x={x + CELL / 2}
                y={BAR_TOP + BAR_MAX + 14}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="var(--color-dim)"
              >
                {fmt2(wt).trim()}
              </text>
            </g>
          )
        })}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 14}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ONE ROW PER QUERY · ROWS SUM TO 1
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3b &mdash; Where {w} looks
      </figcaption>
    </figure>
  )
}
