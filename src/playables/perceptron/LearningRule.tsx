import { useCallback, useEffect, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { PlotAxes, ClassScatter } from './Axes'
import {
  SEPARABLE_POINTS,
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
  INITIAL_WEIGHTS,
  ETA,
  type PerceptronWeights,
  type LabeledPt,
} from './dataset'

/**
 * Act 4 — the learning rule. The reader sees the same feature space as act
 * 3, but now overlaid with labelled training data. Click "train" and the
 * perceptron rule fires:
 *
 *     w ← w + η (y − ŷ) x
 *
 * for one misclassified point at a time. The decision boundary rotates and
 * translates after each update; mid-stream, the most recently updated point
 * pulses; once everything is classified correctly, the training stops.
 *
 *  Left  : feature space with labelled points, current boundary, history
 *          trail of past boundaries, and a step / play / reset control bar.
 *  Right : a "weights inspector" — three bars showing w0 (bias), w1, w2
 *          and the current rule readout (which point fired, which side of
 *          the boundary it was on, how the weights moved).
 *
 * Co-mutating state.
 */

export interface LearningState {
  weights: PerceptronWeights
  /** Index of the point we will examine next (0..N−1). */
  cursor: number
  /** Number of weight updates applied (not iterations). */
  updates: number
  /** Number of consecutive correct classifications since the last update;
   *  if it reaches POINTS.length the perceptron has converged. */
  cleanRun: number
  /** History of (w0,w1,w2) for the boundary trail. */
  history: PerceptronWeights[]
  /** Index of the last point we updated on — for the highlight ring. */
  lastUpdateIdx: number | null
  /** Sign of the last update: +1 (false negative pushed toward), −1 (false
   *  positive pushed away), 0 (none). */
  lastDelta: -1 | 0 | 1
  /** Whether the auto-play timer is running. */
  playing: boolean
}

export const INITIAL_LEARNING: LearningState = {
  weights: { ...INITIAL_WEIGHTS },
  cursor: 0,
  updates: 0,
  cleanRun: 0,
  history: [{ ...INITIAL_WEIGHTS }],
  lastUpdateIdx: null,
  lastDelta: 0,
  playing: false,
}

const MAX_UPDATES = 200
const fmt2 = (n: number) => n.toFixed(2)

/**
 * Take ONE step of the rule. Walk to the cursor; if the point is
 * misclassified, update and reset the clean run. If it's already correct,
 * advance the cursor and increment the clean run. Convergence = cleanRun
 * equals the dataset size after a clean pass.
 */
function stepOnce(s: LearningState, pts: LabeledPt[]): LearningState {
  if (s.cleanRun >= pts.length || s.updates >= MAX_UPDATES) return s
  const idx = s.cursor % pts.length
  const p = pts[idx]
  const r = perceptronStep(s.weights, p, ETA)
  if (r.delta === 0) {
    return {
      ...s,
      cursor: (s.cursor + 1) % pts.length,
      cleanRun: s.cleanRun + 1,
    }
  }
  return {
    weights: r.w,
    cursor: (s.cursor + 1) % pts.length,
    updates: s.updates + 1,
    cleanRun: 0,
    history:
      s.history.length > 60
        ? [...s.history.slice(-30), r.w]
        : [...s.history, r.w],
    lastUpdateIdx: idx,
    lastDelta: r.delta,
    playing: s.playing,
  }
}

function resetState(): LearningState {
  return { ...INITIAL_LEARNING, history: [{ ...INITIAL_WEIGHTS }] }
}

/* ============================================================== */
/* LEFT PANE — feature space + train controls                      */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: LearningState
  onChange: (s: LearningState) => void
}) {
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Auto-play loop: tick every 80ms while playing, stop on convergence.
  useEffect(() => {
    if (!state.playing) return
    const id = window.setInterval(() => {
      const cur = stateRef.current
      const next = stepOnce(cur, SEPARABLE_POINTS)
      // Stop when converged or maxed out.
      if (
        next.cleanRun >= SEPARABLE_POINTS.length ||
        next.updates >= MAX_UPDATES
      ) {
        onChange({ ...next, playing: false })
      } else {
        onChange(next)
      }
    }, 80)
    return () => window.clearInterval(id)
  }, [state.playing, onChange])

  const handleStep = useCallback(
    () => onChange(stepOnce(state, SEPARABLE_POINTS)),
    [state, onChange],
  )
  const handlePlay = useCallback(
    () => onChange({ ...state, playing: !state.playing }),
    [state, onChange],
  )
  const handleReset = useCallback(() => onChange(resetState()), [onChange])

  // Boundary lines: current + a short trail of the previous few.
  const ep = boundaryEndpoints(state.weights)
  const trail = state.history.slice(-8, -1)

  // Misclassified set for the visual rings.
  const mis = new Set<number>()
  SEPARABLE_POINTS.forEach((p, i) => {
    if (predict(state.weights, p) !== p.y_label) mis.add(i)
  })

  const mCount = misclassifiedCount(state.weights, SEPARABLE_POINTS)
  const converged = state.cleanRun >= SEPARABLE_POINTS.length

  const narration = converged
    ? `Converged. The perceptron now classifies all ${SEPARABLE_POINTS.length} points correctly after ${state.updates} weight updates.`
    : state.lastUpdateIdx === null
      ? `Twenty labelled points. Click train to apply the perceptron rule one step at a time.`
      : `Update ${state.updates}. ${mCount === 0 ? 'No mistakes remain.' : `${mCount} points still misclassified.`}`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority={converged ? 'high' : 'normal'}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} 480`}
        className="w-full h-auto"
        role="img"
        aria-label={`Feature space with twenty labelled points, the current decision boundary, and a train button. Updates so far ${state.updates}. Misclassified ${mCount}.`}
      >
        <PlotAxes />

        {/* Boundary trail (faint) */}
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
              strokeOpacity={0.06 + (i / trail.length) * 0.18}
            />
          )
        })}

        {/* Current boundary */}
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

        {/* Points */}
        <ClassScatter
          pts={SEPARABLE_POINTS}
          highlight={state.lastUpdateIdx}
          misclass={mis}
        />

        {/* Readout (top-left) */}
        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            PERCEPTRON RULE &middot; UPDATE {state.updates}
          </text>
          <text
            y="20"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill={mCount === 0 ? 'var(--color-vermilion)' : 'var(--color-ink)'}
          >
            misclassified = {mCount} / {SEPARABLE_POINTS.length}
          </text>
        </g>

        {/* Buttons: train (single step) · play · reset */}
        <ControlButton
          x={PLOT_X1 - 188}
          y={PLOT_Y0 + 8}
          width={56}
          variant="primary"
          label="train"
          ariaLabel={`Apply one perceptron update. Updates so far ${state.updates}.`}
          onClick={handleStep}
        />
        <ControlButton
          x={PLOT_X1 - 124}
          y={PLOT_Y0 + 8}
          width={60}
          variant="outline"
          label={state.playing ? 'pause' : 'play'}
          ariaLabel={
            state.playing ? 'Pause auto-training.' : 'Auto-train until convergence.'
          }
          onClick={handlePlay}
        />
        <ControlButton
          x={PLOT_X1 - 56}
          y={PLOT_Y0 + 8}
          width={48}
          variant="outline"
          label="reset"
          ariaLabel="Reset the weights and start over."
          onClick={handleReset}
        />

        {/* Hint */}
        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TRAIN &middot; ONE UPDATE PER MISCLASSIFIED POINT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3a &mdash; The boundary rotates into place
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
/* RIGHT PANE — weights inspector + rule readout                   */
/* ============================================================== */

export function RightPane({
  state,
  onChange,
}: {
  state: LearningState
  onChange: (s: LearningState) => void
}) {
  // Mirror handlers so the buttons on this side also work.
  const handleStep = useCallback(
    () => onChange(stepOnce(state, SEPARABLE_POINTS)),
    [state, onChange],
  )
  const handleReset = useCallback(() => onChange(resetState()), [onChange])

  const W_RANGE = 3
  const BAR_X = 150
  const BAR_W = 240
  const ROW_H = 50
  const BAR_Y0 = 150

  const bars = [
    { label: 'w₀', value: state.weights.w0 },
    { label: 'w₁', value: state.weights.w1 },
    { label: 'w₂', value: state.weights.w2 },
  ]

  const mid = BAR_X + BAR_W / 2
  const valToPx = (v: number) =>
    mid + (Math.max(-W_RANGE, Math.min(W_RANGE, v)) / W_RANGE) * (BAR_W / 2)

  // Sentence describing the last update.
  const lastSentence =
    state.lastUpdateIdx === null
      ? 'no updates yet'
      : state.lastDelta === 1
        ? `last point was red but predicted blue — pushed w toward it`
        : state.lastDelta === -1
          ? `last point was blue but predicted red — pushed w away`
          : 'last point was already correct'

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Weights inspector. w0 equals ${fmt2(state.weights.w0)}, w1 equals ${fmt2(state.weights.w1)}, w2 equals ${fmt2(state.weights.w2)}. ${lastSentence}.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} 480`}
        className="w-full h-auto"
        role="img"
        aria-label={`The current perceptron weights. w0 ${fmt2(state.weights.w0)}, w1 ${fmt2(state.weights.w1)}, w2 ${fmt2(state.weights.w2)}.`}
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
          y="78"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          WEIGHTS &middot; AFTER {state.updates} UPDATES
        </text>

        {/* Reference for the bars: zero line + range labels */}
        <line
          x1={mid}
          y1={BAR_Y0 - 12}
          x2={mid}
          y2={BAR_Y0 + bars.length * ROW_H - 8}
          stroke="var(--color-graph-fade)"
          strokeWidth="0.8"
        />
        <text
          x={BAR_X}
          y={BAR_Y0 - 18}
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-dim)"
          textAnchor="start"
        >
          −{W_RANGE}
        </text>
        <text
          x={mid}
          y={BAR_Y0 - 18}
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-dim)"
          textAnchor="middle"
        >
          0
        </text>
        <text
          x={BAR_X + BAR_W}
          y={BAR_Y0 - 18}
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-dim)"
          textAnchor="end"
        >
          +{W_RANGE}
        </text>

        {/* Bars */}
        {bars.map((b, i) => {
          const y = BAR_Y0 + i * ROW_H
          const px = valToPx(b.value)
          const positive = b.value >= 0
          return (
            <g key={b.label}>
              {/* Track */}
              <line
                x1={BAR_X}
                y1={y}
                x2={BAR_X + BAR_W}
                y2={y}
                stroke="var(--color-graph-fade)"
                strokeWidth="0.6"
              />
              {/* Bar */}
              <line
                x1={mid}
                y1={y}
                x2={px}
                y2={y}
                stroke="var(--color-vermilion)"
                strokeWidth="6"
                strokeLinecap="butt"
                strokeOpacity={positive ? 0.9 : 0.6}
              />
              <text
                x={BAR_X - 14}
                y={y + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontSize="13"
                fill="var(--color-ink)"
              >
                {b.label}
              </text>
              <text
                x={BAR_X + BAR_W + 14}
                y={y + 4}
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-vermilion)"
              >
                {fmt2(b.value)}
              </text>
            </g>
          )
        })}

        {/* The learning rule itself, rendered as a typeset line */}
        <text
          x={VIEW_W / 2}
          y={330}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE RULE
        </text>
        <text
          x={VIEW_W / 2}
          y={356}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="14"
          fill="var(--color-ink)"
        >
          w ← w + η (y − ŷ) x
        </text>
        <text
          x={VIEW_W / 2}
          y={380}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          {lastSentence}
        </text>

        {/* Mirrored controls */}
        <ControlButton
          x={VIEW_W - 220}
          y={420}
          width={56}
          variant="primary"
          label="train"
          ariaLabel="Apply one perceptron update."
          onClick={handleStep}
        />
        <ControlButton
          x={VIEW_W - 156}
          y={420}
          width={56}
          variant="outline"
          label="reset"
          ariaLabel="Reset the weights."
          onClick={handleReset}
        />
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3b &mdash; What changes inside the box
      </figcaption>
    </figure>
  )
}
