import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Closing scene for the Distributions chapter. A page laid out like
 * the cover plate of a textbook chapter that's about to begin: three
 * small Gaussians lined up across the canvas, each labelled with a use
 * — loss curve, model output, attention weight — and an arrow pointing
 * forward toward Linear regression.
 *
 * Static. The visual handoff: distributions are about to stop being
 * abstract shapes and start being the language we use to describe
 * loss functions, predictions, and learned weights.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

interface PanelSpec {
  x: number
  label: string
  caption: string
  mu: number
  sigma: number
}

const PANEL_TOP = 130
const PANEL_BOTTOM = 280
const PANEL_W = 160
const PANEL_H = PANEL_BOTTOM - PANEL_TOP
const PANELS: PanelSpec[] = [
  { x: 36, label: 'LOSS CURVE', caption: 'errors a model makes', mu: 0, sigma: 1 },
  { x: 220, label: 'MODEL OUTPUT', caption: 'a prediction with confidence', mu: 0.2, sigma: 0.7 },
  { x: 404, label: 'ATTENTION WEIGHTS', caption: 'where the model looks', mu: -0.4, sigma: 1.2 },
]

function gaussianPdf(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

function bellPath(panel: PanelSpec): string {
  const samples = 96
  const xMin = -3
  const xMax = 3
  // Find peak across panels to normalise vertically — use the local panel's peak.
  const peak = gaussianPdf(panel.mu, panel.mu, panel.sigma)
  const pts: string[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const xWorld = xMin + t * (xMax - xMin)
    const pdf = gaussianPdf(xWorld, panel.mu, panel.sigma)
    const px = panel.x + t * PANEL_W
    const py = PANEL_BOTTOM - (pdf / peak) * PANEL_H * 0.82
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')}`
}
function bellFillPath(panel: PanelSpec): string {
  return `${bellPath(panel)} L ${(panel.x + PANEL_W).toFixed(1)},${PANEL_BOTTOM} L ${panel.x.toFixed(1)},${PANEL_BOTTOM} Z`
}

export function Closing() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="Three vermilion bell curves laid out side by side, each labelled with a place it shows up in machine learning — loss curves, model outputs, attention weights. An arrow points forward toward Linear regression, where the first one of these starts doing real work."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Closing figure for the Distributions chapter: three bell curves in a row, labelled loss curve, model output, and attention weights, with a forward-pointing arrow toward Linear regression."
      >
        <g aria-hidden="true" data-origin-x={ORIGIN_X} data-origin-y={ORIGIN_Y} data-unit={UNIT} />

        {/* Headline */}
        <text
          x={VIEW_W / 2}
          y={56}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          distributions, everywhere a model thinks
        </text>

        {/* Three panels */}
        {PANELS.map((panel) => (
          <g key={panel.label}>
            <text
              x={panel.x}
              y={PANEL_TOP - 10}
              fontFamily="Inter, sans-serif"
              fontSize="9"
              letterSpacing="0.18em"
              fill="var(--color-dim)"
            >
              {panel.label}
            </text>
            <line
              x1={panel.x}
              y1={PANEL_BOTTOM}
              x2={panel.x + PANEL_W}
              y2={PANEL_BOTTOM}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.8"
            />
            <path d={bellFillPath(panel)} fill="var(--color-vermilion)" fillOpacity="0.10" />
            <path d={bellPath(panel)} fill="none" stroke="var(--color-vermilion)" strokeWidth="1.5" />
            <text
              x={panel.x + PANEL_W / 2}
              y={PANEL_BOTTOM + 18}
              textAnchor="middle"
              fontFamily="Source Serif 4, Georgia, serif"
              fontStyle="italic"
              fontSize="11"
              fill="var(--color-ink)"
            >
              {panel.caption}
            </text>
          </g>
        ))}

        {/* Forward arrow + next-chapter label */}
        <g transform={`translate(0, ${PANEL_BOTTOM + 80})`}>
          <line
            x1={120}
            y1={0}
            x2={460}
            y2={0}
            stroke="var(--color-vermilion)"
            strokeWidth="1.5"
          />
          <polygon
            points={`460,0 450,-6 450,6`}
            fill="var(--color-vermilion)"
          />
          <text
            x={VIEW_W / 2}
            y={-12}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-vermilion)"
          >
            NEXT
          </text>
          <text
            x={VIEW_W / 2}
            y={28}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontSize="16"
            fontStyle="italic"
            fill="var(--color-ink)"
          >
            Linear regression
          </text>
          <text
            x={VIEW_W / 2}
            y={48}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            where the first of these curves earns its keep
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6 — Distributions are the language of ML
      </figcaption>
    </figure>
  )
}
