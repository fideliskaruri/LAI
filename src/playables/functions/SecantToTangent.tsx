import { useCallback, useEffect, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Secant tipping into tangent. f(x) = x². Point A is fixed-ish (you can
 * drag it, but it anchors the tangent); point B is what you pull toward A.
 *
 * When B gets within MERGE_THRESHOLD of A, B snaps onto A and the chord
 * becomes a *tangent line* — extended both ways across the panel. The
 * slope readout shows the limit value f'(xa) = 2xa.
 *
 * Keyboard: A and B are tab-focusable; arrows nudge by 0.1; Shift by 1.
 * A high-priority narration fires on the merge transition.
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

export function SecantToTangent() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const aRef = useRef<SVGGElement | null>(null)
  const bRef = useRef<SVGGElement | null>(null)
  const [xa, setXa] = useState(-0.8)
  const [xb, setXb] = useState(1.6)
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
    return Math.abs(dx) >= 10 ? Math.sign(dx) : Math.sign(dx) * 0.05
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

  // Detect merge: when |xa - xb| crosses below the threshold, snap B to A.
  // The chord becomes the tangent. Slope is f'(xa) = 2xa.
  const distance = Math.abs(xb - xa)
  const merged = distance < MERGE_THRESHOLD

  // Effective B for drawing: when merged, B sits exactly on A.
  const xbDraw = merged ? xa : xb
  const yaTrue = f(xa)
  const ybTrue = f(xbDraw)

  // Slope: limit value when merged, secant otherwise.
  const slope = merged ? fPrime(xa) : (ybTrue - yaTrue) / (xbDraw - xa)

  const A = { x: ORIGIN_X + xa * UNIT_X, y: ORIGIN_Y - yaTrue * UNIT_Y }
  const B = { x: ORIGIN_X + xbDraw * UNIT_X, y: ORIGIN_Y - ybTrue * UNIT_Y }

  // Extended line: chord or tangent — same formula y = ya + slope*(x - xa).
  const lineY = (x: number) => yaTrue + slope * (x - xa)
  const lineL = { x: ORIGIN_X + X_MIN * UNIT_X, y: ORIGIN_Y - lineY(X_MIN) * UNIT_Y }
  const lineR = { x: ORIGIN_X + X_MAX * UNIT_X, y: ORIGIN_Y - lineY(X_MAX) * UNIT_Y }

  // Edge-detect merge for high-priority narration.
  const [narration, setNarration] = useState<{ text: string; priority: 'normal' | 'high' }>({
    text: 'Drag point B toward point A. Watch the secant tip into the tangent.',
    priority: 'normal',
  })
  const prevMergedRef = useRef<boolean>(merged)
  useEffect(() => {
    const prev = prevMergedRef.current
    if (merged && !prev) {
      setNarration({
        text: `The points have merged. The chord is now a tangent line. The slope at x equals ${fmt(xa).trim()} is ${fmt(fPrime(xa)).trim()}.`,
        priority: 'high',
      })
    } else if (!merged && prev) {
      setNarration({
        text: 'Points are apart again. The line is a secant — its slope is the average rate of change between A and B.',
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
      <CanvasNarrative text={narration.text} priority={narration.priority} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={
          merged
            ? `Tangent line to f of x equals x squared at x equals ${fmt(xa).trim()}. Slope ${fmt(slope).trim()}.`
            : `Secant line on f of x equals x squared from point A at x equals ${fmt(xa).trim()} to point B at x equals ${fmt(xb).trim()}. Slope ${fmt(slope).trim()}. Drag B toward A.`
        }
      >
        <Grid />
        <Axes />

        {/* Parabola */}
        <path d={curvePath()} fill="none" stroke="var(--color-vermilion)" strokeWidth="2" strokeOpacity="0.55" strokeLinejoin="round" />

        {/* Extended line (full panel width) — vermilion when tangent, ink when secant */}
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

        {/* The bold chord segment between A and B (only visible when not merged) */}
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

        {/* Point B (hidden visual when merged, but stays focusable so KB users can pull it back) */}
        <g
          {...bindB()}
          ref={bRef}
          tabIndex={0}
          role="button"
          aria-label={
            merged
              ? `Point B, merged with A at x equals ${fmt(xa).trim()}. Arrow keys to pull B away from A.`
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
            {merged ? 'TANGENT' : 'SECANT'}
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-ink)">
            slope = {fmt(slope).trim()}
          </text>
          <text y="44" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            {merged
              ? `the limit: f'(${fmt(xa).trim()}) = ${fmt(fPrime(xa)).trim()}`
              : `as B → A, this approaches f'(${fmt(xa).trim()}) = ${fmt(fPrime(xa)).trim()}`}
          </text>
        </g>

        {/* Merged badge */}
        {merged && (
          <g transform={`translate(${VIEW_W - 200}, 36)`}>
            <rect width="180" height="30" fill="var(--color-vermilion)" fillOpacity="0.15" />
            <text x="12" y="20" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.18em" fill="var(--color-vermilion)">
              CHORD → TANGENT
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
          PULL B TOWARD A  ·  THE CHORD TIPS INTO THE TANGENT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5 — Bring the points together. That&apos;s the trick.
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
