import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { POINTS, CLUSTER_COLORS, SENSITIVITY_INITS, assign, updateCentroids, type Pt } from './scatterData'

/**
 * The closing scene. Left half: the converged K-means clustering — hard
 * assignment, each point one colour. Right half: the same points, but now
 * coloured by a probability triple (mixture of the three cluster colours)
 * to gesture at the soft-assignment idea GMM will pick up next chapter.
 *
 * No interaction. The teaching is the contrast: same data, two ways to
 * answer "which cluster?".
 */

const VIEW_W = 600
const VIEW_H = 480

// Two stacked panels, side by side
const PANEL_W = 280
const PANEL_H = 320
const LEFT_X = 24
const RIGHT_X = VIEW_W - PANEL_W - 24
const PANEL_Y = 100

const SUB_ORIGIN_X = PANEL_W / 2
const SUB_ORIGIN_Y = PANEL_H / 2
const SUB_UNIT = 38

function runToConvergence(initial: Pt[]) {
  let cur = initial.map((c) => ({ ...c }))
  let a = assign(POINTS, cur)
  for (let step = 0; step < 60; step++) {
    const { next, drift } = updateCentroids(POINTS, a, cur)
    cur = next
    a = assign(POINTS, cur)
    if (drift < 1e-3) break
  }
  return { centroids: cur, assignments: a }
}

/** Soft assignment via a proper Gaussian likelihood — the same recipe a
 *  GMM uses (sans mixing weights and the 1/√(2π)σ constant, which cancel
 *  in the normalization). For each centroid c we compute the unnormalized
 *  likelihood exp(-d²/(2σ²)) and renormalize across centroids so the
 *  three probabilities sum to one. The closing.mdx prose quotes specific
 *  triples like "65 / 30 / 5" — only honest if the math here is honest. */
// σ = 1.4 chosen by eye: large enough that boundary points get genuinely
// mixed colours (not crushed to ~1 on a single cluster), small enough that
// points sitting inside a cluster's core read as nearly pure colour.
const SIGMA = 1.4
const TWO_SIGMA_SQ = 2 * SIGMA * SIGMA

function softProbs(p: Pt, centroids: Pt[]): number[] {
  const weights = centroids.map((c) => {
    const dx = p.x - c.x
    const dy = p.y - c.y
    return Math.exp(-(dx * dx + dy * dy) / TWO_SIGMA_SQ)
  })
  const sum = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => w / sum)
}

/** Blend cluster colours by per-cluster probability. The three CLUSTER_COLORS
    are 'var(--color-vermilion)', '#5a93b0' (blue), '#9bab57' (olive). We
    hardcode RGB to mix; vermilion is approximated as #c0432a. */
const CLUSTER_RGB = [
  [192, 67, 42], // vermilion
  [90, 147, 176], // blue
  [155, 171, 87], // olive
]

function mix(probs: number[]): string {
  let r = 0
  let g = 0
  let b = 0
  for (let i = 0; i < probs.length; i++) {
    r += CLUSTER_RGB[i][0] * probs[i]
    g += CLUSTER_RGB[i][1] * probs[i]
    b += CLUSTER_RGB[i][2] * probs[i]
  }
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}

