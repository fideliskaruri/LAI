import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Cold-open for Derivatives: a hand-feel ink-wash sketch of an apple tree
 * silhouette over a Lincolnshire hillside, with "annus mirabilis" inscribed
 * along the lower margin. Newton's 1666 plague year. Static. No interaction.
 *
 * The visual is the question, not an animation: a 23-year-old, sent home
 * from a plague-closed Cambridge, sitting under an apple tree.
 */

const VIEW_W = 600
const VIEW_H = 480

const ORIGIN_X = 300
const ORIGIN_Y = 240

// Branch endpoints, hand-tuned to keep the silhouette feeling sketched
// rather than radially symmetric.
const BRANCHES: Array<{ x: number; y: number; w: number }> = [
  { x: 218, y: 110, w: 5 },
  { x: 244, y: 88, w: 6 },
  { x: 282, y: 76, w: 7 },
  { x: 322, y: 80, w: 7 },
  { x: 362, y: 100, w: 6 },
  { x: 388, y: 132, w: 5 },
  { x: 200, y: 150, w: 4 },
  { x: 396, y: 178, w: 4 },
]

// Apples — vermilion dots scattered in the canopy. One sits on the ground
// for the obligatory Newton beat.
const APPLES_IN_TREE: Array<{ x: number; y: number; r: number }> = [
  { x: 248, y: 132, r: 5 },
  { x: 286, y: 116, r: 5 },
  { x: 328, y: 130, r: 5 },
  { x: 362, y: 152, r: 4 },
  { x: 230, y: 178, r: 4 },
  { x: 308, y: 168, r: 5 },
  { x: 348, y: 188, r: 4 },
]
const FALLEN_APPLE = { x: 340, y: 340 }

export function NewtonPlague() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A still ink-wash sketch of an apple tree on a Lincolnshire hillside. Inscribed below the horizon: annus mirabilis, 1666. Isaac Newton, twenty-three years old, was sent home from Cambridge that year by an outbreak of plague."
        priority="high"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A hand-drawn silhouette of an apple tree on a hillside, inscribed annus mirabilis 1666. A small fallen apple rests on the ground. Newton spent that plague year at his family farm at Woolsthorpe."
      >
        {/* Faint paper panel */}
        <rect x="40" y="40" width={VIEW_W - 80} height={VIEW_H - 80} fill="#F9F5EA" stroke="var(--color-graph-fade)" strokeWidth="1" />

        {/* Eyebrow */}
        <text x="62" y="74" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          WOOLSTHORPE  ·  LINCOLNSHIRE  ·  1666
        </text>
        <text x="62" y="94" fontFamily="Georgia, serif" fontSize="13" fontStyle="italic" fill="var(--color-ink)">
          Isaac Newton, twenty-three, home from a plague-closed Cambridge.
        </text>

        {/* Hill horizon — a single soft curve, ink */}
        <path
          d={`M 60 ${ORIGIN_Y + 130} Q ${ORIGIN_X - 60} ${ORIGIN_Y + 90} ${ORIGIN_X} ${ORIGIN_Y + 110} T ${VIEW_W - 60} ${ORIGIN_Y + 120}`}
          fill="none"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* Ground stippling */}
        {Array.from({ length: 28 }, (_, i) => {
          const x = 80 + i * 16 + (i % 3) * 4
          const y = ORIGIN_Y + 140 + (i % 4) * 3
          return (
            <line
              key={`grass-${i}`}
              x1={x}
              y1={y}
              x2={x}
              y2={y + 4}
              stroke="var(--color-graph-ink)"
              strokeOpacity="0.35"
              strokeWidth="0.7"
            />
          )
        })}

        {/* Trunk — slightly leaning, two-stroke */}
        <path
          d={`M ${ORIGIN_X - 8} ${ORIGIN_Y + 130} C ${ORIGIN_X - 12} ${ORIGIN_Y + 80}, ${ORIGIN_X - 6} ${ORIGIN_Y + 30}, ${ORIGIN_X + 2} ${ORIGIN_Y - 20}`}
          fill="none"
          stroke="var(--color-graph-ink)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d={`M ${ORIGIN_X + 10} ${ORIGIN_Y + 132} C ${ORIGIN_X + 8} ${ORIGIN_Y + 80}, ${ORIGIN_X + 12} ${ORIGIN_Y + 30}, ${ORIGIN_X + 4} ${ORIGIN_Y - 18}`}
          fill="none"
          stroke="var(--color-graph-ink)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />

        {/* Canopy — overlapping soft ellipses, ink wash */}
        <ellipse cx={ORIGIN_X} cy={ORIGIN_Y - 30} rx="105" ry="78" fill="#1A1A1A" fillOpacity="0.06" />
        <ellipse cx={ORIGIN_X - 30} cy={ORIGIN_Y - 18} rx="78" ry="56" fill="#1A1A1A" fillOpacity="0.08" />
        <ellipse cx={ORIGIN_X + 28} cy={ORIGIN_Y - 22} rx="74" ry="58" fill="#1A1A1A" fillOpacity="0.08" />

        {/* Branches — short ink strokes radiating out of the upper trunk */}
        {BRANCHES.map((b, i) => (
          <line
            key={`branch-${i}`}
            x1={ORIGIN_X + (b.x < ORIGIN_X ? -2 : 2)}
            y1={ORIGIN_Y - 10}
            x2={b.x}
            y2={b.y}
            stroke="var(--color-graph-ink)"
            strokeWidth={b.w * 0.4}
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
        ))}

        {/* Apples in canopy */}
        {APPLES_IN_TREE.map((a, i) => (
          <circle
            key={`apple-${i}`}
            cx={a.x}
            cy={a.y}
            r={a.r}
            fill="var(--color-vermilion)"
            stroke="var(--color-graph-ink)"
            strokeWidth="0.6"
          />
        ))}

        {/* Fallen apple — the one beat the silhouette has to do */}
        <circle
          cx={FALLEN_APPLE.x}
          cy={FALLEN_APPLE.y}
          r="6"
          fill="var(--color-vermilion)"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.8"
        />
        {/* Tiny dashed arc — the apple's path, more suggestion than depiction */}
        <path
          d={`M ${ORIGIN_X + 30} ${ORIGIN_Y - 5} Q ${ORIGIN_X + 80} ${ORIGIN_Y + 140} ${FALLEN_APPLE.x} ${FALLEN_APPLE.y - 4}`}
          fill="none"
          stroke="var(--color-vermilion)"
          strokeWidth="0.8"
          strokeDasharray="2 4"
          strokeOpacity="0.5"
        />

        {/* The inscription — annus mirabilis, italic serif, low on the panel */}
        <text
          x={ORIGIN_X}
          y={VIEW_H - 78}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="22"
          fill="var(--color-ink)"
        >
          annus mirabilis
        </text>
        <text
          x={ORIGIN_X}
          y={VIEW_H - 56}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          letterSpacing="0.32em"
          fill="var(--color-dim)"
        >
          1666
        </text>

        {/* Footer caption */}
        <text
          x="62"
          y={VIEW_H - 28}
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE YEAR HE INVENTED FLUXIONS  ·  AND DIDN'T PUBLISH
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0 &mdash; Newton at twenty-three, home for the plague.
      </figcaption>
    </figure>
  )
}
