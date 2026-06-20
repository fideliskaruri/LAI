import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Derivative as a function. One draggable point on the parabola f(x) = x².
 * A small tangent arrow sits at the point. Below it, a second curve
 * traces out as the user moves the point: for every x they visit, the
 * slope f'(x) = 2x is plotted. The traced curve persists; once the user
 * has swept the full range, the line y = 2x is fully drawn.
 *
 * We seed an initial trace so the panel doesn't look empty on first paint.
 * Then we paint over it as the user moves.
 *
 * Keyboard: the point is tab-focusable; arrows nudge by 0.1; Shift by 1.
 */

const VIEW_W = 600
const VIEW_H = 480
const TOP_PANEL_BOTTOM = 240 // f(x) panel ends here
const ORIGIN_X = 300
const ORIGIN_Y_F = 220 // parabola origin (y)
const ORIGIN_Y_FP = 360 // derivative panel origin (y)
const UNIT_X = 44
const UNIT_Y_F = 14 // parabola y-scale (squashed because x² grows fast)
const UNIT_Y_FP = 22 // f'(x) y-scale (linear, so a normal scale is fine)

const X_MIN = -3.5
const X_MAX = 3.5

const f = (x: number) => x * x
const fPrime = (x: number) => 2 * x

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

const TRACE_BUCKETS = 80 // resolution of the visited-x trace
const INITIAL_X = -2.4

function xToBucketIdx(xv: number) {
  const t = (xv - X_MIN) / (X_MAX - X_MIN)
  return Math.max(0, Math.min(TRACE_BUCKETS - 1, Math.round(t * (TRACE_BUCKETS - 1))))
}

/** Seed the visited set with the starting bucket plus a couple of neighbours
 *  so the first paint shows the beginning of a trail, not a lone dot.
 *  Computed lazily inside useState's initializer so it runs exactly once,
 *  regardless of React 18 Strict Mode's double-invocation of effects. */
function seedVisited(): Set<number> {
  const s = new Set<number>()
  s.add(xToBucketIdx(INITIAL_X))
  s.add(xToBucketIdx(INITIAL_X - 0.15))
  s.add(xToBucketIdx(INITIAL_X + 0.15))
  return s
}

