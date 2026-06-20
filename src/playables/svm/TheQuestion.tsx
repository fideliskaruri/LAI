import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { PlotAxes, ClassScatter, ClassLegend } from './Axes'
import {
  SEPARABLE_POINTS,
  VIEW_W,
  VIEW_H,
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  X_MIN,
  X_MAX,
  dataToSvgX,
  dataToSvgY,
  marginWidth,
  MAX_MARGIN_WIDTH,
  type Line2D,
} from './dataset'

/**
 * Act 2 — three candidate separators, three different margins.
 *
 *   Left  : the separable scatter, with three candidate lines (A, B, C)
 *           drawn through the gap. C is the widest; A is the narrowest.
 *   Right : a bar chart of margin width. C is rendered in vermilion.
 *
 * Static. No interaction. The teaching is the comparison.
 */

// Three candidate lines through the gap. Hand-picked so the spread is visible.
// A is narrow (skims the lower cloud), B is medium, C is the wide max-margin
// answer (close to MAX_MARGIN_LINE).
const CANDIDATES: { id: 'A' | 'B' | 'C'; line: Line2D; label: string }[] = [
  { id: 'A', line: { yLeft: 12, yRight: 21 }, label: 'A — narrow' },
  { id: 'B', line: { yLeft: 24, yRight: 14 }, label: 'B — tilted' },
  { id: 'C', line: { yLeft: 17, yRight: 25 }, label: 'C — wide' },
]

export function LeftPane() {
  const margins = CANDIDATES.map((c) => ({
    id: c.id,
    margin: marginWidth(c.line, SEPARABLE_POINTS),
  }))
  const widestId = margins.reduce((b, c) => (c.margin > b.margin ? c : b)).id

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Two-class scatter — vermilion circles in the upper-right, ink crosses in the lower-left. Three candidate separating lines, labeled A, B and C, pass through the gap. Line ${widestId} has the widest margin and is highlighted.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Two-class scatter with three candidate separating lines. The line with the widest margin is line ${widestId}.`}
      >
        <PlotAxes />
        <ClassScatter pts={SEPARABLE_POINTS} />

        {CANDIDATES.map((c) => {
          const isWide = c.id === widestId
          return (
            <g key={c.id}>
              <line
                x1={dataToSvgX(X_MIN)}
                y1={dataToSvgY(c.line.yLeft)}
                x2={dataToSvgX(X_MAX)}
                y2={dataToSvgY(c.line.yRight)}
                stroke={isWide ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
                strokeWidth={isWide ? '2.4' : '1.4'}
                strokeOpacity={isWide ? 1 : 0.55}
              />
              {/* Label at the right edge */}
              <text
                x={dataToSvgX(X_MAX) + 6}
                y={dataToSvgY(c.line.yRight) + 4}
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill={isWide ? 'var(--color-vermilion)' : 'var(--color-dim)'}
              >
                {c.id}
              </text>
            </g>
          )
        })}

        <ClassLegend x={PLOT_X0 + 8} y={PLOT_Y0 + 8} />

        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THREE CANDIDATES THROUGH THE GAP
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1a &mdash; Three lines, all separators, all different
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  const margins = CANDIDATES.map((c) => ({
    id: c.id,
    margin: marginWidth(c.line, SEPARABLE_POINTS),
    label: c.label,
  }))
  const widest = margins.reduce((b, c) => (c.margin > b.margin ? c : b))

  // Bar chart layout
  const CHART_X0 = 120
  const CHART_X1 = VIEW_W - 80
  const CHART_W = CHART_X1 - CHART_X0
  const BAR_H = 36
  const BAR_GAP = 30
  const BAR_Y0 = 160

  // Scale so the widest bar fills about 90 percent of the chart width.
  const maxMargin = Math.max(...margins.map((m) => m.margin), MAX_MARGIN_WIDTH)
  const scale = (CHART_W * 0.92) / maxMargin

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Bar chart of margin widths for the three candidate lines. Line ${widest.id} is widest at ${widest.margin.toFixed(2)} units, drawn in vermilion. The narrower lines are drawn in ink.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Margin widths for the three candidates. ${margins
          .map((m) => `${m.id} equals ${m.margin.toFixed(2)}`)
          .join('. ')}.`}
      >
        <text
          x={VIEW_W / 2}
          y="56"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          MARGIN  ·  DISTANCE TO NEAREST POINT
        </text>
        <text
          x={VIEW_W / 2}
          y="80"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          Wider is more confident. Why?
        </text>

        {/* Axis baseline */}
        <line
          x1={CHART_X0}
          y1={BAR_Y0 + 3 * (BAR_H + BAR_GAP)}
          x2={CHART_X1}
          y2={BAR_Y0 + 3 * (BAR_H + BAR_GAP)}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />

        {margins.map((m, i) => {
          const isWide = m.id === widest.id
          const y = BAR_Y0 + i * (BAR_H + BAR_GAP)
          const w = m.margin * scale
          return (
            <g key={m.id}>
              {/* Label */}
              <text
                x={CHART_X0 - 14}
                y={y + BAR_H / 2 + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontSize="13"
                fill={isWide ? 'var(--color-vermilion)' : 'var(--color-ink)'}
                fontWeight={isWide ? 600 : 400}
              >
                {m.id}
              </text>
              {/* Bar */}
              <rect
                x={CHART_X0}
                y={y}
                width={w}
                height={BAR_H}
                fill={isWide ? 'var(--color-vermilion)' : 'var(--color-ink)'}
                fillOpacity={isWide ? 0.9 : 0.7}
              />
              {/* Numeric readout */}
              <text
                x={CHART_X0 + w + 8}
                y={y + BAR_H / 2 + 4}
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill={isWide ? 'var(--color-vermilion)' : 'var(--color-dim)'}
              >
                {m.margin.toFixed(2)}
              </text>
            </g>
          )
        })}

        <text
          x={CHART_X0 + CHART_W / 2}
          y={BAR_Y0 + 3 * (BAR_H + BAR_GAP) + 24}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          WIDTH IN FEATURE-SPACE UNITS
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 40}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          the SVM picks line {widest.id} — and only line {widest.id}
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1b &mdash; The width of the empty band
      </figcaption>
    </figure>
  )
}
