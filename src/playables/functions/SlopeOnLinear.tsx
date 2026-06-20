import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Slope on a linear function: two draggable points sit on f(x) = (1/2) x + 1.
 * A chord connects them and a readout shows rise/run. Wherever you put
 * the points, the slope is the same — that's the load-bearing teaching.
 *
 * Only the x of each point is draggable; the y is forced onto the line.
 * Keyboard: each point is tab-focusable; arrows nudge x by 0.1; Shift by 1.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 320
const UNIT = 44

const X_MIN = -5
const X_MAX = 5

const SLOPE_TRUE = 0.5
const INTERCEPT = 1
const f = (x: number) => SLOPE_TRUE * x + INTERCEPT

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

export function SlopeOnLinear() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const aRef = useRef<SVGGElement | null>(null)
  const bRef = useRef<SVGGElement | null>(null)
  const [xa, setXa] = useState(-2)
  const [xb, setXb] = useState(2)
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
    setXa(clampX(start + (mx * sx) / UNIT))
  })
  const bindB = useDrag(({ first, movement: [mx] }) => {
    if (first) startBRef.current = xb
    const start = startBRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    setXb(clampX(start + (mx * sx) / UNIT))
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

  // Line endpoints
  const lineStart = { x: ORIGIN_X + X_MIN * UNIT, y: ORIGIN_Y - f(X_MIN) * UNIT }
  const lineEnd = { x: ORIGIN_X + X_MAX * UNIT, y: ORIGIN_Y - f(X_MAX) * UNIT }

  // Point svg coords
  const A = { x: ORIGIN_X + xa * UNIT, y: ORIGIN_Y - ya * UNIT }
  const B = { x: ORIGIN_X + xb * UNIT, y: ORIGIN_Y - yb * UNIT }

  // Rise/run dashed corner
  const corner = { x: B.x, y: A.y }

  const narrationText = `Point A at x equals ${fmt(xa).trim()}, point B at x equals ${fmt(xb).trim()}. The chord slope is ${isFinite(slope) ? fmt(slope).trim() : 'undefined'}. The actual slope of this line is ${SLOPE_TRUE}, and it doesn't change no matter where you put the points.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A linear function f of x equals one half x plus one with two draggable points and a chord between them. Chord slope: ${isFinite(slope) ? fmt(slope).trim() : 'undefined'}.`}
      >
        <Grid />
        <Axes />

        {/* The line */}
        <line
          x1={lineStart.x}
          y1={lineStart.y}
          x2={lineEnd.x}
          y2={lineEnd.y}
          stroke="var(--color-vermilion)"
          strokeWidth="2"
          strokeOpacity="0.65"
        />

        {/* Rise/run dashed right triangle */}
        <line x1={A.x} y1={A.y} x2={corner.x} y2={corner.y} stroke="var(--color-graph-ink)" strokeWidth="1" strokeDasharray="4 4" opacity="0.55" />
        <line x1={corner.x} y1={corner.y} x2={B.x} y2={B.y} stroke="var(--color-graph-ink)" strokeWidth="1" strokeDasharray="4 4" opacity="0.55" />
        <text
          x={(A.x + corner.x) / 2}
          y={corner.y + 16}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-dim)"
        >
          run {fmt(run).trim()}
        </text>
        <text
          x={corner.x + 8}
          y={(corner.y + B.y) / 2}
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-dim)"
        >
          rise {fmt(rise).trim()}
        </text>

        {/* Chord (vermilion, thicker than the underlying line) */}
        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--color-vermilion)" strokeWidth="2.8" />

        {/* Point A handle */}
        <g
          {...bindA()}
          ref={aRef}
          tabIndex={0}
          role="button"
          aria-label={`Point A. x equals ${fmt(xa).trim()}. Arrow keys to nudge.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={A.x} cy={A.y} r="22" fill="transparent" />
          <circle cx={A.x} cy={A.y} r="6" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="2" />
        </g>
        <text x={A.x - 12} y={A.y - 12} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">
          A
        </text>

        {/* Point B handle */}
        <g
          {...bindB()}
          ref={bRef}
          tabIndex={0}
          role="button"
          aria-label={`Point B. x equals ${fmt(xb).trim()}. Arrow keys to nudge.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={B.x} cy={B.y} r="22" fill="transparent" />
          <circle cx={B.x} cy={B.y} r="6" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="2" />
        </g>
        <text x={B.x + 10} y={B.y + 4} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">
          B
        </text>

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            CHORD SLOPE
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-ink)">
            rise / run = {fmt(rise).trim()} / {fmt(run).trim()}
          </text>
          <text y="44" fontFamily="JetBrains Mono, monospace" fontSize="18" fill="var(--color-vermilion)">
            = {isFinite(slope) ? fmt(slope).trim() : '—'}
          </text>
          <text y="62" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            f(x) = ½ x + 1
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
          DRAG EITHER POINT  ·  THE SLOPE DOESN'T MOVE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3 — A line is the same slope everywhere.
      </figcaption>
    </figure>
  )
}

function Grid() {
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => {
        const gx = ORIGIN_X + (i - 6) * UNIT
        return (
          <line key={`v-${i}`} x1={gx} y1="20" x2={gx} y2={VIEW_H - 60} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
      {Array.from({ length: 11 }, (_, i) => {
        const gy = ORIGIN_Y + (i - 6) * UNIT
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
