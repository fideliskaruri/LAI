import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { PlotAxes, ClassScatter, ClassLegend } from './Axes'
import {
  SEPARABLE_POINTS,
  VIEW_W,
  VIEW_H,
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  X_MIN,
  X_MAX,
  Y_MIN,
  Y_MAX,
  dataToSvgX,
  dataToSvgY,
  marginWidth,
  isSeparator,
  MAX_MARGIN_WIDTH,
  lineSlopeIntercept,
  type Line2D,
} from './dataset'

/**
 * Shared state for acts 3 and 4 — a hyperplane parameterized by its two
 * endpoint y-values plus an `interacting` flag for debounced narration.
 */
export interface HyperplaneState extends Line2D {
  interacting: boolean
}

export const INITIAL_HYPERPLANE: HyperplaneState = {
  yLeft: 14,
  yRight: 28,
  interacting: false,
}

const fmt2 = (n: number) => n.toFixed(2)

/** Quality score: 0 if the line isn't a separator, else margin / best margin. */
function qualityScore(line: Line2D): number {
  if (!isSeparator(line, SEPARABLE_POINTS)) return 0
  return Math.min(1, marginWidth(line, SEPARABLE_POINTS) / MAX_MARGIN_WIDTH)
}

/* ============================================================ */
/* LEFT — draggable separator                                    */
/* ============================================================ */

