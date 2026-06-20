import { useCallback, useMemo, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Linear regression revisited — through the lens of optimization.
 *
 * A small synthetic dataset of (x_i, y_i) pairs drawn from a noisy line.
 * The loss is the SSE, viewed as a function of the line's two parameters:
 * intercept a and slope b. That loss surface is a *perfectly convex bowl*
 * — a paraboloid — which is exactly why Gauss could solve it in 1809
 * with algebra rather than climbing.
 *
 * The reader drags a point on the (a, b) plane; the heatmap shows the
 * SSE at that point; the closed-form minimum is marked with a vermilion X.
 * Drag the point around the bowl — the SSE always goes up away from the
 * mark, never has a second low spot.
 */

const VIEW_W = 600
const VIEW_H = 480

const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 90 // pixels per parameter unit

// (a, b) range — intercept on x, slope on y in the parameter plane
const A_MIN = -1.6
const A_MAX = 1.6
const B_MIN = -0.6
const B_MAX = 2.6

// Synthetic data: y_i = 0.4 + 1.2 x_i + noise. The closed-form best fit
// will be very close to (0.4, 1.2), and the SSE there will be the noise
// floor.
const TRUE_A = 0.4
const TRUE_B = 1.2

function synthData() {
  // Deterministic — pseudo-noise from a fixed seed for visual stability.
  // (Not cryptographic; the goal is reproducibility of the heatmap.)
  const n = 22
  const pts: Array<{ x: number; y: number }> = []
  let seed = 91
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = 0; i < n; i++) {
    const x = -1.4 + (i / (n - 1)) * 2.8
    const noise = (rand() - 0.5) * 0.45
    const y = TRUE_A + TRUE_B * x + noise
    pts.push({ x, y })
  }
  return pts
}

const DATA = synthData()

function sse(a: number, b: number): number {
  let s = 0
  for (const { x, y } of DATA) {
    const e = y - (a + b * x)
    s += e * e
  }
  return s
}

// Closed-form least squares — center the data then divide.
function closedForm() {
  const n = DATA.length
  let mx = 0, my = 0
  for (const { x, y } of DATA) { mx += x; my += y }
  mx /= n
  my /= n
  let num = 0, den = 0
  for (const { x, y } of DATA) {
    num += (x - mx) * (y - my)
    den += (x - mx) * (x - mx)
  }
  const b = num / den
  const a = my - b * mx
  return { a, b }
}

const BEST = closedForm()
const SSE_MIN = sse(BEST.a, BEST.b)
const SSE_MAX = sse(A_MIN, B_MIN) // worst corner
const SSE_SPAN = SSE_MAX - SSE_MIN

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

const CELL_PX = 15
const COLS = Math.ceil((A_MAX - A_MIN) * UNIT / CELL_PX)
const ROWS = Math.ceil((B_MAX - B_MIN) * UNIT / CELL_PX)

const PANEL_X_MIN = ORIGIN_X + A_MIN * UNIT
const PANEL_X_MAX = ORIGIN_X + A_MAX * UNIT
const PANEL_Y_MIN = ORIGIN_Y - B_MAX * UNIT
const PANEL_Y_MAX = ORIGIN_Y - B_MIN * UNIT

