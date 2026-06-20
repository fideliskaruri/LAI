import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { POINTS } from './scatterData'

/**
 * The problem act. A scatter of thirty 2D points in three clusters that a
 * human sees instantly — but all rendered in a single neutral ink colour,
 * with no labels. The teaching is the gap between what your eye does in a
 * fraction of a second and what a computer would have to be told to do.
 *
 * No interaction.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

export function LabeledScatter() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A scatter of thirty two-dimensional points. To a human eye, they fall into three obvious groups: one in the lower-left, one in the upper-middle, one in the lower-right. None of the points carry a label or colour. The teaching question: how do we get a computer to find what your eye does in a fraction of a second?"
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A scatter of thirty unlabeled, identically coloured points. A human sees three clusters instantly: lower-left, upper-middle, lower-right. The points themselves carry no label."
      >
        <Grid />
        <Axes />

        {POINTS.map((p, i) => {
          const cx = ORIGIN_X + p.x * UNIT
          const cy = ORIGIN_Y - p.y * UNIT
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="5"
              fill="var(--color-graph-ink)"
              fillOpacity="0.78"
            />
          )
        })}

        {/* Eyebrow: name the question */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            POINTS WITHOUT LABELS
          </text>
          <text
            y="22"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-ink)"
          >
            How many groups do you see?
          </text>
        </g>

        {/* Count chip, bottom-right */}
        <g transform={`translate(${VIEW_W - 130}, ${VIEW_H - 56})`}>
          <text
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill="var(--color-dim)"
          >
            n = {POINTS.length} points
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1 &mdash; Thirty points, three clusters &mdash; obvious to you, invisible to a computer.
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
