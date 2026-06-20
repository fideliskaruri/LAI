import { useCallback, useRef, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Sample-space act: the 36 outcomes of two six-sided dice, laid out as a
 * 6x6 grid. Outcomes summing to 7 (the long diagonal) glow vermilion; the
 * rest are ink. Click any cell to focus a single outcome; the cell pops and
 * the readout shows its two-die roll, its sum, and the running probability
 * of the "sum = 7" event.
 *
 * Keyboard: a single focus traversal across the grid; arrow keys move the
 * focused cell; Enter/Space selects.
 */

const VIEW_W = 600
const VIEW_H = 480
const GRID_LEFT = 90
const GRID_TOP = 50
const CELL = 56

function isSumSeven(d1: number, d2: number) {
  return d1 + d2 === 7
}

export function SampleSpace() {
  const containerRef = useRef<SVGGElement | null>(null)
  // Focused cell for keyboard nav.
  const [focusCell, setFocusCell] = useState<{ d1: number; d2: number }>({ d1: 4, d2: 3 })
  // Selected cell (click) — may be null at first.
  const [selected, setSelected] = useState<{ d1: number; d2: number } | null>(null)

  const handleNudge = useCallback((dx: number, dy: number) => {
    setFocusCell((c) => {
      const next = {
        d1: Math.max(1, Math.min(6, c.d1 + Math.sign(dx))),
        d2: Math.max(1, Math.min(6, c.d2 - Math.sign(dy))),
      }
      setSelected(next)
      return next
    })
  }, [])
  useKeyNudge(containerRef, handleNudge)

  const sevenCount = 6
  const total = 36
  const probSeven = sevenCount / total // 6/36 = 1/6 ≈ 0.167

  const sel = selected
  const narration = sel
    ? `You selected the outcome where the first die shows ${sel.d1} and the second die shows ${sel.d2}. Their sum is ${sel.d1 + sel.d2}. ${
        isSumSeven(sel.d1, sel.d2)
          ? 'This outcome is one of the six that sum to seven, highlighted in vermilion.'
          : 'This outcome does not sum to seven.'
      }`
    : 'A six by six grid of all thirty-six outcomes of rolling two dice. The six outcomes whose pips sum to seven sit on the long diagonal, highlighted in vermilion. Click any cell to focus a single outcome.'

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority={sel ? 'high' : 'normal'}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A six by six grid showing all thirty-six outcomes of rolling two six-sided dice. Cells whose pips sum to seven are highlighted in vermilion."
      >
        {/* Title strip */}
        <text
          x={GRID_LEFT - 28}
          y={GRID_TOP + 3 * CELL}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
          transform={`rotate(-90, ${GRID_LEFT - 28}, ${GRID_TOP + 3 * CELL})`}
        >
          SECOND DIE
        </text>
        <text
          x={GRID_LEFT + 3 * CELL}
          y={GRID_TOP - 18}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          FIRST DIE
        </text>

        {/* Column / row headers */}
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <text
            key={`col-${d}`}
            x={GRID_LEFT + (d - 1) * CELL + CELL / 2}
            y={GRID_TOP - 4}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill="var(--color-dim)"
          >
            {d}
          </text>
        ))}
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <text
            key={`row-${d}`}
            x={GRID_LEFT - 8}
            y={GRID_TOP + (d - 1) * CELL + CELL / 2 + 4}
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill="var(--color-dim)"
          >
            {d}
          </text>
        ))}

        {/* Cells */}
        <g ref={containerRef} tabIndex={0} role="grid" aria-label="Two-dice outcome grid" style={{ outline: 'none' }}>
          {[1, 2, 3, 4, 5, 6].map((d1) =>
            [1, 2, 3, 4, 5, 6].map((d2) => {
              const x = GRID_LEFT + (d1 - 1) * CELL
              const y = GRID_TOP + (d2 - 1) * CELL
              const seven = isSumSeven(d1, d2)
              const isSel = sel?.d1 === d1 && sel?.d2 === d2
              const isFocus = focusCell.d1 === d1 && focusCell.d2 === d2
              const fill = seven ? 'var(--color-vermilion)' : 'var(--color-ink)'
              return (
                <g
                  key={`${d1}-${d2}`}
                  onClick={() => setSelected({ d1, d2 })}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={x + 2}
                    y={y + 2}
                    width={CELL - 4}
                    height={CELL - 4}
                    fill={seven ? 'var(--color-vermilion)' : 'transparent'}
                    fillOpacity={seven ? (isSel ? 0.32 : 0.18) : isSel ? 0.1 : 0}
                    stroke={
                      isSel
                        ? 'var(--color-vermilion)'
                        : isFocus
                          ? 'var(--color-vermilion-deep)'
                          : seven
                            ? 'var(--color-vermilion)'
                            : 'var(--color-graph-fade)'
                    }
                    strokeWidth={isSel || isFocus ? 2 : 1}
                    rx={3}
                  />
                  {/* Sum text */}
                  <text
                    x={x + CELL / 2}
                    y={y + CELL / 2 + 5}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="14"
                    fontWeight={seven ? 600 : 400}
                    fill={fill}
                  >
                    {d1 + d2}
                  </text>
                  <text
                    x={x + CELL / 2}
                    y={y + CELL / 2 - 10}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="9"
                    fill={seven ? 'var(--color-vermilion-deep)' : 'var(--color-dim)'}
                  >
                    {d1}+{d2}
                  </text>
                </g>
              )
            }),
          )}
        </g>

        {/* Readout */}
        <g transform={`translate(${GRID_LEFT + 6 * CELL + 24}, ${GRID_TOP})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            EVENT
          </text>
          <text y="22" fontFamily="Source Serif 4, Georgia, serif" fontSize="14" fill="var(--color-ink)">
            sum = 7
          </text>
          <text y="56" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
            {sevenCount} / {total}
          </text>
          <text y="76" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
            P = {probSeven.toFixed(3)}
          </text>
        </g>

        {/* Selected detail */}
        {sel && (
          <g transform={`translate(${GRID_LEFT + 6 * CELL + 24}, ${GRID_TOP + 140})`}>
            <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
              SELECTED
            </text>
            <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-ink)">
              ({sel.d1}, {sel.d2})
            </text>
            <text y="42" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
              sum {sel.d1 + sel.d2}
            </text>
          </g>
        )}
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1 — Two dice: thirty-six outcomes, six of which sum to seven
      </figcaption>
    </figure>
  )
}
