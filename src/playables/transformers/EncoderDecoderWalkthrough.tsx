import { useRef, useCallback } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  SRC_EN,
  TGT_FR,
  crossAttention,
  attentionAlpha,
} from './tx'

/**
 * Act 6 — Encoder-decoder walkthrough.
 *
 *  Left  : a stylised mini-encoder stack on the left, a mini-decoder stack
 *          on the right. Source ("the cat sat on the mat") flows in from
 *          the left; output ("le chat était sur le tapis") emerges
 *          token-by-token as the step slider advances 0..6.
 *  Right : the cross-attention pattern at the current decoder step. A
 *          heatmap of source tokens (cols) against decoder positions
 *          generated so far (rows). The current step's row is bordered.
 *
 * Sync : left-drives-right.
 */

const N_STEPS = TGT_FR.length // 6
const CROSS = crossAttention() // hand-baked, see tx.ts

export interface WalkState {
  step: number // 0..N_STEPS  (0 = nothing emitted yet, N = all emitted)
  interacting: boolean
}

export const INITIAL_WALK: WalkState = { step: 3, interacting: false }

const clampStep = (s: number) => Math.max(0, Math.min(N_STEPS, s))

interface LeftProps {
  state: WalkState
  onChange: (next: WalkState) => void
}

export function LeftPane({ state, onChange }: LeftProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<number | null>(null)

  const update = useCallback(
    (s: number, interacting: boolean) => onChange({ step: clampStep(s), interacting }),
    [onChange],
  )

  // Layout: encoder column on the left, decoder column on the right.
  const ENC_X = 70
  const DEC_X = VIEW_W - 70 - 200
  const COL_W = 200
  const SRC_Y = 110
  const TGT_Y = SRC_Y
  const STACK_Y = SRC_Y + 60
  const STACK_H = 140
  const SLIDER_Y = 410

  // Token chip widths.
  const ENC_CHIP_W = (COL_W - 8) / SRC_EN.length
  const DEC_CHIP_W = (COL_W - 8) / N_STEPS

  // Slider geometry.
  const SLIDER_X0 = 80
  const SLIDER_X1 = VIEW_W - 80
  const xAtStep = (s: number) =>
    SLIDER_X0 + (s / N_STEPS) * (SLIDER_X1 - SLIDER_X0)

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startRef.current = state.step
    const start = startRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const span = (SLIDER_X1 - SLIDER_X0) / N_STEPS
    const dS = Math.round((mx * sx) / span)
    update(start + dS, !last)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx !== 0) update(state.step + Math.sign(dx), false)
      },
      [state.step, update],
    ),
  )

  const generated = state.step
  const emittedTokens = TGT_FR.slice(0, generated)
  const nextTok = generated < N_STEPS ? TGT_FR[generated] : null

  const narration = `Encoder reads the English. Decoder has emitted ${generated} of ${N_STEPS} French tokens so far: ${emittedTokens.join(' ') || '(none yet)'}. ${nextTok ? `Now generating ${nextTok}.` : 'Translation complete.'}`

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
        aria-label={`Encoder-decoder. The English source enters on the left; the French translation emerges token by token on the right. Step ${generated} of ${N_STEPS}.`}
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
          ENCODER &middot; DECODER &middot; STEP {generated} / {N_STEPS}
        </text>

        {/* Encoder source row */}
        <text
          x={ENC_X + COL_W / 2}
          y={SRC_Y - 10}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          SOURCE · EN
        </text>
        {SRC_EN.map((t, i) => {
          const x = ENC_X + 4 + i * ENC_CHIP_W
          return (
            <g key={`src-${i}`}>
              <rect
                x={x}
                y={SRC_Y}
                width={ENC_CHIP_W - 4}
                height={28}
                rx={2}
                fill="var(--color-cream)"
                stroke="var(--color-vermilion)"
                strokeWidth={1}
              />
              <text
                x={x + (ENC_CHIP_W - 4) / 2}
                y={SRC_Y + 18}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="12"
                fill="var(--color-ink)"
              >
                {t}
              </text>
            </g>
          )
        })}

        {/* Encoder stack */}
        <rect
          x={ENC_X}
          y={STACK_Y}
          width={COL_W}
          height={STACK_H}
          rx={4}
          fill="var(--color-cream)"
          stroke="var(--color-vermilion)"
          strokeOpacity={0.5}
          strokeWidth={1}
        />
        {[0, 1, 2].map((row) => (
          <text
            key={row}
            x={ENC_X + COL_W / 2}
            y={STACK_Y + 30 + row * 36}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            encoder block · {row + 1}
          </text>
        ))}
        <text
          x={ENC_X + COL_W / 2}
          y={STACK_Y + STACK_H + 20}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-vermilion)"
        >
          encoded states
        </text>

        {/* Decoder target row */}
        <text
          x={DEC_X + COL_W / 2}
          y={TGT_Y - 10}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          OUTPUT · FR
        </text>
        {TGT_FR.map((t, i) => {
          const x = DEC_X + 4 + i * DEC_CHIP_W
          const emitted = i < generated
          const current = i === generated - 1
          return (
            <g key={`tgt-${i}`}>
              <rect
                x={x}
                y={TGT_Y}
                width={DEC_CHIP_W - 4}
                height={28}
                rx={2}
                fill={
                  current
                    ? 'var(--color-vermilion)'
                    : emitted
                      ? 'var(--color-cream)'
                      : 'transparent'
                }
                stroke={emitted ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
                strokeDasharray={emitted ? undefined : '3 3'}
                strokeWidth={current ? 2 : 1}
              />
              <text
                x={x + (DEC_CHIP_W - 4) / 2}
                y={TGT_Y + 18}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="12"
                fill={
                  current
                    ? 'var(--color-cream)'
                    : emitted
                      ? 'var(--color-ink)'
                      : 'var(--color-fade)'
                }
              >
                {emitted ? t : '·'}
              </text>
            </g>
          )
        })}

        {/* Decoder stack */}
        <rect
          x={DEC_X}
          y={STACK_Y}
          width={COL_W}
          height={STACK_H}
          rx={4}
          fill="var(--color-cream)"
          stroke="var(--color-vermilion)"
          strokeOpacity={0.5}
          strokeWidth={1}
        />
        {[0, 1, 2].map((row) => (
          <text
            key={row}
            x={DEC_X + COL_W / 2}
            y={STACK_Y + 30 + row * 36}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            decoder block · {row + 1}
          </text>
        ))}

        {/* Bridge: encoder → decoder (K, V) */}
        <line
          x1={ENC_X + COL_W}
          y1={STACK_Y + STACK_H / 2}
          x2={DEC_X}
          y2={STACK_Y + STACK_H / 2}
          stroke="var(--color-vermilion)"
          strokeOpacity={0.55}
          strokeWidth={1.4}
        />
        <polygon
          points={`${DEC_X},${STACK_Y + STACK_H / 2} ${DEC_X - 8},${STACK_Y + STACK_H / 2 - 5} ${DEC_X - 8},${STACK_Y + STACK_H / 2 + 5}`}
          fill="var(--color-vermilion)"
          opacity={0.7}
        />
        <text
          x={(ENC_X + COL_W + DEC_X) / 2}
          y={STACK_Y + STACK_H / 2 - 8}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          K, V
        </text>
        <text
          x={(ENC_X + COL_W + DEC_X) / 2}
          y={STACK_Y + STACK_H / 2 + 22}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.2em"
          fill="var(--color-dim)"
        >
          CROSS-ATTN
        </text>

        {/* Slider */}
        <line
          x1={SLIDER_X0}
          y1={SLIDER_Y}
          x2={SLIDER_X1}
          y2={SLIDER_Y}
          stroke="var(--color-graph-ink)"
          strokeOpacity={0.45}
          strokeWidth={1}
        />
        {Array.from({ length: N_STEPS + 1 }).map((_, s) => (
          <g key={s}>
            <circle
              cx={xAtStep(s)}
              cy={SLIDER_Y}
              r={3}
              fill={s === state.step ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
            />
            <text
              x={xAtStep(s)}
              y={SLIDER_Y + 22}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill={s === state.step ? 'var(--color-vermilion)' : 'var(--color-dim)'}
            >
              {s}
            </text>
          </g>
        ))}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={N_STEPS}
          aria-valuenow={state.step}
          aria-label={`Decoder step ${state.step} of ${N_STEPS}.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle]:stroke-vermilion-deep"
        >
          <circle
            cx={xAtStep(state.step)}
            cy={SLIDER_Y}
            r={11}
            fill="var(--color-vermilion)"
            stroke="var(--color-vermilion)"
            strokeWidth={2}
          />
          <text
            x={xAtStep(state.step)}
            y={SLIDER_Y + 4}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-cream)"
          >
            {state.step}
          </text>
        </g>

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
        Fig. 6a &mdash; Translation, one token at a time
      </figcaption>
    </figure>
  )
}

interface RightProps {
  state: WalkState
}

export function RightPane({ state }: RightProps) {
  // Current decoder position is state.step - 1 (the one being generated).
  // For step 0 we show "nothing yet".
  const generated = state.step
  const currentPos = generated - 1 // 0..N_STEPS-1, or -1 if step=0

  const narration =
    generated === 0
      ? `No French tokens generated yet. The cross-attention matrix below shows how each French position will attend to the English source.`
      : `Cross-attention at decoder step ${generated}: generating ${TGT_FR[currentPos]}, with attention concentrated near English token ${SRC_EN[currentPos]}.`

  // Heatmap layout.
  const CELL = 50
  const N_FR = TGT_FR.length
  const N_EN = SRC_EN.length
  const GRID_X = (VIEW_W - N_EN * CELL) / 2
  const GRID_Y = 130

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
        aria-label={`Cross-attention heatmap, ${N_FR} French rows by ${N_EN} English columns.`}
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
          CROSS-ATTENTION · FR &times; EN
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
          where the decoder is looking, right now
        </text>

        {/* Column labels (EN) */}
        {SRC_EN.map((t, j) => (
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

        {/* Row labels (FR) */}
        {TGT_FR.map((t, i) => {
          const emitted = i < generated
          const isCurrent = i === currentPos
          return (
            <text
              key={`row-${i}`}
              x={GRID_X - 8}
              y={GRID_Y + i * CELL + CELL / 2 + 4}
              textAnchor="end"
              fontFamily="Source Serif 4, Georgia, serif"
              fontStyle="italic"
              fontSize="12"
              fill={
                isCurrent
                  ? 'var(--color-vermilion)'
                  : emitted
                    ? 'var(--color-ink)'
                    : 'var(--color-fade)'
              }
              fontWeight={isCurrent ? '600' : undefined}
            >
              {t}
            </text>
          )
        })}

        {/* Cells */}
        {CROSS.map((row, i) =>
          row.map((v, j) => {
            const emitted = i < generated
            const isCurrent = i === currentPos
            return (
              <g key={`${i}-${j}`}>
                <rect
                  x={GRID_X + j * CELL}
                  y={GRID_Y + i * CELL}
                  width={CELL}
                  height={CELL}
                  fill="var(--color-vermilion)"
                  fillOpacity={
                    emitted ? attentionAlpha(v) : 0.05 + attentionAlpha(v) * 0.15
                  }
                  stroke="var(--color-graph-fade)"
                  strokeWidth={0.5}
                />
                {v > 0.15 && emitted && (
                  <text
                    x={GRID_X + j * CELL + CELL / 2}
                    y={GRID_Y + i * CELL + CELL / 2 + 4}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    fill={v > 0.4 ? 'var(--color-cream)' : 'var(--color-ink)'}
                    fillOpacity={isCurrent ? 1 : 0.7}
                  >
                    {v.toFixed(2)}
                  </text>
                )}
              </g>
            )
          }),
        )}

        {/* Vermilion border around the current row */}
        {currentPos >= 0 && (
          <rect
            x={GRID_X - 1}
            y={GRID_Y + currentPos * CELL - 1}
            width={N_EN * CELL + 2}
            height={CELL + 2}
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth={2.4}
          />
        )}

        {/* Footer */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 36}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          {currentPos >= 0
            ? `step ${generated}: "${TGT_FR[currentPos]}" attends near "${SRC_EN[currentPos]}"`
            : 'advance the slider to begin translating'}
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 14}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ROWS SUM TO 1 · ONE ROW PER FRENCH POSITION
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6b &mdash; Where the decoder is looking
      </figcaption>
    </figure>
  )
}
