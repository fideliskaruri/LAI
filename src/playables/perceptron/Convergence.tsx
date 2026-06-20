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
  ETA,
  type PerceptronWeights,
} from './dataset'

/**
 * Act 5 — Rosenblatt's convergence theorem (1962). The data IS linearly
 * separable; show empirically that no matter where you start the weights,
 * the perceptron rule lands on a separating line in a finite number of
 * updates.
 *
 *  Left  : feature space + the current boundary, plus a "reroll" control
 *          that randomises the initial weights and replays training.
 *  Right : a horizontal bar showing "updates so far" against a running
 *          theoretical ceiling, plus a one-sentence theorem statement.
 *
 * Co-mutating state.
 */

export interface ConvergenceState {
  weights: PerceptronWeights
  updates: number
  cleanRun: number
  cursor: number
  /** Auto-play timer state — distinct from the LearningRule act because
   *  here we ALWAYS auto-play after a reroll. */
  playing: boolean
  /** Run id — bumped each reroll so the effect can re-fire deterministically. */
  runId: number
  /** Trail of past boundaries for the "watch it sweep into place" feel. */
  history: PerceptronWeights[]
}

/** A small LCG so the reroll is deterministic per session (no Math.random
 *  jitter on initial render). The seed lives in module scope so successive
 *  rerolls cycle through different inits without remounting state. */
let RNG_SEED = 0x12345678
function rng(): number {
  RNG_SEED = (RNG_SEED * 1103515245 + 12345) & 0x7fffffff
  return RNG_SEED / 0x7fffffff
}
function randomInit(): PerceptronWeights {
  return {
    w0: rng() * 2 - 1,
    w1: rng() * 2 - 1,
    w2: rng() * 2 - 1,
  }
}

const STARTING_WEIGHTS: PerceptronWeights = { w0: 0.8, w1: 0.7, w2: -0.6 }
export const INITIAL_CONVERGENCE: ConvergenceState = {
  weights: { ...STARTING_WEIGHTS },
  updates: 0,
  cleanRun: 0,
  cursor: 0,
  playing: true,
  runId: 0,
  history: [{ ...STARTING_WEIGHTS }],
}

const MAX_UPDATES = 300
const fmt0 = (n: number) => n.toFixed(0)

function stepOnce(s: ConvergenceState): ConvergenceState {
  if (s.cleanRun >= SEPARABLE_POINTS.length || s.updates >= MAX_UPDATES) {
    return { ...s, playing: false }
  }
  const idx = s.cursor % SEPARABLE_POINTS.length
  const p = SEPARABLE_POINTS[idx]
  const r = perceptronStep(s.weights, p, ETA)
  if (r.delta === 0) {
    return {
      ...s,
      cursor: (s.cursor + 1) % SEPARABLE_POINTS.length,
      cleanRun: s.cleanRun + 1,
    }
  }
  return {
    ...s,
    weights: r.w,
    cursor: (s.cursor + 1) % SEPARABLE_POINTS.length,
    updates: s.updates + 1,
    cleanRun: 0,
    history:
      s.history.length > 60
        ? [...s.history.slice(-30), r.w]
        : [...s.history, r.w],
  }
}

function reroll(s: ConvergenceState): ConvergenceState {
  const w = randomInit()
  return {
    weights: w,
    updates: 0,
    cleanRun: 0,
    cursor: 0,
    playing: true,
    runId: s.runId + 1,
    history: [w],
  }
}

