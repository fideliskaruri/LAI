import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { PlotAxes, ScatterDots } from './Axes'
import { POINTS, VIEW_W, VIEW_H, PLOT_X0, PLOT_X1, PLOT_Y0, PLOT_Y1 } from './dataset'

/**
 * Act 2 — the data.
 *
 *  Left  : scatter of twelve (height, weight) points + a faint fit-line
 *          placeholder (no slope yet, just a horizontal hint at the mean).
 *  Right : an empty residual-panel placeholder, framed but unpopulated.
 *
 * No interaction. The point of this act is to set up "we have data; we want
 * a line." The next act lets the reader push one around.
 */

export function LeftPane() {
  // Mean of y for the faint horizontal hint
  const ybar = POINTS.reduce((s, p) => s + p.y, 0) / POINTS.length
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A scatter plot of twelve points relating a person's height to their weight. The data trends upward — taller people weigh more — but with scatter. A faint horizontal line marks the average weight."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Scatter plot of twelve height-versus-weight points. The trend is positive but noisy. A faint horizontal line marks the mean weight as a placeholder for the not-yet-chosen fit."
      >
        <PlotAxes xLabel="Height" yLabel="Weight" />
        <ScatterDots pts={POINTS} />
        {/* Mean-of-y placeholder */}
        <line
          x1={PLOT_X0}
          y1={meanY(ybar)}
          x2={PLOT_X1}
          y2={meanY(ybar)}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
          strokeDasharray="2 5"
          strokeOpacity="0.45"
        />
        <text
          x={PLOT_X1 - 6}
          y={meanY(ybar) - 6}
          textAnchor="end"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-dim)"
        >
          mean
        </text>
        <text
          x={PLOT_X0 + 12}
          y={PLOT_Y0 + 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DATA
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1a &mdash; Twelve people, two measurements each
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="An empty residual panel — a framed region waiting for a fit line to be chosen so its gaps to the data can be drawn here."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="An empty residual panel. Awaiting a fit line."
      >
        {/* Frame */}
        <rect
          x={PLOT_X0}
          y={PLOT_Y0}
          width={PLOT_X1 - PLOT_X0}
          height={PLOT_Y1 - PLOT_Y0}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <text
          x={(PLOT_X0 + PLOT_X1) / 2}
          y={(PLOT_Y0 + PLOT_Y1) / 2}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-fade)"
        >
          (no line chosen yet)
        </text>
        <text
          x={PLOT_X0 + 12}
          y={PLOT_Y0 + 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          RESIDUALS
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1b &mdash; The gap panel, empty for now
      </figcaption>
    </figure>
  )
}

function meanY(y: number) {
  // Inline copy of dataToSvgY so we don't import it just for this line
  const PLOT_H = PLOT_Y1 - PLOT_Y0
  return PLOT_Y1 - (y / 40) * PLOT_H
}