export function Closing() {
  // Use the "good" init so the left panel shows a clean converged state.
  const { centroids, assignments } = runToConvergence(SENSITIVITY_INITS[0])

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="Two panels of the same thirty points. On the left, hard assignment: each point belongs to exactly one cluster. On the right, soft assignment: each point's colour is a blend, reflecting its membership probability across all three clusters. Hard versus soft is the bridge to Gaussian mixture models."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A side-by-side comparison. Left panel: hard cluster assignments — each point is one of three colours. Right panel: soft cluster assignments — each point's colour is a probability-weighted blend. The forward link to Gaussian mixture models."
      >
        {/* Title */}
        <text
          x={VIEW_W / 2}
          y="50"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          HARD VERSUS SOFT
        </text>
        <text
          x={VIEW_W / 2}
          y="74"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          One cluster, or a probability across all three?
        </text>

        {/* LEFT panel — hard assignment */}
        <g transform={`translate(${LEFT_X}, ${PANEL_Y})`}>
          <rect
            width={PANEL_W}
            height={PANEL_H}
            fill="none"
            stroke="var(--color-graph-fade)"
            strokeWidth="1"
          />
          {/* axes */}
          <line
            x1="0"
            y1={SUB_ORIGIN_Y}
            x2={PANEL_W}
            y2={SUB_ORIGIN_Y}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.6"
            strokeOpacity="0.5"
          />
          <line
            x1={SUB_ORIGIN_X}
            y1="0"
            x2={SUB_ORIGIN_X}
            y2={PANEL_H}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.6"
            strokeOpacity="0.5"
          />
          {POINTS.map((p, i) => (
            <circle
              key={i}
              cx={SUB_ORIGIN_X + p.x * SUB_UNIT}
              cy={SUB_ORIGIN_Y - p.y * SUB_UNIT}
              r="4"
              fill={CLUSTER_COLORS[assignments[i]]}
              fillOpacity="0.9"
            />
          ))}
          {centroids.map((c, i) => {
            const cx = SUB_ORIGIN_X + c.x * SUB_UNIT
            const cy = SUB_ORIGIN_Y - c.y * SUB_UNIT
            return (
              <polygon
                key={i}
                points={`${cx},${cy - 8} ${cx + 8},${cy} ${cx},${cy + 8} ${cx - 8},${cy}`}
                fill="var(--color-cream)"
                stroke={CLUSTER_COLORS[i]}
                strokeWidth="2"
              />
            )
          })}
          <text
            x={PANEL_W / 2}
            y={PANEL_H + 24}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            K-MEANS  ·  HARD
          </text>
        </g>

        {/* RIGHT panel — soft assignment */}
        <g transform={`translate(${RIGHT_X}, ${PANEL_Y})`}>
          <rect
            width={PANEL_W}
            height={PANEL_H}
            fill="none"
            stroke="var(--color-graph-fade)"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={SUB_ORIGIN_Y}
            x2={PANEL_W}
            y2={SUB_ORIGIN_Y}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.6"
            strokeOpacity="0.5"
          />
          <line
            x1={SUB_ORIGIN_X}
            y1="0"
            x2={SUB_ORIGIN_X}
            y2={PANEL_H}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.6"
            strokeOpacity="0.5"
          />
          {POINTS.map((p, i) => {
            const probs = softProbs(p, centroids)
            return (
              <circle
                key={i}
                cx={SUB_ORIGIN_X + p.x * SUB_UNIT}
                cy={SUB_ORIGIN_Y - p.y * SUB_UNIT}
                r="4"
                fill={mix(probs)}
                fillOpacity="0.9"
              />
            )
          })}
          {centroids.map((c, i) => {
            const cx = SUB_ORIGIN_X + c.x * SUB_UNIT
            const cy = SUB_ORIGIN_Y - c.y * SUB_UNIT
            return (
              <polygon
                key={i}
                points={`${cx},${cy - 8} ${cx + 8},${cy} ${cx},${cy + 8} ${cx - 8},${cy}`}
                fill="var(--color-cream)"
                stroke={CLUSTER_COLORS[i]}
                strokeWidth="2"
              />
            )
          })}
          <text
            x={PANEL_W / 2}
            y={PANEL_H + 24}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            GMM  ·  SOFT  (next chapter)
          </text>
        </g>

        {/* Arrow between */}
        <g transform={`translate(${VIEW_W / 2}, ${PANEL_Y + PANEL_H / 2})`}>
          <line
            x1="-22"
            y1="0"
            x2="22"
            y2="0"
            stroke="var(--color-vermilion)"
            strokeWidth="1.5"
          />
          <polygon
            points="28,0 18,-5 18,5"
            fill="var(--color-vermilion)"
          />
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6 &mdash; Hard assignment is one step from soft. GMM is next.
      </figcaption>
    </figure>
  )
}
