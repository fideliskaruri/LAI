import { useCallback, useMemo, useRef } from 'react'
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
} from './dataset'

/**
 * Act 9 — Higher-degree polynomial fits.
 *
 * Slider: degree d from 1 to 10. Left pane: the scatter with the best
 * polynomial-of-degree-d fit drawn through. Right pane: a bar chart of
 * training MSE as a function of degree, with the current d highlighted —
 * monotonically decreasing as d grows, which is the teaser: the fit looks
 * perfect at d=10, but on *new* data it would not. Regularization comes
 * later; this act is just a hand-wave at the problem.
 *
 * The polynomial coefficients are computed via the normal equations on a
 * Vandermonde matrix at mount time, then cached per degree.
 */

export interface PolyState {
  degree: number
  interacting: boolean
}
export const INITIAL_POLY: PolyState = { degree: 1, interacting: false }

const MIN_DEG = 1
const MAX_DEG = 10

/* ---------- Polynomial fitting (one-off, on mount) ---------- */

/** Solve A x = b for x via Gaussian elimination with partial pivoting. */
function solveLinear(A: number[][], b: number[]): number[] | null {
  const n = b.length
  // Augmented matrix
  const M = A.map((row, i) => [...row, b[i]])
  for (let i = 0; i < n; i++) {
    // pivot
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k
    }
    if (Math.abs(M[maxRow][i]) < 1e-12) return null
    ;[M[i], M[maxRow]] = [M[maxRow], M[i]]
    for (let k = i + 1; k < n; k++) {
      const f = M[k][i] / M[i][i]
      for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j]
    }
  }
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n]
    for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j]
    x[i] = sum / M[i][i]
  }
  return x
}

/** Fit poly of degree d to POINTS via normal equations on the Vandermonde. */
function fitPoly(degree: number): number[] {
  // Center & scale x to keep the Vandermonde well-conditioned at d=10.
  const center = 20
  const scale = 20
  const k = degree + 1
  const A: number[][] = Array.from({ length: k }, () => new Array(k).fill(0))
  const bv = new Array(k).fill(0)
  for (const p of POINTS) {
    const xn = (p.x - center) / scale
    // Build powers of xn
    const px: number[] = new Array(k)
    px[0] = 1
    for (let i = 1; i < k; i++) px[i] = px[i - 1] * xn
    for (let i = 0; i < k; i++) {
      bv[i] += px[i] * p.y
      for (let j = 0; j < k; j++) A[i][j] += px[i] * px[j]
    }
  }
  // Add a microscopic ridge for d=10 to avoid numerical blow-up
  const lambda = 1e-6
  for (let i = 0; i < k; i++) A[i][i] += lambda
  return solveLinear(A, bv) ?? new Array(k).fill(0)
}

function evalPoly(coeffs: number[], x: number) {
  const xn = (x - 20) / 20
  let s = 0
  let xp = 1
  for (let i = 0; i < coeffs.length; i++) {
    s += coeffs[i] * xp
    xp *= xn
  }
  return s
}

function trainMSE(coeffs: number[]): number {
  let s = 0
  for (const p of POINTS) {
    const r = p.y - evalPoly(coeffs, p.x)
    s += r * r
  }
  return s / POINTS.length
}

/* Slider geometry (right pane) */
const SLIDER_X_MIN = PLOT_X0 + 24
const SLIDER_X_MAX = PLOT_X1 - 24
const SLIDER_Y = PLOT_Y1 - 28

