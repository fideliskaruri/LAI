import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { PlotAxes, ScatterDots } from './Axes'
import {
  POINTS,
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
  OLS,
  sse,
} from './dataset'

/**
 * Act 7 — Normal equations.
 *
 *  Left  : the same scatter, but with the *closed-form* best-fit line drawn
 *          in vermilion. A small footer reports β₀ and β₁, the residual sum,
 *          and the SSE.
 *
 *  Right : a "worked symbolic block" with the design matrix X, the response
 *          vector y, and the closed-form solution β = (XᵀX)⁻¹ Xᵀ y, with
 *          the actual numerical values filled in. No interaction; this is a
 *          card the reader stops in front of.
 *
 * The teaching beat: the parabola from act 6 had a unique minimum because
 * SSE is a quadratic in β. Setting d/dβ = 0 gives a linear system; the
 * linear system has a closed-form solution. The same idea generalises to
 * many features and that's where the matrix formula lives.
 */

const fmt2 = (n: number) => n.toFixed(2)
const fmt1 = (n: number) => n.toFixed(1)

export function LeftPane() {
  const yL = OLS.slope * X_MIN + OLS.intercept
  const yR = OLS.slope * X_MAX + OLS.intercept
  const finalSSE = sse(OLS.slope, OLS.intercept)
  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The best-fit line by least squares: slope ${fmt2(OLS.slope)}, intercept ${fmt1(OLS.intercept)}. Sum of squared residuals is ${fmt1(finalSSE)}, the smallest it can be for this dataset.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`The best-fit line by least squares. Slope ${fmt2(OLS.slope)}, intercept ${fmt1(OLS.intercept)}.`}
      >
        <PlotAxes xLabel="Height" yLabel="Weight" />
        <ScatterDots pts={POINTS} />

        {/* Residual hints — pale ink */}
        {POINTS.map((p, i) => {
          const yHat = OLS.slope * p.x + OLS.intercept
          return (
            <line
              key={i}
              x1={dataToSvgX(p.x)}
              y1={dataToSvgY(p.y)}
              x2={dataToSvgX(p.x)}
              y2={dataToSvgY(yHat)}
              stroke="var(--color-graph-ink)"
              strokeOpacity="0.25"
              strokeWidth="1"
            />
          )
        })}

        {/* Best-fit line — solid vermilion */}
        <line
          x1={dataToSvgX(X_MIN)}
          y1={dataToSvgY(yL)}
          x2={dataToSvgX(X_MAX)}
          y2={dataToSvgY(yR)}
          stroke="var(--color-vermilion)"
          strokeWidth="2.6"
        />

        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-vermilion)">
            BEST FIT &middot; OLS
          </text>
          <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            β₀ = {fmt2(OLS.intercept)}
          </text>
          <text y="38" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            β₁ = {fmt2(OLS.slope)}
          </text>
          <text y="56" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
            SSE = {fmt1(finalSSE)}
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6a &mdash; The best line the formula spits out
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  // Build short numerical X, y for display: just first 5 rows + ⋮ + last row
  const sampleRows = POINTS.slice(0, 5).map((p) => [1, p.x, p.y] as const)
  const lastRow = POINTS[POINTS.length - 1]
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A worked block showing the closed-form least-squares solution: β equals X-transpose-X-inverse times X-transpose-y. The matrices X and y are written out for the height-weight dataset; the resulting β values match the line on the left."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Closed-form solution card. Beta equals X-transpose-X inverse times X-transpose-y."
      >
        {/* Card frame */}
        <rect
          x={PLOT_X0}
          y={PLOT_Y0}
          width={PLOT_X1 - PLOT_X0}
          height={PLOT_Y1 - PLOT_Y0}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x={PLOT_X0 + 18}
          y={PLOT_Y0 + 28}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          NORMAL EQUATIONS
        </text>

        {/* Headline equation */}
        <text
          x={(PLOT_X0 + PLOT_X1) / 2}
          y={PLOT_Y0 + 76}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="26"
          fill="var(--color-vermilion)"
        >
          β = ( X
          <tspan baselineShift="super" fontSize="14">
            T
          </tspan>
          X )
          <tspan baselineShift="super" fontSize="14">
            −1
          </tspan>{' '}
          X
          <tspan baselineShift="super" fontSize="14">
            T
          </tspan>{' '}
          y
        </text>

        {/* Pieces */}
        <text
          x={PLOT_X0 + 56}
          y={PLOT_Y0 + 120}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          X (design)
        </text>
        <BracketMatrix
          x={PLOT_X0 + 56}
          y={PLOT_Y0 + 132}
          rows={sampleRows.map((r) => [r[0].toFixed(0), r[1].toFixed(0)])}
          tail
          lastRow={[1, lastRow.x].map((v) => v.toFixed(0))}
        />

        <text
          x={PLOT_X0 + 208}
          y={PLOT_Y0 + 120}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          y (response)
        </text>
        <BracketMatrix
          x={PLOT_X0 + 208}
          y={PLOT_Y0 + 132}
          rows={POINTS.slice(0, 5).map((p) => [p.y.toFixed(0)])}
          tail
          lastRow={[lastRow.y.toFixed(0)]}
        />

        {/* Right-hand block: β values from the formula */}
        <text
          x={PLOT_X0 + 320}
          y={PLOT_Y0 + 120}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          β (solution)
        </text>
        <BracketMatrix
          x={PLOT_X0 + 320}
          y={PLOT_Y0 + 132}
          rows={[[fmt2(OLS.intercept)], [fmt2(OLS.slope)]]}
          colour="var(--color-vermilion)"
        />

        {/* Why this exists */}
        <text
          x={PLOT_X0 + 18}
          y={PLOT_Y1 - 64}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          Set ∂SSE/∂β = 0. Solve. That&apos;s the whole story.
        </text>
        <text
          x={PLOT_X0 + 18}
          y={PLOT_Y1 - 40}
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="12"
          fill="var(--color-dim)"
        >
          A linear loss curve has a unique minimum, and we can write it down.
        </text>

        {/* Tiny tag-row of MML reference */}
        <text
          x={PLOT_X1 - 16}
          y={PLOT_Y1 - 16}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          MML §9.2.1
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6b &mdash; The closed form, with this chapter&rsquo;s twelve points plugged in
      </figcaption>
    </figure>
  )
}

