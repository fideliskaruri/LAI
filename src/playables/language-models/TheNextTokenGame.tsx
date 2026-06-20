import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { VIEW_W, VIEW_H, VOCAB, softmax, entropyBits, fmt2, pct } from './lm'

/**
 * Act 1 — the next-token game. left-drives-right.
 *
 *  Left  : the prompt "the cat sat on the ___" plus a temperature slider
 *          (0.3 to 2.0). The slider position drives the right pane.
 *  Right : a bar chart of softmax(logits / T) over a 5-word vocabulary.
 *          Bars sharpen toward "mat" as T → 0.3; flatten toward uniform
 *          as T → 2.0.
 *
 * left-drives-right: the right pane re-derives from the left state.
 */

export interface NextTokenState {
  /** Temperature, clamped to [T_MIN, T_MAX]. */
  T: number
  /** Whether the user is currently dragging the slider. */
  interacting: boolean
}

export const T_MIN = 0.3
export const T_MAX = 2.0
export const INITIAL_NEXT_TOKEN: NextTokenState = { T: 1.0, interacting: false }

export function deriveNextTokenRight(left: NextTokenState): NextTokenState {
  // Right pane reads the same state — left-drives-right.
  return { ...left }
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/* ============================================================== */
/* LEFT PANE — prompt + temperature slider                          */
/* ============================================================== */

const PROMPT_TOKENS = ['the', 'cat', 'sat', 'on', 'the']

const SLIDER_X_MIN = 90
const SLIDER_X_MAX = VIEW_W - 90
const SLIDER_Y = 400

const TtoX = (T: number) =>
  SLIDER_X_MIN + ((T - T_MIN) / (T_MAX - T_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const XtoT = (x: number) =>
  T_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (T_MAX - T_MIN)

export function LeftPane({
  state,
  onChange,
}: {
  state: NextTokenState
  onChange: (s: NextTokenState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<number | null>(null)

  const set = useCallback(
    (T: number, interacting: boolean) =>
      onChange({ T: clamp(T, T_MIN, T_MAX), interacting }),
    [onChange],
  )

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startRef.current = state.T
    const start = startRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const dx = mx * sx
    const newX = TtoX(start) + dx
    set(XtoT(newX), !last)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        set(state.T + dx * 0.05, false)
      },
      [state.T, set],
    ),
  )

  const handleX = TtoX(state.T)
  const tempLabel =
    state.T < 0.7 ? 'sharp · greedy' : state.T < 1.3 ? 'natural' : 'flat · creative'

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Prompt: the cat sat on the blank. Temperature ${fmt2(state.T).trim()}. ${state.T < 0.7 ? 'A low temperature concentrates the probability on the single most likely word.' : state.T < 1.3 ? 'Around one, the distribution is the model’s natural calibration.' : 'A high temperature flattens the distribution, mixing in less likely words.'}`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`The prompt the cat sat on the blank, with a temperature slider at ${fmt2(state.T).trim()}.`}
      >
        <text
          x={VIEW_W / 2}
          y="36"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ONE BLANK · FIVE CHOICES
        </text>

        {/* Prompt */}
        <g transform="translate(0, 140)">
          {PROMPT_TOKENS.map((tok, i) => {
            const x = 60 + i * 84
            return (
              <g key={i}>
                <rect
                  x={x}
                  y="-30"
                  width="74"
                  height="44"
                  fill="var(--color-cream-deep, #F3EFE6)"
                  stroke="var(--color-graph-fade)"
                  strokeWidth="0.8"
                  rx="3"
                />
                <text
                  x={x + 37}
                  y="0"
                  textAnchor="middle"
                  fontFamily="Source Serif 4, Georgia, serif"
                  fontSize="18"
                  fill="var(--color-ink)"
                >
                  {tok}
                </text>
              </g>
            )
          })}
          {/* Vermilion blank */}
          <rect
            x={60 + 5 * 84}
            y="-30"
            width="74"
            height="44"
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="1.6"
            strokeDasharray="4 3"
            rx="3"
          />
          <text
            x={60 + 5 * 84 + 37}
            y="0"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="18"
            fill="var(--color-vermilion)"
          >
            ___
          </text>
        </g>

        {/* Slider */}
        <text
          x={SLIDER_X_MIN}
          y={SLIDER_Y - 38}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TEMPERATURE · T
        </text>
        <text
          x={SLIDER_X_MAX}
          y={SLIDER_Y - 38}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          T = {fmt2(state.T)}
        </text>

        <line
          x1={SLIDER_X_MIN}
          y1={SLIDER_Y}
          x2={SLIDER_X_MAX}
          y2={SLIDER_Y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        {/* Tick marks */}
        {[T_MIN, 0.7, 1.0, 1.5, T_MAX].map((t, i) => (
          <g key={i}>
            <line
              x1={TtoX(t)}
              y1={SLIDER_Y - 6}
              x2={TtoX(t)}
              y2={SLIDER_Y + 6}
              stroke="var(--color-graph-fade)"
              strokeWidth="1"
            />
            <text
              x={TtoX(t)}
              y={SLIDER_Y + 22}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {t.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Slider knob */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label="Temperature slider"
          aria-valuemin={T_MIN}
          aria-valuemax={T_MAX}
          aria-valuenow={state.T}
          aria-valuetext={`${fmt2(state.T).trim()}, ${tempLabel}`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_.knob]:stroke-vermilion-deep"
        >
          <circle cx={handleX} cy={SLIDER_Y} r="22" fill="transparent" />
          <circle
            className="knob"
            cx={handleX}
            cy={SLIDER_Y}
            r="9"
            fill="var(--color-vermilion)"
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 30}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          {tempLabel}
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1a &mdash; Drag the slider · arrows nudge
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — probability bar chart                              */
/* ============================================================== */

export function RightPane({ state }: { state: NextTokenState }) {
  const logits = VOCAB.map((v) => v.logit)
  const probs = softmax(logits, state.T)
  const H = entropyBits(probs)
  const topIdx = probs.indexOf(Math.max(...probs))

  const CHART_TOP = 90
  const CHART_BOTTOM = VIEW_H - 130
  const CHART_H = CHART_BOTTOM - CHART_TOP
  const N = VOCAB.length
  const BAR_W = 56
  const GAP = 24
  const TOTAL_W = N * BAR_W + (N - 1) * GAP
  const LEFT_PAD = (VIEW_W - TOTAL_W) / 2

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The probability bar chart over five candidate next-words. Mat ${pct(probs[0])}. Dog ${pct(probs[1])}. End ${pct(probs[2])}. Hat ${pct(probs[3])}. Ball ${pct(probs[4])}. The distribution’s entropy is ${fmt2(H).trim()} bits.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Bar chart of next-token probability over five candidates. Top candidate: ${VOCAB[topIdx].word} at ${pct(probs[topIdx])}.`}
      >
        <text
          x={VIEW_W / 2}
          y="36"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          p(next | the cat sat on the)
        </text>

        {/* Axis baseline */}
        <line
          x1={LEFT_PAD - 12}
          y1={CHART_BOTTOM}
          x2={LEFT_PAD + TOTAL_W + 12}
          y2={CHART_BOTTOM}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.9"
        />
        {/* Horizontal gridline at 0.5 */}
        <line
          x1={LEFT_PAD - 12}
          y1={CHART_BOTTOM - CHART_H * 0.5}
          x2={LEFT_PAD + TOTAL_W + 12}
          y2={CHART_BOTTOM - CHART_H * 0.5}
          stroke="var(--color-graph-fade)"
          strokeWidth="0.6"
          strokeDasharray="3 3"
        />
        <text
          x={LEFT_PAD - 18}
          y={CHART_BOTTOM - CHART_H * 0.5 + 4}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-dim)"
        >
          0.5
        </text>
        <text
          x={LEFT_PAD - 18}
          y={CHART_BOTTOM + 4}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-dim)"
        >
          0.0
        </text>

        {/* Bars */}
        {VOCAB.map((v, i) => {
          const x = LEFT_PAD + i * (BAR_W + GAP)
          const h = probs[i] * CHART_H
          const isTop = i === topIdx
          return (
            <g key={v.id}>
              <rect
                x={x}
                y={CHART_BOTTOM - h}
                width={BAR_W}
                height={h}
                fill={isTop ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
                fillOpacity={isTop ? 0.92 : 0.78}
              />
              <text
                x={x + BAR_W / 2}
                y={CHART_BOTTOM - h - 8}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill={isTop ? 'var(--color-vermilion)' : 'var(--color-ink)'}
              >
                {pct(probs[i])}
              </text>
              <text
                x={x + BAR_W / 2}
                y={CHART_BOTTOM + 22}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontSize="14"
                fontWeight={isTop ? 600 : 400}
                fill="var(--color-ink)"
              >
                {v.word}
              </text>
              <text
                x={x + BAR_W / 2}
                y={CHART_BOTTOM + 38}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="var(--color-dim)"
              >
                z = {v.logit.toFixed(1)}
              </text>
            </g>
          )
        })}

        {/* Entropy readout */}
        <g transform={`translate(60, ${VIEW_H - 50})`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            ENTROPY
          </text>
          <text
            y="18"
            fontFamily="JetBrains Mono, monospace"
            fontSize="13"
            fill="var(--color-vermilion)"
          >
            H = {fmt2(H)} bits
          </text>
        </g>
        <g transform={`translate(${VIEW_W - 60}, ${VIEW_H - 50})`}>
          <text
            textAnchor="end"
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            SAMPLE
          </text>
          <text
            y="18"
            textAnchor="end"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="13"
            fill="var(--color-ink)"
          >
            … on the {VOCAB[topIdx].word}.
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1b &mdash; The distribution sharpens or flattens with T
      </figcaption>
    </figure>
  )
}
