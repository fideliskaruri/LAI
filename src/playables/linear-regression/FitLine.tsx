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
  Y_MIN,
  Y_MAX,
  dataToSvgX,
  dataToSvgY,
  svgYToData,
  sumAbsResiduals,
  sse,
} from './data'

/**
 * Shared state model for acts 3–5. Both panes co-mutate (PLAN §5.2 sync
 * mode 'co-mutating') so dragging the line on the left and clicking the
 * Σ|r| / Σr² toggle on the right both write into the same object.
 */
export interface LineState {
  slope: number
  intercept: number
  /** Only act 5 uses this. Earlier acts pin to 'abs'. */
  mode: 'abs' | 'sq'
  /** Are we mid-drag? Drives debounced narration. */
  interacting: boolean
}

export const INITIAL_LINE: LineState = {
  slope: 0.5,
  intercept: 6,
  mode: 'abs',
  interacting: false,
}

const fmt2 = (n: number) => n.toFixed(2)
const fmt1 = (n: number) => n.toFixed(1)

/** Clamp a y at one end of the data range so the visible line never leaves the plot. */
function lineYAt(s: LineState, x: number) {
  return s.slope * x + s.intercept
}

/* ============================================================== */
/* LEFT PANE — scatter + draggable line (acts 3, 4, 5)             */
/* ============================================================== */

interface LeftProps {
  state: LineState
  onChange: (next: LineState) => void
  showLabel?: string
  /** True for act 3 — narration omits residual-sum talk. */
  narrationStyle: 'plain' | 'residuals'
  /** Used in narration for the figure caption number. */
  figNum: string
}

