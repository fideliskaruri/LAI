import { useCallback, useEffect, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Review act: the secant-to-tangent move recalled from Functions chapter,
 * act 6. Same parabola f(x) = x². Two draggable points A and B on the
 * curve. As B is pulled toward A, the chord rotates and tips into the
 * tangent at A. When |xa - xb| crosses below MERGE_THRESHOLD, B snaps onto
 * A and the line stretches across the panel as the tangent.
 *
 * Adapted from src/playables/functions/SecantToTangent.tsx, with the
 * Derivatives chapter framing (the chapter that names what falls out of
 * this move). Keyboard: arrows nudge by 0.1, Shift by 1.
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
const fPrime = (x: number) => 2 * x

const MERGE_THRESHOLD = 0.18

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

export function SecantRecap() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const aRef = useRef<SVGGElement | null>(null)
  const bRef = useRef<SVGGElement | null>(null)
  const [xa, setXa] = useState(-0.8)
  const [xb, setXb] = useState(1.8)
  const [isInteracting, setIsInteracting] = useState(false)
  const startARef = useRef<number | null>(null)
  const startBRef = useRef<number | null>(null)

  const clampX = (x: number) => Math.max(X_MIN, Math.min(X_MAX, x))

  const bindA = useDrag(({ first, last, movement: [mx] }) => {
    if (first) {
      startARef.current = xa
      setIsInteracting(true)
    }
    if (last) setIsInteracting(false)
    const start = startARef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    setXa(clampX(start + (mx * sx) / UNIT_X))
  })
  const bindB = useDrag(({ first, last, movement: [mx] }) => {
    if (first) {
      startBRef.current = xb
      setIsInteracting(true)
    }
    if (last) setIsInteracting(false)
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

  const distance = Math.abs(xb - xa)
  const merged = distance < MERGE_THRESHOLD

  const xbDraw = merged ? xa : xb
  const yaTrue = f(xa)
  const ybTrue = f(xbDraw)

  const slope = merged ? fPrime(xa) : (ybTrue - yaTrue) / (xbDraw - xa)

  const A = { x: ORIGIN_X + xa * UNIT_X, y: ORIGIN_Y - yaTrue * UNIT_Y }
  const B = { x: ORIGIN_X + xbDraw * UNIT_X, y: ORIGIN_Y - ybTrue * UNIT_Y }

  const lineY = (x: number) => yaTrue + slope * (x - xa)
  const lineL = { x: ORIGIN_X + X_MIN * UNIT_X, y: ORIGIN_Y - lineY(X_MIN) * UNIT_Y }
  const lineR = { x: ORIGIN_X + X_MAX * UNIT_X, y: ORIGIN_Y - lineY(X_MAX) * UNIT_Y }

  const [narration, setNarration] = useState<{ text: string; priority: 'normal' | 'high' }>({
    text: 'Recall the move from the last chapter. Pull point B toward point A. The chord tips into the tangent at A.',
    priority: 'normal',
  })
  const prevMergedRef = useRef<boolean>(merged)
  useEffect(() => {
    const prev = prevMergedRef.current
    if (merged && !prev) {
      setNarration({
        text: `The points have merged. The chord is now the tangent. The slope at x equals ${fmt(xa).trim()} is ${fmt(fPrime(xa)).trim()}. That is the derivative at A.`,
        priority: 'high',
      })
    } else if (!merged && prev) {
      setNarration({
        text: 'Points apart again. The line is a secant — its slope is the average rate of change between A and B.',
        priority: 'high',
      })
    } else if (merged) {
      setNarration({
        text: `Tangent at x equals ${fmt(xa).trim()}. Slope ${fmt(fPrime(xa)).trim()}.`,
        priority: 'normal',
      })
    } else {
      setNarration({
        text: `Secant from x equals ${fmt(xa).trim()} to x equals ${fmt(xb).trim()}. Slope ${fmt(slope).trim()}.`,
        priority: 'normal',
      })
    }
    prevMergedRef.current = merged
  }, [merged, xa, xb, slope])

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration.text}
        priority={narration.priority}
        isInteracting={isInteracting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={
          merged
            ? `Tangent line to f of x equals x squared at x equals ${fmt(xa).trim()}. Slope ${fmt(slope).trim()}.`
            : `Secant on f of x equals x squared from A at x equals ${fmt(xa).trim()} to B at x equals ${fmt(xb).trim()}. Slope ${fmt(slope).trim()}. Drag B toward A to recall the move.`
        }
      >
        <Grid />
        <Axes />

        <path
          d={curvePath()}
          fill="none"
          stroke="var(--color-vermilion)"
          strokeWidth="2"
          strokeOpacity="0.55"
          strokeLinejoin="round"
        />

        <line
          x1={lineL.x}
          y1={lineL.y}
          x2={lineR.x}
          y2={lineR.y}
          stroke={merged ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
          strokeWidth={merged ? 2.6 : 1.2}
          strokeOpacity={merged ? 0.95 : 0.45}
          strokeDasharray={merged ? '' : '4 5'}
        />

        {!merged && (
          <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--color-vermilion)" strokeWidth="2.8" />
        )}

        {/* Point A */}
        <g
          {...bindA()}
          ref={aRef}
          tabIndex={0}
          role="button"
          aria-label={`Point A on the parabola. x equals ${fmt(xa).trim()}. Arrow keys to nudge.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={A.x} cy={A.y} r="22" fill="transparent" />
          <circle cx={A.x} cy={A.y} r="7" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
        </g>
        <text x={A.x - 16} y={A.y - 12} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">
          A
        </text>

        {/* Point B */}
        <g
          {...bindB()}
          ref={bRef}
          tabIndex={0}
          role="button"
          aria-label={
            merged
              ? `Point B, merged with A at x equals ${fmt(xa).trim()}. Arrow keys to pull B away.`
              : `Point B on the parabola. x equals ${fmt(xb).trim()}. Arrow keys to drag toward A.`
          }
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={B.x} cy={B.y} r="22" fill="transparent" />
          {!merged && (
            <circle cx={B.x} cy={B.y} r="6" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="2" />
          )}
        </g>
        {!merged && (
          <text x={B.x + 10} y={B.y - 10} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">
            B
          </text>
        )}

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            {merged ? 'TANGENT' : 'SECANT'}  ·  RECAP FROM FUNCTIONS
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-ink)">
            slope = {fmt(slope).trim()}
          </text>
          <text y="44" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            {merged
              ? `the limit: f'(${fmt(xa).trim()}) = ${fmt(fPrime(xa)).trim()}`
              : `as B → A, the chord approaches f'(${fmt(xa).trim()}) = ${fmt(fPrime(xa)).trim()}`}
          </text>
        </g>

        {merged && (
          <g transform={`translate(${VIEW_W - 220}, 36)`}>
            <rect width="196" height="30" fill="var(--color-vermilion)" fillOpacity="0.15" />
            <text x="12" y="20" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.18em" fill="var(--color-vermilion)">
              CHORD → TANGENT  ·  RECALLED
            </text>
          </g>
        )}

        <text
          x="32"
          y={VIEW_H - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE MOVE FROM LAST CHAPTER  ·  PULL B TOWARD A
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2 &mdash; Where we left off. The chord, the tangent, the limit.
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
