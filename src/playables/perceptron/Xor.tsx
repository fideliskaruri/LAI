import { useCallback, useEffect, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { PlotAxes, ClassScatter } from './Axes'
import {
  XOR_POINTS,
  VIEW_W,
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  dataToSvgX,
  dataToSvgY,
  boundaryEndpoints,
  perceptronStep,
  predict,
  misclassifiedCount,
  ETA,
  type PerceptronWeights,
} from './dataset'

/**
 * Act 6 — XOR. Same machinery, fatal data.
 *
 *  Left  : feature space with the XOR pattern — positives in the lower-left
 *          and upper-right corners; negatives in the upper-left and lower-right.
 *          A train button runs the rule. The boundary thrashes but never
 *          separates more than two of the four clusters.
 *  Right : a "no-line-fits" diagram. The four corners of the unit square
 *          labelled with their XOR truth values. Three faint candidate lines
 *          are drawn, each labelled with the number of corners it
 *          misclassifies — always at least one.
 *
 * Co-mutating state.
 */

export interface XorState {
  weights: PerceptronWeights
  updates: number
  cursor: number
  /** Best (lowest) mistake count seen across this run — for the readout. */
  bestMistakes: number
  /** Auto-play state. */
  playing: boolean
  /** Trail for the visual chaos. */
  history: PerceptronWeights[]
}

const XOR_START: PerceptronWeights = { w0: 0.0, w1: 0.5, w2: 0.3 }
export const INITIAL_XOR: XorState = {
  weights: { ...XOR_START },
  updates: 0,
  cursor: 0,
  bestMistakes: XOR_POINTS.length,
  playing: false,
  history: [{ ...XOR_START }],
}

const MAX_UPDATES = 250
const fmt0 = (n: number) => n.toFixed(0)

function stepOnce(s: XorState): XorState {
  if (s.updates >= MAX_UPDATES) return { ...s, playing: false }
  const idx = s.cursor % XOR_POINTS.length
  const p = XOR_POINTS[idx]
  const r = perceptronStep(s.weights, p, ETA)
  const nextCursor = (s.cursor + 1) % XOR_POINTS.length
  if (r.delta === 0) {
    return { ...s, cursor: nextCursor }
  }
  const next: XorState = {
    ...s,
    weights: r.w,
    cursor: nextCursor,
    updates: s.updates + 1,
    history:
      s.history.length > 80
        ? [...s.history.slice(-40), r.w]
        : [...s.history, r.w],
  }
  const m = misclassifiedCount(r.w, XOR_POINTS)
  if (m < next.bestMistakes) next.bestMistakes = m
  return next
}

function resetState(): XorState {
  return { ...INITIAL_XOR, history: [{ ...XOR_START }] }
}

/* ============================================================== */
/* LEFT PANE                                                       */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: XorState
  onChange: (s: XorState) => void
}) {
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    if (!state.playing) return
    const id = window.setInterval(() => {
      onChange(stepOnce(stateRef.current))
    }, 70)
    return () => window.clearInterval(id)
  }, [state.playing, onChange])

  const handleStep = useCallback(() => onChange(stepOnce(state)), [state, onChange])
  const handlePlay = useCallback(
    () => onChange({ ...state, playing: !state.playing }),
    [state, onChange],
  )
  const handleReset = useCallback(() => onChange(resetState()), [onChange])

  const ep = boundaryEndpoints(state.weights)
  const trail = state.history.slice(-12, -1)
  const mCount = misclassifiedCount(state.weights, XOR_POINTS)

  const mis = new Set<number>()
  XOR_POINTS.forEach((p, i) => {
    if (predict(state.weights, p) !== p.y_label) mis.add(i)
  })

  const stuck = state.updates > 40 && state.bestMistakes > 0
  const narration = stuck
    ? `After ${state.updates} updates the perceptron still misclassifies at least ${state.bestMistakes} of ${XOR_POINTS.length} points. There is no line that can separate the XOR pattern.`
    : `Training on XOR. ${state.updates} updates so far, ${mCount} misclassified right now.`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority={stuck ? 'high' : 'normal'}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} 480`}
        className="w-full h-auto"
        role="img"
        aria-label={`The XOR pattern in feature space. ${state.updates} updates so far. ${mCount} points misclassified by the current line.`}
      >
        <PlotAxes />

        {/* Trail of past lines — paints the chaos */}
        {trail.map((w, i) => {
          const tep = boundaryEndpoints(w)
          if (!tep) return null
          return (
            <line
              key={i}
              x1={dataToSvgX(tep.x1)}
              y1={dataToSvgY(tep.y1)}
              x2={dataToSvgX(tep.x2)}
              y2={dataToSvgY(tep.y2)}
              stroke="var(--color-vermilion)"
              strokeWidth="1"
              strokeOpacity={0.05 + (i / trail.length) * 0.16}
            />
          )
        })}

        {ep && (
          <line
            x1={dataToSvgX(ep.x1)}
            y1={dataToSvgY(ep.y1)}
            x2={dataToSvgX(ep.x2)}
            y2={dataToSvgY(ep.y2)}
            stroke="var(--color-vermilion)"
            strokeWidth="2.2"
          />
        )}

        <ClassScatter pts={XOR_POINTS} misclass={mis} />

        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            XOR &middot; UPDATE {fmt0(state.updates)}
          </text>
          <text
            y="20"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-ink)"
          >
            misclassified = {mCount} / {XOR_POINTS.length}
          </text>
          <text
            y="38"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-vermilion)"
          >
            best so far = {state.bestMistakes}
          </text>
        </g>

        {/* Controls */}
        <ControlButton
          x={PLOT_X1 - 188}
          y={PLOT_Y0 + 8}
          width={56}
          variant="primary"
          label="train"
          ariaLabel="Apply one perceptron update on the XOR data."
          onClick={handleStep}
        />
        <ControlButton
          x={PLOT_X1 - 124}
          y={PLOT_Y0 + 8}
          width={60}
          variant="outline"
          label={state.playing ? 'pause' : 'play'}
          ariaLabel={state.playing ? 'Pause auto-training.' : 'Auto-train.'}
          onClick={handlePlay}
        />
        <ControlButton
          x={PLOT_X1 - 56}
          y={PLOT_Y0 + 8}
          width={48}
          variant="outline"
          label="reset"
          ariaLabel="Reset weights."
          onClick={handleReset}
        />

        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TRAIN &middot; THE LINE NEVER LANDS
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5a &mdash; A pattern no straight line can separate
      </figcaption>
    </figure>
  )
}

function ControlButton({
  x,
  y,
  width,
  variant,
  label,
  ariaLabel,
  onClick,
}: {
  x: number
  y: number
  width: number
  variant: 'primary' | 'outline'
  label: string
  ariaLabel: string
  onClick: () => void
}) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      style={{ cursor: 'pointer' }}
      className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
    >
      <rect
        width={width}
        height="28"
        fill={variant === 'primary' ? 'var(--color-vermilion)' : 'transparent'}
        stroke="var(--color-vermilion)"
        strokeWidth="1.2"
      />
      <text
        x={width / 2}
        y="18"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="12"
        fill={
          variant === 'primary' ? 'var(--color-cream)' : 'var(--color-vermilion)'
        }
      >
        {label}
      </text>
    </g>
  )
}

/* ============================================================== */
/* RIGHT PANE — XOR truth table and the impossibility              */
/* ============================================================== */

export function RightPane() {
  // Canonical XOR truth-table picture: the four corners of the unit square
  // labelled with their xor outputs. Three illustrative candidate lines drawn
  // faintly across, each labelled with the count of corners it gets wrong.

  const PLOT_X0_R = 130
  const PLOT_X1_R = VIEW_W - 130
  const PLOT_Y0_R = 130
  const PLOT_Y1_R = 380
  const PW = PLOT_X1_R - PLOT_X0_R
  const PH = PLOT_Y1_R - PLOT_Y0_R

  // (a, b) in {0,1}² → svg
  const toSvg = (a: 0 | 1, b: 0 | 1) => ({
    x: PLOT_X0_R + a * PW,
    y: PLOT_Y1_R - b * PH,
  })

  // Corners with their XOR values
  const corners: { a: 0 | 1; b: 0 | 1; xor: 0 | 1 }[] = [
    { a: 0, b: 0, xor: 0 },
    { a: 0, b: 1, xor: 1 },
    { a: 1, b: 0, xor: 1 },
    { a: 1, b: 1, xor: 0 },
  ]

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The XOR truth table, laid out on the unit square. Positive at zero zero and one one, negative at zero one and one zero. The same labels sit on diagonally opposite corners, so no straight line can put both positive corners on one side. Minsky and Papert wrote down this fact and stopped the field for a decade."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} 480`}
        className="w-full h-auto"
        role="img"
        aria-label="The four corners of the unit square labelled with their XOR truth values. Positive at zero zero and one one; negative at zero one and one zero. No straight line can separate them."
      >
        {/* Frame */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height="400"
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="80"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          XOR &middot; MINSKY &amp; PAPERT &middot; 1969
        </text>

        {/* Unit square */}
        <rect
          x={PLOT_X0_R}
          y={PLOT_Y0_R}
          width={PW}
          height={PH}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="0.8"
        />

        {/* Three candidate lines, each labelled with mistake count.
            Lines drawn so they're clearly NOT separating the diagonal. */}
        <g>
          {/* Vertical-ish */}
          <line
            x1={PLOT_X0_R + PW * 0.5}
            y1={PLOT_Y0_R - 8}
            x2={PLOT_X0_R + PW * 0.5}
            y2={PLOT_Y1_R + 8}
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
            strokeOpacity="0.35"
            strokeDasharray="3 3"
          />
          <text
            x={PLOT_X0_R + PW * 0.5 + 4}
            y={PLOT_Y0_R - 12}
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-dim)"
          >
            2 wrong
          </text>

          {/* Horizontal-ish */}
          <line
            x1={PLOT_X0_R - 8}
            y1={PLOT_Y0_R + PH * 0.5}
            x2={PLOT_X1_R + 8}
            y2={PLOT_Y0_R + PH * 0.5}
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
            strokeOpacity="0.35"
            strokeDasharray="3 3"
          />
          <text
            x={PLOT_X1_R + 12}
            y={PLOT_Y0_R + PH * 0.5 + 4}
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-dim)"
          >
            2 wrong
          </text>

          {/* Diagonal */}
          <line
            x1={PLOT_X0_R - 8}
            y1={PLOT_Y0_R - 8}
            x2={PLOT_X1_R + 8}
            y2={PLOT_Y1_R + 8}
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
            strokeOpacity="0.35"
            strokeDasharray="3 3"
          />
          <text
            x={PLOT_X1_R + 12}
            y={PLOT_Y1_R + 4}
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-dim)"
          >
            2 wrong
          </text>
        </g>

        {/* Corner dots and labels */}
        {corners.map((c, i) => {
          const { x, y } = toSvg(c.a, c.b)
          const color =
            c.xor === 1 ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="8" fill={color} stroke={color} strokeWidth="1" />
              <text
                x={x + 16}
                y={y + 4}
                fontFamily="JetBrains Mono, monospace"
                fontSize="12"
                fill="var(--color-ink)"
              >
                ({c.a}, {c.b}) → {c.xor}
              </text>
            </g>
          )
        })}

        <text
          x={VIEW_W / 2}
          y={420}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          no straight line separates the diagonals
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5b &mdash; The truth-table picture
      </figcaption>
    </figure>
  )
}