export function FitLineLeftPane({
  state,
  onChange,
  showLabel,
  narrationStyle,
  figNum,
}: LeftProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const leftHandleRef = useRef<SVGGElement | null>(null)
  const rightHandleRef = useRef<SVGGElement | null>(null)
  const startStateRef = useRef<LineState | null>(null)

  // Drag the line by either endpoint. Left endpoint changes intercept;
  // right endpoint changes the slope around the left endpoint.
  const setEndpoints = useCallback(
    (yLeft: number, yRight: number) => {
      const yL = Math.max(Y_MIN - 8, Math.min(Y_MAX + 8, yLeft))
      const yR = Math.max(Y_MIN - 8, Math.min(Y_MAX + 8, yRight))
      const slope = (yR - yL) / (X_MAX - X_MIN)
      const intercept = yL - slope * X_MIN
      onChange({ ...state, slope, intercept, interacting: true })
    },
    [state, onChange],
  )

  const scale = () => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { sy: 1 }
    return { sy: VIEW_H / rect.height }
  }

  const yLeft = lineYAt(state, X_MIN)
  const yRight = lineYAt(state, X_MAX)

  const bindLeft = useDrag(({ first, last, movement: [, my] }) => {
    if (first) startStateRef.current = state
    const start = startStateRef.current
    if (!start) return
    const { sy } = scale()
    const startYL = lineYAt(start, X_MIN)
    const newYL = startYL - (my * sy) / ((PLOT_Y1 - PLOT_Y0) / (Y_MAX - Y_MIN))
    setEndpoints(newYL, lineYAt(start, X_MAX))
    if (last) onChange({ ...state, slope: state.slope, intercept: state.intercept, interacting: false })
  })

  const bindRight = useDrag(({ first, last, movement: [, my] }) => {
    if (first) startStateRef.current = state
    const start = startStateRef.current
    if (!start) return
    const { sy } = scale()
    const startYR = lineYAt(start, X_MAX)
    const newYR = startYR - (my * sy) / ((PLOT_Y1 - PLOT_Y0) / (Y_MAX - Y_MIN))
    setEndpoints(lineYAt(start, X_MIN), newYR)
    if (last) onChange({ ...state, slope: state.slope, intercept: state.intercept, interacting: false })
  })

  // Keyboard: arrows nudge that endpoint by 0.5 data-y; Shift+arrow by 5.
  useKeyNudge(
    leftHandleRef,
    useCallback(
      (_dx: number, dy: number) => {
        if (dy === 0) return
        const step = Math.abs(dy) >= 10 ? 5 : 0.5
        const dir = Math.sign(dy)
        setEndpoints(lineYAt(state, X_MIN) + dir * step, lineYAt(state, X_MAX))
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
        const dir = Math.sign(dy)
        setEndpoints(lineYAt(state, X_MIN), lineYAt(state, X_MAX) + dir * step)
      },
      [state, setEndpoints],
    ),
  )

  const sumAbs = sumAbsResiduals(state.slope, state.intercept)
  const sumSq = sse(state.slope, state.intercept)

  const narration =
    narrationStyle === 'residuals'
      ? `Line with slope ${fmt2(state.slope)} and intercept ${fmt1(state.intercept)}. Sum of absolute residuals is ${fmt1(sumAbs)}. Sum of squared residuals is ${fmt1(sumSq)}.`
      : `Line with slope ${fmt2(state.slope)} and intercept ${fmt1(state.intercept)}. Drag either endpoint to change the line.`

  // Clip the visible line to the plot rectangle so dragging far off-screen
  // doesn't spill into the axes' tick labels.
  const yLeftPx = clampPx(dataToSvgY(yLeft))
  const yRightPx = clampPx(dataToSvgY(yRight))

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
        aria-label={`Draggable fit line over scatter. Slope ${fmt2(state.slope)}, intercept ${fmt1(state.intercept)}.`}
      >
        <PlotAxes xLabel="Height" yLabel="Weight" />
        <ScatterDots pts={POINTS} />

        {/* Fit line */}
        <line
          x1={PLOT_X0}
          y1={yLeftPx}
          x2={PLOT_X1}
          y2={yRightPx}
          stroke="var(--color-vermilion)"
          strokeWidth="2.2"
        />

        {/* Endpoint handles */}
        <g
          {...bindLeft()}
          ref={leftHandleRef}
          tabIndex={0}
          role="button"
          aria-label={`Left endpoint of the line. Current y equals ${fmt1(yLeft)}. Drag vertically or use arrow keys to change the intercept.`}
          style={{ cursor: 'ns-resize', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={PLOT_X0} cy={yLeftPx} r="22" fill="transparent" />
          <circle
            cx={PLOT_X0}
            cy={yLeftPx}
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
          aria-label={`Right endpoint of the line. Current y equals ${fmt1(yRight)}. Drag vertically or use arrow keys to change the slope.`}
          style={{ cursor: 'ns-resize', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={PLOT_X1} cy={yRightPx} r="22" fill="transparent" />
          <circle
            cx={PLOT_X1}
            cy={yRightPx}
            r="7"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        </g>

        {/* Readout */}
        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
            {(showLabel ?? 'FIT LINE').toUpperCase()}
          </text>
          <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            y = {fmt2(state.slope)}·x + {fmt1(state.intercept)}
          </text>
        </g>

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
          DRAG ENDPOINTS &middot; ARROWS NUDGE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. {figNum} &mdash; A line you can move
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — residual bars / squares (acts 3, 4, 5)            */
/* ============================================================== */

interface RightProps {
  state: LineState
  /** Variant: 'empty' renders a frame only (act 3); 'bars' renders residual bars
   *  with a running Σ|r| readout (act 4); 'toggle' renders bars OR squares
   *  depending on state.mode plus a toggle (act 5). */
  variant: 'empty' | 'bars' | 'toggle'
  onChange?: (next: LineState) => void
  figNum: string
}

export function FitLineRightPane({ state, variant, onChange, figNum }: RightProps) {
  const sumAbs = sumAbsResiduals(state.slope, state.intercept)
  const sumSq = sse(state.slope, state.intercept)

  // For act 5 'toggle', squares are drawn around each residual, with a side
  // length proportional to the absolute residual (in data units). To keep
  // them visible they're rendered with low opacity fill.
  const showSquares = variant === 'toggle' && state.mode === 'sq'
  const showBars = variant === 'bars' || (variant === 'toggle' && state.mode === 'abs')

  // Compute residuals per point
  const residuals = POINTS.map((p) => {
    const yHat = state.slope * p.x + state.intercept
    return { p, yHat, r: p.y - yHat }
  })

  let narration: string
  if (variant === 'empty') {
    narration = 'Empty residual panel; a fit line is needed first.'
  } else if (showSquares) {
    narration = `Squared-residual mode. Total squared error is ${fmt1(sumSq)}.`
  } else {
    narration = `Absolute-residual bars. Total absolute error is ${fmt1(sumAbs)}.`
  }

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
        aria-label={`Residual panel. ${narration}`}
      >
        <PlotAxes xLabel="Height" yLabel="Weight" />

        {/* Faint scatter + line for context */}
        <ScatterDots pts={POINTS} />
        <line
          x1={dataToSvgX(X_MIN)}
          y1={dataToSvgY(state.slope * X_MIN + state.intercept)}
          x2={dataToSvgX(X_MAX)}
          y2={dataToSvgY(state.slope * X_MAX + state.intercept)}
          stroke="var(--color-vermilion)"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />

        {/* Residuals */}
        {variant !== 'empty' &&
          residuals.map(({ p, yHat, r }, i) => {
            const x = dataToSvgX(p.x)
            const yPt = dataToSvgY(p.y)
            const yLn = dataToSvgY(yHat)
            const above = r >= 0
            const stroke = above ? 'var(--color-vermilion)' : 'var(--color-ink)'

            if (showSquares) {
              // Square — width AND height equal |r| (so this is a square in
              // data-coordinates, not pixel-coordinates; the readout makes
              // that clear). Stroked so the boundary is crisp.
              const side =
                Math.abs(yPt - yLn) // pixel side ≈ same as bar height
              const sx = x
              const sy = above ? yPt : yLn
              return (
                <g key={i}>
                  <rect
                    x={sx}
                    y={sy}
                    width={side}
                    height={side}
                    fill={stroke}
                    fillOpacity="0.13"
                    stroke={stroke}
                    strokeWidth="1"
                  />
                  <line
                    x1={x}
                    y1={yPt}
                    x2={x}
                    y2={yLn}
                    stroke={stroke}
                    strokeWidth="1.5"
                  />
                </g>
              )
            }
            return (
              <line
                key={i}
                x1={x}
                y1={yPt}
                x2={x}
                y2={yLn}
                stroke={stroke}
                strokeWidth="2"
              />
            )
          })}

        {/* Readout */}
        {variant !== 'empty' && (
          <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
            <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
              {showSquares ? 'SQUARED RESIDUALS' : 'RESIDUALS'}
            </text>
            <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
              Σ|r| = {fmt1(sumAbs)}
            </text>
            <text y="38" fontFamily="JetBrains Mono, monospace" fontSize="12" fill={showSquares ? 'var(--color-vermilion)' : 'var(--color-dim)'}>
              Σr² = {fmt1(sumSq)}
            </text>
          </g>
        )}

        {/* Toggle (act 5 only) */}
        {variant === 'toggle' && onChange && (
          <g transform={`translate(${PLOT_X1 - 168}, ${PLOT_Y0 + 8})`}>
            <text
              fontFamily="Inter, sans-serif"
              fontSize="9"
              letterSpacing="0.22em"
              fill="var(--color-dim)"
            >
              PENALTY
            </text>
            <ToggleButton
              x={0}
              y={16}
              active={state.mode === 'abs'}
              label="Σ|r|"
              onClick={() => onChange({ ...state, mode: 'abs' })}
            />
            <ToggleButton
              x={84}
              y={16}
              active={state.mode === 'sq'}
              label="Σr²"
              onClick={() => onChange({ ...state, mode: 'sq' })}
            />
          </g>
        )}

        {variant === 'empty' && (
          <text
            x={(PLOT_X0 + PLOT_X1) / 2}
            y={(PLOT_Y0 + PLOT_Y1) / 2}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-fade)"
          >
            (drag the line, gaps appear here)
          </text>
        )}
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. {figNum} &mdash;{' '}
        {variant === 'empty'
          ? 'The gap panel, still empty'
          : showSquares
            ? 'Squared gaps — squares whose total area you minimise'
            : 'The gap between each point and the line'}
      </figcaption>
    </figure>
  )
}

function ToggleButton({
  x,
  y,
  active,
  label,
  onClick,
}: {
  x: number
  y: number
  active: boolean
  label: string
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
      aria-pressed={active}
      aria-label={`Toggle penalty to ${label}`}
      style={{ cursor: 'pointer' }}
      className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
    >
      <rect
        x={0}
        y={0}
        width={72}
        height={26}
        fill={active ? 'var(--color-vermilion)' : 'transparent'}
        stroke="var(--color-vermilion)"
        strokeWidth="1.2"
      />
      <text
        x={36}
        y={17}
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="12"
        fill={active ? 'var(--color-cream)' : 'var(--color-vermilion)'}
      >
        {label}
      </text>
    </g>
  )
}

function clampPx(y: number) {
  return Math.max(PLOT_Y0 - 10, Math.min(PLOT_Y1 + 10, y))
}

/* Re-export svgYToData to silence unused-import warnings in this module.
 * (Used in earlier drafts; keep export to avoid TS churn if a consumer wants it.) */
export { svgYToData }
