import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 2: a clean unit grid with the two basis vectors î and ĵ drawn
 * in vermilion. A third arrow v shows what "a linear combination of î and ĵ"
 * looks like, with dashed projections onto the axes.
 *
 * Static. The teaching is: everything in the plane is a sum of multiples
 * of these two arrows.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

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

export function BasisIntro() {
  const O = { x: ORIGIN_X, y: ORIGIN_Y }
  const I = { x: ORIGIN_X + UNIT, y: ORIGIN_Y }
  const J = { x: ORIGIN_X, y: ORIGIN_Y - UNIT }

  // An example combination: v = 3·î + 2·ĵ
  const V = { x: ORIGIN_X + 3 * UNIT, y: ORIGIN_Y - 2 * UNIT }
  const headI = arrowHead(O, I)
  const headJ = arrowHead(O, J)
  const headV = arrowHead(O, V)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A unit grid with two basis vectors î and ĵ drawn in vermilion. A third vector v sits at three î plus two ĵ — a linear combination of the basis."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A unit grid. Two short vermilion arrows mark the basis: î pointing one unit right along the x axis, and ĵ pointing one unit up along the y axis. A third vector v sits at three î plus two ĵ, showing how every point in the plane is a linear combination of these two."
      >
        <Grid />
        <Axes />

        {/* Dashed projection lines for v */}
        <line
          x1={V.x}
          y1={V.y}
          x2={V.x}
          y2={ORIGIN_Y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.45"
        />
        <line
          x1={V.x}
          y1={V.y}
          x2={ORIGIN_X}
          y2={V.y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.45"
        />

        {/* v (faded ink — it's the example, not the star) */}
        <line x1={O.x} y1={O.y} x2={V.x} y2={V.y} stroke="var(--color-graph-ink)" strokeWidth="2" />
        <polygon
          points={`${V.x},${V.y} ${headV.p1.x},${headV.p1.y} ${headV.p2.x},${headV.p2.y}`}
          fill="var(--color-graph-ink)"
        />
        <text
          x={V.x + 10}
          y={V.y - 8}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-graph-ink)"
        >
          v = 3î + 2ĵ
        </text>

        {/* î (vermilion) */}
        <line x1={O.x} y1={O.y} x2={I.x} y2={I.y} stroke="var(--color-vermilion)" strokeWidth="3" />
        <polygon
          points={`${I.x},${I.y} ${headI.p1.x},${headI.p1.y} ${headI.p2.x},${headI.p2.y}`}
          fill="var(--color-vermilion)"
        />
        <text
          x={I.x + 6}
          y={I.y + 18}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-vermilion)"
        >
          î
        </text>

        {/* ĵ (vermilion) */}
        <line x1={O.x} y1={O.y} x2={J.x} y2={J.y} stroke="var(--color-vermilion)" strokeWidth="3" />
        <polygon
          points={`${J.x},${J.y} ${headJ.p1.x},${headJ.p1.y} ${headJ.p2.x},${headJ.p2.y}`}
          fill="var(--color-vermilion)"
        />
        <text
          x={J.x - 18}
          y={J.y + 4}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-vermilion)"
        >
          ĵ
        </text>

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            BASIS  ·  STANDARD
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
            î = (1, 0)
          </text>
          <text y="42" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
            ĵ = (0, 1)
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1 &mdash; The two arrows everything else is built from
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
      <text
        x={VIEW_W - 30}
        y={ORIGIN_Y - 8}
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize="14"
        fill="var(--color-graph-ink)"
      >
        x
      </text>
      <text
        x={ORIGIN_X + 8}
        y="30"
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize="14"
        fill="var(--color-graph-ink)"
      >
        y
      </text>
    </>
  )
}