interface MatProps {
  x: number
  y: number
  rows: string[][]
  tail?: boolean
  lastRow?: string[]
  colour?: string
}

function BracketMatrix({ x, y, rows, tail = false, lastRow, colour = 'var(--color-ink)' }: MatProps) {
  const cols = rows[0]?.length ?? 1
  const cellW = 30
  const cellH = 18
  const totalRows = rows.length + (tail ? 2 : 0)
  const w = cols * cellW + 16
  const h = totalRows * cellH + 8
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Bracket left */}
      <path
        d={`M 5 4 L 0 4 L 0 ${h - 4} L 5 ${h - 4}`}
        fill="none"
        stroke={colour}
        strokeWidth="1.2"
      />
      {/* Bracket right */}
      <path
        d={`M ${w - 5} 4 L ${w} 4 L ${w} ${h - 4} L ${w - 5} ${h - 4}`}
        fill="none"
        stroke={colour}
        strokeWidth="1.2"
      />
      {rows.map((r, ri) =>
        r.map((v, ci) => (
          <text
            key={`${ri}-${ci}`}
            x={8 + ci * cellW + cellW / 2}
            y={cellH + ri * cellH + 2}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill={colour}
          >
            {v}
          </text>
        )),
      )}
      {tail && (
        <>
          <text
            x={w / 2}
            y={cellH + rows.length * cellH + 2}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-dim)"
          >
            ⋮
          </text>
          {lastRow?.map((v, ci) => (
            <text
              key={`last-${ci}`}
              x={8 + ci * cellW + cellW / 2}
              y={cellH + (rows.length + 1) * cellH + 2}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="11"
              fill={colour}
            >
              {v}
            </text>
          ))}
        </>
      )}
    </g>
  )
}
