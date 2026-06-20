import { useCallback, useMemo } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { PlotAxes, ClassScatter } from './Axes'
import {
  POINTS,
  VIEW_W,
  VIEW_H,
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  dataToSvgX,
  dataToSvgY,
  logLoss,
  gradStep,
  toWeights,
  fromWeights,
  boundaryEndpoints,
  INITIAL_BOUNDARY,
  type BoundaryState,
} from './dataset'

/**
 * Act 5 — the connection back to Optimization.
 *
 *  Left  : same feature space and current boundary, plus a trail of the
 *          previous boundaries faded behind it. As the reader clicks "step",
 *          the line rotates and slides toward the optimal cut.
 *  Right : a 2D loss-landscape projection — a heat map of mean log loss as
 *          a function of (w_x, w_y) with bias kept at its current optimum
 *          for each (w_x, w_y) pair. A vermilion trace tracks the descent
 *          through this slice. Click-step on either pane advances.
 *
 * Implementation note: rather than truly recompute optimal-b at every grid
 * point (which is costly), we hold the current bias fixed for the heat map.
 * The heat map is regenerated when the state changes — fine, the dataset is
 * tiny.
 *
 * State: GDState wraps a boundary plus a history of (wx, wy, b) for the trace.
 */

export interface GDState {
  current: BoundaryState
  history: { wx: number; wy: number; b: number }[]
  steps: number
}

export const INITIAL_GD: GDState = {
  current: { ...INITIAL_BOUNDARY },
  history: (() => {
    const w = toWeights(INITIAL_BOUNDARY)
    return [{ wx: w.wx, wy: w.wy, b: w.b }]
  })(),
  steps: 0,
}

const LR = 4.5
const MAX_STEPS = 80
const fmt2 = (n: number) => n.toFixed(2)
const fmt3 = (n: number) => n.toFixed(3)
const fmt0 = (n: number) => n.toFixed(0)

/* ============================================================== */
/* LEFT PANE — boundary trail                                      */
/* ============================================================== */

function step(state: GDState): GDState {
  if (state.steps >= MAX_STEPS) return state
  const next = gradStep(state.current, LR)
  const w = toWeights(next)
  return {
    current: next,
    history: [...state.history, { wx: w.wx, wy: w.wy, b: w.b }],
    steps: state.steps + 1,
  }
}

function reset(): GDState {
  return INITIAL_GD
}

