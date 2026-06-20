import { useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'

/**
 * Arrow act: a single arrow rooted at a base. Drag the tip — components
 * relative to the base update. Drag the whole arrow (the shaft) — base
 * and tip translate together, components don't change.
 *
 * This is the translation-invariance teaching from PLAN §7.1 act 4: vectors
 * are *displacements*, not locations. Where the arrow sits in the plane
 * doesn't matter; the difference between its endpoints does.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const fmt = (n: number) => n.toFixed(2)

export function DraggableArrow() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  // Base of the arrow (math coords)
  const [base, setBase] = useState({ x: 0, y: 0 })
  // Tip relative to base — the actual vector components
  const [components, setComponents] = useState({ x: 3, y: 2 })

  const baseStart = useRef<typeof base | null>(null)
  const compStart = useRef<typeof components | null>(null)

  const scale = () => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { sx: 1, sy: 1 }
    return { sx: VIEW_W / rect.width, sy: VIEW_H / rect.height }
  }

  // Drag the tip: update components
  const bindTip = useDrag(({ first, movement: [mx, my] }) => {
    if (first) compStart.current = { ...components }
    const start = compStart.current
    if (!start) return
    const { sx, sy } = scale()
    setComponents({
      x: start.x + (mx * sx) / UNIT,
      y: start.y - (my * sy) / UNIT, // y inverted
    })
  })

  // Drag the shaft: update base only (components frozen)
  const bindShaft = useDrag(({ first, movement: [mx, my] }) => {
    if (first) baseStart.current = { ...base }
    const start = baseStart.current
    if (!start) return
    const { sx, sy } = scale()
    setBase({
      x: start.x + (mx * sx) / UNIT,
      y: start.y - (my * sy) / UNIT,
    })
  })

  // SVG coords for base + tip
  const baseSvg = { x: ORIGIN_X + base.x * UNIT, y: ORIGIN_Y - base.y * UNIT }
  const tipSvg = {
    x: ORIGIN_X + (base.x + components.x) * UNIT,
    y: ORIGIN_Y - (base.y + components.y) * UNIT,
  }

  // Arrow shape: line + arrowhead
  const ang = Math.atan2(tipSvg.y - baseSvg.y, tipSvg.x - baseSvg.x)
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
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A vector with components ${fmt(components.x)}, ${fmt(components.y)}. Drag the tip to change components. Drag the shaft to move the arrow without changing components.`}
      >
        {/* Grid + axes */}
        <Grid />
        <Axes />

        {/* Arrow shaft (draggable for translation) */}
        <g {...bindShaft()} style={{ cursor: 'grab', touchAction: 'none' }}>
          <line
            x1={baseSvg.x}
            y1={baseSvg.y}
            x2={tipSvg.x}
            y2={tipSvg.y}
            stroke="var(--color-vermilion)"
            strokeWidth="14"
            strokeOpacity="0"
          />
          <line
            x1={baseSvg.x}
            y1={baseSvg.y}
            x2={tipSvg.x}
            y2={tipSvg.y}
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
          <polygon
            points={`${tipSvg.x},${tipSvg.y} ${headBase1.x},${headBase1.y} ${headBase2.x},${headBase2.y}`}
            fill="var(--color-vermilion)"
          />
        </g>

        {/* Base dot */}
        <circle cx={baseSvg.x} cy={baseSvg.y} r="3.5" fill="var(--color-graph-ink)" />

        {/* Tip handle (draggable for components) */}
        <g {...bindTip()} style={{ cursor: 'grab', touchAction: 'none' }}>
          <circle cx={tipSvg.x} cy={tipSvg.y} r="22" fill="transparent" />
          <circle
            cx={tipSvg.x}
            cy={tipSvg.y}
            r="7"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        </g>

        {/* Components readout */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            COMPONENTS
          </text>
          <text
            y="22"
            fontFamily="JetBrains Mono, monospace"
            fontSize="16"
            fill="var(--color-ink)"
          >
            v = ({fmt(components.x)}, {fmt(components.y)})
          </text>
        </g>

        {/* Hint */}
        <text
          x="32"
          y={VIEW_H - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG TIP — CHANGE COMPONENTS  ·  DRAG SHAFT — MOVE THE ARROW
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4 — A vector has direction and magnitude — and a freedom to slide
      </figcaption>
    </figure>
  )
}

// Reusable subcomponents
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