function parabolaPath() {
  const steps = 200
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / steps
    const y = f(x)
    const px = ORIGIN_X + x * UNIT_X
    const py = ORIGIN_Y_F - y * UNIT_Y_F
    if (py < 20) continue
    pts.push(`${pts.length === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return pts.join(' ')
}

export function DerivativeAsFunction() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pointRef = useRef<SVGGElement | null>(null)
  const [x, setX] = useState(INITIAL_X)
  const startRef = useRef<number | null>(null)

  // Trace of "visited" x-positions, as a set of bucket indices. Held in
  // state with immutable updates (`new Set(prev).add(b)` — TRACE_BUCKETS
  // is small, so the copy is trivially cheap). The starting bucket and
  // its two neighbours are seeded inside the useState initializer, which
  // React 18 Strict Mode runs exactly once — unlike a useEffect-driven
  // ref seed, which would silently no-op on the second mount.
  const [visited, setVisited] = useState<Set<number>>(seedVisited)

  const clampX = (val: number) => Math.max(X_MIN, Math.min(X_MAX, val))

  const markVisited = useCallback((xv: number) => {
    const b = xToBucketIdx(xv)
    setVisited((prev) => (prev.has(b) ? prev : new Set(prev).add(b)))
  }, [])

  const updateX = useCallback(
    (next: number) => {
      const clamped = clampX(next)
      setX(clamped)
      markVisited(clamped)
    },
    [markVisited],
  )

  const bind = useDrag(({ first, movement: [mx] }) => {
    if (first) startRef.current = x
    const start = startRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    updateX(start + (mx * sx) / UNIT_X)
  })

  useKeyNudge(
    pointRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? Math.sign(dx) : Math.sign(dx) * 0.1
        updateX(x + step)
      },
      [x, updateX],
    ),
  )

  // Compute trace path on the derivative panel: connect consecutive visited
  // buckets with line segments. (Gaps where the user hasn't been remain gaps.)
  const tracePath = (() => {
    const sorted = Array.from(visited).sort((a, b) => a - b)
    if (sorted.length === 0) return ''
    const segments: string[] = []
    let current: string[] = []
    for (let i = 0; i < sorted.length; i++) {
      const bucket = sorted[i]
      const xv = X_MIN + (bucket / (TRACE_BUCKETS - 1)) * (X_MAX - X_MIN)
      const yv = fPrime(xv)
      const px = ORIGIN_X + xv * UNIT_X
      const py = ORIGIN_Y_FP - yv * UNIT_Y_FP
      // Start a new segment on bucket gap > 1.
      if (i > 0 && bucket - sorted[i - 1] > 1) {
        if (current.length > 0) segments.push(current.join(' '))
        current = []
      }
      current.push(`${current.length === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
    }
    if (current.length > 0) segments.push(current.join(' '))
    return segments.join(' ')
  })()

  // Current point on parabola
  const y = f(x)
  const P = { x: ORIGIN_X + x * UNIT_X, y: ORIGIN_Y_F - y * UNIT_Y_F }
  // Current point on derivative panel
  const slope = fPrime(x)
  const Pp = { x: ORIGIN_X + x * UNIT_X, y: ORIGIN_Y_FP - slope * UNIT_Y_FP }

  // Tangent arrow at P. We draw a short segment of length ARROW_LEN along
  // direction (1, slope), scaled by the parabola's units.
  const ARROW_HALF = 38
  const dirX = 1
  const dirY = slope
  // Convert mathematical direction into svg pixel direction (y is flipped
  // and the two axes have different units in this panel).
  const pixelDx = dirX * UNIT_X
  const pixelDy = -dirY * UNIT_Y_F
  const mag = Math.hypot(pixelDx, pixelDy) || 1
  const tipX = P.x + (pixelDx / mag) * ARROW_HALF
  const tipY = P.y + (pixelDy / mag) * ARROW_HALF
  const tailX = P.x - (pixelDx / mag) * ARROW_HALF
  const tailY = P.y - (pixelDy / mag) * ARROW_HALF
  // Arrowhead at tip
  const ang = Math.atan2(tipY - P.y, tipX - P.x)
  const headLen = 10
  const headWide = 5
  const head1 = {
    x: tipX - headLen * Math.cos(ang) + headWide * Math.cos(ang + Math.PI / 2),
    y: tipY - headLen * Math.sin(ang) + headWide * Math.sin(ang + Math.PI / 2),
  }
  const head2 = {
    x: tipX - headLen * Math.cos(ang) - headWide * Math.cos(ang + Math.PI / 2),
    y: tipY - headLen * Math.sin(ang) - headWide * Math.sin(ang + Math.PI / 2),
  }

  // Are we "almost done"? Trace coverage signal for narration.
  const coverage = visited.size / TRACE_BUCKETS
  const narrationText =
    coverage > 0.7
      ? `You've traced most of the derivative. As you've moved the point, the slope value f' of x equals 2 x has drawn itself out. The derivative is a straight line through the origin.`
      : `Point at x equals ${fmt(x).trim()}. Slope of the tangent is ${fmt(slope).trim()}. As you move, the slope at each x traces the curve f' of x equals 2 x in the panel below.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Two stacked panels. Top: the parabola f of x equals x squared with a draggable point and a small tangent arrow. Bottom: the derivative f prime of x equals 2 x, traced as you move. Current point x equals ${fmt(x).trim()}, slope ${fmt(slope).trim()}.`}
      >
        {/* Top panel: f(x) */}
        <Grid panel="f" />
        <Axes panel="f" />
        <path d={parabolaPath()} fill="none" stroke="var(--color-vermilion)" strokeWidth="2" strokeOpacity="0.6" strokeLinejoin="round" />

        {/* Tangent arrow */}
        <line
          x1={tailX}
          y1={tailY}
          x2={tipX}
          y2={tipY}
          stroke="var(--color-vermilion)"
          strokeWidth="2.4"
        />
        <polygon
          points={`${tipX},${tipY} ${head1.x},${head1.y} ${head2.x},${head2.y}`}
          fill="var(--color-vermilion)"
        />

        {/* Draggable point on the parabola */}
        <g
          {...bind()}
          ref={pointRef}
          tabIndex={0}
          role="button"
          aria-label={`Point on the parabola at x equals ${fmt(x).trim()}. Arrow keys to slide along the curve.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={P.x} cy={P.y} r="22" fill="transparent" />
          <circle cx={P.x} cy={P.y} r="7" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
        </g>

        {/* Divider */}
        <line
          x1="20"
          y1={TOP_PANEL_BOTTOM + 30}
          x2={VIEW_W - 20}
          y2={TOP_PANEL_BOTTOM + 30}
          stroke="var(--color-graph-fade)"
          strokeWidth="0.8"
          strokeDasharray="2 4"
        />

        {/* Bottom panel: f'(x) */}
        <Grid panel="fp" />
        <Axes panel="fp" />

        {/* Traced derivative curve */}
        {tracePath && (
          <path
            d={tracePath}
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Current dot in derivative panel (mirrors point in top) */}
        <line
          x1={P.x}
          y1={P.y + 10}
          x2={Pp.x}
          y2={Pp.y - 10}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.8"
          strokeOpacity="0.45"
          strokeDasharray="2 3"
        />
        <circle cx={Pp.x} cy={Pp.y} r="5" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="1.5" />

        {/* Readout */}
        <g transform="translate(36, 30)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            f(x) = x²
          </text>
          <text y="18" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
            x = {fmt(x).trim()}, f(x) = {fmt(y).trim()}
          </text>
          <text y="36" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
            slope = {fmt(slope).trim()}
          </text>
        </g>

        <g transform={`translate(36, ${TOP_PANEL_BOTTOM + 56})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            f'(x) = 2x — the slope at every x
          </text>
        </g>

        <text
          x="32"
          y={VIEW_H - 12}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG THE POINT  ·  THE SLOPE BELOW TRACES ITSELF OUT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6 — The slope at every point is itself a function — the derivative.
      </figcaption>
    </figure>
  )
}

