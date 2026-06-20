import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Closing scene of the Derivatives chapter. A small heatmap-bowl sketch
 * on the left dissolves into a vermilion gradient-arrow on the right,
 * with a downward-pointing arc suggesting "and from here, optimization
 * climbs". Static, no interaction. The teaching is the thread forward.
 */

const VIEW_W = 600
const VIEW_H = 480

export function Closing() {
  // Small heatmap sketch: a 6x6 grid of squares with deepening vermilion
  // toward the corners.
  const heatCells: Array<{ x: number; y: number; v: number }> = []
  const HEAT_X = 60
  const HEAT_Y = 90
  const HEAT_CELL = 28
  const HEAT_COLS = 6
  const HEAT_ROWS = 6
  for (let i = 0; i < HEAT_COLS; i++) {
    for (let j = 0; j < HEAT_ROWS; j++) {
      // distance from center → higher value
      const dx = i - (HEAT_COLS - 1) / 2
      const dy = j - (HEAT_ROWS - 1) / 2
      const v = Math.min(1, (dx * dx + dy * dy) / ((HEAT_COLS - 1) ** 2 / 2))
      heatCells.push({
        x: HEAT_X + i * HEAT_CELL,
        y: HEAT_Y + j * HEAT_CELL,
        v,
      })
    }
  }

  // Center of the heatmap, for the arrow origin.
  const heatCx = HEAT_X + (HEAT_COLS * HEAT_CELL) / 2
  const heatCy = HEAT_Y + (HEAT_ROWS * HEAT_CELL) / 2

  // Arrow on the heatmap (gradient direction, up-right)
  const heatArrow = {
    from: { x: heatCx + 18, y: heatCy - 12 },
    to: { x: heatCx + 60, y: heatCy - 54 },
  }

  // Right side: a single big vermilion gradient arrow, with a downward
  // dashed arc beneath it suggesting "optimization will climb down."
  const bigArrow = {
    from: { x: 380, y: 280 },
    to: { x: 510, y: 130 },
  }

  function heatColor(v: number): string {
    const t = v
    const r1 = 243, g1 = 239, b1 = 230
    const r2 = 110, g2 = 28, b2 = 20
    return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A small heatmap on the left, with an arrow pointing up the slope. On the right, a much larger vermilion gradient arrow, with the word optimization written below it. The thread from this chapter to the next: the gradient is the thing optimization climbs."
        priority="high"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="On the left, a small heatmap with a gradient arrow climbing toward higher values. An arrow points right. On the right, a single large vermilion gradient arrow. Caption: the gradient becomes the thing optimization climbs."
      >
        {/* Header */}
        <text x={36} y={40} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          THE THREAD FORWARD
        </text>

        {/* Left: small heatmap */}
        <g>
          {heatCells.map((c, i) => (
            <rect
              key={i}
              x={c.x}
              y={c.y}
              width={HEAT_CELL}
              height={HEAT_CELL}
              fill={heatColor(c.v)}
            />
          ))}
          {/* Level curves — two ellipses */}
          <ellipse
            cx={heatCx}
            cy={heatCy}
            rx={42}
            ry={42}
            fill="none"
            stroke="var(--color-graph-ink)"
            strokeWidth="0.6"
            strokeOpacity="0.4"
            strokeDasharray="3 4"
          />
          <ellipse
            cx={heatCx}
            cy={heatCy}
            rx={70}
            ry={70}
            fill="none"
            stroke="var(--color-graph-ink)"
            strokeWidth="0.6"
            strokeOpacity="0.4"
            strokeDasharray="3 4"
          />
          {/* Small gradient arrow */}
          <line
            x1={heatArrow.from.x}
            y1={heatArrow.from.y}
            x2={heatArrow.to.x}
            y2={heatArrow.to.y}
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
          <polygon
            points={`${heatArrow.to.x},${heatArrow.to.y} ${heatArrow.to.x - 10},${heatArrow.to.y + 2} ${heatArrow.to.x - 6},${heatArrow.to.y + 10}`}
            fill="var(--color-vermilion)"
          />
          <text
            x={HEAT_X}
            y={HEAT_Y + HEAT_ROWS * HEAT_CELL + 22}
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            the gradient, in this chapter
          </text>
        </g>

        {/* Center: connecting arrow */}
        <g>
          <line
            x1={270}
            y1={240}
            x2={350}
            y2={240}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
            strokeOpacity="0.6"
          />
          <polygon
            points={`${356},${240} ${346},${236} ${346},${244}`}
            fill="var(--color-graph-ink)"
            fillOpacity="0.6"
          />
          <text
            x={310}
            y={232}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            BECOMES
          </text>
        </g>

        {/* Right: big gradient arrow + caption */}
        <g>
          <line
            x1={bigArrow.from.x}
            y1={bigArrow.from.y}
            x2={bigArrow.to.x}
            y2={bigArrow.to.y}
            stroke="var(--color-vermilion)"
            strokeWidth="3.2"
          />
          {(() => {
            const ang = Math.atan2(bigArrow.to.y - bigArrow.from.y, bigArrow.to.x - bigArrow.from.x)
            const headLen = 22
            const headWide = 11
            const head1 = {
              x: bigArrow.to.x - headLen * Math.cos(ang) + headWide * Math.cos(ang + Math.PI / 2),
              y: bigArrow.to.y - headLen * Math.sin(ang) + headWide * Math.sin(ang + Math.PI / 2),
            }
            const head2 = {
              x: bigArrow.to.x - headLen * Math.cos(ang) - headWide * Math.cos(ang + Math.PI / 2),
              y: bigArrow.to.y - headLen * Math.sin(ang) - headWide * Math.sin(ang + Math.PI / 2),
            }
            return (
              <polygon
                points={`${bigArrow.to.x},${bigArrow.to.y} ${head1.x},${head1.y} ${head2.x},${head2.y}`}
                fill="var(--color-vermilion)"
              />
            )
          })()}

          {/* Dashed downhill arc — optimization climbs the gradient */}
          <path
            d={`M ${bigArrow.from.x - 10} ${bigArrow.from.y + 40} Q ${(bigArrow.from.x + bigArrow.to.x) / 2 - 30} ${(bigArrow.from.y + bigArrow.to.y) / 2 + 60} ${bigArrow.to.x - 60} ${bigArrow.to.y + 80}`}
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="1.2"
            strokeOpacity="0.45"
            strokeDasharray="4 5"
          />
          <text
            x={bigArrow.to.x}
            y={bigArrow.to.y - 24}
            textAnchor="end"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-vermilion)"
          >
            STEEPEST ASCENT
          </text>
          <text
            x={bigArrow.from.x - 4}
            y={bigArrow.from.y + 80}
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="13"
            fill="var(--color-dim)"
          >
            the thing optimization will climb
          </text>
        </g>

        {/* Caption */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 60}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="15"
          fill="var(--color-ink)"
        >
          Next chapter: a loss function, and the gradient that takes us down it.
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 36}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          INTEGRALS  ·  OPTIMIZATION  ·  EVERYTHING DOWNSTREAM
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 8 &mdash; The gradient becomes the thing every later chapter follows.
      </figcaption>
    </figure>
  )
}
