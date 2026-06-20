import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Act 3: drag î and ĵ. The whole grid distorts in real time as a linear
 * transformation of the standard grid. The 2×2 matrix in the corner shows
 * the column-vector positions of î and ĵ — i.e. the matrix IS where the
 * basis vectors land.
 *
 * The teaching: a 2×2 matrix is what it does to the basis. There is no
 * other content.
 *
 * Phase 5 a11y: both tips tab-focusable; arrow keys nudge by 0.1, Shift+arrow
 * by 1. CanvasNarrative announces the matrix as it changes and fires a
 * high-priority cue when the determinant crosses zero.
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

// Math (x, y) -> SVG (x, y), with origin at (ORIGIN_X, ORIGIN_Y) and y up
function toSvg(mx: number, my: number) {
  return { x: ORIGIN_X + mx * UNIT, y: ORIGIN_Y - my * UNIT }
}

export function DraggableBasis() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const iRef = useRef<SVGGElement | null>(null)
  const jRef = useRef<SVGGElement | null>(null)

  // î and ĵ in math coordinates. Identity = standard basis.
  const [iv, setIv] = useState({ x: 1, y: 0 })
  const [jv, setJv] = useState({ x: 0, y: 1 })

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

  // Determinant — the (signed) area of the unit-square's image.
  const det = iv.x * jv.y - iv.y * jv.x
  const degenerate = Math.abs(det) < 0.05

  const O = { x: ORIGIN_X, y: ORIGIN_Y }
  const I = toSvg(iv.x, iv.y)
  const J = toSvg(jv.x, jv.y)
  // Image of the unit square's far corner: î + ĵ
  const IJ = toSvg(iv.x + jv.x, iv.y + jv.y)

  const headI = arrowHead(O, I)
  const headJ = arrowHead(O, J)

  // Build the transformed grid. We sweep integer math coordinates and map
  // each line via the linear map: (a, b) -> a·î + b·ĵ.
  const transformedLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  for (let k = -6; k <= 6; k++) {
    // verticals: x = k, y in [-4, 4]
    const a = toSvg(k * iv.x + -4 * jv.x, k * iv.y + -4 * jv.y)
    const b = toSvg(k * iv.x + 4 * jv.x, k * iv.y + 4 * jv.y)
    transformedLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
  }
  for (let k = -4; k <= 4; k++) {
    // horizontals: y = k, x in [-6, 6]
    const a = toSvg(-6 * iv.x + k * jv.x, -6 * iv.y + k * jv.y)
    const b = toSvg(6 * iv.x + k * jv.x, 6 * iv.y + k * jv.y)
    transformedLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
  }

  const narrationText = degenerate
    ? `The determinant has collapsed to zero. The grid has flattened onto a line — the two basis vectors are parallel.`
    : `Matrix entries: top row ${fmt(iv.x)}, ${fmt(jv.x)}; bottom row ${fmt(iv.y)}, ${fmt(jv.y)}. Determinant ${fmt(det)}.`
  const narrationPriority: 'normal' | 'high' = degenerate ? 'high' : 'normal'

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} priority={narrationPriority} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A transformed grid. Basis vector î is at ${fmt(iv.x)}, ${fmt(iv.y)}; ĵ is at ${fmt(jv.x)}, ${fmt(jv.y)}. The 2 by 2 matrix has columns î and ĵ.`}
      >
        {/* Faint reference grid (the original, undistorted) */}
        <ReferenceGrid />

        {/* Transformed grid */}
        {transformedLines.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="var(--color-vermilion)"
            strokeOpacity="0.22"
            strokeWidth="0.7"
          />
        ))}

        {/* Image of the unit square */}
        <polygon
          points={`${O.x},${O.y} ${I.x},${I.y} ${IJ.x},${IJ.y} ${J.x},${J.y}`}
          fill="var(--color-vermilion)"
          fillOpacity="0.10"
          stroke="var(--color-vermilion)"
          strokeOpacity="0.4"
          strokeWidth="1"
        />

        {/* Axes */}
        <Axes />

        {/* î (vermilion) */}
        <line x1={O.x} y1={O.y} x2={I.x} y2={I.y} stroke="var(--color-vermilion)" strokeWidth="3" />
        <polygon
          points={`${I.x},${I.y} ${headI.p1.x},${headI.p1.y} ${headI.p2.x},${headI.p2.y}`}
          fill="var(--color-vermilion)"
        />
        {/* ĵ (vermilion) */}
        <line x1={O.x} y1={O.y} x2={J.x} y2={J.y} stroke="var(--color-vermilion)" strokeWidth="3" />
        <polygon
          points={`${J.x},${J.y} ${headJ.p1.x},${headJ.p1.y} ${headJ.p2.x},${headJ.p2.y}`}
          fill="var(--color-vermilion)"
        />

        {/* Tip handles */}
        <g
          {...bindI()}
          ref={iRef}
          tabIndex={0}
          role="button"
          aria-label={`Basis vector î. Currently ${fmt(iv.x)}, ${fmt(iv.y)}. Arrow keys to nudge.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={I.x} cy={I.y} r="22" fill="transparent" />
          <circle cx={I.x} cy={I.y} r="7" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="2" />
        </g>
        <g
          {...bindJ()}
          ref={jRef}
          tabIndex={0}
          role="button"
          aria-label={`Basis vector ĵ. Currently ${fmt(jv.x)}, ${fmt(jv.y)}. Arrow keys to nudge.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={J.x} cy={J.y} r="22" fill="transparent" />
          <circle cx={J.x} cy={J.y} r="7" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="2" />
        </g>

        {/* Matrix readout — the columns ARE î and ĵ */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            MATRIX  ·  COLUMNS = î, ĵ
          </text>
          <g transform="translate(0, 14)">
            {/* Bracket left */}
            <path
              d="M 4 6 L 0 6 L 0 56 L 4 56"
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="1.4"
            />
            <text x="14" y="22" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
              {fmt(iv.x)}
            </text>
            <text x="74" y="22" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
              {fmt(jv.x)}
            </text>
            <text x="14" y="46" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
              {fmt(iv.y)}
            </text>
            <text x="74" y="46" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
              {fmt(jv.y)}
            </text>
            {/* Bracket right */}
            <path
              d="M 132 6 L 136 6 L 136 56 L 132 56"
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="1.4"
            />
          </g>
          <text y="92" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
            det M = {fmt(det)}
          </text>
        </g>

        {/* Degenerate badge */}
        {degenerate && (
          <g transform={`translate(${VIEW_W - 220}, 36)`}>
            <rect width="200" height="30" fill="var(--color-vermilion)" fillOpacity="0.15" />
            <text x="12" y="20" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.18em" fill="var(--color-vermilion)">
              GRID COLLAPSED TO A LINE
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
          DRAG î OR ĵ  ·  THE WHOLE GRID FOLLOWS
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2 &mdash; A 2&times;2 matrix is what it does to the basis
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