export function LeftPane({
  state,
  onChange,
}: {
  state: HyperplaneState
  onChange: (next: HyperplaneState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const leftHandleRef = useRef<SVGGElement | null>(null)
  const rightHandleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<HyperplaneState | null>(null)

  const setEndpoints = useCallback(
    (yL: number, yR: number, down: boolean) => {
      onChange({
        yLeft: Math.max(Y_MIN - 6, Math.min(Y_MAX + 6, yL)),
        yRight: Math.max(Y_MIN - 6, Math.min(Y_MAX + 6, yR)),
        interacting: down,
      })
    },
    [onChange],
  )

  const scale = () => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { sy: 1 }
    return { sy: VIEW_H / rect.height }
  }

  const bindLeft = useDrag(({ down, first, movement: [, my] }) => {
    if (first) startRef.current = state
    const s = startRef.current
    if (!s) return
    const { sy } = scale()
    const newYL = s.yLeft - (my * sy) / ((PLOT_Y1 - PLOT_Y0) / (Y_MAX - Y_MIN))
    setEndpoints(newYL, s.yRight, down)
  })
  const bindRight = useDrag(({ down, first, movement: [, my] }) => {
    if (first) startRef.current = state
    const s = startRef.current
    if (!s) return
    const { sy } = scale()
    const newYR = s.yRight - (my * sy) / ((PLOT_Y1 - PLOT_Y0) / (Y_MAX - Y_MIN))
    setEndpoints(s.yLeft, newYR, down)
  })

  useKeyNudge(
    leftHandleRef,
    useCallback(
      (_dx: number, dy: number) => {
        if (dy === 0) return
        const step = Math.abs(dy) >= 10 ? 5 : 0.5
        setEndpoints(state.yLeft + Math.sign(dy) * step, state.yRight, false)
      },
      [state, setEndpoints],
    ),
  )
  useKeyNudge(
    rightHandleRef,
    useCallback(
      (_dx: number, dy: number) => {
        if (dy === 0) return
        const step = Math.abs(dy) >= 10 ? 5 : 0.5
        setEndpoints(state.yLeft, state.yRight + Math.sign(dy) * step, false)
      },
      [state, setEndpoints],
    ),
  )

  const yLpx = clampPx(dataToSvgY(state.yLeft))
  const yRpx = clampPx(dataToSvgY(state.yRight))
  const m = marginWidth(state, SEPARABLE_POINTS)
  const ok = isSeparator(state, SEPARABLE_POINTS)

  const narration = ok
    ? `Separating line with margin width ${fmt2(m)}. Drag either endpoint or press arrow keys to widen the margin.`
    : `Line currently cuts through a class — it is not a separator. Drag it back into the gap.`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority={ok ? 'normal' : 'high'}
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Two-class scatter with a draggable hyperplane. Margin width ${fmt2(m)} ${ok ? 'units' : 'units, but the line currently crosses a class'}.`}
      >
        <PlotAxes />
        <ClassScatter pts={SEPARABLE_POINTS} />

        {/* Margin band — two parallel offset lines */}
        <MarginBand line={state} marginVal={m} />

        {/* The line itself */}
        <line
          x1={dataToSvgX(X_MIN)}
          y1={yLpx}
          x2={dataToSvgX(X_MAX)}
          y2={yRpx}
          stroke={ok ? 'var(--color-vermilion)' : '#b94a3c'}
          strokeWidth="2.4"
        />

        {/* Endpoint handles */}
        <g
          {...bindLeft()}
          ref={leftHandleRef}
          tabIndex={0}
          role="button"
          aria-label={`Left endpoint of the separating line at y equals ${fmt2(state.yLeft)}. Drag vertically or use arrow keys.`}
          style={{ cursor: 'ns-resize', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={dataToSvgX(X_MIN)} cy={yLpx} r="22" fill="transparent" />
          <circle
            cx={dataToSvgX(X_MIN)}
            cy={yLpx}
            r="7"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        </g>
        <g
          {...bindRight()}
          ref={rightHandleRef}
          tabIndex={0}
          role="button"
          aria-label={`Right endpoint of the separating line at y equals ${fmt2(state.yRight)}. Drag vertically or use arrow keys.`}
          style={{ cursor: 'ns-resize', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={dataToSvgX(X_MAX)} cy={yRpx} r="22" fill="transparent" />
          <circle
            cx={dataToSvgX(X_MAX)}
            cy={yRpx}
            r="7"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        </g>

        <ClassLegend x={PLOT_X0 + 8} y={PLOT_Y0 + 8} />

        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG ENDPOINTS &middot; ARROWS NUDGE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2a &mdash; The line you choose; the margin you get
      </figcaption>
    </figure>
  )
}

/** A faint vermilion band whose width matches the current margin. Drawn as
 *  two parallel translated copies of the line. */
function MarginBand({ line, marginVal }: { line: Line2D; marginVal: number }) {
  const { slope } = lineSlopeIntercept(line)
  // Perpendicular offset of `marginVal` in data units: shift y by margin·√(1+slope²)
  const dy = marginVal * Math.sqrt(1 + slope * slope)
  const yLpxA = clampPx(dataToSvgY(line.yLeft + dy))
  const yRpxA = clampPx(dataToSvgY(line.yRight + dy))
  const yLpxB = clampPx(dataToSvgY(line.yLeft - dy))
  const yRpxB = clampPx(dataToSvgY(line.yRight - dy))
  return (
    <g>
      <polygon
        points={`${dataToSvgX(X_MIN)},${yLpxA} ${dataToSvgX(X_MAX)},${yRpxA} ${dataToSvgX(X_MAX)},${yRpxB} ${dataToSvgX(X_MIN)},${yLpxB}`}
        fill="var(--color-vermilion)"
        fillOpacity="0.08"
      />
      <line
        x1={dataToSvgX(X_MIN)}
        y1={yLpxA}
        x2={dataToSvgX(X_MAX)}
        y2={yRpxA}
        stroke="var(--color-vermilion)"
        strokeWidth="1"
        strokeOpacity="0.5"
        strokeDasharray="4 4"
      />
      <line
        x1={dataToSvgX(X_MIN)}
        y1={yLpxB}
        x2={dataToSvgX(X_MAX)}
        y2={yRpxB}
        stroke="var(--color-vermilion)"
        strokeWidth="1"
        strokeOpacity="0.5"
        strokeDasharray="4 4"
      />
    </g>
  )
}

function clampPx(y: number) {
  return Math.max(PLOT_Y0 - 12, Math.min(PLOT_Y1 + 12, y))
}

/* ============================================================ */
/* RIGHT — live margin readout + quality score                   */
/* ============================================================ */

export function RightPane({ state }: { state: HyperplaneState }) {
  const m = marginWidth(state, SEPARABLE_POINTS)
  const ok = isSeparator(state, SEPARABLE_POINTS)
  const q = qualityScore(state)
  const pct = Math.round(q * 100)

  // Layout
  const BAR_W = 360
  const BAR_X = (VIEW_W - BAR_W) / 2
  const BAR_Y = 180
  const BAR_H = 18

  const narration = ok
    ? `Margin width ${fmt2(m)} units. Quality score ${pct} out of one hundred. The maximum possible margin on this dataset is ${fmt2(MAX_MARGIN_WIDTH)} units.`
    : `The line is not currently a separator. Quality score is zero. Move the line back into the gap.`

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
        aria-label={`Live margin readout. Width ${fmt2(m)}. Quality ${pct} percent.`}
      >
        <text
          x={VIEW_W / 2}
          y="60"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          LIVE MARGIN  ·  QUALITY SCORE
        </text>

        {/* Margin width — big number */}
        <text
          x={VIEW_W / 2}
          y="124"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="48"
          fill={ok ? 'var(--color-vermilion)' : 'var(--color-dim)'}
        >
          {fmt2(m)}
        </text>
        <text
          x={VIEW_W / 2}
          y="146"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          feature-space units of margin
        </text>

        {/* Quality bar */}
        <text
          x={BAR_X}
          y={BAR_Y - 12}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          QUALITY
        </text>
        <rect
          x={BAR_X}
          y={BAR_Y}
          width={BAR_W}
          height={BAR_H}
          fill="none"
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />
        <rect
          x={BAR_X}
          y={BAR_Y}
          width={BAR_W * q}
          height={BAR_H}
          fill="var(--color-vermilion)"
          fillOpacity="0.85"
        />
        <text
          x={BAR_X + BAR_W + 8}
          y={BAR_Y + 14}
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-ink)"
        >
          {pct}%
        </text>

        {/* Status sentence */}
        <text
          x={VIEW_W / 2}
          y={BAR_Y + 56}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill={ok ? 'var(--color-ink)' : '#b94a3c'}
        >
          {ok
            ? pct >= 99
              ? 'You have found the support-vector machine.'
              : pct >= 80
                ? 'Close. Try to widen the band a little more.'
                : 'A valid separator. But there is room to do better.'
            : 'Not a separator — points sit on the wrong side.'}
        </text>

        {/* The cap */}
        <text
          x={VIEW_W / 2}
          y={BAR_Y + 100}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          MAX POSSIBLE  ·  {fmt2(MAX_MARGIN_WIDTH)} UNITS
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 60}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          maximise this and you have done the SVM&apos;s entire job
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2b &mdash; The number you are trying to make big
      </figcaption>
    </figure>
  )
}
