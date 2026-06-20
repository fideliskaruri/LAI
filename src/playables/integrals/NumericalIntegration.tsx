import { useRef, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Numerical integration on a curve with no elementary antiderivative:
 * the Gaussian-shaped e^(-x²) on [-2, 2]. There is no closed-form F;
 * Simpson's rule approximates it numerically.
 *
 * The user picks n ∈ {4, 16, 64} via three buttons (proper HTML buttons,
 * focusable, arrow-key navigable in a toolbar pattern). The Simpson
 * approximation is drawn as a parabolic-segment envelope over each pair
 * of subintervals (visually thin curves), and the numerical answer is
 * shown in the readout. The true value (∫₋₂² e^(-x²) dx ≈ 1.7641) is
 * shown beside it so the convergence is legible.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const PLOT_ORIGIN_X = 80
const PLOT_ORIGIN_Y = 340
const X_UNIT = 110
const Y_UNIT = 220

const X_MIN = -2
const X_MAX = 2
const Y_MAX = 1.05

const f = (x: number) => Math.exp(-x * x)

// True integral of e^(-x²) over [-2, 2] is sqrt(pi) · erf(2)
// erf(2) ≈ 0.99532226501895
const TRUE_VALUE = Math.sqrt(Math.PI) * 0.99532226501895 // ≈ 1.7641627815

const fmt = (n: number, p = 6) => n.toFixed(p)

function toPx(x: number, y: number) {
  return {
    px: PLOT_ORIGIN_X + (x - X_MIN) * X_UNIT,
    py: PLOT_ORIGIN_Y - y * Y_UNIT,
  }
}

function curvePath() {
  const steps = 200
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / steps
    const y = f(x)
    const { px, py } = toPx(x, y)
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return pts.join(' ')
}

function simpsonRule(n: number): number {
  // Composite Simpson's rule. n must be even.
  const N = n % 2 === 0 ? n : n + 1
  const h = (X_MAX - X_MIN) / N
  let s = f(X_MIN) + f(X_MAX)
  for (let i = 1; i < N; i++) {
    const x = X_MIN + i * h
    s += (i % 2 === 0 ? 2 : 4) * f(x)
  }
  return (h / 3) * s
}

/**
 * Visualise Simpson: each pair of subintervals is approximated by a
 * parabola through three points (the two endpoints and the midpoint).
 * We render the union of those parabolas as a single faint vermilion
 * fill, so the reader sees the Simpson envelope sitting on the bell.
 */
function simpsonEnvelopePath(n: number): string {
  const N = n % 2 === 0 ? n : n + 1
  const h = (X_MAX - X_MIN) / N
  const samples = 24 // per parabolic arc
  const pts: string[] = []
  for (let pair = 0; pair < N; pair += 2) {
    const xL = X_MIN + pair * h
    const xM = xL + h
    const xR = xL + 2 * h
    const yL = f(xL)
    const yM = f(xM)
    const yR = f(xR)
    // Quadratic through (xL,yL), (xM,yM), (xR,yR)
    // Lagrange form: y(x) = yL*L0 + yM*L1 + yR*L2
    const denomL = (xL - xM) * (xL - xR)
    const denomM = (xM - xL) * (xM - xR)
    const denomR = (xR - xL) * (xR - xM)
    for (let i = 0; i <= samples; i++) {
      const t = i / samples
      const xs = xL + t * (xR - xL)
      const L0 = ((xs - xM) * (xs - xR)) / denomL
      const L1 = ((xs - xL) * (xs - xR)) / denomM
      const L2 = ((xs - xL) * (xs - xM)) / denomR
      const ys = yL * L0 + yM * L1 + yR * L2
      const { px, py } = toPx(xs, ys)
      if (pair === 0 && i === 0) pts.push(`M${px.toFixed(1)},${py.toFixed(1)}`)
      else pts.push(`L${px.toFixed(1)},${py.toFixed(1)}`)
    }
  }
  // Close down to the x-axis
  const { px: pxR, py: py0 } = toPx(X_MAX, 0)
  const { px: pxL } = toPx(X_MIN, 0)
  pts.push(`L${pxR.toFixed(1)},${py0.toFixed(1)}`)
  pts.push(`L${pxL.toFixed(1)},${py0.toFixed(1)}`)
  pts.push('Z')
  return pts.join(' ')
}

function nodesAtN(n: number): Array<{ x: number; y: number }> {
  const N = n % 2 === 0 ? n : n + 1
  const h = (X_MAX - X_MIN) / N
  const arr: Array<{ x: number; y: number }> = []
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + i * h
    arr.push({ x, y: f(x) })
  }
  return arr
}

const N_CHOICES: Array<{ n: number; label: string }> = [
  { n: 4, label: 'n = 4' },
  { n: 16, label: 'n = 16' },
  { n: 64, label: 'n = 64' },
]

