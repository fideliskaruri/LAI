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
  CLASS_COLORS,
  type LabeledPt,
  type MultiPt,
} from './dataset'

/**
 * Shared axes + light grid for the 2D panes in the Logistic Regression
 * chapter. Mirrors the Linear Regression chapter so the visual family reads
 * as one — JetBrains-Mono tick labels, a one-pixel ink axis, half-opacity
 * grid lines. (Cloned, not imported, so the two chapters can drift if needed
 * without breaking either.)
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

/** Two-class scatter — blue (class 0) and red (class 1). */
export function ClassScatter({
  pts,
  highlight,
  faded = false,
}: {
  pts: LabeledPt[]
  /** Indices of points to draw with an outer ring (e.g. misclassified). */
  highlight?: Set<number>
  /** Render dots in lighter outline form (acts that overlay other things). */
  faded?: boolean
}) {
  return (
    <g>
      {pts.map((p, i) => {
        const color = p.y_label === 1 ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
        const cx = dataToSvgX(p.x)
        const cy = dataToSvgY(p.y)
        const hl = highlight?.has(i) ?? false
        return (
          <g key={i}>
            {hl && (
              <circle
                cx={cx}
                cy={cy}
                r="10"
                fill="none"
                stroke="var(--color-vermilion)"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r="5"
              fill={faded ? 'none' : color}
              stroke={color}
              strokeWidth={faded ? 1.5 : 1}
              fillOpacity={faded ? 0 : p.y_label === 1 ? 0.9 : 0.85}
            />
          </g>
        )
      })}
    </g>
  )
}

/** Three-class scatter — blue, red, amber. */
export function MultiScatter({
  pts,
  focus,
  probeIndex,
}: {
  pts: MultiPt[]
  focus: 0 | 1 | 2
  probeIndex?: number | null
}) {
  return (
    <g>
      {pts.map((p, i) => {
        const color = CLASS_COLORS[p.y_label]
        const cx = dataToSvgX(p.x)
        const cy = dataToSvgY(p.y)
        const dim = p.y_label !== focus
        const isProbe = probeIndex === i
        return (
          <g key={i}>
            {isProbe && (
              <circle
                cx={cx}
                cy={cy}
                r="11"
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="1.5"
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r="5"
              fill={color}
              fillOpacity={dim ? 0.25 : 0.9}
              stroke={color}
              strokeWidth="1"
              strokeOpacity={dim ? 0.4 : 1}
            />
          </g>
        )
      })}
    </g>
  )
}
