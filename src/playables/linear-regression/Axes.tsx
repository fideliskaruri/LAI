import {
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  X_MIN,
  X_MAX,
  Y_MIN,
  Y_MAX,
  dataToSvgX,
  dataToSvgY,
} from './data'

/**
 * Shared axes + light grid for the 2D panes. The 2D look is intentionally
 * austere — JetBrains-Mono tick labels, a one-pixel ink axis, half-opacity
 * grid lines. Borrowed from the eigenvalues figures so the chapters read as
 * a single visual family.
 */
export function PlotAxes({
  xLabel,
  yLabel,
  ticksX = [0, 10, 20, 30, 40],
  ticksY = [0, 10, 20, 30, 40],
}: {
  xLabel?: string
  yLabel?: string
  ticksX?: number[]
  ticksY?: number[]
}) {
  return (
    <g>
      {/* Grid */}
      {ticksX
        .filter((t) => t > X_MIN && t < X_MAX)
        .map((t) => (
          <line
            key={`gx-${t}`}
            x1={dataToSvgX(t)}
            y1={PLOT_Y0}
            x2={dataToSvgX(t)}
            y2={PLOT_Y1}
            stroke="var(--color-graph-fade)"
            strokeWidth="0.5"
          />
        ))}
      {ticksY
        .filter((t) => t > Y_MIN && t < Y_MAX)
        .map((t) => (
          <line
            key={`gy-${t}`}
            x1={PLOT_X0}
            y1={dataToSvgY(t)}
            x2={PLOT_X1}
            y2={dataToSvgY(t)}
            stroke="var(--color-graph-fade)"
            strokeWidth="0.5"
          />
        ))}

      {/* Axes */}
      <line
        x1={PLOT_X0}
        y1={PLOT_Y1}
        x2={PLOT_X1}
        y2={PLOT_Y1}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
      <line
        x1={PLOT_X0}
        y1={PLOT_Y0}
        x2={PLOT_X0}
        y2={PLOT_Y1}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />

      {/* Ticks */}
      {ticksX.map((t) => (
        <g key={`tx-${t}`}>
          <line
            x1={dataToSvgX(t)}
            y1={PLOT_Y1}
            x2={dataToSvgX(t)}
            y2={PLOT_Y1 + 4}
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
          />
          <text
            x={dataToSvgX(t)}
            y={PLOT_Y1 + 18}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-dim)"
          >
            {t}
          </text>
        </g>
      ))}
      {ticksY.map((t) => (
        <g key={`ty-${t}`}>
          <line
            x1={PLOT_X0 - 4}
            y1={dataToSvgY(t)}
            x2={PLOT_X0}
            y2={dataToSvgY(t)}
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
          />
          <text
            x={PLOT_X0 - 8}
            y={dataToSvgY(t) + 3}
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-dim)"
          >
            {t}
          </text>
        </g>
      ))}

      {/* Axis labels */}
      {xLabel && (
        <text
          x={(PLOT_X0 + PLOT_X1) / 2}
          y={PLOT_Y1 + 40}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          {xLabel.toUpperCase()}
        </text>
      )}
      {yLabel && (
        <text
          x={PLOT_X0 - 44}
          y={(PLOT_Y0 + PLOT_Y1) / 2}
          transform={`rotate(-90, ${PLOT_X0 - 44}, ${(PLOT_Y0 + PLOT_Y1) / 2})`}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          {yLabel.toUpperCase()}
        </text>
      )}
    </g>
  )
}

/** Scatter dots — used by every act that shows the dataset. */
export function ScatterDots({ pts }: { pts: { x: number; y: number }[] }) {
  return (
    <g>
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={dataToSvgX(p.x)}
          cy={dataToSvgY(p.y)}
          r="4"
          fill="var(--color-ink)"
          fillOpacity="0.85"
        />
      ))}
    </g>
  )
}
