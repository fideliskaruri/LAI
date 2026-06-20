import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * The question, sharper. f(x) = x² on [0, 3]. A vermilion-ruled region
 * under the curve labelled "what's the area?"
 *
 * Static. No interaction. Sets up Riemann sums in the next act.
 */

const VIEW_W = 600
const VIEW_H = 480

const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

// We want f(x) = x² on [0, 3]. To keep the picture readable we shift the
// origin to the lower-left of the visible region rather than the centre.
const PLOT_ORIGIN_X = 110
const PLOT_ORIGIN_Y = 400

const X_MIN = 0
const X_MAX = 3
const Y_MAX = 9.5

const X_UNIT = 110
const Y_UNIT = 36

const f = (x: number) => x * x

function toPx(x: number, y: number) {
  return {
    px: PLOT_ORIGIN_X + x * X_UNIT,
    py: PLOT_ORIGIN_Y - y * Y_UNIT,
  }
}

function curvePath() {
  const steps = 140
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / steps
    const y = f(x)
    const { px, py } = toPx(x, y)
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return pts.join(' ')
}

function regionPath() {
  // Closed path: from (0, 0) along the curve to (3, 9) then down to (3, 0)
  // and back to origin. Vermilion fill at low opacity.
  const steps = 140
  const top: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / steps
    const y = f(x)
    const { px, py } = toPx(x, y)
    top.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  const { px: rx, py: ry0 } = toPx(X_MAX, 0)
  const { px: lx } = toPx(X_MIN, 0)
  top.push(`L${rx.toFixed(1)},${ry0.toFixed(1)}`)
  top.push(`L${lx.toFixed(1)},${ry0.toFixed(1)}`)
  top.push('Z')
  return top.join(' ')
}

export function AreaUnderCurve() {
  // Suppress unused-import lint by referencing UNIT/ORIGIN_X — the chapter
  // contract specifies these constants live in every playable.
  void UNIT
  void ORIGIN_X
  void ORIGIN_Y

  const xTicks = [0, 1, 2, 3]
  const yTicks = [0, 2, 4, 6, 8]

  // The true area, for the watermark in the corner: ∫₀³ x² dx = 9
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A still drawing of f of x equals x squared on the interval from zero to three. The region under the curve is shaded vermilion and labelled: what is the area? The question this chapter sets out to answer."
        priority="high"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A parabola f of x equals x squared plotted from zero to three, with the region between the curve and the x-axis shaded vermilion. A handwritten label asks: what is the area?"
      >
        <Grid />

        {/* Filled region under the curve — vermilion at low opacity */}
        <path
          d={regionPath()}
          fill="var(--color-vermilion)"
          fillOpacity="0.18"
          stroke="none"
        />

        {/* Axes */}
        <line
          x1={toPx(X_MIN, 0).px - 10}
          y1={toPx(X_MIN, 0).py}
          x2={toPx(X_MAX, 0).px + 30}
          y2={toPx(X_MIN, 0).py}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />
        <line
          x1={toPx(X_MIN, 0).px}
          y1={toPx(X_MIN, 0).py + 10}
          x2={toPx(X_MIN, 0).px}
          y2={toPx(0, Y_MAX).py - 8}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />

        {/* x-axis ticks */}
        {xTicks.map((tx) => {
          const { px, py } = toPx(tx, 0)
          return (
            <g key={`xt-${tx}`}>
              <line x1={px} y1={py - 3} x2={px} y2={py + 3} stroke="var(--color-graph-ink)" strokeWidth="1" />
              <text
                x={px}
                y={py + 16}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-dim)"
              >
                {tx}
              </text>
            </g>
          )
        })}
        {/* y-axis ticks */}
        {yTicks.map((ty) => {
          const { px, py } = toPx(0, ty)
          return (
            <g key={`yt-${ty}`}>
              <line x1={px - 3} y1={py} x2={px + 3} y2={py} stroke="var(--color-graph-ink)" strokeWidth="1" />
              <text
                x={px - 8}
                y={py + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-dim)"
              >
                {ty}
              </text>
            </g>
          )
        })}

        {/* Axis labels */}
        <text
          x={toPx(X_MAX, 0).px + 22}
          y={toPx(X_MIN, 0).py + 4}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-graph-ink)"
        >
          x
        </text>
        <text
          x={toPx(0, 0).px + 8}
          y={toPx(0, Y_MAX).py - 2}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-graph-ink)"
        >
          f(x)
        </text>

        {/* The curve itself */}
        <path
          d={curvePath()}
          fill="none"
          stroke="var(--color-vermilion)"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />

        {/* Curve label */}
        <text
          x={toPx(2.5, f(2.5)).px + 14}
          y={toPx(2.5, f(2.5)).py - 4}
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-vermilion)"
        >
          f(x) = x&sup2;
        </text>

        {/* Handwritten-feel arrow + label pointing into the region */}
        <g>
          <path
            d={`M ${VIEW_W - 130} 220 Q ${VIEW_W - 200} 280 ${toPx(1.6, 1.6).px} ${toPx(1.6, 1.6).py - 8}`}
            fill="none"
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
            strokeOpacity="0.6"
            strokeDasharray="3 4"
          />
          <polygon
            points={`${toPx(1.6, 1.6).px},${toPx(1.6, 1.6).py - 6} ${toPx(1.6, 1.6).px - 6},${toPx(1.6, 1.6).py - 14} ${toPx(1.6, 1.6).px + 4},${toPx(1.6, 1.6).py - 16}`}
            fill="var(--color-graph-ink)"
            fillOpacity="0.6"
          />
          <text
            x={VIEW_W - 50}
            y={210}
            textAnchor="end"
            fontFamily="Georgia, serif"
            fontStyle="italic"
            fontSize="18"
            fill="var(--color-ink)"
          >
            what&rsquo;s the area?
          </text>
          <text
            x={VIEW_W - 50}
            y={230}
            textAnchor="end"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            FROM x = 0 TO x = 3
          </text>
        </g>

        {/* Header */}
        <text x="62" y={50} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          THE QUESTION, SHARPER
        </text>
        <text x="62" y={70} fontFamily="Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-ink)">
          A curve. An interval. A region. A number.
        </text>

        {/* Footer */}
        <text
          x="62"
          y={VIEW_H - 28}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          NO FORMULA YET  &middot;  ONLY THE THING WE&rsquo;RE AFTER
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1 &mdash; The question we are about to answer.
      </figcaption>
    </figure>
  )
}

function Grid() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => {
        const { px } = toPx(i, 0)
        const { py: yTop } = toPx(0, Y_MAX)
        const { py: yBot } = toPx(0, 0)
        return (
          <line key={`gv-${i}`} x1={px} y1={yTop} x2={px} y2={yBot} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
      {Array.from({ length: 6 }, (_, i) => {
        const yv = i * 2
        const { px: xL } = toPx(X_MIN, 0)
        const { px: xR } = toPx(X_MAX, 0)
        const { py } = toPx(0, yv)
        return (
          <line key={`gh-${i}`} x1={xL} y1={py} x2={xR} y2={py} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
    </>
  )
}
