import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { PlotAxes, ScatterDots } from './Axes'
import {
  POINTS,
  VIEW_W,
  VIEW_H,
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  X_MIN,
  X_MAX,
  dataToSvgX,
  dataToSvgY,
  sse,
  OLS,
} from './data'

/**
 * Act 6 — derivative-finds-min. Right pane: SSE as a function of slope —
 * a smooth parabola. A draggable slope handle slides along the slope axis;
 * a vertical line meets the parabola at the corresponding SSE. The reader
 * tries to land on the bottom. Left pane: the fit line co-moves; its
 * intercept stays pinned at the optimal value for the current slope so the
 * picture stays informative (otherwise SSE-vs-slope alone is degenerate).
 *
 * NOTE: this is "derivative-finds-min," not gradient descent. The reader
 * gets a one-handle slider on a 1-D loss curve and the prose says, "the
 * minimum is where the derivative is zero." No step rule. No learning rate.
 * Optimization-the-chapter has not been earned yet.
 */

export interface SlopeState {
  slope: number
  interacting: boolean
}

export const INITIAL_SLOPE: SlopeState = { slope: 0.3, interacting: false }

const fmt2 = (n: number) => n.toFixed(2)
const fmt1 = (n: number) => n.toFixed(1)

/** Optimal intercept for a given slope (closed form: b = ȳ − m·x̄). */
function optimalIntercept(slope: number) {
  const n = POINTS.length
  const mx = POINTS.reduce((s, p) => s + p.x, 0) / n
  const my = POINTS.reduce((s, p) => s + p.y, 0) / n
  return my - slope * mx
}

/* Parabola plot frame (right pane). */
const PARAB_X0 = PLOT_X0
const PARAB_X1 = PLOT_X1
const PARAB_Y0 = PLOT_Y0
const PARAB_Y1 = PLOT_Y1
const SLOPE_MIN = -0.4
const SLOPE_MAX = 2.0

function slopeToPx(s: number) {
  return PARAB_X0 + ((s - SLOPE_MIN) / (SLOPE_MAX - SLOPE_MIN)) * (PARAB_X1 - PARAB_X0)
}
function pxToSlope(px: number) {
  return SLOPE_MIN + ((px - PARAB_X0) / (PARAB_X1 - PARAB_X0)) * (SLOPE_MAX - SLOPE_MIN)
}

function sseAtSlope(s: number) {
  return sse(s, optimalIntercept(s))
}

/* Pre-compute parabola range for y-axis scaling. The min lives at OLS.slope. */
const SSE_MIN = sseAtSlope(OLS.slope)
const SSE_MAX = Math.max(sseAtSlope(SLOPE_MIN), sseAtSlope(SLOPE_MAX))

function sseToPx(v: number) {
  return PARAB_Y1 - ((v - SSE_MIN) / (SSE_MAX - SSE_MIN)) * (PARAB_Y1 - PARAB_Y0)
}

/* ===== Left pane: co-moving fit line ===== */