export function NumericalIntegration() {
  void ORIGIN_X
  void ORIGIN_Y
  void UNIT

  const [n, setN] = useState<number>(4)
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

  const approx = simpsonRule(n)
  const error = Math.abs(TRUE_VALUE - approx)
  const nodes = nodesAtN(n)

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (idx + 1) % N_CHOICES.length
      setN(N_CHOICES[next].n)
      buttonRefs.current[next]?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const next = (idx - 1 + N_CHOICES.length) % N_CHOICES.length
      setN(N_CHOICES[next].n)
      buttonRefs.current[next]?.focus()
    }
  }

  const narrationText = `Simpson's rule with n equals ${n}. The approximation is ${fmt(approx, 6)}. The true value is approximately 1.764163. Error: ${fmt(error, 6)}.`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narrationText}
        priority="normal"
      />
      <div
        role="toolbar"
        aria-label="Choose number of subintervals for Simpson's rule"
        className="flex items-center justify-center gap-2 mb-2"
      >
        {N_CHOICES.map((c, idx) => {
          const selected = c.n === n
          return (
            <button
              key={c.n}
              ref={(el) => {
                buttonRefs.current[idx] = el
              }}
              type="button"
              aria-pressed={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setN(c.n)}
              onKeyDown={(e) => onKey(e, idx)}
              className={`font-sans text-[11px] uppercase tracking-[0.22em] px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                selected
                  ? 'text-vermilion border-b border-vermilion'
                  : 'text-dim hover:text-ink border-b border-transparent'
              }`}
            >
              {c.label}
            </button>
          )
        })}
      </div>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Numerical integration of e to the negative x-squared on the interval from minus two to two. Simpson's rule with n equals ${n} gives ${fmt(approx, 6)}. The true value is approximately 1.764163.`}
      >
        {/* Header */}
        <text x={36} y={40} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          NUMERICAL  &middot;  NO CLOSED-FORM ANTIDERIVATIVE
        </text>
        <text x={36} y={60} fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-ink)">
          f(x) = e<tspan dy="-4" fontSize="10">&minus;x&sup2;</tspan><tspan dy="4" fontSize="13">&nbsp; on [&minus;2, 2]</tspan>
        </text>

        {/* Grid */}
        {[-2, -1, 0, 1, 2].map((tx) => {
          const { px } = toPx(tx, 0)
          const { py: yTop } = toPx(0, Y_MAX)
          const { py: yBot } = toPx(0, 0)
          return (
            <line key={`gv-${tx}`} x1={px} y1={yTop} x2={px} y2={yBot} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
          )
        })}
        {[0, 0.25, 0.5, 0.75, 1].map((ty) => {
          const { px: xL } = toPx(X_MIN, 0)
          const { px: xR } = toPx(X_MAX, 0)
          const { py } = toPx(0, ty)
          return (
            <line key={`gh-${ty}`} x1={xL} y1={py} x2={xR} y2={py} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
          )
        })}

        {/* Simpson envelope — soft vermilion fill UNDER the true curve */}
        <path
          d={simpsonEnvelopePath(n)}
          fill="var(--color-vermilion)"
          fillOpacity="0.18"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
          strokeOpacity="0.55"
        />

        {/* Subinterval boundaries — thin vertical ticks */}
        {nodes.map((nd, i) => {
          const { px } = toPx(nd.x, 0)
          const { py: py0 } = toPx(0, 0)
          const { py: pyT } = toPx(0, nd.y)
          // Suppress the dense vertical ticks when n is large (64)
          if (n > 16 && i % 4 !== 0) return null
          return (
            <line
              key={`tk-${i}`}
              x1={px}
              y1={py0}
              x2={px}
              y2={pyT}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.5"
              strokeOpacity="0.3"
              strokeDasharray="2 2"
            />
          )
        })}

        {/* Sample nodes — drawn as small dots where Simpson evaluates f */}
        {nodes.map((nd, i) => {
          if (n > 16 && i % 4 !== 0 && i !== nodes.length - 1) return null
          const { px, py } = toPx(nd.x, nd.y)
          return (
            <circle
              key={`nd-${i}`}
              cx={px}
              cy={py}
              r={n > 16 ? 1.6 : 2.4}
              fill="var(--color-vermilion)"
            />
          )
        })}

        {/* Axes */}
        <line
          x1={toPx(X_MIN, 0).px - 6}
          y1={toPx(0, 0).py}
          x2={toPx(X_MAX, 0).px + 24}
          y2={toPx(0, 0).py}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />
        <line
          x1={toPx(0, 0).px}
          y1={toPx(0, 0).py + 10}
          x2={toPx(0, 0).px}
          y2={toPx(0, Y_MAX).py - 8}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />
        {[-2, -1, 0, 1, 2].map((tx) => {
          const { px, py } = toPx(tx, 0)
          return (
            <g key={`xt-${tx}`}>
              <line x1={px} y1={py - 3} x2={px} y2={py + 3} stroke="var(--color-graph-ink)" strokeWidth="1" />
              <text x={px} y={py + 16} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
                {tx}
              </text>
            </g>
          )
        })}

        {/* The true curve drawn on top */}
        <path
          d={curvePath()}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* Readout */}
        <g transform={`translate(${VIEW_W - 36}, 90)`}>
          <text textAnchor="end" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            SIMPSON&rsquo;S RULE
          </text>
          <text y="20" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
            n = {n}
          </text>
          <text y="44" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="16" fill="var(--color-vermilion)">
            &asymp; {fmt(approx, 6)}
          </text>
          <text y="64" textAnchor="end" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            true: 1.764163
          </text>
          <text y="80" textAnchor="end" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            error: {fmt(error, 6)}
          </text>
        </g>

        {/* Sidebar: this is how every scientific lib does it */}
        <g transform={`translate(36, ${VIEW_H - 110})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
            EVERY SCIENTIFIC LIBRARY DOES THIS
          </text>
          <text y="18" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-ink)">
            scipy.integrate.quad &middot; numpy.trapz
          </text>
          <text y="34" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-ink)">
            torch.cumulative_trapezoid
          </text>
          <text y="56" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            Under the hood: parabolas through samples,
          </text>
          <text y="72" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            summed up. The whole numerical zoo is a sum.
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5 &mdash; e<sup>&minus;x&sup2;</sup>, no closed form &mdash; sampled and summed.
      </figcaption>
    </figure>
  )
}
