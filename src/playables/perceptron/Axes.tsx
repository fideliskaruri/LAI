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
  type LabeledPt,
} from './dataset'

/**
 * Axes for the [−1, 1]² feature space. We draw a centred origin cross
 * (since 0 is interior to the range) plus the bounding rectangle that
 * delimits the plot. JetBrains Mono ticks at −1, 0, +1 only — the
 * register here is "diagram", not "chart".
 */
export function PlotAxes({
  xLabel = 'x',
  yLabel = 'y',
}: {
  xLabel?: string
  yLabel?: string
}) {
  const ticks = [-1, -0.5, 0, 0.5, 1]
  const x0 = dataToSvgX(0)
  const y0 = dataToSvgY(0)
  return (
    <g>
      {/* Bounding rectangle */}
      <rect
        x={PLOT_X0}
        y={PLOT_Y0}
        width={PLOT_X1 - PLOT_X0}
        height={PLOT_Y1 - PLOT_Y0}
        fill="none"
        stroke="var(--color-graph-fade)"
        strokeWidth="1"
      />

      {/* Grid at half-units */}
      {ticks
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
      {ticks
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

      {/* Origin cross — thicker than grid, thinner than border */}
      <line
        x1={PLOT_X0}
        y1={y0}
        x2={PLOT_X1}
        y2={y0}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
      <line
        x1={x0}
        y1={PLOT_Y0}
        x2={x0}
        y2={PLOT_Y1}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />

      {/* Ticks */}
      {ticks.map((t) => (
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
      {ticks.map((t) => (
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
    </g>
  )
}

/**
 * Two-class scatter. Blue = ink, red = vermilion. `highlight` rings the
 * most recently updated-on point in the learning act; `misclass` rings
 * any point currently on the wrong side of the boundary.
 */
export function ClassScatter({
  pts,
  highlight,
  misclass,
}: {
  pts: LabeledPt[]
  highlight?: number | null
  misclass?: Set<number>
}) {
  return (
    <g>
      {pts.map((p, i) => {
        const color =
          p.y_label === 1 ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
        const cx = dataToSvgX(p.x)
        const cy = dataToSvgY(p.y)
        const isMis = misclass?.has(i) ?? false
        const isHi = highlight === i
        return (
          <g key={i}>
            {isMis && (
              <circle
                cx={cx}
                cy={cy}
                r="9"
                fill="none"
                stroke={color}
                strokeWidth="1"
                strokeDasharray="2 2"
                strokeOpacity="0.6"
              />
            )}
            {isHi && (
              <circle
                cx={cx}
                cy={cy}
                r="12"
                fill="none"
                stroke="var(--color-vermilion)"
                strokeWidth="1.5"
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r="5"
              fill={color}
              fillOpacity={p.y_label === 1 ? 0.9 : 0.85}
              stroke={color}
              strokeWidth="1"
            />
          </g>
        )
      })}
    </g>
  )
}
