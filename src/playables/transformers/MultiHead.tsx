import { useRef, useCallback } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  TOKENS,
  N_TOKENS,
  HEAD_DEFS,
  headPattern,
  attentionAlpha,
  type HeadId,
} from './tx'

/**
 * Act 4 — Multi-head attention.
 *
 *  Left  : an h-slider 1..8 selects which head is "active". Each of the 8
 *          heads is shown as a tiny stacked Q/K/V mini-block. The active
 *          head is bordered vermilion.
 *  Right : the attention pattern of the active head over the six tokens.
 *          Four hand-baked archetypes (diagonal, previous, next, first)
 *          are cycled through so the reader sees that heads specialise.
 *
 * Sync : left-drives-right.
 */

const H_TOTAL = 8 // eight heads, matching the original Vaswani paper

/** Which archetype each of the 8 heads is shown as. */
const HEAD_ASSIGNMENT: HeadId[] = [
  'diagonal',
  'previous',
  'next',
  'first',
  'diagonal',
  'previous',
  'next',
  'first',
]

export interface MhState {
  head: number // 0..H_TOTAL-1
  interacting: boolean
}

export const INITIAL_MH: MhState = { head: 2, interacting: false }

const clamp = (h: number) => Math.max(0, Math.min(H_TOTAL - 1, h))

interface LeftProps {
  state: MhState
  onChange: (next: MhState) => void
}

export function LeftPane({ state, onChange }: LeftProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<number | null>(null)

  const update = useCallback(
    (h: number, interacting: boolean) => onChange({ head: clamp(h), interacting }),
    [onChange],
  )

  // Layout: 8 mini-blocks in a 4x2 grid.
  const COLS = 4
  const ROWS = 2
  const BLOCK_W = 96
  const BLOCK_H = 88
  const GAP_X = 22
  const GAP_Y = 22
  const totalW = COLS * BLOCK_W + (COLS - 1) * GAP_X
  const totalH = ROWS * BLOCK_H + (ROWS - 1) * GAP_Y
  const X0 = (VIEW_W - totalW) / 2
  const Y0 = 110

  const xOf = (i: number) => X0 + (i % COLS) * (BLOCK_W + GAP_X)
  const yOf = (i: number) => Y0 + Math.floor(i / COLS) * (BLOCK_H + GAP_Y)

  // Slider area
  const SLIDER_Y = Y0 + totalH + 56
  const SLIDER_X0 = X0
  const SLIDER_X1 = X0 + totalW
  const xAt = (h: number) =>
    SLIDER_X0 + (h / (H_TOTAL - 1)) * (SLIDER_X1 - SLIDER_X0)

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startRef.current = state.head
    const start = startRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const span = (SLIDER_X1 - SLIDER_X0) / (H_TOTAL - 1)
    const dH = Math.round((mx * sx) / span)
    update(start + dH, !last)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx !== 0) update(state.head + Math.sign(dx), false)
      },
      [state.head, update],
    ),
  )

  const headArche = HEAD_DEFS.find((d) => d.id === HEAD_ASSIGNMENT[state.head])!
  const narration = `Head ${state.head + 1} of ${H_TOTAL}. Pattern: ${headArche.label}. ${headArche.story}`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Eight heads, four-by-two grid; head ${state.head + 1} is active.`}
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
          EIGHT HEADS IN PARALLEL
        </text>
        <text
          x={VIEW_W / 2}
          y={82}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          each runs its own Q, K, V on the same input
        </text>

        {/* Heads */}
        {Array.from({ length: H_TOTAL }).map((_, i) => {
          const x = xOf(i)
          const y = yOf(i)
          const active = i === state.head
          const arche = HEAD_DEFS.find((d) => d.id === HEAD_ASSIGNMENT[i])!
          return (
            <g
              key={i}
              tabIndex={0}
              role="button"
              aria-label={`Head ${i + 1}: ${arche.label}. ${active ? 'Active.' : 'Click to select.'}`}
              onClick={() => update(i, false)}
              onMouseEnter={() => update(i, false)}
              onFocus={() => update(i, false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  update(i, false)
                }
              }}
              style={{ cursor: 'pointer' }}
              className="focus-visible:outline-none [&:focus-visible_rect.frame]:stroke-vermilion-deep"
            >
              <rect
                className="frame"
                x={x}
                y={y}
                width={BLOCK_W}
                height={BLOCK_H}
                rx={4}
                fill={active ? 'var(--color-vermilion)' : 'var(--color-cream)'}
                fillOpacity={active ? 0.08 : 1}
                stroke={active ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
                strokeWidth={active ? 2 : 1}
              />
              <text
                x={x + 8}
                y={y + 16}
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fill={active ? 'var(--color-vermilion)' : 'var(--color-dim)'}
              >
                h{i + 1}
              </text>
              {/* Q, K, V tags */}
              {(['Q', 'K', 'V'] as const).map((lab, j) => (
                <g key={lab}>
                  <rect
                    x={x + 12}
                    y={y + 28 + j * 18}
                    width={BLOCK_W - 24}
                    height={12}
                    rx={2}
                    fill="var(--color-cream)"
                    stroke={active ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
                    strokeOpacity={active ? 0.85 : 0.4}
                    strokeWidth={0.8}
                  />
                  <text
                    x={x + 18}
                    y={y + 38 + j * 18}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="9"
                    fill={active ? 'var(--color-vermilion)' : 'var(--color-dim)'}
                  >
                    {lab}
                  </text>
                  {/* mini bar */}
                  <rect
                    x={x + 32}
                    y={y + 30 + j * 18}
                    width={BLOCK_W - 48}
                    height={8}
                    fill={active ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
                    fillOpacity={active ? 0.45 : 0.18}
                  />
                </g>
              ))}
            </g>
          )
        })}

        {/* Slider */}
        <line
          x1={SLIDER_X0}
          y1={SLIDER_Y}
          x2={SLIDER_X1}
          y2={SLIDER_Y}
          stroke="var(--color-graph-ink)"
          strokeOpacity={0.4}
          strokeWidth={1}
        />
        {Array.from({ length: H_TOTAL }).map((_, h) => (
          <g key={h}>
            <circle
              cx={xAt(h)}
              cy={SLIDER_Y}
              r={3}
              fill={h === state.head ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
            />
            <text
              x={xAt(h)}
              y={SLIDER_Y + 22}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill={h === state.head ? 'var(--color-vermilion)' : 'var(--color-dim)'}
            >
              {h + 1}
            </text>
          </g>
        ))}

        {/* Slider thumb */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-valuemin={1}
          aria-valuemax={H_TOTAL}
          aria-valuenow={state.head + 1}
          aria-label={`Head selector. Head ${state.head + 1} of ${H_TOTAL}.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle]:stroke-vermilion-deep"
        >
          <circle
            cx={xAt(state.head)}
            cy={SLIDER_Y}
            r={10}
            fill="var(--color-vermilion)"
            stroke="var(--color-vermilion)"
            strokeWidth={2}
          />
        </g>

        {/* Label for active archetype */}
        <text
          x={VIEW_W / 2}
          y={SLIDER_Y + 50}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-vermilion)"
        >
          h{state.head + 1} ·{' '}
          <tspan fill="var(--color-ink)">{headArche.label}</tspan>
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
          DRAG · ARROWS NUDGE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4a &mdash; Eight readers of the same sentence
      </figcaption>
    </figure>
  )
}

