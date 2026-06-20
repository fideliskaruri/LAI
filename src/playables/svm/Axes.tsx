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
  classColor,
  type Pt,
} from './dataset'

/**
 * Plot axes for the SVM chapter. Same austere monospace look as the linear
 * regression chapter — sibling visual family. Feature 1 vs feature 2.
 */
export function PlotAxes({
  xLabel = 'Feature 1',
  yLabel = 'Feature 2',
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
          x={PLOT_X0 - 40}
          y={(PLOT_Y0 + PLOT_Y1) / 2}
          transform={`rotate(-90, ${PLOT_X0 - 40}, ${(PLOT_Y0 + PLOT_Y1) / 2})`}
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

/** Class-colored scatter — vermilion circles for +1, ink crosses for −1.
 *  Two glyph types so the chapter is legible without color too. */
export function ClassScatter({
  pts,
  fade = 1,
  highlight,
}: {
  pts: Pt[]
  /** 0..1 fade for non-support points; useful when the support vectors are
   *  drawn separately on top. */
  fade?: number
  /** If provided, points in this set are not rendered (so the caller can draw
   *  them with a different style — e.g. ringed as support vectors). */
  highlight?: Set<number>
}) {
  return (
    <g>
      {pts.map((p, i) => {
        if (highlight?.has(i)) return null
        const cx = dataToSvgX(p.x)
        const cy = dataToSvgY(p.y)
        if (p.label === 1) {
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="5"
              fill={classColor(1)}
              fillOpacity={0.85 * fade}
            />
          )
        }
        // −1: an X glyph so the chapter is legible without color.
        const r = 5
        return (
          <g key={i} opacity={fade}>
            <line
              x1={cx - r}
              y1={cy - r}
              x2={cx + r}
              y2={cy + r}
              stroke={classColor(-1)}
              strokeWidth="1.8"
            />
            <line
              x1={cx - r}
              y1={cy + r}
              x2={cx + r}
              y2={cy - r}
              stroke={classColor(-1)}
              strokeWidth="1.8"
            />
          </g>
        )
      })}
    </g>
  )
}

/** A small legend chip. */
export function ClassLegend({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="6" cy="6" r="5" fill={classColor(1)} fillOpacity="0.85" />
      <text
        x="18"
        y="10"
        fontFamily="JetBrains Mono, monospace"
        fontSize="11"
        fill="var(--color-dim)"
      >
        y = +1
      </text>
      <g transform="translate(78, 6)">
        <line x1="-5" y1="-5" x2="5" y2="5" stroke={classColor(-1)} strokeWidth="1.8" />
        <line x1="-5" y1="5" x2="5" y2="-5" stroke={classColor(-1)} strokeWidth="1.8" />
      </g>
      <text
        x="92"
        y="10"
        fontFamily="JetBrains Mono, monospace"
        fontSize="11"
        fill="var(--color-dim)"
      >
        y = −1
      </text>
    </g>
  )
}