/* ============================================================== */
/* LEFT PANE                                                       */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: ConvergenceState
  onChange: (s: ConvergenceState) => void
}) {
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Auto-play loop.
  useEffect(() => {
    if (!state.playing) return
    const id = window.setInterval(() => {
      const next = stepOnce(stateRef.current)
      onChange(next)
    }, 60)
    return () => window.clearInterval(id)
  }, [state.playing, state.runId, onChange])

  const handleReroll = useCallback(() => onChange(reroll(state)), [state, onChange])

  const ep = boundaryEndpoints(state.weights)
  const trail = state.history.slice(-10, -1)
  const mCount = misclassifiedCount(state.weights, SEPARABLE_POINTS)
  const converged = state.cleanRun >= SEPARABLE_POINTS.length

  const mis = new Set<number>()
  SEPARABLE_POINTS.forEach((p, i) => {
    if (predict(state.weights, p) !== p.y_label) mis.add(i)
  })

  const narration = converged
    ? `Converged. The boundary now separates the two classes after ${state.updates} updates.`
    : `Training. ${state.updates} updates so far. ${mCount} points still misclassified.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority={converged ? 'high' : 'normal'} />
      <svg
        viewBox={`0 0 ${VIEW_W} 480`}
        className="w-full h-auto"
        role="img"
        aria-label={`Feature space showing the perceptron's path to convergence. Updates ${state.updates}, misclassified ${mCount}.`}
      >
        <PlotAxes />

        {/* Trail */}
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
              strokeOpacity={0.04 + (i / trail.length) * 0.18}
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

        <ClassScatter pts={SEPARABLE_POINTS} misclass={mis} />

        {/* Readout */}
        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            CONVERGENCE &middot; UPDATE {fmt0(state.updates)}
          </text>
          <text
            y="20"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill={converged ? 'var(--color-vermilion)' : 'var(--color-ink)'}
          >
            {converged ? 'separated' : `${mCount} mistakes`}
          </text>
        </g>

        {/* Reroll button */}
        <g
          transform={`translate(${PLOT_X1 - 88}, ${PLOT_Y0 + 8})`}
          onClick={handleReroll}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleReroll()
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Reroll the initial weights and run training again."
          style={{ cursor: 'pointer' }}
          className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
        >
          <rect
            width="80"
            height="28"
            fill="var(--color-vermilion)"
            stroke="var(--color-vermilion)"
            strokeWidth="1.2"
          />
          <text
            x="40"
            y="18"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-cream)"
          >
            reroll
          </text>
        </g>

        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          REROLL &middot; ALWAYS LANDS ON A SEPARATOR
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4a &mdash; Same data, different starts &mdash; same destination
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — progress + theorem                                 */
/* ============================================================== */

export function RightPane({
  state,
}: {
  state: ConvergenceState
  onChange: (s: ConvergenceState) => void
}) {
  const mCount = misclassifiedCount(state.weights, SEPARABLE_POINTS)
  const converged = state.cleanRun >= SEPARABLE_POINTS.length
  const progress = Math.min(1, state.updates / 60) // rough visual scale

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={
          converged
            ? `Convergence theorem confirmed empirically. The perceptron rule reached a separating boundary in ${state.updates} updates.`
            : `Rosenblatt's 1962 theorem: if the data is linearly separable, the perceptron rule converges in finitely many steps. Updates so far ${state.updates}, mistakes ${mCount}.`
        }
        priority={converged ? 'high' : 'normal'}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} 480`}
        className="w-full h-auto"
        role="img"
        aria-label={`Convergence panel. Updates so far ${state.updates}. Misclassified ${mCount}.`}
      >
        {/* Frame */}
        <rect
          x="60"
          y="60"
          width={VIEW_W - 120}
          height="360"
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="100"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ROSENBLATT &middot; 1962
        </text>

        <text
          x={VIEW_W / 2}
          y="148"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-ink)"
        >
          If the data is linearly separable,
        </text>
        <text
          x={VIEW_W / 2}
          y="170"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-ink)"
        >
          the rule converges in finitely many steps.
        </text>

        <line
          x1={VIEW_W / 2 - 32}
          y1="200"
          x2={VIEW_W / 2 + 32}
          y2="200"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />

        {/* Progress bar */}
        <text
          x={120}
          y={250}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          UPDATES
        </text>
        <text
          x={VIEW_W - 120}
          y={250}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-ink)"
        >
          {fmt0(state.updates)}
        </text>
        <line
          x1={120}
          y1={266}
          x2={VIEW_W - 120}
          y2={266}
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />
        <line
          x1={120}
          y1={266}
          x2={120 + (VIEW_W - 240) * progress}
          y2={266}
          stroke="var(--color-vermilion)"
          strokeWidth="3"
        />

        {/* Status sentence */}
        <text
          x={VIEW_W / 2}
          y={320}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill={converged ? 'var(--color-vermilion)' : 'var(--color-dim)'}
        >
          {converged
            ? `separated after ${state.updates} updates`
            : `${mCount} of ${SEPARABLE_POINTS.length} still misclassified`}
        </text>

        <text
          x={VIEW_W / 2}
          y={370}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          Reroll the start &mdash; the theorem holds.
        </text>
        <text
          x={VIEW_W / 2}
          y={392}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          Different paths, same destination.
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4b &mdash; The theorem, in one line
      </figcaption>
    </figure>
  )
}