export function LeftPane({ state }: { state: SlopeState }) {
  const b = optimalIntercept(state.slope)
  const yL = state.slope * X_MIN + b
  const yR = state.slope * X_MAX + b
  const currentSSE = sseAtSlope(state.slope)
  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Fit line with slope ${fmt2(state.slope)} and the best intercept for that slope: ${fmt1(b)}. Total squared error is ${fmt1(currentSSE)}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Fit line moving with the slope slider. Slope ${fmt2(state.slope)}.`}
      >
        <PlotAxes xLabel="Height" yLabel="Weight" />
        <ScatterDots pts={POINTS} />
        <line
          x1={dataToSvgX(X_MIN)}
          y1={dataToSvgY(yL)}
          x2={dataToSvgX(X_MAX)}
          y2={dataToSvgY(yR)}
          stroke="var(--color-vermilion)"
          strokeWidth="2.2"
        />
        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
            CO-MOVING FIT
          </text>
          <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            slope = {fmt2(state.slope)}
          </text>
          <text y="38" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
            SSE = {fmt1(currentSSE)}
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5a &mdash; The same line, now driven by a slider on the loss curve
      </figcaption>
    </figure>
  )
}

/* ===== Right pane: SSE parabola + draggable slope handle ===== */

export function RightPane({
  state,
  onChange,
}: {
  state: SlopeState
  onChange: (s: SlopeState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startSlopeRef = useRef<number | null>(null)

  const updateSlope = useCallback(
    (s: number, interacting: boolean) => {
      const clamped = Math.max(SLOPE_MIN, Math.min(SLOPE_MAX, s))
      onChange({ slope: clamped, interacting })
    },
    [onChange],
  )

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startSlopeRef.current = state.slope
    const start = startSlopeRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startX = slopeToPx(start)
    const newX = startX + mx * sx
    updateSlope(pxToSlope(newX), !last)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? 0.1 : 0.01
        updateSlope(state.slope + Math.sign(dx) * step, false)
      },
      [state.slope, updateSlope],
    ),
  )

  // Build the parabola path
  const N = 80
  const pts: string[] = []
  for (let i = 0; i <= N; i++) {
    const s = SLOPE_MIN + ((SLOPE_MAX - SLOPE_MIN) * i) / N
    const v = sseAtSlope(s)
    const px = slopeToPx(s)
    const py = sseToPx(v)
    pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`)
  }
  const parabPath = pts.join(' ')

  const handleX = slopeToPx(state.slope)
  const handleY = sseToPx(sseAtSlope(state.slope))

  // Tangent line at the handle — slope of d(SSE)/dm. Compute numerically.
  const eps = 0.005
  const dSSE = (sseAtSlope(state.slope + eps) - sseAtSlope(state.slope - eps)) / (2 * eps)
  const TANGENT_HALF = 60 // px half-length
  // Convert dSSE (SSE-per-slope) into pixel slope on the chart
  const pxPerSlope = (PARAB_X1 - PARAB_X0) / (SLOPE_MAX - SLOPE_MIN)
  const pxPerSSE = (PARAB_Y1 - PARAB_Y0) / (SSE_MAX - SSE_MIN)
  const pixelSlope = -dSSE * (pxPerSSE / pxPerSlope) // negative because SVG y grows downward
  const tHalf = TANGENT_HALF
  const tX1 = handleX - tHalf
  const tX2 = handleX + tHalf
  const tY1 = handleY - pixelSlope * tHalf
  const tY2 = handleY + pixelSlope * tHalf

  const atMin = Math.abs(state.slope - OLS.slope) < 0.04
  const narration = atMin
    ? `At the minimum. Slope ${fmt2(state.slope)}, SSE ${fmt1(sseAtSlope(state.slope))}. The tangent is flat — the derivative is zero.`
    : `Slope ${fmt2(state.slope)}, SSE ${fmt1(sseAtSlope(state.slope))}. The tangent is tilted; we're not at the minimum yet.`
  const priority: 'normal' | 'high' = atMin ? 'high' : 'normal'

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority={priority} isInteracting={state.interacting} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`SSE as a function of slope. Draggable slope handle at slope ${fmt2(state.slope)}.`}
      >
        <PlotAxes
          xLabel="Slope (β₁)"
          yLabel="SSE"
          ticksX={[0, 0.5, 1, 1.5, 2]}
          ticksY={[]}
        />

        {/* x-axis sub-ticks at the slope range */}
        {[0, 0.5, 1, 1.5, 2].map((t) => (
          <g key={`xt-${t}`}>
            <line
              x1={slopeToPx(t)}
              y1={PARAB_Y1}
              x2={slopeToPx(t)}
              y2={PARAB_Y1 + 4}
              stroke="var(--color-graph-ink)"
            />
            <text
              x={slopeToPx(t)}
              y={PARAB_Y1 + 18}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {t.toFixed(1)}
            </text>
          </g>
        ))}

        {/* The parabola */}
        <path d={parabPath} fill="none" stroke="var(--color-graph-ink)" strokeWidth="1.6" />

        {/* Vertical from x-axis to point on curve */}
        <line
          x1={handleX}
          y1={PARAB_Y1}
          x2={handleX}
          y2={handleY}
          stroke="var(--color-vermilion)"
          strokeOpacity="0.4"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Tangent line at the handle — visualises the derivative */}
        <line
          x1={tX1}
          y1={tY1}
          x2={tX2}
          y2={tY2}
          stroke="var(--color-vermilion)"
          strokeWidth="1.5"
          strokeOpacity={atMin ? 0.9 : 0.55}
        />

        {/* Marker at minimum — small ghost circle */}
        <circle
          cx={slopeToPx(OLS.slope)}
          cy={sseToPx(SSE_MIN)}
          r="6"
          fill="none"
          stroke="var(--color-vermilion)"
          strokeOpacity="0.35"
          strokeDasharray="2 2"
        />

        {/* Handle */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Slope of the fit line. Current ${fmt2(state.slope)}. Arrow keys to nudge, Shift plus arrow to step by 0.1.`}
          aria-valuemin={SLOPE_MIN}
          aria-valuemax={SLOPE_MAX}
          aria-valuenow={Number(state.slope.toFixed(2))}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={handleX} cy={handleY} r="22" fill="transparent" />
          <circle
            cx={handleX}
            cy={handleY}
            r="8"
            fill="var(--color-vermilion)"
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
        </g>

        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
            LOSS CURVE
          </text>
          <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            SSE = {fmt1(sseAtSlope(state.slope))}
          </text>
          <text y="38" fontFamily="JetBrains Mono, monospace" fontSize="12" fill={atMin ? 'var(--color-vermilion)' : 'var(--color-dim)'}>
            d/dβ₁ = {dSSE.toFixed(1)}
          </text>
        </g>

        {atMin && (
          <g transform={`translate(${PLOT_X1 - 196}, ${PLOT_Y0 + 8})`}>
            <rect width="180" height="44" fill="var(--color-vermilion)" fillOpacity="0.15" />
            <text
              x="12"
              y="18"
              fontFamily="Inter, sans-serif"
              fontSize="10"
              letterSpacing="0.18em"
              fill="var(--color-vermilion)"
            >
              MINIMUM
            </text>
            <text x="12" y="36" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
              β₁ ≈ {fmt2(OLS.slope)}
            </text>
          </g>
        )}

        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG &middot; TANGENT FLATTENS AT MIN
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5b &mdash; The loss curve, and the slope of the slope
      </figcaption>
    </figure>
  )
}
