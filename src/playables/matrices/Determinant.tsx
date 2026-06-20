import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Act 7 — closing: the unit square's image is a parallelogram. Its (signed)
 * area equals det M. As the user drags î and ĵ to make them parallel, the
 * parallelogram collapses and the determinant goes to zero. The forward
 * link to Eigenvalues is the closing prose.
 *
 * Phase 5 a11y: both basis tips tab-focusable; arrow keys nudge by 0.1,
 * Shift+arrow by 1. CanvasNarrative reads out the area as it changes;
 * high-priority fires at the collapse.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const fmt = (n: number) => n.toFixed(2)

function arrowHead(from: { x: number; y: number }, to: { x: number; y: number }) {
  const ang = Math.atan2(to.y - from.y, to.x - from.x)
  const headLen = 13
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

function toSvg(mx: number, my: number) {
  return { x: ORIGIN_X + mx * UNIT, y: ORIGIN_Y - my * UNIT }
}

export function Determinant() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const iRef = useRef<SVGGElement | null>(null)
  const jRef = useRef<SVGGElement | null>(null)

  // Start with a mild stretch so the parallelogram is visibly non-square
  const [iv, setIv] = useState({ x: 1.4, y: 0.3 })
  const [jv, setJv] = useState({ x: 0.5, y: 1.2 })

  const startIRef = useRef<typeof iv | null>(null)
  const startJRef = useRef<typeof jv | null>(null)

  const scale = () => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { sx: 1, sy: 1 }
    return { sx: VIEW_W / rect.width, sy: VIEW_H / rect.height }
  }
  const bindI = useDrag(({ first, movement: [mx, my] }) => {
    if (first) startIRef.current = { ...iv }
    const start = startIRef.current
    if (!start) return
    const { sx, sy } = scale()
    setIv({ x: start.x + (mx * sx) / UNIT, y: start.y - (my * sy) / UNIT })
  })
  const bindJ = useDrag(({ first, movement: [mx, my] }) => {
    if (first) startJRef.current = { ...jv }
    const start = startJRef.current
    if (!start) return
    const { sx, sy } = scale()
    setJv({ x: start.x + (mx * sx) / UNIT, y: start.y - (my * sy) / UNIT })
  })

  const nudgeAmount = (d: number) => {
    if (d === 0) return 0
    return Math.abs(d) >= 10 ? Math.sign(d) * 1 : Math.sign(d) * 0.1
  }
  useKeyNudge(
    iRef,
    useCallback((dx: number, dy: number) => {
      setIv((cur) => ({ x: cur.x + nudgeAmount(dx), y: cur.y + nudgeAmount(dy) }))
    }, []),
  )
  useKeyNudge(
    jRef,
    useCallback((dx: number, dy: number) => {
      setJv((cur) => ({ x: cur.x + nudgeAmount(dx), y: cur.y + nudgeAmount(dy) }))
    }, []),
  )

  const det = iv.x * jv.y - iv.y * jv.x
  const area = Math.abs(det)
  const collapsed = area < 0.04
  const flipped = det < 0 && !collapsed

  const O = { x: ORIGIN_X, y: ORIGIN_Y }
  const I = toSvg(iv.x, iv.y)
  const J = toSvg(jv.x, jv.y)
  const IJ = toSvg(iv.x + jv.x, iv.y + jv.y)
  const headI = arrowHead(O, I)
  const headJ = arrowHead(O, J)

  const narrationText = collapsed
    ? 'The parallelogram has collapsed. The determinant is zero — this matrix flattens the whole plane onto a line.'
    : flipped
      ? `The determinant is ${fmt(det)}. Negative — the matrix flips orientation. Area is ${fmt(area)}.`
      : `The unit square's image has area ${fmt(area)}. That number is the determinant.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} priority={collapsed ? 'high' : 'normal'} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`The image of the unit square under the current matrix is a parallelogram with area ${fmt(area)}. That area is the absolute value of the determinant, which is ${fmt(det)}.`}
      >
        <ReferenceGrid />

        {/* The original unit square (faint) */}
        <rect
          x={ORIGIN_X}
          y={ORIGIN_Y - UNIT}
          width={UNIT}
          height={UNIT}
          fill="var(--color-graph-ink)"
          fillOpacity="0.05"
          stroke="var(--color-graph-ink)"
          strokeOpacity="0.4"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <text
          x={ORIGIN_X + UNIT / 2}
          y={ORIGIN_Y - UNIT / 2 + 4}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-graph-ink)"
          opacity="0.6"
        >
          1
        </text>

        {/* The image parallelogram */}
        <polygon
          points={`${O.x},${O.y} ${I.x},${I.y} ${IJ.x},${IJ.y} ${J.x},${J.y}`}
          fill={flipped ? 'var(--color-vermilion-deep)' : 'var(--color-vermilion)'}
          fillOpacity={collapsed ? 0 : 0.18}
          stroke="var(--color-vermilion)"
          strokeWidth={collapsed ? 2 : 1.5}
        />

        <Axes />

        {!collapsed && (
          <>
            <line x1={O.x} y1={O.y} x2={I.x} y2={I.y} stroke="var(--color-vermilion)" strokeWidth="2.5" />
            <polygon
              points={`${I.x},${I.y} ${headI.p1.x},${headI.p1.y} ${headI.p2.x},${headI.p2.y}`}
              fill="var(--color-vermilion)"
            />
            <line x1={O.x} y1={O.y} x2={J.x} y2={J.y} stroke="var(--color-vermilion)" strokeWidth="2.5" />
            <polygon
              points={`${J.x},${J.y} ${headJ.p1.x},${headJ.p1.y} ${headJ.p2.x},${headJ.p2.y}`}
              fill="var(--color-vermilion)"
            />
          </>
        )}

        {/* Tip handles */}
        <g
          {...bindI()}
          ref={iRef}
          tabIndex={0}
          role="button"
          aria-label={`Basis vector î. Currently ${fmt(iv.x)}, ${fmt(iv.y)}.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={I.x} cy={I.y} r="22" fill="transparent" />
          <circle cx={I.x} cy={I.y} r="6" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="2" />
        </g>
        <g
          {...bindJ()}
          ref={jRef}
          tabIndex={0}
          role="button"
          aria-label={`Basis vector ĵ. Currently ${fmt(jv.x)}, ${fmt(jv.y)}.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={J.x} cy={J.y} r="22" fill="transparent" />
          <circle cx={J.x} cy={J.y} r="6" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="2" />
        </g>

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            UNIT SQUARE  →  PARALLELOGRAM
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-ink)">
            area = {fmt(area)}
          </text>
          <text y="44" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
            det M = {fmt(det)}
          </text>
          {flipped && (
            <text y="64" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.16em" fill="var(--color-vermilion)">
              ORIENTATION FLIPPED
            </text>
          )}
        </g>

        {/* Collapse badge */}
        {collapsed && (
          <g transform={`translate(${VIEW_W - 220}, 36)`}>
            <rect width="200" height="30" fill="var(--color-vermilion)" fillOpacity="0.15" />
            <text x="12" y="20" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.18em" fill="var(--color-vermilion)">
              AREA → 0
            </text>
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
          DRAG î OR ĵ  ·  AREA = |det M|  ·  TRY COLLAPSING IT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6 &mdash; The determinant is an area
      </figcaption>
    </figure>
  )
}

function ReferenceGrid() {
  return (
    <>
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
          />
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
