import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * The promise: static visual showing king − man + woman ≈ queen as three
 * positioned points on a 2D plane. The "gender" direction connects man↔woman
 * and king↔queen as roughly parallel arrows. The "royalty" direction connects
 * man↔king and woman↔queen.
 *
 * Read-only. Coordinates are cosmetic — chosen so the parallelogram closes
 * cleanly and the two parallels are visually obvious.
 *
 * Positions (in unit-grid coordinates relative to ORIGIN):
 *   man    = (1.0, 0.6)
 *   woman  = (1.6, 1.6)
 *   king   = (3.0, 1.4)
 *   queen  = (3.6, 2.4)   ← king + (woman − man)
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

interface Pt {
  x: number
  y: number
  label: string
  emphasis?: boolean
}

const points: Pt[] = [
  { x: 1.0, y: 0.6, label: 'man' },
  { x: 1.6, y: 1.6, label: 'woman' },
  { x: 3.0, y: 1.4, label: 'king' },
  { x: 3.6, y: 2.4, label: 'queen', emphasis: true },
]

const toScreen = (p: { x: number; y: number }) => ({
  x: ORIGIN_X + p.x * UNIT - 100,
  y: ORIGIN_Y - p.y * UNIT,
})

function arrowHead(from: { x: number; y: number }, to: { x: number; y: number }) {
  const ang = Math.atan2(to.y - from.y, to.x - from.x)
  const headLen = 12
  const headWide = 5
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

export function KingMinusManPlusWoman() {
  const man = toScreen(points[0])
  const woman = toScreen(points[1])
  const king = toScreen(points[2])
  const queen = toScreen(points[3])

  const genderManToWoman = arrowHead(man, woman)
  const genderKingToQueen = arrowHead(king, queen)
  const royaltyManToKing = arrowHead(man, king)
  const royaltyWomanToQueen = arrowHead(woman, queen)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="Four word-vectors arranged on a plane. The arrow from man to woman is roughly parallel to the arrow from king to queen — that direction encodes gender. The arrow from man to king is roughly parallel to the arrow from woman to queen — that direction encodes royalty. Adding the two arrows from king lands exactly on queen."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Four labelled points on a 2D plane: man, woman, king, queen. The arrow from man to woman is parallel to the arrow from king to queen, both labelled 'gender'. The arrow from man to king is parallel to the arrow from woman to queen, both labelled 'royalty'. king minus man plus woman lands on queen."
      >
        <Grid />

        {/* Gender direction — man → woman, king → queen */}
        <line
          x1={man.x}
          y1={man.y}
          x2={woman.x}
          y2={woman.y}
          stroke="var(--color-vermilion)"
          strokeWidth="2"
          strokeOpacity="0.85"
        />
        <polygon
          points={`${woman.x},${woman.y} ${genderManToWoman.p1.x},${genderManToWoman.p1.y} ${genderManToWoman.p2.x},${genderManToWoman.p2.y}`}
          fill="var(--color-vermilion)"
        />
        <line
          x1={king.x}
          y1={king.y}
          x2={queen.x}
          y2={queen.y}
          stroke="var(--color-vermilion)"
          strokeWidth="2"
          strokeOpacity="0.85"
        />
        <polygon
          points={`${queen.x},${queen.y} ${genderKingToQueen.p1.x},${genderKingToQueen.p1.y} ${genderKingToQueen.p2.x},${genderKingToQueen.p2.y}`}
          fill="var(--color-vermilion)"
        />

        {/* Royalty direction — man → king, woman → queen */}
        <line
          x1={man.x}
          y1={man.y}
          x2={king.x}
          y2={king.y}
          stroke="var(--color-ink)"
          strokeWidth="1.2"
          strokeOpacity="0.55"
          strokeDasharray="4 4"
        />
        <polygon
          points={`${king.x},${king.y} ${royaltyManToKing.p1.x},${royaltyManToKing.p1.y} ${royaltyManToKing.p2.x},${royaltyManToKing.p2.y}`}
          fill="var(--color-ink)"
          fillOpacity="0.55"
        />
        <line
          x1={woman.x}
          y1={woman.y}
          x2={queen.x}
          y2={queen.y}
          stroke="var(--color-ink)"
          strokeWidth="1.2"
          strokeOpacity="0.55"
          strokeDasharray="4 4"
        />
        <polygon
          points={`${queen.x},${queen.y} ${royaltyWomanToQueen.p1.x},${royaltyWomanToQueen.p1.y} ${royaltyWomanToQueen.p2.x},${royaltyWomanToQueen.p2.y}`}
          fill="var(--color-ink)"
          fillOpacity="0.55"
        />

        {/* Direction labels */}
        <text
          x={(man.x + woman.x) / 2 - 28}
          y={(man.y + woman.y) / 2 - 6}
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-vermilion)"
        >
          GENDER
        </text>
        <text
          x={(man.x + king.x) / 2 - 14}
          y={(man.y + king.y) / 2 + 16}
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          ROYALTY
        </text>

        {/* Word points */}
        {[points[0], points[1], points[2], points[3]].map((p, i) => {
          const s = toScreen(p)
          return (
            <g key={i}>
              <circle
                cx={s.x}
                cy={s.y}
                r={p.emphasis ? 6 : 4}
                fill={p.emphasis ? 'var(--color-vermilion)' : 'var(--color-ink)'}
                stroke={p.emphasis ? 'var(--color-cream)' : 'none'}
                strokeWidth={p.emphasis ? 2 : 0}
              />
              <text
                x={s.x + 10}
                y={s.y - 8}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize={p.emphasis ? '17' : '15'}
                fontWeight={p.emphasis ? 600 : 400}
                fill={p.emphasis ? 'var(--color-vermilion)' : 'var(--color-ink)'}
              >
                {p.label}
              </text>
            </g>
          )
        })}

        {/* HUD */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            THE PROMISE
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="15" fill="var(--color-ink)">
            king − man + woman ≈ queen
          </text>
          <text y="40" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            two parallel directions: gender, royalty
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1 — The parallelogram of meaning
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
            y2={VIEW_H - 40}
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
      <line
        x1="20"
        y1={ORIGIN_Y}
        x2={VIEW_W - 20}
        y2={ORIGIN_Y}
        stroke="var(--color-graph-ink)"
        strokeWidth="0.8"
        strokeOpacity="0.5"
      />
      <line
        x1={ORIGIN_X}
        y1="20"
        x2={ORIGIN_X}
        y2={VIEW_H - 40}
        stroke="var(--color-graph-ink)"
        strokeWidth="0.8"
        strokeOpacity="0.5"
      />
    </>
  )
}