export function LeftPane({
  state,
  onChange,
}: {
  state: GDState
  onChange: (s: GDState) => void
}) {
  // The current line's endpoints
  const ep = boundaryEndpoints(state.current)
  const x1px = dataToSvgX(ep.x1)
  const y1px = dataToSvgY(ep.y1)
  const x2px = dataToSvgX(ep.x2)
  const y2px = dataToSvgY(ep.y2)

  // The trail of past lines (reconstructed from history). We keep last 10.
  const trail = useMemo(() => {
    const recent = state.history.slice(-10, -1)
    return recent.map((h, i) => {
      const b = fromWeights({ wx: h.wx, wy: h.wy, b: h.b }, state.current.gain)
      const e = boundaryEndpoints(b)
      return {
        i,
        x1: dataToSvgX(e.x1),
        y1: dataToSvgY(e.y1),
        x2: dataToSvgX(e.x2),
        y2: dataToSvgY(e.y2),
      }
    })
  }, [state.history, state.current.gain])

  const loss = logLoss(state.current)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Step ${state.steps}. Log loss ${fmt3(loss)}. The boundary slides toward the cleanest cut as gradient descent runs.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Feature space with the current decision boundary at step ${state.steps}, log loss ${fmt3(loss)}.`}
      >
        <PlotAxes xLabel="Feature 1" yLabel="Feature 2" />
        <ClassScatter pts={POINTS} />

        {/* Trail */}
        {trail.map((t) => (
          <line
            key={t.i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="var(--color-vermilion)"
            strokeWidth="1"
            strokeOpacity={0.08 + (t.i / trail.length) * 0.18}
          />
        ))}

        {/* Current boundary */}
        <line
          x1={x1px}
          y1={y1px}
          x2={x2px}
          y2={y2px}
          stroke="var(--color-vermilion)"
          strokeWidth="2.2"
        />

        {/* Step + Reset buttons */}
        <g
          transform={`translate(${PLOT_X1 - 116}, ${PLOT_Y0 + 8})`}
          onClick={() => onChange(step(state))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onChange(step(state))
            }
          }}
          tabIndex={0}
          role="button"
          aria-disabled={state.steps >= MAX_STEPS}
          aria-label={
            state.steps >= MAX_STEPS
              ? `Step cap reached at ${MAX_STEPS}. Press reset to start over.`
              : `Take a gradient-descent step. Current step ${state.steps} of ${MAX_STEPS}.`
          }
          style={{ cursor: state.steps >= MAX_STEPS ? 'default' : 'pointer', opacity: state.steps >= MAX_STEPS ? 0.4 : 1 }}
          className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
        >
          <rect
            width="64"
            height="28"
            fill="var(--color-vermilion)"
            stroke="var(--color-vermilion)"
            strokeWidth="1.2"
          />
          <text
            x="32"
            y="18"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-cream)"
          >
            step
          </text>
        </g>

        <g
          transform={`translate(${PLOT_X1 - 48}, ${PLOT_Y0 + 8})`}
          onClick={() => onChange(reset())}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onChange(reset())
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Reset boundary to the initial state."
          style={{ cursor: 'pointer' }}
          className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
        >
          <rect
            width="48"
            height="28"
            fill="transparent"
            stroke="var(--color-vermilion)"
            strokeWidth="1.2"
          />
          <text
            x="24"
            y="18"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-vermilion)"
          >
            reset
          </text>
        </g>

        {/* Readout */}
        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
            GRADIENT DESCENT &middot; STEP {state.steps}
          </text>
          <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
            log loss = {fmt3(loss)}
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
          PRESS &middot; STEP &middot; THE BOUNDARY IMPROVES
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4a &mdash; The boundary, descending
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — descent through (wx, wy) space                     */
/* ============================================================== */

const W_MIN = -1.5
const W_MAX = 1.5
const HEAT_N = 32

function wxToPx(wx: number) {
  return PLOT_X0 + ((wx - W_MIN) / (W_MAX - W_MIN)) * (PLOT_X1 - PLOT_X0)
}
function wyToPx(wy: number) {
  return PLOT_Y1 - ((wy - W_MIN) / (W_MAX - W_MIN)) * (PLOT_Y1 - PLOT_Y0)
}

export function RightPane({
  state,
  onChange,
}: {
  state: GDState
  onChange: (s: GDState) => void
}) {
  // Pre-compute a low-resolution heat map of log loss in (wx, wy) space
  // with the current bias held fixed. We quantise the bias to a half-unit so
  // the heat map only recomputes when bias has changed meaningfully — keeps
  // the picture stable while the trace slides over it.
  const currentB = toWeights(state.current).b
  const quantisedB = Math.round(currentB * 2) / 2
  const gain = state.current.gain
  const heat = useMemo(() => {
    const data: number[] = []
    let lo = Infinity
    let hi = -Infinity
    for (let iy = 0; iy < HEAT_N; iy++) {
      for (let ix = 0; ix < HEAT_N; ix++) {
        const wx = W_MIN + (W_MAX - W_MIN) * ((ix + 0.5) / HEAT_N)
        const wy = W_MIN + (W_MAX - W_MIN) * ((iy + 0.5) / HEAT_N)
        const b = fromWeights({ wx, wy, b: quantisedB }, gain)
        const L = logLoss(b)
        data.push(L)
        if (L < lo) lo = L
        if (L > hi) hi = L
      }
    }
    return { data, min: lo, max: hi }
  }, [quantisedB, gain])

  // Cell size in pixels
  const cellW = (PLOT_X1 - PLOT_X0) / HEAT_N
  const cellH = (PLOT_Y1 - PLOT_Y0) / HEAT_N

  // Build the descent trace path
  const tracePath = state.history
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${wxToPx(h.wx).toFixed(2)} ${wyToPx(h.wy).toFixed(2)}`)
    .join(' ')

  const currentW = toWeights(state.current)

  const handleStep = useCallback(() => onChange(step(state)), [onChange, state])
  const handleReset = useCallback(() => onChange(reset()), [onChange])

  const loss = logLoss(state.current)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Descent path through weight space. Step ${state.steps}. Current weights: w_x equals ${fmt2(currentW.wx)}, w_y equals ${fmt2(currentW.wy)}. Log loss ${fmt3(loss)}.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A heat map of log loss as a function of the two weights w_x and w_y, with a descent path traced through it.`}
      >
        {/* Frame */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* Heat map: low loss = pale, high loss = ink-dark. */}
        <g>
          {heat.data.map((L, i) => {
            const ix = i % HEAT_N
            const iy = Math.floor(i / HEAT_N)
            const t = (L - heat.min) / Math.max(1e-9, heat.max - heat.min)
            const alpha = 0.05 + t * 0.55
            return (
              <rect
                key={i}
                x={PLOT_X0 + ix * cellW}
                y={PLOT_Y1 - (iy + 1) * cellH}
                width={cellW + 0.5}
                height={cellH + 0.5}
                fill="var(--color-graph-ink)"
                fillOpacity={alpha}
              />
            )
          })}
        </g>

        {/* Axis labels */}
        <PlotAxes
          xLabel="w_x"
          yLabel="w_y"
          ticksX={[-1.5, -0.75, 0, 0.75, 1.5]}
          ticksY={[-1.5, -0.75, 0, 0.75, 1.5]}
        />

        {/* Descent trace */}
        <path
          d={tracePath}
          fill="none"
          stroke="var(--color-vermilion)"
          strokeWidth="2"
          strokeOpacity="0.85"
        />

        {/* Past points along the trace */}
        {state.history.slice(0, -1).map((h, i) => (
          <circle
            key={i}
            cx={wxToPx(h.wx)}
            cy={wyToPx(h.wy)}
            r="2.5"
            fill="var(--color-vermilion)"
            fillOpacity="0.6"
          />
        ))}

        {/* Current */}
        <circle
          cx={wxToPx(currentW.wx)}
          cy={wyToPx(currentW.wy)}
          r="6"
          fill="var(--color-vermilion)"
          stroke="var(--color-cream)"
          strokeWidth="2"
        />

        {/* Step + Reset buttons */}
        <g
          transform={`translate(${PLOT_X1 - 116}, ${PLOT_Y0 + 8})`}
          onClick={handleStep}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleStep()
            }
          }}
          tabIndex={0}
          role="button"
          aria-disabled={state.steps >= MAX_STEPS}
          aria-label={
            state.steps >= MAX_STEPS
              ? `Step cap reached at ${MAX_STEPS}. Press reset to start over.`
              : `Take a gradient-descent step.`
          }
          style={{ cursor: state.steps >= MAX_STEPS ? 'default' : 'pointer', opacity: state.steps >= MAX_STEPS ? 0.4 : 1 }}
          className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
        >
          <rect
            width="64"
            height="28"
            fill="var(--color-vermilion)"
            stroke="var(--color-vermilion)"
            strokeWidth="1.2"
          />
          <text
            x="32"
            y="18"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-cream)"
          >
            step
          </text>
        </g>
        <g
          transform={`translate(${PLOT_X1 - 48}, ${PLOT_Y0 + 8})`}
          onClick={handleReset}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleReset()
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Reset to the initial state."
          style={{ cursor: 'pointer' }}
          className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
        >
          <rect
            width="48"
            height="28"
            fill="transparent"
            stroke="var(--color-vermilion)"
            strokeWidth="1.2"
          />
          <text
            x="24"
            y="18"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-vermilion)"
          >
            reset
          </text>
        </g>

        {/* Readout */}
        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
            (w_x, w_y) SPACE &middot; STEP {fmt0(state.steps)}
          </text>
          <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            wx = {fmt2(currentW.wx)}, wy = {fmt2(currentW.wy)}
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4b &mdash; The descent path through weight space
      </figcaption>
    </figure>
  )
}