interface RightProps {
  state: MhState
}

export function RightPane({ state }: RightProps) {
  const arche = HEAD_DEFS.find((d) => d.id === HEAD_ASSIGNMENT[state.head])!
  const M = headPattern(arche.id, N_TOKENS)

  // Matrix layout.
  const CELL = 50
  const GRID_X = (VIEW_W - N_TOKENS * CELL) / 2
  const GRID_Y = 130

  const narration = `Head ${state.head + 1} attention pattern. ${arche.label}. ${arche.story}`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Six-by-six attention matrix for head ${state.head + 1}, pattern ${arche.label}.`}
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
          HEAD {state.head + 1} · {arche.short.toUpperCase()}
        </text>
        <text
          x={VIEW_W / 2}
          y={84}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-vermilion)"
        >
          {arche.label}
        </text>

        {/* Column labels */}
        {TOKENS.map((t, j) => (
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
        {/* Row labels */}
        {TOKENS.map((t, i) => (
          <text
            key={`row-${i}`}
            x={GRID_X - 8}
            y={GRID_Y + i * CELL + CELL / 2 + 4}
            textAnchor="end"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            {t}
          </text>
        ))}

        {/* Cells */}
        {M.map((row, i) =>
          row.map((v, j) => (
            <g key={`${i}-${j}`}>
              <rect
                x={GRID_X + j * CELL}
                y={GRID_Y + i * CELL}
                width={CELL}
                height={CELL}
                fill="var(--color-vermilion)"
                fillOpacity={attentionAlpha(v)}
                stroke="var(--color-graph-fade)"
                strokeWidth={0.5}
              />
              {v > 0.1 && (
                <text
                  x={GRID_X + j * CELL + CELL / 2}
                  y={GRID_Y + i * CELL + CELL / 2 + 4}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="10"
                  fill={v > 0.4 ? 'var(--color-cream)' : 'var(--color-ink)'}
                >
                  {v.toFixed(2)}
                </text>
              )}
            </g>
          )),
        )}

        {/* Story */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 36}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          {arche.story}
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 14}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          REAL HEADS SPECIALISE LIKE THIS
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4b &mdash; What head {state.head + 1} reads for
      </figcaption>
    </figure>
  )
}
