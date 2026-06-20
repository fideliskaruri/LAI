import { useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'

/**
 * Direction act: an arrow + an arc sweeping from the positive-x axis
 * counterclockwise to the arrow's direction. The angle θ updates.
 *
 * tan⁻¹ explained, not assumed: "the function that asks what angle has this slope."
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const fmtDeg = (n: number) => n.toFixed(1)
const fmtRad = (n: number) => n.toFixed(3)

export function Direction() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [tip, setTip] = useState({ x: 3, y: 2 })
  const startRef = useRef<typeof tip | null>(null)

  const bind = useDrag(({ first, movement: [mx, my] }) => {
    if (first) startRef.current = { ...tip }
    const start = startRef.current
    if (!start) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const sy = VIEW_H / rect.height
    setTip({
      x: start.x + (mx * sx) / UNIT,
      y: start.y - (my * sy) / UNIT,
    })
  })

  const tipSvg = { x: ORIGIN_X + tip.x * UNIT, y: ORIGIN_Y - tip.y * UNIT }
  const mag = Math.sqrt(tip.x * tip.x + tip.y * tip.y)
  // Standard math angle, atan2, normalized to [0, 2π)
  let theta = Math.atan2(tip.y, tip.x)
  if (theta < 0) theta += 2 * Math.PI
  const thetaDeg = (theta * 180) / Math.PI

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

  // Arc from +x axis to the arrow direction (CCW). Radius small, near origin.
  const arcR = Math.min(50, Math.max(30, mag * 14))
  const largeArc = theta > Math.PI ? 1 : 0
  // SVG arc — note y is inverted
  const arcStart = { x: ORIGIN_X + arcR, y: ORIGIN_Y }
  const arcEnd = {
    x: ORIGIN_X + arcR * Math.cos(theta),
    y: ORIGIN_Y - arcR * Math.sin(theta),
  }
  const arcPath = `M ${arcStart.x} ${arcStart.y} A ${arcR} ${arcR} 0 ${largeArc} 0 ${arcEnd.x} ${arcEnd.y}`
  // Angle label position — midpoint of arc, slightly outside
  const midAng = theta / 2
  const labelR = arcR + 18
  const labelPos = {
    x: ORIGIN_X + labelR * Math.cos(midAng),
    y: ORIGIN_Y - labelR * Math.sin(midAng),
  }

  return (
    <figure className="w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A vector pointing at angle ${fmtDeg(thetaDeg)} degrees from the positive x axis. Drag the tip to change direction.`}
      >
        <Grid />
        <Axes />

        {/* Arc */}
        {mag > 0.1 && (
          <>
            <path d={arcPath} fill="none" stroke="var(--color-vermilion)" strokeWidth="1.5" />
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="Source Serif 4, Georgia, serif"
              fontStyle="italic"
              fontSize="16"
              fill="var(--color-vermilion)"
            >
              θ
            </text>
          </>
        )}

        {/* Arrow */}
        {mag > 0.05 && (
          <>
            <line x1={ORIGIN_X} y1={ORIGIN_Y} x2={tipSvg.x} y2={tipSvg.y} stroke="var(--color-graph-ink)" strokeWidth="2" />
            <polygon points={`${tipSvg.x},${tipSvg.y} ${headBase1.x},${headBase1.y} ${headBase2.x},${headBase2.y}`} fill="var(--color-graph-ink)" />
          </>
        )}

        {/* Tip handle */}
        <g {...bind()} style={{ cursor: 'grab', touchAction: 'none' }}>
          <circle cx={tipSvg.x} cy={tipSvg.y} r="22" fill="transparent" />
          <circle cx={tipSvg.x} cy={tipSvg.y} r="6" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="2" />
        </g>

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            DIRECTION
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="16" fill="var(--color-ink)">
            θ = {fmtDeg(thetaDeg)}°
          </text>
          <text y="42" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-dim)">
            = {fmtRad(theta)} rad
          </text>
          <text y="62" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            = arctan(y / x)
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 8 — Direction from the positive-x axis
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