const degToPx = (d: number) =>
  SLIDER_X_MIN + ((d - MIN_DEG) / (MAX_DEG - MIN_DEG)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const pxToDeg = (px: number) =>
  MIN_DEG + ((px - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (MAX_DEG - MIN_DEG)

/* ===== Left pane: scatter + polynomial curve ===== */

export function LeftPane({
  state,
  onChange,
}: {
  state: PolyState
  onChange: (s: PolyState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startDegreeRef = useRef<number | null>(null)

  const updateDegree = useCallback(
    (d: number, interacting: boolean) => {
      const clamped = Math.max(MIN_DEG, Math.min(MAX_DEG, Math.round(d)))
      onChange({ degree: clamped, interacting })
    },
    [onChange],
  )

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startDegreeRef.current = state.degree
    const start = startDegreeRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startX = degToPx(start)
    const newX = startX + mx * sx
    updateDegree(pxToDeg(newX), !last)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        updateDegree(state.degree + Math.sign(dx), false)
      },
      [state.degree, updateDegree],
    ),
  )

  const coeffs = useMemo(() => fitPoly(state.degree), [state.degree])

  // Build the curve as a polyline
  const N = 200
  const pathParts: string[] = []
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / N
    const y = evalPoly(coeffs, x)
    // Clamp to plotted range so wild d=10 oscillations don't break the SVG
    const yC = Math.max(Y_MIN - 12, Math.min(Y_MAX + 12, y))
    pathParts.push(`${i === 0 ? 'M' : 'L'} ${dataToSvgX(x).toFixed(2)} ${dataToSvgY(yC).toFixed(2)}`)
  }
  const path = pathParts.join(' ')

  const handleX = degToPx(state.degree)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Polynomial fit of degree ${state.degree} to the twelve points. ${
          state.degree >= 8
            ? 'The curve wiggles through each point but the wiggles between points are unconvincing.'
            : state.degree >= 4
              ? 'The curve has gentle bends.'
              : 'The fit is nearly a straight line.'
        }`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Polynomial fit of degree ${state.degree} to twelve points.`}
      >
        <PlotAxes xLabel="Height" yLabel="Weight" />
        <ScatterDots pts={POINTS} />

        {/* Polynomial curve */}
        <path d={path} fill="none" stroke="var(--color-vermilion)" strokeWidth="2" />

        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
            DEGREE
          </text>
          <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
            d = {state.degree}
          </text>
        </g>

        {/* Slider */}
        <g>
          <line
            x1={SLIDER_X_MIN}
            y1={SLIDER_Y}
            x2={SLIDER_X_MAX}
            y2={SLIDER_Y}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
          {[1, 4, 7, 10].map((d) => (
            <g key={d}>
              <line
                x1={degToPx(d)}
                y1={SLIDER_Y - 4}
                x2={degToPx(d)}
                y2={SLIDER_Y + 4}
                stroke="var(--color-graph-ink)"
              />
              <text
                x={degToPx(d)}
                y={SLIDER_Y + 18}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fill="var(--color-dim)"
              >
                {d}
              </text>
            </g>
          ))}
          <g
            {...bind()}
            ref={handleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Polynomial degree. Current ${state.degree}. Arrow keys to nudge.`}
            aria-valuemin={MIN_DEG}
            aria-valuemax={MAX_DEG}
            aria-valuenow={state.degree}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={handleX} cy={SLIDER_Y} r="22" fill="transparent" />
            <circle
              cx={handleX}
              cy={SLIDER_Y}
              r="8"
              fill="var(--color-vermilion)"
              stroke="var(--color-cream)"
              strokeWidth="2"
            />
          </g>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 8a &mdash; The polynomial that obediently bends through every point
      </figcaption>
    </figure>
  )
}

/* ===== Right pane: training-error bars ===== */

export function RightPane({ state }: { state: PolyState }) {
  // Pre-compute MSE for every degree once.
  const mseByDegree = useMemo(() => {
    const out: number[] = []
    for (let d = MIN_DEG; d <= MAX_DEG; d++) {
      out.push(trainMSE(fitPoly(d)))
    }
    return out
  }, [])
  const maxMse = Math.max(...mseByDegree)
  const N = MAX_DEG - MIN_DEG + 1
  const barW = ((PLOT_X1 - PLOT_X0 - 64) / N) * 0.6
  const gap = ((PLOT_X1 - PLOT_X0 - 64) / N) * 0.4
  const startX = PLOT_X0 + 32

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Training error as a function of degree. At degree ${state.degree}, the mean squared error on the training set is ${mseByDegree[state.degree - 1].toFixed(2)}. Errors keep falling as the degree grows — but only on the data we fit.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Training error bar chart by polynomial degree, current degree ${state.degree}.`}
      >
        <PlotAxes
          xLabel="Degree"
          yLabel="Training MSE"
          ticksX={[]}
          ticksY={[]}
        />

        {/* Bars */}
        {mseByDegree.map((v, i) => {
          const d = i + 1
          const active = d === state.degree
          const x = startX + i * (barW + gap)
          const h = (v / maxMse) * (PLOT_Y1 - PLOT_Y0 - 40)
          const y = PLOT_Y1 - h
          return (
            <g key={d}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                fill={active ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
                fillOpacity={active ? 0.85 : 0.25}
              />
              <text
                x={x + barW / 2}
                y={PLOT_Y1 + 18}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fill={active ? 'var(--color-vermilion)' : 'var(--color-dim)'}
              >
                {d}
              </text>
              {active && (
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="10"
                  fill="var(--color-vermilion)"
                >
                  {v.toFixed(1)}
                </text>
              )}
            </g>
          )
        })}

        {/* Title */}
        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
            TRAINING MSE
          </text>
          <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            on these twelve points
          </text>
        </g>

        {/* Suspicious-flat tail label */}
        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y0 + 56}
          textAnchor="end"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          on <em>new</em> points: not so much
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 8b &mdash; Training error falls; that&rsquo;s only half the story
      </figcaption>
    </figure>
  )
}
