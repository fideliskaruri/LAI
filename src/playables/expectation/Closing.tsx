import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Closing thread for the Expectation chapter. On the left, the six-bar
 * histogram from the rest of the chapter (a fair die). An arrow points
 * right to a continuous Gaussian bell curve, sketched in the same vermilion.
 * The visual handoff: discrete distributions are about to become continuous,
 * and the same μ and σ will keep meaning what they meant here.
 *
 * Static — no interaction. The teaching is the prose; the canvas is the
 * baton-pass.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

// Left: histogram
const HIST_LEFT = 60
const HIST_BOTTOM = 320
const HIST_W = 200
const HIST_BAR_H = 110
const N = 6
const COL_W = HIST_W / N

// Right: bell curve
const BELL_LEFT = 340
const BELL_RIGHT = 560
const BELL_BOTTOM = 320
const BELL_W = BELL_RIGHT - BELL_LEFT
const BELL_PEAK_H = 130

// Sample the bell-curve path: standard normal, x in roughly [-3, 3], mapped
// to the [BELL_LEFT, BELL_RIGHT] range.
function bellPath(): string {
  const pts: string[] = []
  const samples = 64
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const xStd = -3 + 6 * t // standard-normal x
    const y = Math.exp(-(xStd * xStd) / 2) // unnormalised pdf
    const px = BELL_LEFT + t * BELL_W
    const py = BELL_BOTTOM - y * BELL_PEAK_H
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')}`
}

function bellFillPath(): string {
  const linePath = bellPath()
  return `${linePath} L ${BELL_RIGHT},${BELL_BOTTOM} L ${BELL_LEFT},${BELL_BOTTOM} Z`
}

