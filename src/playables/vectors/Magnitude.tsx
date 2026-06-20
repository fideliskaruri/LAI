import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Magnitude act: an arrow + dashed right triangle below it (legs along the
 * x and y axes, hypotenuse is the arrow). Drag the tip; the triangle redraws
 * and the |v| readout updates. Pythagoras's identity is built from the picture.
 *
 * Phase 5 accessibility: the tip is tab-focusable; arrow keys nudge by 0.1
 * math-units, Shift+arrow by 1. CanvasNarrative reads the components and
 * the current magnitude.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const fmt = (n: number) => n.toFixed(2)

export function Magnitude() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const tipRef = useRef<SVGGElement | null>(null)
  const [tip, setTip] = useState({ x: 3, y: 2 })
  const startRef = useRef<typeof tip | null>(null)

  const bind = useDrag(({ first, movement: [mx, my] }) => {
    if (first) startRef.current = { ...tip }
    const start = startRef.current
    if (!start) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const scaleX = VIEW_W / rect.width
    const scaleY = VIEW_H / rect.height
    setTip({
      x: start.x + (mx * scaleX) / UNIT,
      y: start.y - (my * scaleY) / UNIT,
    })
  })

  // Keyboard nudge — 0.1 unit per arrow, 1 unit on Shift.
  const nudgeAmount = (d: number) => {
    if (d === 0) return 0
    return Math.abs(d) >= 10 ? Math.sign(d) * 1 : Math.sign(d) * 0.1
  }
  useKeyNudge(
    tipRef,
    useCallback((dx: number, dy: number) => {
      setTip((cur) => ({ x: cur.x + nudgeAmount(dx), y: cur.y + nudgeAmount(dy) }))
    }, []),
  )

  const tipSvg = { x: ORIGIN_X + tip.x * UNIT, y: ORIGIN_Y - tip.y * UNIT }
  const cornerSvg = { x: tipSvg.x, y: ORIGIN_Y } // foot of the perpendicular
  const mag = Math.sqrt(tip.x * tip.x + tip.y * tip.y)

  const ang = Math.atan2(tipSvg.y - ORIGIN_Y, tipSvg.x - ORIGIN_X)
  const headLen = 14
  const headWide = 6
  const headBase1 = {
    x: tipSvg.x - headLen * Math.cos(ang) + headWide * Math.cos(ang + Math.PI / 2),
    y: tipSvg.y - headLen * Math.sin(ang) + headWide * Math.sin(ang + Math.PI / 2),
  }
  const headBase2 = {
    x: tipSvg.x - headLen * Math.cos(ang) - headWide * Math.cos(ang + Math.PI / 2),
    y: tipSvg.y - headLen * Math.sin(ang) - headWide * Math.sin(ang + Math.PI / 2),
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Vector (${fmt(tip.x)}, ${fmt(tip.y)}). Magnitude ${mag.toFixed(2)}.`}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A vector with components ${fmt(tip.x)}, ${fmt(tip.y)} and magnitude ${fmt(mag)}. A dashed right triangle visualizes the Pythagorean relation.`}
      >
        <Grid />
        <Axes />

        {/* Right triangle: dashed horizontal leg + dashed vertical leg */}
        <line x1={ORIGIN_X} y1={ORIGIN_Y} x2={cornerSvg.x} y2={cornerSvg.y} stroke="var(--color-graph-ink)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1={cornerSvg.x} y1={cornerSvg.y} x2={tipSvg.x} y2={tipSvg.y} stroke="var(--color-graph-ink)" strokeWidth="1" strokeDasharray="4 4" />

        {/* Right-angle indicator at the corner */}
        {Math.abs(tip.x) > 0.1 && Math.abs(tip.y) > 0.1 && (
          <path
            d={`M ${cornerSvg.x - Math.sign(tip.x) * 8} ${cornerSvg.y} L ${cornerSvg.x - Math.sign(tip.x) * 8} ${cornerSvg.y - Math.sign(tip.y) * 8} L ${cornerSvg.x} ${cornerSvg.y - Math.sign(tip.y) * 8}`}
            fill="none"
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
          />
        )}

        {/* Leg labels */}
        <text
          x={(ORIGIN_X + cornerSvg.x) / 2}
          y={ORIGIN_Y + (tip.y >= 0 ? 18 : -8)}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-dim)"
        >
          {fmt(tip.x)}
        </text>
        <text
          x={cornerSvg.x + (tip.x >= 0 ? 14 : -14)}
          y={(cornerSvg.y + tipSvg.y) / 2}
          textAnchor={tip.x >= 0 ? 'start' : 'end'}
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-dim)"
        >
          {fmt(tip.y)}
        </text>

        {/* Arrow */}
        <line x1={ORIGIN_X} y1={ORIGIN_Y} x2={tipSvg.x} y2={tipSvg.y} stroke="var(--color-vermilion)" strokeWidth="2" />
        <polygon points={`${tipSvg.x},${tipSvg.y} ${headBase1.x},${headBase1.y} ${headBase2.x},${headBase2.y}`} fill="var(--color-vermilion)" />

        {/* Tip handle */}
        <g
          {...bind()}
          ref={tipRef}
          tabIndex={0}
          role="button"
          aria-label={`Vector tip. Currently ${fmt(tip.x)}, ${fmt(tip.y)}, magnitude ${fmt(mag)}. Arrow keys to nudge.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={tipSvg.x} cy={tipSvg.y} r="22" fill="transparent" />
          <circle cx={tipSvg.x} cy={tipSvg.y} r="6" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="2" />
        </g>

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            MAGNITUDE
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="16" fill="var(--color-ink)">
            |v| = √({fmt(tip.x)}² + {fmt(tip.y)}²)
          </text>
          <text y="44" fontFamily="JetBrains Mono, monospace" fontSize="16" fill="var(--color-vermilion)">
            = {fmt(mag)}
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7 — Pythagoras's diagonal
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
      <text x={VIEW_W - 30} y={ORIGIN_Y - 8} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">x</text>
      <text x={ORIGIN_X + 8} y="30" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">y</text>
    </>
  )
}
