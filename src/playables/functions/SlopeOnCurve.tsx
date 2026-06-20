import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Slope on a curve: same two-points-plus-chord pattern, now on f(x) = x².
 * The chord's slope changes as you move the points. The teaching here
 * is the absence of a constant slope — and the question that opens:
 * what *is* the slope at a single point?
 *
 * Keyboard: each point tab-focusable; arrows nudge by 0.1; Shift by 1.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 380
const UNIT_X = 50
const UNIT_Y = 24

const X_MIN = -3.5
const X_MAX = 3.5

const f = (x: number) => x * x

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

function curvePath() {
  const steps = 200
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / steps
    const y = f(x)
    const px = ORIGIN_X + x * UNIT_X
    const py = ORIGIN_Y - y * UNIT_Y
    if (py < 20) continue
    pts.push(`${pts.length === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return pts.join(' ')
}

export function SlopeOnCurve() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const aRef = useRef<SVGGElement | null>(null)
  const bRef = useRef<SVGGElement | null>(null)
  const [xa, setXa] = useState(-1.6)
  const [xb, setXb] = useState(1.8)
  const startARef = useRef<number | null>(null)
  const startBRef = useRef<number | null>(null)

  const clampX = (x: number) => Math.max(X_MIN, Math.min(X_MAX, x))

  const bindA = useDrag(({ first, movement: [mx] }) => {
    if (first) startARef.current = xa
    const start = startARef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    setXa(clampX(start + (mx * sx) / UNIT_X))
  })
  const bindB = useDrag(({ first, movement: [mx] }) => {
    if (first) startBRef.current = xb
    const start = startBRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    setXb(clampX(start + (mx * sx) / UNIT_X))
  })

  const nudge = (dx: number) => {
    if (dx === 0) return 0
    return Math.abs(dx) >= 10 ? Math.sign(dx) : Math.sign(dx) * 0.1
  }
  useKeyNudge(
    aRef,
    useCallback((dx: number) => {
      setXa((cur) => clampX(cur + nudge(dx)))
    }, []),
  )
  useKeyNudge(
    bRef,
    useCallback((dx: number) => {
      setXb((cur) => clampX(cur + nudge(dx)))
    }, []),
  )

  const ya = f(xa)
  const yb = f(xb)
  const rise = yb - ya
  const run = xb - xa
  const slope = Math.abs(run) < 1e-6 ? NaN : rise / run

  const A = { x: ORIGIN_X + xa * UNIT_X, y: ORIGIN_Y - ya * UNIT_Y }
  const B = { x: ORIGIN_X + xb * UNIT_X, y: ORIGIN_Y - yb * UNIT_Y }

  // Extend the chord visually past both endpoints so the secant feel is clear.
  const dx = B.x - A.x
  const dy = B.y - A.y
  const len = Math.hypot(dx, dy) || 1
  const ext = 70
  const chordStart = { x: A.x - (dx / len) * ext, y: A.y - (dy / len) * ext }
  const chordEnd = { x: B.x + (dx / len) * ext, y: B.y + (dy / len) * ext }

  const narrationText = `Point A at x equals ${fmt(xa).trim()}, point B at x equals ${fmt(xb).trim()}. The chord slope is ${isFinite(slope) ? fmt(slope).trim() : 'undefined'}. Move either point and the slope changes — the parabola doesn't have a single slope.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`The parabola f of x equals x squared with two draggable points and a chord. Chord slope changes with the points; currently ${isFinite(slope) ? fmt(slope).trim() : 'undefined'}.`}
      >
        <Grid />
        <Axes />

        {/* The parabola */}
        <path d={curvePath()} fill="none" stroke="var(--color-vermilion)" strokeWidth="2" strokeOpacity="0.6" strokeLinejoin="round" />

        {/* Chord, extended past the points */}
        <line
          x1={chordStart.x}
          y1={chordStart.y}
          x2={chordEnd.x}
          y2={chordEnd.y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
          strokeOpacity="0.45"
          strokeDasharray="3 4"
        />
        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--color-vermilion)" strokeWidth="2.8" />

        {/* Handles */}
        <g
          {...bindA()}
          ref={aRef}
          tabIndex={0}
          role="button"
          aria-label={`Point A. x equals ${fmt(xa).trim()}, on the parabola. Arrow keys to nudge.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={A.x} cy={A.y} r="22" fill="transparent" />
          <circle cx={A.x} cy={A.y} r="6" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="2" />
        </g>
        <text x={A.x - 14} y={A.y - 12} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">
          A
        </text>

        <g
          {...bindB()}
          ref={bRef}
          tabIndex={0}
          role="button"
          aria-label={`Point B. x equals ${fmt(xb).trim()}, on the parabola. Arrow keys to nudge.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={B.x} cy={B.y} r="22" fill="transparent" />
          <circle cx={B.x} cy={B.y} r="6" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="2" />
        </g>
        <text x={B.x + 10} y={B.y - 10} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">
          B
        </text>

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            CHORD SLOPE
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-ink)">
            ({fmt(xa).trim()}, {fmt(ya).trim()}) → ({fmt(xb).trim()}, {fmt(yb).trim()})
          </text>
          <text y="44" fontFamily="JetBrains Mono, monospace" fontSize="18" fill="var(--color-vermilion)">
            slope = {isFinite(slope) ? fmt(slope).trim() : '—'}
          </text>
          <text y="62" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            f(x) = x²
          </text>
        </g>

        <text
          x="32"
          y={VIEW_H - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG EITHER POINT  ·  THE SLOPE MOVES WITH YOU
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4 — A curve has a different slope at every point.
      </figcaption>
    </figure>
  )
}

function Grid() {
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => {
        const gx = ORIGIN_X + (i - 6) * UNIT_X
        return (
          <line key={`v-${i}`} x1={gx} y1="20" x2={gx} y2={VIEW_H - 60} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
      {Array.from({ length: 14 }, (_, i) => {
        const gy = ORIGIN_Y - i * UNIT_Y
        if (gy < 20) return null
        return (
          <line key={`h-${i}`} x1="20" y1={gy} x2={VIEW_W - 20} y2={gy} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
    </>
  )
}

function Axes() {
  return (
    <>
      <line x1="20" y1={ORIGIN_Y} x2={VIEW_W - 20} y2={ORIGIN_Y} stroke="var(--color-graph-ink)" strokeWidth="1" />
      <line x1={ORIGIN_X} y1="20" x2={ORIGIN_X} y2={VIEW_H - 60} stroke="var(--color-graph-ink)" strokeWidth="1" />
      <text x={VIEW_W - 30} y={ORIGIN_Y - 8} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">x</text>
      <text x={ORIGIN_X + 8} y="30" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">f(x)</text>
    </>
  )
}
