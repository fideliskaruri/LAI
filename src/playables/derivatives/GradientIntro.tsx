import { useCallback, useMemo, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Gradient intro: a 2D heatmap of f(x, y) = x² + y², the standard bowl.
 * One draggable point on the plane. A vermilion arrow at the point shows
 * the gradient, which (for this f) points radially outward from the
 * origin — the direction of steepest ascent. Length scales with |grad|.
 *
 * The heatmap is a coarse grid of squares (24×24 cells), each shaded by
 * the function's value clamped to the panel range. Concentric level
 * curves (where f equals 1, 4, 9, 16) are drawn over the top so the
 * geometry of "going uphill perpendicular to a level set" is visible.
 *
 * Keyboard: arrows nudge the point by 0.1 in x or y; Shift by 1.
 */

const VIEW_W = 600
const VIEW_H = 480

const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50 // pixels per math unit
const X_MIN = -3
const X_MAX = 3
const Y_MIN = -2.4
const Y_MAX = 2.4

const f = (x: number, y: number) => x * x + y * y
const gradF = (x: number, y: number) => ({ gx: 2 * x, gy: 2 * y })

const F_MAX = X_MAX * X_MAX + Y_MAX * Y_MAX

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

// Heatmap grid resolution — coarse enough to keep DOM small, fine enough
// to read as a smooth bowl.
const CELL_PX = 16
const COLS = Math.ceil((X_MAX - X_MIN) * UNIT / CELL_PX)
const ROWS = Math.ceil((Y_MAX - Y_MIN) * UNIT / CELL_PX)

const PANEL_X_MIN = ORIGIN_X + X_MIN * UNIT
const PANEL_X_MAX = ORIGIN_X + X_MAX * UNIT
const PANEL_Y_MIN = ORIGIN_Y - Y_MAX * UNIT
const PANEL_Y_MAX = ORIGIN_Y - Y_MIN * UNIT

// Heat color — interpolate from cream (low) to vermilion-deep (high).
function heatColor(value: number): string {
  const t = Math.min(1, Math.max(0, value / F_MAX))
  // Endpoints: low ~ #F3EFE6 (cream-deep), high ~ #6E1C14 (deep vermilion)
  const r1 = 243, g1 = 239, b1 = 230
  const r2 = 110, g2 = 28, b2 = 20
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

export function GradientIntro() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pointRef = useRef<SVGGElement | null>(null)
  const [pt, setPt] = useState({ x: 1.4, y: 0.8 })
  const [isInteracting, setIsInteracting] = useState(false)
  const startRef = useRef<{ x: number; y: number } | null>(null)

  const clampX = (v: number) => Math.max(X_MIN + 0.1, Math.min(X_MAX - 0.1, v))
  const clampY = (v: number) => Math.max(Y_MIN + 0.1, Math.min(Y_MAX - 0.1, v))

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
      x: clampX(start.x + (mx * sx) / UNIT),
      y: clampY(start.y - (my * sy) / UNIT),
    })
  })

  useKeyNudge(
    pointRef,
    useCallback((dx: number, dy: number) => {
      const stepX = Math.abs(dx) >= 10 ? Math.sign(dx) : Math.sign(dx) * 0.1
      const stepY = Math.abs(dy) >= 10 ? Math.sign(dy) : Math.sign(dy) * 0.1
      setPt((cur) => ({ x: clampX(cur.x + stepX), y: clampY(cur.y + stepY) }))
    }, []),
  )

  const cells = useMemo(() => {
    const result: Array<{ x: number; y: number; fill: string; v: number }> = []
    for (let i = 0; i < COLS; i++) {
      for (let j = 0; j < ROWS; j++) {
        // Cell center in math coords
        const xMath = X_MIN + (i + 0.5) * ((X_MAX - X_MIN) / COLS)
        const yMath = Y_MAX - (j + 0.5) * ((Y_MAX - Y_MIN) / ROWS)
        const value = f(xMath, yMath)
        result.push({
          x: PANEL_X_MIN + i * ((PANEL_X_MAX - PANEL_X_MIN) / COLS),
          y: PANEL_Y_MIN + j * ((PANEL_Y_MAX - PANEL_Y_MIN) / ROWS),
          fill: heatColor(value),
          v: value,
        })
      }
    }
    return result
  }, [])

  const cellW = (PANEL_X_MAX - PANEL_X_MIN) / COLS
  const cellH = (PANEL_Y_MAX - PANEL_Y_MIN) / ROWS

  const value = f(pt.x, pt.y)
  const { gx, gy } = gradF(pt.x, pt.y)
  const gMag = Math.hypot(gx, gy)

  const pPx = { x: ORIGIN_X + pt.x * UNIT, y: ORIGIN_Y - pt.y * UNIT }
  // Arrow vector in pixel space — note y is flipped
  const arrowLenMath = 0.9 // base length unit factor
  const tipMathX = pt.x + gx * arrowLenMath * 0.3
  const tipMathY = pt.y + gy * arrowLenMath * 0.3
  const tipPx = { x: ORIGIN_X + tipMathX * UNIT, y: ORIGIN_Y - tipMathY * UNIT }

  // Arrowhead at tip
  const ang = Math.atan2(tipPx.y - pPx.y, tipPx.x - pPx.x)
  const headLen = 12
  const headWide = 6
  const head1 = {
    x: tipPx.x - headLen * Math.cos(ang) + headWide * Math.cos(ang + Math.PI / 2),
    y: tipPx.y - headLen * Math.sin(ang) + headWide * Math.sin(ang + Math.PI / 2),
  }
  const head2 = {
    x: tipPx.x - headLen * Math.cos(ang) - headWide * Math.cos(ang + Math.PI / 2),
    y: tipPx.y - headLen * Math.sin(ang) - headWide * Math.sin(ang + Math.PI / 2),
  }

  // Level curves at f = 1, 4, 9, 16 are circles of radius sqrt(f).
  const levelValues = [1, 4, 9, 16]

  const narrationText = `Point at x equals ${fmt(pt.x).trim()}, y equals ${fmt(pt.y).trim()}. The value f of x y is ${fmt(value).trim()}. The gradient vector is ${fmt(gx).trim()} comma ${fmt(gy).trim()}; it points uphill, away from the origin. Its length, ${fmt(gMag).trim()}, is how steep the climb is.`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narrationText}
        priority="normal"
        isInteracting={isInteracting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Heatmap of f of x y equals x squared plus y squared. A draggable point at x equals ${fmt(pt.x).trim()}, y equals ${fmt(pt.y).trim()}. The gradient at this point is ${fmt(gx).trim()} comma ${fmt(gy).trim()}, drawn as a vermilion arrow pointing uphill.`}
      >
        {/* Header */}
        <text x={36} y={32} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          GRADIENT  ·  THE DERIVATIVE IN TWO DIMENSIONS
        </text>
        <text x={36} y={50} fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-ink)">
          f(x, y) = x² + y² &nbsp;·&nbsp; ∇f = (2x, 2y)
        </text>

        {/* Panel border */}
        <rect
          x={PANEL_X_MIN}
          y={PANEL_Y_MIN}
          width={PANEL_X_MAX - PANEL_X_MIN}
          height={PANEL_Y_MAX - PANEL_Y_MIN}
          fill="var(--color-cream)"
        />

        {/* Heatmap cells */}
        <g>
          {cells.map((c, i) => (
            <rect
              key={i}
              x={c.x}
              y={c.y}
              width={cellW + 0.5}
              height={cellH + 0.5}
              fill={c.fill}
            />
          ))}
        </g>

        {/* Level curves (circles centered at origin) */}
        {levelValues.map((lv) => {
          const r = Math.sqrt(lv) * UNIT
          if (r > Math.max(PANEL_X_MAX - ORIGIN_X, PANEL_Y_MAX - ORIGIN_Y) + 30) return null
          return (
            <g key={lv}>
              <circle
                cx={ORIGIN_X}
                cy={ORIGIN_Y}
                r={r}
                fill="none"
                stroke="var(--color-graph-ink)"
                strokeWidth="0.6"
                strokeOpacity="0.45"
                strokeDasharray="3 4"
              />
              <text
                x={ORIGIN_X + r + 4}
                y={ORIGIN_Y - 4}
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="var(--color-graph-ink)"
                fillOpacity="0.6"
              >
                f={lv}
              </text>
            </g>
          )
        })}

        {/* Axes — light overlay */}
        <line x1={PANEL_X_MIN} y1={ORIGIN_Y} x2={PANEL_X_MAX} y2={ORIGIN_Y} stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.7" />
        <line x1={ORIGIN_X} y1={PANEL_Y_MIN} x2={ORIGIN_X} y2={PANEL_Y_MAX} stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.7" />
        <text x={PANEL_X_MAX - 14} y={ORIGIN_Y - 6} fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-graph-ink)">x</text>
        <text x={ORIGIN_X + 8} y={PANEL_Y_MIN + 12} fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-graph-ink)">y</text>

        {/* Gradient arrow at the point */}
        <line x1={pPx.x} y1={pPx.y} x2={tipPx.x} y2={tipPx.y} stroke="var(--color-vermilion)" strokeWidth="2.6" />
        <polygon
          points={`${tipPx.x},${tipPx.y} ${head1.x},${head1.y} ${head2.x},${head2.y}`}
          fill="var(--color-vermilion)"
        />

        {/* Draggable point */}
        <g
          {...bind()}
          ref={pointRef}
          tabIndex={0}
          role="button"
          aria-label={`Draggable point. x equals ${fmt(pt.x).trim()}, y equals ${fmt(pt.y).trim()}. Arrow keys to nudge.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={pPx.x} cy={pPx.y} r="22" fill="transparent" />
          <circle
            cx={pPx.x}
            cy={pPx.y}
            r="7"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="2.4"
          />
        </g>

        {/* Readout */}
        <g transform={`translate(${VIEW_W - 36}, 36)`}>
          <text textAnchor="end" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            POINT  ·  GRADIENT
          </text>
          <text y="22" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            (x, y) = ({fmt(pt.x).trim()}, {fmt(pt.y).trim()})
          </text>
          <text y="42" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            f(x,y) = {fmt(value).trim()}
          </text>
          <text y="62" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
            ∇f = ({fmt(gx).trim()}, {fmt(gy).trim()})
          </text>
          <text y="82" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
            |∇f| = {fmt(gMag).trim()}
          </text>
        </g>

        {/* Footer hint */}
        <text
          x="36"
          y={VIEW_H - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG THE POINT  ·  THE ARROW POINTS UPHILL
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7 &mdash; In two dimensions, the derivative is a vector.
      </figcaption>
    </figure>
  )
}
