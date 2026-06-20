import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Closing thread for Probability — sample space on the left dissolves into
 * an "expectation" teaser on the right: a weighted average bar over six
 * possible outcomes, with the average marked by a vermilion ruler. Static,
 * no interaction. The teaching is the *handoff* — probabilities ask which
 * outcomes happen; expectation asks how much, on average, they pay.
 */
export function ClosingThread() {
  // The six outcomes of a single die — each weighted equally (1/6) — with
  // their *value* shown above the bars and the average (3.5) marked.
  const die = [1, 2, 3, 4, 5, 6]
  const W = 600
  const H = 480

  // Tiny sample-space grid on the left (the same 6x6 grid, miniaturized)
  const MINI_CELL = 18
  const MINI_LEFT = 50
  const MINI_TOP = 110

  // Bar chart on the right
  const BAR_LEFT = 360
  const BAR_TOP = 220
  const BAR_W = 220
  const BAR_H = 110
  const colW = BAR_W / 6
  // The "value" of each outcome scales the bar height. Use a fixed scale so
  // bars are visually balanced.
  const maxValue = 6
  const barHeight = (v: number) => (v / maxValue) * BAR_H

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="On the left, the 6×6 sample space of two dice — small and dim. An arrow points right to a bar chart of one die's six outcomes, with a vermilion ruler at value 3.5: the expected value. The thread: probabilities tell us which outcomes happen; expectation asks, on average, what do they give us?"
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="The closing figure: a miniature sample space on the left, an arrow to a weighted-average bar chart on the right with the expected value 3.5 marked in vermilion."
      >
        {/* Headline */}
        <text
          x={W / 2}
          y={52}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          on average, what?
        </text>

        {/* Left: mini sample space (6×6) */}
        <g transform={`translate(${MINI_LEFT}, ${MINI_TOP})`}>
          {[1, 2, 3, 4, 5, 6].map((d1) =>
            [1, 2, 3, 4, 5, 6].map((d2) => {
              const seven = d1 + d2 === 7
              return (
                <rect
                  key={`${d1}-${d2}`}
                  x={(d1 - 1) * MINI_CELL}
                  y={(d2 - 1) * MINI_CELL}
                  width={MINI_CELL - 2}
                  height={MINI_CELL - 2}
                  fill={seven ? 'var(--color-vermilion)' : 'transparent'}
                  fillOpacity={seven ? 0.25 : 0}
                  stroke={seven ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
                  strokeWidth="0.6"
                />
              )
            }),
          )}
          <text
            x={6 * MINI_CELL / 2}
            y={6 * MINI_CELL + 18}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            SAMPLE SPACE
          </text>
        </g>

        {/* Arrow */}
        <line
          x1="200"
          y1={MINI_TOP + 3 * MINI_CELL}
          x2="340"
          y2={MINI_TOP + 3 * MINI_CELL}
          stroke="var(--color-vermilion)"
          strokeWidth="1.5"
        />
        <polygon
          points={`340,${MINI_TOP + 3 * MINI_CELL} 332,${MINI_TOP + 3 * MINI_CELL - 5} 332,${MINI_TOP + 3 * MINI_CELL + 5}`}
          fill="var(--color-vermilion)"
        />
        <text
          x="270"
          y={MINI_TOP + 3 * MINI_CELL - 12}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          WEIGHTED AVERAGE
        </text>

        {/* Right: bar chart for one die */}
        <g>
          <text
            x={BAR_LEFT}
            y={BAR_TOP - 30}
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            ONE DIE — OUTCOMES & PROBABILITIES
          </text>

          {die.map((v, i) => {
            const x = BAR_LEFT + i * colW
            const h = barHeight(v)
            return (
              <g key={v}>
                <rect
                  x={x + 2}
                  y={BAR_TOP + BAR_H - h}
                  width={colW - 4}
                  height={h}
                  fill="var(--color-ink)"
                  fillOpacity="0.7"
                />
                <text
                  x={x + colW / 2}
                  y={BAR_TOP + BAR_H + 14}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="11"
                  fill="var(--color-dim)"
                >
                  {v}
                </text>
                <text
                  x={x + colW / 2}
                  y={BAR_TOP + BAR_H + 28}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9"
                  fill="var(--color-dim)"
                >
                  1/6
                </text>
              </g>
            )
          })}

          {/* Expected-value ruler at x = 3.5 of the die scale */}
          <line
            x1={BAR_LEFT + (3.5 - 0.5) * colW}
            y1={BAR_TOP - 8}
            x2={BAR_LEFT + (3.5 - 0.5) * colW}
            y2={BAR_TOP + BAR_H + 8}
            stroke="var(--color-vermilion)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text
            x={BAR_LEFT + (3.5 - 0.5) * colW}
            y={BAR_TOP - 12}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fontWeight="600"
            fill="var(--color-vermilion)"
          >
            E[X] = 3.5
          </text>
        </g>

        {/* Bottom sentence */}
        <text
          x={W / 2}
          y={H - 50}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          Next we ask: on average, what?
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7 — Sample space → expectation
      </figcaption>
    </figure>
  )
}
