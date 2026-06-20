import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Closing scene for Integrals. A small triptych: a bell curve labelled
 * "probability density," a U-shaped loss labelled "loss function," and
 * a vermilion arrow pointing toward both from the long-S integral sign
 * we just defined. The thread forward.
 *
 * Static, no interaction.
 */

const VIEW_W = 600
const VIEW_H = 480

const PANEL_W = 150
const PANEL_H = 110

const LEFT = { x: 50, y: 200 }
const MID = { x: 220, y: 200 }
const RIGHT = { x: 390, y: 200 }

function bellPath(panel: { x: number; y: number }) {
  const baseY = panel.y + PANEL_H - 12
  const ampl = PANEL_H - 30
  const steps = 60
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 6 - 3 // x in [-3, 3]
    const y = Math.exp(-t * t / 2)
    const px = panel.x + 12 + (i / steps) * (PANEL_W - 24)
    const py = baseY - y * ampl
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  // Close to baseline
  pts.push(`L${panel.x + PANEL_W - 12},${baseY}`)
  pts.push(`L${panel.x + 12},${baseY}`)
  pts.push('Z')
  return pts.join(' ')
}

function lossPath(panel: { x: number; y: number }) {
  const baseY = panel.y + PANEL_H - 12
  const steps = 60
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 4 - 2 // x in [-2, 2]
    const y = t * t / 4 + 0.1 // U-shaped loss
    const px = panel.x + 12 + (i / steps) * (PANEL_W - 24)
    const py = baseY - y * (PANEL_H - 30)
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return pts.join(' ')
}

function expectedPath(panel: { x: number; y: number }) {
  // Decorative — sum of two narrow bumps to suggest "expected value"
  const baseY = panel.y + PANEL_H - 12
  const ampl = PANEL_H - 30
  const steps = 60
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 6 - 3
    const y = 0.55 * Math.exp(-((t + 1.2) ** 2) / 0.6) + 0.7 * Math.exp(-((t - 1) ** 2) / 0.8)
    const px = panel.x + 12 + (i / steps) * (PANEL_W - 24)
    const py = baseY - y * ampl
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  pts.push(`L${panel.x + PANEL_W - 12},${baseY}`)
  pts.push(`L${panel.x + 12},${baseY}`)
  pts.push('Z')
  return pts.join(' ')
}

function MiniPanel({
  panel,
  title,
  caption,
  d,
  filled,
}: {
  panel: { x: number; y: number }
  title: string
  caption: string
  d: string
  filled: boolean
}) {
  return (
    <g>
      <rect
        x={panel.x}
        y={panel.y}
        width={PANEL_W}
        height={PANEL_H}
        fill="var(--color-paper)"
        stroke="var(--color-graph-fade)"
        strokeWidth="1"
      />
      <text
        x={panel.x + 8}
        y={panel.y + 16}
        fontFamily="Inter, sans-serif"
        fontSize="9"
        letterSpacing="0.22em"
        fill="var(--color-dim)"
      >
        {title}
      </text>
      <path
        d={d}
        fill={filled ? 'var(--color-vermilion)' : 'none'}
        fillOpacity={filled ? 0.2 : 0}
        stroke="var(--color-vermilion)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <line
        x1={panel.x + 12}
        y1={panel.y + PANEL_H - 12}
        x2={panel.x + PANEL_W - 12}
        y2={panel.y + PANEL_H - 12}
        stroke="var(--color-graph-ink)"
        strokeWidth="0.8"
      />
      <text
        x={panel.x + PANEL_W / 2}
        y={panel.y + PANEL_H + 18}
        textAnchor="middle"
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize="12"
        fill="var(--color-dim)"
      >
        {caption}
      </text>
    </g>
  )
}

export function Closing() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A small triptych: a bell-shaped probability density, an expected-value distribution, and a U-shaped loss function. Each is an integral. The chapter ends pointing forward: expected values, probabilities, losses — all of them sit on top of the integral we just defined."
        priority="high"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A triptych of three small panels: a bell-shaped probability density, a two-bump expected value distribution, and a U-shaped loss curve. Each panel is captioned with where the integral shows up downstream. Bottom of the figure: the thread forward."
      >
        {/* Header — long-S integral, anchor on the left */}
        <g transform="translate(36, 50)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
            WHERE THE INTEGRAL SHOWS UP
          </text>
          <text y="48" fontFamily="Georgia, serif" fontStyle="italic" fontSize="48" fill="var(--color-vermilion)">
            &#8747;
          </text>
          <text y="92" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="12" fill="var(--color-dim)">
            the move we just made
          </text>
        </g>

        {/* Three downstream panels */}
        <MiniPanel
          panel={LEFT}
          title="PROBABILITY DENSITY"
          caption="area = probability"
          d={bellPath(LEFT)}
          filled
        />
        <MiniPanel
          panel={MID}
          title="EXPECTED VALUE"
          caption={'E[X] = ∫ x p(x) dx'}
          d={expectedPath(MID)}
          filled
        />
        <MiniPanel
          panel={RIGHT}
          title="LOSS LANDSCAPE"
          caption="total loss = integral"
          d={lossPath(RIGHT)}
          filled={false}
        />

        {/* Arrows from the big integral to each panel */}
        {[LEFT, MID, RIGHT].map((p, i) => {
          const fromX = 100
          const fromY = 110
          const toX = p.x + 4
          const toY = p.y + PANEL_H / 2
          return (
            <g key={`arr-${i}`}>
              <path
                d={`M ${fromX} ${fromY} Q ${(fromX + toX) / 2} ${(fromY + toY) / 2 - 24} ${toX} ${toY}`}
                fill="none"
                stroke="var(--color-vermilion)"
                strokeWidth="1.2"
                strokeOpacity="0.5"
                strokeDasharray="3 4"
              />
            </g>
          )
        })}

        {/* Caption */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 76}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="15"
          fill="var(--color-ink)"
        >
          The integral is the derivative&rsquo;s sister, and they meet you everywhere downstream.
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 50}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          PROBABILITY  &middot;  EXPECTATION  &middot;  OPTIMIZATION
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 28}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          NEXT &middot; OPTIMIZATION
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6 &mdash; The integral, downstream.
      </figcaption>
    </figure>
  )
}
