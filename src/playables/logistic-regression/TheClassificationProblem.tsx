import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { PlotAxes, ClassScatter } from './Axes'
import {
  POINTS,
  VIEW_W,
  VIEW_H,
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  dataToSvgX,
  dataToSvgY,
} from './dataset'

/**
 * Act 1 — cold-open. The classification problem in one picture.
 *
 *  Left  : the scatter, coloured blue / red, with a thin straight line cut
 *          across it — the linear-regression habit applied to a problem it
 *          doesn't belong on. The line predicts real numbers; the labels are
 *          0 and 1.
 *  Right : the same scatter with a smooth sigmoid surface overlaid, gently
 *          dividing blue from red. A title card says "we want probabilities."
 *
 * No interaction. The next act picks up the sigmoid in earnest.
 */

export function LeftPane() {
  // The linear-regression line, drawn as if someone had naively fit y_label
  // against (x, y) on this dataset. Hand-picked endpoints so it cuts the
  // cloud in a vaguely sensible direction but is obviously wrong: it
  // extrapolates to negative values on the left and well above 1 on the
  // right. We're showing why linear regression alone fails here.
  const xL = 0
  const xR = 40
  const yL = -0.4 // far below 0
  const yR = 1.5 // far above 1

  // Map "fake y values" — which live in [−0.4, 1.5] — onto the y-axis
  // [0, 40] purely visually, so they sit alongside the real points without
  // a second axis. The point of the picture is the failure mode, not the
  // numbers.
  const scale = (v: number) => 4 + v * 24
  const yL_px = dataToSvgY(scale(yL))
  const yR_px = dataToSvgY(scale(yR))

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A scatter plot of twenty-six points, half blue and half red, separated roughly by a diagonal. A straight line cuts across the cloud — linear regression's answer — but it extrapolates below zero on one side and above one on the other, even though the labels are only zero or one."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Two-class scatter — blue and red points. A naive linear regression line cuts through them, predicting values that fall outside zero and one."
      >
        <PlotAxes xLabel="Feature 1" yLabel="Feature 2" />
        <ClassScatter pts={POINTS} />

        {/* The naive linear regression "fit" — a straight line through the cloud */}
        <line
          x1={dataToSvgX(xL)}
          y1={yL_px}
          x2={dataToSvgX(xR)}
          y2={yR_px}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <text
          x={dataToSvgX(xR) - 6}
          y={yR_px - 8}
          textAnchor="end"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-dim)"
        >
          a straight line
        </text>

        {/* Annotation: predicted-value clutter */}
        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
            LABELS &middot; 0 OR 1
          </text>
          <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            predict ŷ ∈ ℝ ?
          </text>
        </g>

        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE LINE OVERSHOOTS BOTH WAYS
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0a &mdash; A line tries to predict a label
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  // A nice smooth sigmoid surface, rendered as a colour-graded band along the
  // diagonal: blue below, white at p=0.5, red above. We use a simple linear
  // gradient angled to match the data's separation.
  const gradId = 'classify-gradient'
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A title card framing the chapter's question. We want to give every point a probability — a number between zero and one — that smoothly traverses from the blue side to the red side instead of jumping at a hard line."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Title card for the chapter. A smooth probability gradient sweeps from blue at the bottom-left to red at the top-right, illustrating the goal of mapping each point to a probability."
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-graph-ink)" stopOpacity="0.18" />
            <stop offset="50%" stopColor="var(--color-cream)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--color-vermilion)" stopOpacity="0.20" />
          </linearGradient>
        </defs>

        {/* Frame */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* Soft gradient as the conceptual surface */}
        <rect
          x="60"
          y="60"
          width={VIEW_W - 120}
          height={VIEW_H - 120}
          fill={`url(#${gradId})`}
        />

        <text
          x={VIEW_W / 2}
          y="100"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE CLASSIFICATION PROBLEM
        </text>

        <text
          x={VIEW_W / 2}
          y="160"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="18"
          fill="var(--color-ink)"
        >
          Each point is one thing or the other.
        </text>
        <text
          x={VIEW_W / 2}
          y="186"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="18"
          fill="var(--color-ink)"
        >
          The labels are 0 and 1.
        </text>

        <text
          x={VIEW_W / 2}
          y="240"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-dim)"
        >
          But we don&rsquo;t want to commit too early.
        </text>

        <text
          x={VIEW_W / 2}
          y="280"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="18"
          fill="var(--color-vermilion)"
        >
          We want a probability.
        </text>

        <line
          x1={VIEW_W / 2 - 60}
          y1="318"
          x2={VIEW_W / 2 + 60}
          y2="318"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="356"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          A number in [0, 1] that says
        </text>
        <text
          x={VIEW_W / 2}
          y="376"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          how confidently this point is red.
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 56}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          ENTER &middot; THE LOGISTIC FUNCTION
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0b &mdash; The chapter&rsquo;s aim, in one sentence
      </figcaption>
    </figure>
  )
}