export function Closing() {
  const barH = (i: number) => {
    // Same fair-die distribution as the other acts — all six bars equal.
    void i
    return (1 / N) * HIST_BAR_H * N * 0.5
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="On the left, the discrete six-bar histogram of a fair die — all bars equal. An arrow points right to a continuous bell curve. The two share their mean and standard deviation as labels, hinting that the next chapter will swap bars for curves without changing what μ and σ mean."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Closing figure: a discrete six-bar histogram on the left morphs into a continuous bell curve on the right, the bridge from Expectation to Distributions."
      >
        <g aria-hidden="true" data-origin-x={ORIGIN_X} data-origin-y={ORIGIN_Y} data-unit={UNIT} />

        {/* Headline */}
        <text
          x={VIEW_W / 2}
          y={56}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          discrete → continuous
        </text>

        {/* Left histogram */}
        <g>
          <text
            x={HIST_LEFT}
            y={HIST_BOTTOM - HIST_BAR_H - 18}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            DISCRETE — A DIE
          </text>
          <line
            x1={HIST_LEFT}
            y1={HIST_BOTTOM}
            x2={HIST_LEFT + HIST_W}
            y2={HIST_BOTTOM}
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
          />
          {Array.from({ length: N }, (_, i) => {
            const x = HIST_LEFT + i * COL_W
            const h = barH(i)
            return (
              <g key={i}>
                <rect
                  x={x + 3}
                  y={HIST_BOTTOM - h}
                  width={COL_W - 6}
                  height={h}
                  fill="var(--color-ink)"
                  fillOpacity="0.7"
                />
                <text
                  x={x + COL_W / 2}
                  y={HIST_BOTTOM + 14}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="10"
                  fill="var(--color-dim)"
                >
                  {i + 1}
                </text>
              </g>
            )
          })}
          {/* μ marker */}
          <line
            x1={HIST_LEFT + (3.5 / N) * HIST_W}
            y1={HIST_BOTTOM - HIST_BAR_H - 4}
            x2={HIST_LEFT + (3.5 / N) * HIST_W}
            y2={HIST_BOTTOM + 8}
            stroke="var(--color-vermilion)"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          <text
            x={HIST_LEFT + (3.5 / N) * HIST_W}
            y={HIST_BOTTOM + 30}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-vermilion)"
          >
            μ = 3.5
          </text>
        </g>

        {/* Arrow */}
        <line
          x1={HIST_LEFT + HIST_W + 16}
          y1={HIST_BOTTOM - HIST_BAR_H / 2}
          x2={BELL_LEFT - 16}
          y2={HIST_BOTTOM - HIST_BAR_H / 2}
          stroke="var(--color-vermilion)"
          strokeWidth="1.5"
        />
        <polygon
          points={`${BELL_LEFT - 16},${HIST_BOTTOM - HIST_BAR_H / 2} ${BELL_LEFT - 24},${HIST_BOTTOM - HIST_BAR_H / 2 - 5} ${BELL_LEFT - 24},${HIST_BOTTOM - HIST_BAR_H / 2 + 5}`}
          fill="var(--color-vermilion)"
        />
        <text
          x={(HIST_LEFT + HIST_W + BELL_LEFT) / 2}
          y={HIST_BOTTOM - HIST_BAR_H / 2 - 12}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          BARS → CURVE
        </text>

        {/* Right bell curve */}
        <g>
          <text
            x={BELL_LEFT}
            y={HIST_BOTTOM - HIST_BAR_H - 18}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            CONTINUOUS — A DISTRIBUTION
          </text>
          <line
            x1={BELL_LEFT}
            y1={BELL_BOTTOM}
            x2={BELL_RIGHT}
            y2={BELL_BOTTOM}
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
          />
          {/* Bell curve fill */}
          <path d={bellFillPath()} fill="var(--color-vermilion)" fillOpacity="0.10" />
          {/* Bell curve outline */}
          <path d={bellPath()} fill="none" stroke="var(--color-vermilion)" strokeWidth="1.5" />
          {/* μ marker */}
          <line
            x1={(BELL_LEFT + BELL_RIGHT) / 2}
            y1={BELL_BOTTOM - BELL_PEAK_H - 4}
            x2={(BELL_LEFT + BELL_RIGHT) / 2}
            y2={BELL_BOTTOM + 8}
            stroke="var(--color-vermilion)"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          <text
            x={(BELL_LEFT + BELL_RIGHT) / 2}
            y={BELL_BOTTOM + 30}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-vermilion)"
          >
            μ
          </text>
          {/* σ braces — under the curve, ± 1σ from the mean (at x = ±1 stdev) */}
          {(() => {
            const sigmaX = BELL_LEFT + (4 / 6) * BELL_W - BELL_LEFT + BELL_LEFT // i.e. 1 std east of mean
            const mid = (BELL_LEFT + BELL_RIGHT) / 2
            const stepX = BELL_W / 6 // 1σ = 1/6 of the displayed range
            return (
              <>
                <line
                  x1={mid - stepX}
                  y1={BELL_BOTTOM + 44}
                  x2={mid + stepX}
                  y2={BELL_BOTTOM + 44}
                  stroke="var(--color-vermilion)"
                  strokeWidth="1"
                />
                <line x1={mid - stepX} y1={BELL_BOTTOM + 40} x2={mid - stepX} y2={BELL_BOTTOM + 48} stroke="var(--color-vermilion)" strokeWidth="1" />
                <line x1={mid + stepX} y1={BELL_BOTTOM + 40} x2={mid + stepX} y2={BELL_BOTTOM + 48} stroke="var(--color-vermilion)" strokeWidth="1" />
                <text x={mid} y={BELL_BOTTOM + 62} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-vermilion)">
                  ± σ
                </text>
                {/* Suppress unused var lint by referencing sigmaX */}
                <g data-sigma-x={sigmaX} />
              </>
            )
          })()}
        </g>

        {/* Bottom sentence */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 50}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          Next: when the bars become a curve.
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6 — From histogram to distribution
      </figcaption>
    </figure>
  )
}
