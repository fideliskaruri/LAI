import { useRef, useCallback } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { VIEW_W, VIEW_H, TOKENS, MAX_PE_FREQ } from './tx'

/**
 * Act 2 — Positional encoding (Vaswani §3.5).
 *
 *  Left  : the same six tokens as a row, with an extra two "ghost" tokens
 *          to make the position slider reach 0..7. A vermilion position
 *          marker sits below one chip and can be dragged left/right; arrow
 *          keys nudge.
 *  Right : the four sinusoidal/cosine waves at four different frequencies,
 *          drawn over position 0..7. Vertical vermilion line marks the
 *          current position; the wave amplitudes shift as the slider moves.
 *
 * Sync : left-drives-right. Position lives in the left state.
 */

export interface PosState {
  position: number
  interacting: boolean
}

export const N_POS = 8
export const INITIAL_POS: PosState = { position: 2, interacting: false }

const D_MODEL = 8
const N_WAVES = 4 // we plot four of the eight (i = 0, 2, 4, 6)

interface LeftProps {
  state: PosState
  onChange: (next: PosState) => void
}

const clampPos = (p: number) => Math.max(0, Math.min(N_POS - 1, p))

export function LeftPane({ state, onChange }: LeftProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<number | null>(null)

  const update = useCallback(
    (p: number, interacting: boolean) =>
      onChange({ position: clampPos(p), interacting }),
    [onChange],
  )

  // Layout the chips for positions 0..N_POS-1. Real tokens for 0..5,
  // a placeholder for 6 and 7 (the sentence is only six tokens long
  // but the slider explores eight positions to show the wave shape).
  const CHIP_W = 56
  const CHIP_GAP = 10
  const total = N_POS * CHIP_W + (N_POS - 1) * CHIP_GAP
  const X0 = (VIEW_W - total) / 2
  const TOK_Y = 200
  const SLIDER_Y = TOK_Y + 78
  const xOfPos = (p: number) => X0 + p * (CHIP_W + CHIP_GAP) + CHIP_W / 2

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startRef.current = state.position
    const start = startRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const dP = Math.round((mx * sx) / (CHIP_W + CHIP_GAP))
    update(start + dP, !last)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx !== 0) update(state.position + Math.sign(dx), false)
      },
      [state.position, update],
    ),
  )

  const narration = `Position ${state.position} selected. The marker can be dragged to any of ${N_POS} positions; the right pane shows the sinusoidal encoding shifting as you drag.`

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
        aria-label={`A row of eight position slots with a draggable vermilion marker at position ${state.position}.`}
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
          POSITION 0 ... 7
        </text>
        <text
          x={VIEW_W / 2}
          y={92}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          drag the marker; each slot gets a unique fingerprint
        </text>

        {/* Sentence chips (with two placeholders) */}
        {Array.from({ length: N_POS }).map((_, p) => {
          const x = X0 + p * (CHIP_W + CHIP_GAP)
          const isToken = p < TOKENS.length
          const active = p === state.position
          return (
            <g key={p}>
              <rect
                x={x}
                y={TOK_Y - 20}
                width={CHIP_W}
                height={40}
                rx={3}
                fill={
                  active
                    ? 'var(--color-vermilion)'
                    : isToken
                      ? 'var(--color-cream)'
                      : 'transparent'
                }
                stroke={isToken ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
                strokeDasharray={isToken ? undefined : '4 3'}
                strokeWidth={active ? 2 : 1}
              />
              <text
                x={x + CHIP_W / 2}
                y={TOK_Y + 4}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="14"
                fill={
                  active
                    ? 'var(--color-cream)'
                    : isToken
                      ? 'var(--color-ink)'
                      : 'var(--color-fade)'
                }
              >
                {isToken ? TOKENS[p] : '·'}
              </text>
              <text
                x={x + CHIP_W / 2}
                y={TOK_Y + 36}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="var(--color-dim)"
              >
                pos {p}
              </text>
            </g>
          )
        })}

        {/* Slider rail */}
        <line
          x1={xOfPos(0)}
          y1={SLIDER_Y}
          x2={xOfPos(N_POS - 1)}
          y2={SLIDER_Y}
          stroke="var(--color-graph-ink)"
          strokeOpacity={0.4}
          strokeWidth={1}
        />
        {Array.from({ length: N_POS }).map((_, p) => (
          <circle
            key={p}
            cx={xOfPos(p)}
            cy={SLIDER_Y}
            r={3}
            fill={p === state.position ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
          />
        ))}

        {/* Draggable marker */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Position marker at ${state.position}.`}
          aria-valuemin={0}
          aria-valuemax={N_POS - 1}
          aria-valuenow={state.position}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle]:stroke-vermilion-deep"
        >
          <circle
            cx={xOfPos(state.position)}
            cy={SLIDER_Y}
            r={11}
            fill="var(--color-vermilion)"
            stroke="var(--color-vermilion)"
            strokeWidth={2}
          />
          <text
            x={xOfPos(state.position)}
            y={SLIDER_Y + 4}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-cream)"
          >
            {state.position}
          </text>
        </g>

        {/* Caption */}
        <text
          x={VIEW_W / 2}
          y={SLIDER_Y + 64}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          position{' '}
          <tspan fontFamily="JetBrains Mono, monospace" fill="var(--color-vermilion)">
            p = {state.position}
          </tspan>
        </text>

        {/* Footer hint */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 16}
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
        Fig. 2a &mdash; A slot in the sentence
      </figcaption>
    </figure>
  )
}

interface RightProps {
  state: PosState
}

export function RightPane({ state }: RightProps) {
  const { position } = state

  // Plot four cosine/sine waves over position p = 0..7.
  // For wave index w (in 0..N_WAVES-1), use frequency from i = 2w
  //   PE(p, 2w) = sin(p / 10000^(2w/d))
  const PAD_L = 60
  const PAD_R = 30
  const TOP = 110
  const BOTTOM = VIEW_H - 60
  const PLOT_W = VIEW_W - PAD_L - PAD_R
  const PLOT_H = BOTTOM - TOP
  const ROW_H = PLOT_H / N_WAVES

  const xOf = (p: number) => PAD_L + (p / (N_POS - 1)) * PLOT_W

  const sampleResolution = 60
  const samples = Array.from({ length: sampleResolution + 1 }, (_, k) =>
    (k * (N_POS - 1)) / sampleResolution,
  )

  function waveValue(p: number, waveIdx: number): number {
    const i = 2 * waveIdx
    const power = i / D_MODEL
    const denom = Math.pow(MAX_PE_FREQ, power)
    return Math.sin(p / denom)
  }

  const narration = `Sinusoidal positional encodings. Four waves at frequencies decreasing with dimension. Position ${position} is the vertical marker.`

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
        aria-label={`Four sinusoidal waves over positions 0 to 7, evaluated at position ${position}.`}
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
          SIN AT FOUR FREQUENCIES
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
          PE(p, 2i) = sin(p / 10000<tspan baselineShift="super" fontSize="9">2i/d</tspan>)
        </text>

        {/* X-axis ticks */}
        {Array.from({ length: N_POS }).map((_, p) => (
          <g key={p}>
            <line
              x1={xOf(p)}
              y1={TOP - 8}
              x2={xOf(p)}
              y2={BOTTOM + 4}
              stroke="var(--color-graph-fade)"
              strokeWidth={0.5}
            />
            <text
              x={xOf(p)}
              y={BOTTOM + 18}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill="var(--color-dim)"
            >
              {p}
            </text>
          </g>
        ))}

        {/* Per-wave row */}
        {Array.from({ length: N_WAVES }).map((_, w) => {
          const rowY = TOP + w * ROW_H + ROW_H / 2
          const amp = (ROW_H / 2) * 0.7
          const i = 2 * w
          const period = Math.pow(MAX_PE_FREQ, i / D_MODEL)

          // Compute the path d="" for this wave.
          const d = samples
            .map((p, k) => {
              const v = waveValue(p, w)
              const x = xOf(p)
              const y = rowY - v * amp
              return `${k === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
            })
            .join(' ')

          const valHere = waveValue(position, w)

          return (
            <g key={w}>
              {/* Row separator */}
              {w > 0 && (
                <line
                  x1={PAD_L}
                  y1={TOP + w * ROW_H}
                  x2={VIEW_W - PAD_R}
                  y2={TOP + w * ROW_H}
                  stroke="var(--color-graph-fade)"
                  strokeWidth={0.5}
                  strokeDasharray="2 3"
                />
              )}
              {/* Center line */}
              <line
                x1={PAD_L}
                y1={rowY}
                x2={VIEW_W - PAD_R}
                y2={rowY}
                stroke="var(--color-graph-ink)"
                strokeOpacity={0.25}
                strokeWidth={0.6}
              />
              {/* Wave path */}
              <path
                d={d}
                fill="none"
                stroke="var(--color-vermilion)"
                strokeWidth={1.6}
                strokeOpacity={0.85}
              />
              {/* Label */}
              <text
                x={PAD_L - 8}
                y={rowY - amp + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="var(--color-dim)"
              >
                i={i}
              </text>
              <text
                x={PAD_L - 8}
                y={rowY + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="var(--color-dim)"
              >
                T={period < 100 ? period.toFixed(0) : period.toExponential(0)}
              </text>

              {/* Current-position dot */}
              <circle
                cx={xOf(position)}
                cy={rowY - valHere * amp}
                r={4}
                fill="var(--color-vermilion)"
                stroke="var(--color-cream)"
                strokeWidth={1.4}
              />
              <text
                x={xOf(position) + 8}
                y={rowY - valHere * amp - 6}
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="var(--color-vermilion)"
              >
                {valHere.toFixed(2)}
              </text>
            </g>
          )
        })}

        {/* Vertical position marker */}
        <line
          x1={xOf(position)}
          y1={TOP}
          x2={xOf(position)}
          y2={BOTTOM}
          stroke="var(--color-vermilion)"
          strokeWidth={1}
          strokeOpacity={0.45}
          strokeDasharray="3 3"
        />

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 16}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          HIGH FREQ AT TOP · LOW FREQ AT BOTTOM
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2b &mdash; Position as a stack of waves
      </figcaption>
    </figure>
  )
}
