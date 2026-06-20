import { useCallback, useEffect, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { clamp, MATH_X_MAX, MATH_X_MIN, MATH_Y_MAX, MATH_Y_MIN } from '../../lib/math'

/**
 * Addition act: two arrows v and w, parallelogram completes itself.
 * Sum v+w drawn as the diagonal. When v ∥ w, the parallelogram collapses
 * to a line — the degenerate case the prose catches.
 *
 * Phase 5 accessibility: both tips (v, w) are tab-focusable; arrow keys
 * nudge by 0.1 math-units, Shift+arrow by 1. A CanvasNarrative announces
 * the degenerate transition at high priority, otherwise reads the three
 * coordinate triples.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const fmt = (n: number) => n.toFixed(2)

function arrowHead(from: { x: number; y: number }, to: { x: number; y: number }) {
  const ang = Math.atan2(to.y - from.y, to.x - from.x)
  const headLen = 14
  const headWide = 6
  return {
    p1: {
      x: to.x - headLen * Math.cos(ang) + headWide * Math.cos(ang + Math.PI / 2),
      y: to.y - headLen * Math.sin(ang) + headWide * Math.sin(ang + Math.PI / 2),
    },
    p2: {
      x: to.x - headLen * Math.cos(ang) - headWide * Math.cos(ang + Math.PI / 2),
      y: to.y - headLen * Math.sin(ang) - headWide * Math.sin(ang + Math.PI / 2),
    },
  }
}

export function Parallelogram() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const vRef = useRef<SVGGElement | null>(null)
  const wRef = useRef<SVGGElement | null>(null)
  const [v, setV] = useState({ x: 3, y: 1 })
  const [w, setW] = useState({ x: 1, y: 2 })
  const [dragging, setDragging] = useState(false)
  const startVRef = useRef<typeof v | null>(null)
  const startWRef = useRef<typeof w | null>(null)

  const scale = () => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { sx: 1, sy: 1 }
    return { sx: VIEW_W / rect.width, sy: VIEW_H / rect.height }
  }

  const bindV = useDrag(({ first, down, movement: [mx, my] }) => {
    if (first) startVRef.current = { ...v }
    setDragging(down)
    const start = startVRef.current
    if (!start) return
    const { sx, sy } = scale()
    setV({ x: start.x + (mx * sx) / UNIT, y: start.y - (my * sy) / UNIT })
  })
  const bindW = useDrag(({ first, down, movement: [mx, my] }) => {
    if (first) startWRef.current = { ...w }
    setDragging(down)
    const start = startWRef.current
    if (!start) return
    const { sx, sy } = scale()
    setW({ x: start.x + (mx * sx) / UNIT, y: start.y - (my * sy) / UNIT })
  })

  // Keyboard nudge — 0.1 unit / 1 unit Shift
  const nudgeAmount = (d: number) => {
    if (d === 0) return 0
    return Math.abs(d) >= 10 ? Math.sign(d) * 1 : Math.sign(d) * 0.1
  }
  useKeyNudge(
    vRef,
    useCallback((dx: number, dy: number) => {
      setV((cur) => ({
        x: clamp(cur.x + nudgeAmount(dx), MATH_X_MIN, MATH_X_MAX),
        y: clamp(cur.y + nudgeAmount(dy), MATH_Y_MIN, MATH_Y_MAX),
      }))
    }, []),
  )
  useKeyNudge(
    wRef,
    useCallback((dx: number, dy: number) => {
      setW((cur) => ({
        x: clamp(cur.x + nudgeAmount(dx), MATH_X_MIN, MATH_X_MAX),
        y: clamp(cur.y + nudgeAmount(dy), MATH_Y_MIN, MATH_Y_MAX),
      }))
    }, []),
  )

  // SVG positions
  const O = { x: ORIGIN_X, y: ORIGIN_Y }
  const V = { x: ORIGIN_X + v.x * UNIT, y: ORIGIN_Y - v.y * UNIT }
  const W = { x: ORIGIN_X + w.x * UNIT, y: ORIGIN_Y - w.y * UNIT }
  const SUM = { x: ORIGIN_X + (v.x + w.x) * UNIT, y: ORIGIN_Y - (v.y + w.y) * UNIT }

  // Degenerate test — parallel if cross product ~ 0.
  // Hysteresis: enter when |cross| < 0.08, exit only when |cross| > 0.15,
  // so a tip dragged right along the boundary doesn't flutter the
  // high-priority announcement on every other frame.
  const cross = v.x * w.y - v.y * w.x
  const absCross = Math.abs(cross)
  const degenerateRef = useRef<boolean>(absCross < 0.08)
  if (degenerateRef.current) {
    if (absCross > 0.15) degenerateRef.current = false
  } else {
    if (absCross < 0.08) degenerateRef.current = true
  }
  const degenerate = degenerateRef.current

  const headV = arrowHead(O, V)
  const headW = arrowHead(O, W)
  const headSum = arrowHead(O, SUM)

  // Edge-detect degenerate transitions so we can fire high-priority narration.
  const [narration, setNarration] = useState<{ text: string; priority: 'normal' | 'high' }>({
    text: `v at (${fmt(v.x)}, ${fmt(v.y)}); w at (${fmt(w.x)}, ${fmt(w.y)}); sum at (${fmt(v.x + w.x)}, ${fmt(v.y + w.y)}).`,
    priority: 'normal',
  })
  const prevDegenerateRef = useRef<boolean>(degenerate)
  useEffect(() => {
    const prev = prevDegenerateRef.current
    if (degenerate && !prev) {
      setNarration({
        text: 'Vectors are now parallel. The parallelogram has collapsed into a line.',
        priority: 'high',
      })
    } else if (!degenerate && prev) {
      setNarration({
        text: 'Parallelogram is well-formed again.',
        priority: 'high',
      })
    } else {
      setNarration({
        text: `v at (${fmt(v.x)}, ${fmt(v.y)}); w at (${fmt(w.x)}, ${fmt(w.y)}); sum at (${fmt(v.x + w.x)}, ${fmt(v.y + w.y)}).`,
        priority: 'normal',
      })
    }
    prevDegenerateRef.current = degenerate
  }, [degenerate, v.x, v.y, w.x, w.y])

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration.text} priority={narration.priority} isInteracting={dragging} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={
          degenerate
            ? `Two vectors v equals ${fmt(v.x)}, ${fmt(v.y)} and w equals ${fmt(w.x)}, ${fmt(w.y)} are parallel. The parallelogram has collapsed into a line. The sum vector lies along the same line.`
            : `Two vectors v equals ${fmt(v.x)}, ${fmt(v.y)} and w equals ${fmt(w.x)}, ${fmt(w.y)}. The parallelogram completes itself; the sum v plus w is the diagonal.`
        }
      >
        <Grid />
        <Axes />

        {/* Parallelogram dashed sides */}
        <line x1={V.x} y1={V.y} x2={SUM.x} y2={SUM.y} stroke="var(--color-graph-ink)" strokeWidth="1" strokeDasharray="4 4" opacity={degenerate ? 0.3 : 0.6} />
        <line x1={W.x} y1={W.y} x2={SUM.x} y2={SUM.y} stroke="var(--color-graph-ink)" strokeWidth="1" strokeDasharray="4 4" opacity={degenerate ? 0.3 : 0.6} />

        {/* Vector v (ink) */}
        <line x1={O.x} y1={O.y} x2={V.x} y2={V.y} stroke="var(--color-graph-ink)" strokeWidth="2" />
        <polygon points={`${V.x},${V.y} ${headV.p1.x},${headV.p1.y} ${headV.p2.x},${headV.p2.y}`} fill="var(--color-graph-ink)" />
        <text x={V.x + 12} y={V.y + 6} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="16" fill="var(--color-graph-ink)">v</text>

        {/* Vector w (also ink, but with a w label) */}
        <line x1={O.x} y1={O.y} x2={W.x} y2={W.y} stroke="var(--color-graph-ink)" strokeWidth="2" />
        <polygon points={`${W.x},${W.y} ${headW.p1.x},${headW.p1.y} ${headW.p2.x},${headW.p2.y}`} fill="var(--color-graph-ink)" />
        <text x={W.x + 12} y={W.y + 6} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="16" fill="var(--color-graph-ink)">w</text>

        {/* Sum vector (vermilion) */}
        <line x1={O.x} y1={O.y} x2={SUM.x} y2={SUM.y} stroke="var(--color-vermilion)" strokeWidth="2.5" />
        <polygon points={`${SUM.x},${SUM.y} ${headSum.p1.x},${headSum.p1.y} ${headSum.p2.x},${headSum.p2.y}`} fill="var(--color-vermilion)" />

        {/* Tip handles */}
        <g
          {...bindV()}
          ref={vRef}
          tabIndex={0}
          role="button"
          aria-label={`Vector v tip. Currently ${fmt(v.x)}, ${fmt(v.y)}. Arrow keys to nudge.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={V.x} cy={V.y} r="22" fill="transparent" />
          <circle cx={V.x} cy={V.y} r="6" fill="var(--color-cream)" stroke="var(--color-graph-ink)" strokeWidth="2" />
        </g>
        <g
          {...bindW()}
          ref={wRef}
          tabIndex={0}
          role="button"
          aria-label={`Vector w tip. Currently ${fmt(w.x)}, ${fmt(w.y)}. Arrow keys to nudge.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={W.x} cy={W.y} r="22" fill="transparent" />
          <circle cx={W.x} cy={W.y} r="6" fill="var(--color-cream)" stroke="var(--color-graph-ink)" strokeWidth="2" />
        </g>

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            v  +  w
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-ink)">
            ({fmt(v.x)}, {fmt(v.y)}) + ({fmt(w.x)}, {fmt(w.y)})
          </text>
          <text y="44" fontFamily="JetBrains Mono, monospace" fontSize="16" fill="var(--color-vermilion)">
            = ({fmt(v.x + w.x)}, {fmt(v.y + w.y)})
          </text>
        </g>

        {/* Degenerate badge */}
        {degenerate && (
          <g transform={`translate(${VIEW_W - 200}, 36)`}>
            <rect width="180" height="30" fill="var(--color-vermilion)" fillOpacity="0.15" />
            <text x="12" y="20" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.18em" fill="var(--color-vermilion)">
              YOU JUST COLLAPSED IT
            </text>
          </g>
        )}
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5 — Adding vectors: the parallelogram law
      </figcaption>
    </figure>
  )
}

function Grid() {
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => {
        const x = ORIGIN_X + (i - 6) * UNIT
        return (
          <line key={`v-${i}`} x1={x} y1="20" x2={x} y2={VIEW_H - 20} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const y = ORIGIN_Y + (i - 4) * UNIT
        return (
          <line key={`h-${i}`} x1="20" y1={y} x2={VIEW_W - 20} y2={y} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
    </>
  )
}

function Axes() {
  return (
    <>
      <line x1="20" y1={ORIGIN_Y} x2={VIEW_W - 20} y2={ORIGIN_Y} stroke="var(--color-graph-ink)" strokeWidth="1" />
      <line x1={ORIGIN_X} y1="20" x2={ORIGIN_X} y2={VIEW_H - 20} stroke="var(--color-graph-ink)" strokeWidth="1" />
    </>
  )
}