function Grid({ panel }: { panel: 'f' | 'fp' }) {
  if (panel === 'f') {
    return (
      <>
        {Array.from({ length: 13 }, (_, i) => {
          const gx = ORIGIN_X + (i - 6) * UNIT_X
          return (
            <line key={`vf-${i}`} x1={gx} y1="20" x2={gx} y2={TOP_PANEL_BOTTOM} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
          )
        })}
        {Array.from({ length: 14 }, (_, i) => {
          const gy = ORIGIN_Y_F - i * UNIT_Y_F
          if (gy < 20 || gy > TOP_PANEL_BOTTOM) return null
          return (
            <line key={`hf-${i}`} x1="20" y1={gy} x2={VIEW_W - 20} y2={gy} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
          )
        })}
      </>
    )
  }
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => {
        const gx = ORIGIN_X + (i - 6) * UNIT_X
        return (
          <line key={`vp-${i}`} x1={gx} y1={TOP_PANEL_BOTTOM + 40} x2={gx} y2={VIEW_H - 30} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const gy = ORIGIN_Y_FP + (i - 4) * UNIT_Y_FP
        if (gy < TOP_PANEL_BOTTOM + 40 || gy > VIEW_H - 30) return null
        return (
          <line key={`hp-${i}`} x1="20" y1={gy} x2={VIEW_W - 20} y2={gy} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
    </>
  )
}

function Axes({ panel }: { panel: 'f' | 'fp' }) {
  if (panel === 'f') {
    return (
      <>
        <line x1="20" y1={ORIGIN_Y_F} x2={VIEW_W - 20} y2={ORIGIN_Y_F} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <line x1={ORIGIN_X} y1="20" x2={ORIGIN_X} y2={TOP_PANEL_BOTTOM} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <text x={VIEW_W - 30} y={ORIGIN_Y_F - 8} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-graph-ink)">x</text>
        <text x={ORIGIN_X + 8} y="30" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-graph-ink)">f(x)</text>
      </>
    )
  }
  return (
    <>
      <line x1="20" y1={ORIGIN_Y_FP} x2={VIEW_W - 20} y2={ORIGIN_Y_FP} stroke="var(--color-graph-ink)" strokeWidth="1" />
      <line x1={ORIGIN_X} y1={TOP_PANEL_BOTTOM + 40} x2={ORIGIN_X} y2={VIEW_H - 30} stroke="var(--color-graph-ink)" strokeWidth="1" />
      <text x={VIEW_W - 30} y={ORIGIN_Y_FP - 8} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-graph-ink)">x</text>
      <text x={ORIGIN_X + 8} y={TOP_PANEL_BOTTOM + 56} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-graph-ink)">f'(x)</text>
    </>
  )
}
