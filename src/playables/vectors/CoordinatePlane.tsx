import { useState, useRef } from 'react'
import { useDrag } from '@use-gesture/react'

/**
 * Descartes act: an empty coordinate plane. Click anywhere to drop a point;
 * drag it. Coordinates display in monospace next to the point.
 *
 * SVG coordinates: viewBox 600×480, origin at (300, 240), 1 math unit = 50 px.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

// SVG-px → math units
const toMath = (sx: number, sy: number) => ({
  mx: (sx - ORIGIN_X) / UNIT,
  my: (ORIGIN_Y - sy) / UNIT, // y inverted
})

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

export function CoordinatePlane() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  // Default: a point at (3, 2)
  const [point, setPoint] = useState<{ sx: number; sy: number } | null>({
    sx: ORIGIN_X + 3 * UNIT,
    sy: ORIGIN_Y - 2 * UNIT,
  })

  const onCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only if the click hit the background (not the point itself)
    if ((e.target as SVGElement).dataset?.role !== 'background') return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const scaleX = VIEW_W / rect.width
    const scaleY = VIEW_H / rect.height
    setPoint({ sx: (e.clientX - rect.left) * scaleX, sy: (e.clientY - rect.top) * scaleY })
  }

  const startPosRef = useRef<{ sx: number; sy: number } | null>(null)
  const bindPoint = useDrag(({ first, movement: [mx, my] }) => {
    if (!point) return
    if (first) startPosRef.current = { sx: point.sx, sy: point.sy }
    const origin = startPosRef.current
    if (!origin) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const scaleX = VIEW_W / rect.width
    const scaleY = VIEW_H / rect.height
    setPoint({ sx: origin.sx + mx * scaleX, sy: origin.sy + my * scaleY })
  })

  const coords = point ? toMath(point.sx, point.sy) : null

  return (
    <figure className="w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        onClick={onCanvasClick}
        role="img"
        aria-label={
          point
            ? `A point on a coordinate plane at coordinates ${coords?.mx.toFixed(1)}, ${coords?.my.toFixed(1)}. Click anywhere to move it; drag the point to slide it around.`
            : 'An empty coordinate plane. Click anywhere to drop a point.'
        }
      >
        {/* Background click target */}
        <rect
          data-role="background"
          x="0"
          y="0"
          width={VIEW_W}
          height={VIEW_H}
          fill="transparent"
          style={{ cursor: 'crosshair' }}
        />

        {/* Grid */}
        {Array.from({ length: 13 }, (_, i) => {
          const x = ORIGIN_X + (i - 6) * UNIT
          return (
            <line
              key={`v-${i}`}
              x1={x}
              y1="20"
              x2={x}
              y2={VIEW_H - 20}
              stroke="var(--color-graph-fade)"
              strokeWidth="0.5"
              data-role="background"
            />
          )
        })}
        {Array.from({ length: 9 }, (_, i) => {
          const y = ORIGIN_Y + (i - 4) * UNIT
          return (
            <line
              key={`h-${i}`}
              x1="20"
              y1={y}
              x2={VIEW_W - 20}
              y2={y}
              stroke="var(--color-graph-fade)"
              strokeWidth="0.5"
              data-role="background"
            />
          )
        })}

        {/* Axes */}
        <line x1="20" y1={ORIGIN_Y} x2={VIEW_W - 20} y2={ORIGIN_Y} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <line x1={ORIGIN_X} y1="20" x2={ORIGIN_X} y2={VIEW_H - 20} stroke="var(--color-graph-ink)" strokeWidth="1" />

        {/* Axis labels */}
        <text x={VIEW_W - 30} y={ORIGIN_Y - 8} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">
          x
        </text>
        <text x={ORIGIN_X + 8} y="30" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">
          y
        </text>

        {/* The point */}
        {point && (
          <g {...bindPoint()} style={{ cursor: 'grab', touchAction: 'none' }}>
            <circle cx={point.sx} cy={point.sy} r="20" fill="transparent" />
            <circle cx={point.sx} cy={point.sy} r="5" fill="var(--color-vermilion)" />
            {coords && (
              <text
                x={point.sx + 14}
                y={point.sy - 10}
                fontFamily="JetBrains Mono, monospace"
                fontSize="13"
                fill="var(--color-ink)"
              >
                ({fmt(coords.mx).trim()}, {fmt(coords.my).trim()})
              </text>
            )}
          </g>
        )}

        {/* Hint */}
        <text
          x="32"
          y={VIEW_H - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          CLICK TO DROP A POINT  ·  DRAG TO MOVE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3 — A point in the Cartesian plane
      </figcaption>
    </figure>
  )
}
