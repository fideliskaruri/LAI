import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Act 4: same draggable basis as Act 3, plus one extra arrow v with fixed
 * coordinates (1.5, 2) in the *original* basis. As the user drags î and ĵ,
 * v rides along, because v = v_x · î + v_y · ĵ — that linear-combination
 * recipe is the only definition v has.
 *
 * Matrix readout in the corner now reads out Mv coordinates too.
 *
 * Phase 5 a11y: same as Act 3 — î and ĵ are tab-focusable; arrow keys
 * nudge by 0.1, Shift+arrow by 1. CanvasNarrative announces Mv as it
 * changes.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

// v's coordinates in the *original* basis. These do not change with drag —
// they're the recipe. What does change is where v actually lands once î and
// ĵ move.
const VX = 1.5
const VY = 2

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

export function VectorFollowsBasis() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const iRef = useRef<SVGGElement | null>(null)
  const jRef = useRef<SVGGElement | null>(null)

  // start a little off-identity so the teaching is visible
  const [iv, setIv] = useState({ x: 1, y: 0 })
  const [jv, setJv] = useState({ x: 0.4, y: 1 })

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

  // Mv = v_x · î + v_y · ĵ
  const Mvx = VX * iv.x + VY * jv.x
  const Mvy = VX * iv.y + VY * jv.y

  const O = { x: ORIGIN_X, y: ORIGIN_Y }
  const I = toSvg(iv.x, iv.y)
  const J = toSvg(jv.x, jv.y)
  const MV = toSvg(Mvx, Mvy)

  // Ghost showing where v sat under the identity basis, for comparison
  const V0 = toSvg(VX, VY)

  const headI = arrowHead(O, I)
  const headJ = arrowHead(O, J)
  const headMV = arrowHead(O, MV)

  // Build the transformed grid
  const transformedLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  for (let k = -6; k <= 6; k++) {
    const a = toSvg(k * iv.x + -4 * jv.x, k * iv.y + -4 * jv.y)
    const b = toSvg(k * iv.x + 4 * jv.x, k * iv.y + 4 * jv.y)
    transformedLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
  }
  for (let k = -4; k <= 4; k++) {
    const a = toSvg(-6 * iv.x + k * jv.x, -6 * iv.y + k * jv.y)
    const b = toSvg(6 * iv.x + k * jv.x, 6 * iv.y + k * jv.y)
    transformedLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
  }

  const narrationText = `Vector v has recipe ${VX} î plus ${VY} ĵ. With the current basis, v lands at ${fmt(Mvx)}, ${fmt(Mvy)}.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} priority="normal" />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Draggable basis with one extra vector v. v has recipe ${VX} î plus ${VY} ĵ. Right now v lands at ${fmt(Mvx)}, ${fmt(Mvy)}.`}
      >
        <ReferenceGrid />

        {transformedLines.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="var(--color-vermilion)"
            strokeOpacity="0.18"
            strokeWidth="0.7"
          />
        ))}

        <Axes />

        {/* Ghost of v under identity */}
        <line
          x1={O.x}
          y1={O.y}
          x2={V0.x}
          y2={V0.y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
          strokeDasharray="3 5"
          opacity="0.4"
        />
        <text
          x={V0.x + 8}
          y={V0.y - 4}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-graph-ink)"
          opacity="0.5"
        >
          v (recipe)
        </text>

        {/* î and ĵ in faded vermilion — they're scaffolding here */}
        <line x1={O.x} y1={O.y} x2={I.x} y2={I.y} stroke="var(--color-vermilion)" strokeWidth="2" strokeOpacity="0.6" />
        <polygon
          points={`${I.x},${I.y} ${headI.p1.x},${headI.p1.y} ${headI.p2.x},${headI.p2.y}`}
          fill="var(--color-vermilion)"
          fillOpacity="0.6"
        />
        <line x1={O.x} y1={O.y} x2={J.x} y2={J.y} stroke="var(--color-vermilion)" strokeWidth="2" strokeOpacity="0.6" />
        <polygon
          points={`${J.x},${J.y} ${headJ.p1.x},${headJ.p1.y} ${headJ.p2.x},${headJ.p2.y}`}
          fill="var(--color-vermilion)"
          fillOpacity="0.6"
        />

        {/* Mv (the star) */}
        <line x1={O.x} y1={O.y} x2={MV.x} y2={MV.y} stroke="var(--color-vermilion)" strokeWidth="3" />
        <polygon
          points={`${MV.x},${MV.y} ${headMV.p1.x},${headMV.p1.y} ${headMV.p2.x},${headMV.p2.y}`}
          fill="var(--color-vermilion)"
        />
        <text
          x={MV.x + 10}
          y={MV.y - 6}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-vermilion)"
        >
          Mv
        </text>

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

        {/* Matrix + Mv readout */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            M  ·  v  =
          </text>
          <g transform="translate(0, 14)">
            <path
              d="M 4 6 L 0 6 L 0 56 L 4 56"
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="1.3"
            />
            <text x="14" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
              {fmt(iv.x)}
            </text>
            <text x="68" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
              {fmt(jv.x)}
            </text>
            <text x="14" y="44" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
              {fmt(iv.y)}
            </text>
            <text x="68" y="44" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
              {fmt(jv.y)}
            </text>
            <path
              d="M 122 6 L 126 6 L 126 56 L 122 56"
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="1.3"
            />
            <text x="140" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-dim)">
              {VX.toFixed(1)}
            </text>
            <text x="140" y="44" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-dim)">
              {VY.toFixed(1)}
            </text>
            <text x="172" y="34" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-dim)">
              =
            </text>
            <text x="190" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
              {fmt(Mvx)}
            </text>
            <text x="190" y="44" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
              {fmt(Mvy)}
            </text>
          </g>
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
          DRAG î OR ĵ — v RIDES ALONG  ·  v = v_x · î + v_y · ĵ
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3 &mdash; Where does v land? Wherever the recipe says.
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