function heatColor(value: number): string {
  const t = Math.min(1, Math.max(0, (value - SSE_MIN) / SSE_SPAN))
  const r1 = 243, g1 = 239, b1 = 230
  const r2 = 110, g2 = 28, b2 = 20
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

export function LinRegRevisited() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pointRef = useRef<SVGGElement | null>(null)
  const [pt, setPt] = useState({ a: -0.8, b: 0.4 })
  const [isInteracting, setIsInteracting] = useState(false)
  const startRef = useRef<{ a: number; b: number } | null>(null)

  const clampA = (v: number) => Math.max(A_MIN + 0.05, Math.min(A_MAX - 0.05, v))
  const clampB = (v: number) => Math.max(B_MIN + 0.05, Math.min(B_MAX - 0.05, v))

  const bind = useDrag(({ first, last, movement: [mx, my] }) => {
    if (first) {
      startRef.current = { ...pt }
      setIsInteracting(true)
    }
    if (last) setIsInteracting(false)
    const start = startRef.current
    if (!start) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const sy = VIEW_H / rect.height
    setPt({
      a: clampA(start.a + (mx * sx) / UNIT),
      b: clampB(start.b - (my * sy) / UNIT),
    })
  })

  useKeyNudge(
    pointRef,
    useCallback((dx: number, dy: number) => {
      const stepA = Math.abs(dx) >= 10 ? Math.sign(dx) * 0.5 : Math.sign(dx) * 0.05
      const stepB = Math.abs(dy) >= 10 ? Math.sign(dy) * 0.5 : Math.sign(dy) * 0.05
      setPt((cur) => ({ a: clampA(cur.a + stepA), b: clampB(cur.b + stepB) }))
    }, []),
  )

  const cells = useMemo(() => {
    const result: Array<{ x: number; y: number; fill: string }> = []
    for (let i = 0; i < COLS; i++) {
      for (let j = 0; j < ROWS; j++) {
        const aMath = A_MIN + (i + 0.5) * ((A_MAX - A_MIN) / COLS)
        const bMath = B_MAX - (j + 0.5) * ((B_MAX - B_MIN) / ROWS)
        result.push({
          x: PANEL_X_MIN + i * ((PANEL_X_MAX - PANEL_X_MIN) / COLS),
          y: PANEL_Y_MIN + j * ((PANEL_Y_MAX - PANEL_Y_MIN) / ROWS),
          fill: heatColor(sse(aMath, bMath)),
        })
      }
    }
    return result
  }, [])

  const cellW = (PANEL_X_MAX - PANEL_X_MIN) / COLS
  const cellH = (PANEL_Y_MAX - PANEL_Y_MIN) / ROWS

  const value = sse(pt.a, pt.b)
  const bestPx = { x: ORIGIN_X + BEST.a * UNIT, y: ORIGIN_Y - BEST.b * UNIT }
  const pPx = { x: ORIGIN_X + pt.a * UNIT, y: ORIGIN_Y - pt.b * UNIT }

  const narrationText = `Intercept a equals ${fmt(pt.a).trim()}, slope b equals ${fmt(pt.b).trim()}. Sum of squared errors equals ${fmt(value).trim()}. The minimum at the vermilion mark is ${fmt(SSE_MIN).trim()}. The whole surface is a single convex bowl.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} priority="normal" isInteracting={isInteracting} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Heatmap of sum of squared errors as a function of intercept and slope, for a linear regression of a small synthetic dataset. The minimum is at intercept ${fmt(BEST.a).trim()}, slope ${fmt(BEST.b).trim()}. A draggable point at intercept ${fmt(pt.a).trim()}, slope ${fmt(pt.b).trim()}.`}
      >
        <text x={36} y={32} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          LINREG LOSS  ·  A CONVEX BOWL
        </text>
        <text x={36} y={50} fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-ink)">
          SSE(a, b) = Σ (yᵢ &minus; a &minus; b xᵢ)²
        </text>

        <rect
          x={PANEL_X_MIN}
          y={PANEL_Y_MIN}
          width={PANEL_X_MAX - PANEL_X_MIN}
          height={PANEL_Y_MAX - PANEL_Y_MIN}
          fill="var(--color-cream)"
        />

        <g>
          {cells.map((c, i) => (
            <rect key={i} x={c.x} y={c.y} width={cellW + 0.5} height={cellH + 0.5} fill={c.fill} />
          ))}
        </g>

        <line x1={PANEL_X_MIN} y1={ORIGIN_Y} x2={PANEL_X_MAX} y2={ORIGIN_Y} stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.7" />
        <line x1={ORIGIN_X} y1={PANEL_Y_MIN} x2={ORIGIN_X} y2={PANEL_Y_MAX} stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.7" />
        <text x={PANEL_X_MAX - 14} y={ORIGIN_Y - 6} fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-graph-ink)">a</text>
        <text x={ORIGIN_X + 8} y={PANEL_Y_MIN + 12} fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-graph-ink)">b</text>

        {/* Closed-form minimum — vermilion X */}
        <g>
          <line x1={bestPx.x - 8} y1={bestPx.y - 8} x2={bestPx.x + 8} y2={bestPx.y + 8} stroke="var(--color-vermilion)" strokeWidth="2.4" />
          <line x1={bestPx.x - 8} y1={bestPx.y + 8} x2={bestPx.x + 8} y2={bestPx.y - 8} stroke="var(--color-vermilion)" strokeWidth="2.4" />
          <text x={bestPx.x + 14} y={bestPx.y - 4} fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-vermilion)">
            closed form
          </text>
        </g>

        {/* Draggable point */}
        <g
          {...bind()}
          ref={pointRef}
          tabIndex={0}
          role="button"
          aria-label={`Draggable point in parameter space. a equals ${fmt(pt.a).trim()}, b equals ${fmt(pt.b).trim()}. Arrow keys to nudge.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={pPx.x} cy={pPx.y} r="22" fill="transparent" />
          <circle cx={pPx.x} cy={pPx.y} r="7" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="2.4" />
        </g>

        {/* Readout */}
        <g transform={`translate(${VIEW_W - 36}, 36)`}>
          <text textAnchor="end" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            PARAMETERS  ·  SSE
          </text>
          <text y="22" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            (a, b) = ({fmt(pt.a).trim()}, {fmt(pt.b).trim()})
          </text>
          <text y="42" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
            SSE = {fmt(value).trim()}
          </text>
          <text y="60" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
            best = {fmt(SSE_MIN).trim()}
          </text>
        </g>

        <text x="36" y={VIEW_H - 18} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          DRAG THE POINT  ·  THERE IS NO SECOND MINIMUM
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6 &mdash; LinReg's loss is a single bowl. That's why Gauss had a formula. For the rest of ML, we climb.
      </figcaption>
    </figure>
  )
}
