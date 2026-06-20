import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 2 — "Which directions are special?"
 *
 * Static (no drag). Several arrows at different angles emanate from the
 * origin. A 2×2 transformation M = [[2, 1], [1, 2]] is applied. The
 * "before" arrows are faint ink; the "after" arrows are vermilion.
 *
 * For most arrows, the after-arrow rotates (lands on a different ray than
 * the before-arrow). For two of them — the eigendirections (1, 1) and
 * (1, −1) — the after-arrow lies on the *same* ray as the before-arrow,
 * just longer. Those get a halo.
 *
 * No interaction; the act exists to plant the question the next act lets
 * the reader chase.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

// The teaching matrix M = [[2, 1], [1, 2]] — symmetric, two clean real
// eigenvalues (1 and 3) with eigenvectors (1, −1) and (1, 1).
const M00 = 2
const M01 = 1
const M10 = 1
const M11 = 2

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

function toSvg(mx: number, my: number) {
  return { x: ORIGIN_X + mx * UNIT, y: ORIGIN_Y - my * UNIT }
}

interface Probe {
  /** Math-coords unit direction the arrow points in (before). */
  x: number
  y: number
  /** True if this is an eigendirection (image lies on the same line). */
  eigen: boolean
  /** Display length so all the probe arrows fit in the viewBox. */
  scale: number
  label?: string
}

// Six probe arrows. (1, 1) and (1, −1) are eigenvectors of M (eigenvalues
// 3 and 1 respectively). The others rotate noticeably under M.
const PROBES: Probe[] = [
  { x: 1, y: 0, eigen: false, scale: 1.4 },
  { x: 1, y: 0.6, eigen: false, scale: 1.3 },
  { x: 1, y: 1, eigen: true, scale: 1.3, label: 'eigen · λ = 3' },
  { x: 0.4, y: 1, eigen: false, scale: 1.4 },
  { x: -0.4, y: 1, eigen: false, scale: 1.4 },
  { x: 1, y: -1, eigen: true, scale: 1.3, label: 'eigen · λ = 1' },
]

function applyM(x: number, y: number) {
  return { x: M00 * x + M01 * y, y: M10 * x + M11 * y }
}

export function WhichDirections() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A static figure. Six arrows fan out from the origin. A two-by-two matrix has been applied. Most of the arrows land on a different ray than they started — they have rotated. Two of them land on the same ray, just longer. Those two are the eigenvectors of the matrix; the others are not."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A unit grid with six probe arrows shown in their before and after positions under the matrix M equals two, one, one, two. The probes along directions one, one and one, minus one keep their direction; the others rotate."
      >
        <ReferenceGrid />
        <Axes />

        {/* Before/after arrows for each probe */}
        {PROBES.map((p, i) => {
          const before = { x: p.x * p.scale, y: p.y * p.scale }
          const afterMath = applyM(before.x, before.y)
          const B = toSvg(before.x, before.y)
          const A = toSvg(afterMath.x, afterMath.y)
          const O = { x: ORIGIN_X, y: ORIGIN_Y }
          const headB = arrowHead(O, B)
          const headA = arrowHead(O, A)

          return (
            <g key={i}>
              {/* Eigen halo — a faint dashed line through the eigendirection */}
              {p.eigen && (
                <line
                  x1={ORIGIN_X - 6 * UNIT * p.x}
                  y1={ORIGIN_Y + 6 * UNIT * p.y}
                  x2={ORIGIN_X + 6 * UNIT * p.x}
                  y2={ORIGIN_Y - 6 * UNIT * p.y}
                  stroke="var(--color-vermilion)"
                  strokeOpacity="0.18"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />
              )}

              {/* Before arrow — faint ink */}
              <line
                x1={O.x}
                y1={O.y}
                x2={B.x}
                y2={B.y}
                stroke="var(--color-graph-ink)"
                strokeOpacity="0.45"
                strokeWidth="1.5"
              />
              <polygon
                points={`${B.x},${B.y} ${headB.p1.x},${headB.p1.y} ${headB.p2.x},${headB.p2.y}`}
                fill="var(--color-graph-ink)"
                fillOpacity="0.45"
              />

              {/* After arrow — vermilion */}
              <line
                x1={O.x}
                y1={O.y}
                x2={A.x}
                y2={A.y}
                stroke="var(--color-vermilion)"
                strokeWidth="2.4"
              />
              <polygon
                points={`${A.x},${A.y} ${headA.p1.x},${headA.p1.y} ${headA.p2.x},${headA.p2.y}`}
                fill="var(--color-vermilion)"
              />

              {/* Eigenvalue tag */}
              {p.eigen && p.label && (
                <text
                  x={A.x + 10}
                  y={A.y + (p.y >= 0 ? -10 : 18)}
                  fontFamily="Source Serif 4, Georgia, serif"
                  fontStyle="italic"
                  fontSize="12"
                  fill="var(--color-vermilion)"
                >
                  {p.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Matrix readout */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            APPLIED TRANSFORMATION  ·  M
          </text>
          <g transform="translate(0, 14)">
            <path
              d="M 4 6 L 0 6 L 0 56 L 4 56"
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="1.4"
            />
            <text
              x="14"
              y="22"
              fontFamily="JetBrains Mono, monospace"
              fontSize="14"
              fill="var(--color-ink)"
            >
              2
            </text>
            <text
              x="60"
              y="22"
              fontFamily="JetBrains Mono, monospace"
              fontSize="14"
              fill="var(--color-ink)"
            >
              1
            </text>
            <text
              x="14"
              y="46"
              fontFamily="JetBrains Mono, monospace"
              fontSize="14"
              fill="var(--color-ink)"
            >
              1
            </text>
            <text
              x="60"
              y="46"
              fontFamily="JetBrains Mono, monospace"
              fontSize="14"
              fill="var(--color-ink)"
            >
              2
            </text>
            <path
              d="M 96 6 L 100 6 L 100 56 L 96 56"
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="1.4"
            />
          </g>
        </g>

        {/* Legend */}
        <g transform={`translate(36, ${VIEW_H - 84})`}>
          <line x1="0" y1="6" x2="22" y2="6" stroke="var(--color-graph-ink)" strokeOpacity="0.45" strokeWidth="1.5" />
          <text
            x="30"
            y="10"
            fontFamily="Inter, sans-serif"
            fontSize="11"
            fill="var(--color-dim)"
          >
            before v
          </text>
          <line x1="0" y1="28" x2="22" y2="28" stroke="var(--color-vermilion)" strokeWidth="2.4" />
          <text
            x="30"
            y="32"
            fontFamily="Inter, sans-serif"
            fontSize="11"
            fill="var(--color-dim)"
          >
            after Mv
          </text>
          <line x1="0" y1="50" x2="22" y2="50" stroke="var(--color-vermilion)" strokeOpacity="0.18" strokeWidth="1.5" strokeDasharray="6 4" />
          <text
            x="30"
            y="54"
            fontFamily="Inter, sans-serif"
            fontSize="11"
            fill="var(--color-dim)"
          >
            eigen-line
          </text>
        </g>

        <text
          x={VIEW_W - 32}
          y={VIEW_H - 18}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE ONES THAT JUST STRETCH  ·  ARE THE EIGENVECTORS
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1 &mdash; Most directions rotate. A few don&rsquo;t.
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
      <line
        x1="20"
        y1={ORIGIN_Y}
        x2={VIEW_W - 20}
        y2={ORIGIN_Y}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
      <line
        x1={ORIGIN_X}
        y1="20"
        x2={ORIGIN_X}
        y2={VIEW_H - 20}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
    </>
  )
}
