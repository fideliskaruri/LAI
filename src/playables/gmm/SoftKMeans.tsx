import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import {
  POINTS,
  CONVERGED_MIXTURE,
  responsibilities,
  mixColor,
  COMPONENT_COLORS,
} from './gmmData'

/**
 * Cold-open. The same thirty-point scatter the K-means chapter ended on —
 * but now each point is painted with its *blended* responsibility across
 * the three Gaussian components.
 *
 * No interaction. The teaching is the question that hovers over the picture:
 * how do we compute those probabilities? That question gets answered in
 * acts 2 through 5.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

export function SoftKMeans() {
  const gammas = responsibilities(POINTS, CONVERGED_MIXTURE)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The same thirty-point scatter from the K-means chapter. Each point is now painted with a blend of three colours — vermilion, blue, olive — weighted by its probability of belonging to each of three Gaussian components. Points near the cluster centers read as pure colour; points on the boundaries read muddy."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Thirty data points coloured by mixture responsibility. Three components — vermilion, blue, olive — each point's colour blends them by membership probability."
      >
        <Grid />
        <Axes />

        {/* Centers shown faintly as diamonds so the eye has anchors */}
        {CONVERGED_MIXTURE.map((c, i) => {
          const cx = ORIGIN_X + c.mean.x * UNIT
          const cy = ORIGIN_Y - c.mean.y * UNIT
          return (
            <polygon
              key={i}
              points={`${cx},${cy - 7} ${cx + 7},${cy} ${cx},${cy + 7} ${cx - 7},${cy}`}
              fill="var(--color-cream)"
              stroke={COMPONENT_COLORS[i]}
              strokeWidth="1.5"
              opacity="0.55"
            />
          )
        })}

        {/* Points painted by blended responsibilities */}
        {POINTS.map((p, i) => {
          const cx = ORIGIN_X + p.x * UNIT
          const cy = ORIGIN_Y - p.y * UNIT
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="6"
              fill={mixColor(gammas[i])}
              fillOpacity="0.92"
            />
          )
        })}

        {/* Title / question */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            SOFT K-MEANS  ·  THE QUESTION
          </text>
          <text
            y="22"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="15"
            fill="var(--color-ink)"
          >
            Each point: a probability across all three clusters.
          </text>
          <text
            y="40"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="13"
            fill="var(--color-dim)"
          >
            How do we compute those probabilities?
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0 &mdash; Soft assignment: every point is partly every cluster.
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
