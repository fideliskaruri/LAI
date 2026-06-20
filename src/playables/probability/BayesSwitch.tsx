import { useCallback, useRef, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Bayes act: same 6x6 grid, plus a "direction switch" that flips which
 * proposition is the *constraint* and which is the *question*. With the
 * switch in position A, we filter on B = "sum = 7" and ask about
 * A = "first die is 4"; with the switch flipped, we filter on A and ask
 * about B. The readout shows both P(A|B) and P(B|A) and the joint
 * P(A ∩ B); the user can see Bayes' theorem
 *   P(A|B) · P(B) = P(B|A) · P(A) = P(A ∩ B)
 * as a literal equation between the cells.
 */

const VIEW_W = 600
const VIEW_H = 480
const GRID_LEFT = 90
const GRID_TOP = 70
const CELL = 56

type Direction = 'given-B' | 'given-A'

// Event A: first die is 4 (highlighted as a column in mode "given B")
const isA = (d1: number) => d1 === 4
// Event B: sum is 7 (highlighted as a diagonal)
const isB = (d1: number, d2: number) => d1 + d2 === 7

export function BayesSwitch() {
  const switchRef = useRef<HTMLButtonElement | null>(null)
  const [dir, setDir] = useState<Direction>('given-B')

  const toggle = useCallback(() => {
    setDir((d) => (d === 'given-B' ? 'given-A' : 'given-B'))
  }, [])

  useKeyNudge(
    switchRef as unknown as React.RefObject<HTMLElement | null>,
    useCallback(
      (dx: number, dy: number) => {
        if (dx === 0 && dy === 0) return
        toggle()
      },
      [toggle],
    ),
  )

  // Both events
  // |A| = 6 (first die = 4, any second die)
  // |B| = 6 (sum = 7)
  // |A ∩ B| = 1 (d1=4, d2=3)
  const cellsInA = 6
  const cellsInB = 6
  const joint = 1
  const probA = cellsInA / 36
  const probB = cellsInB / 36
  const probJoint = joint / 36
  const probAgivenB = joint / cellsInB
  const probBgivenA = joint / cellsInA

  // Which side is the "given" (denominator)?
  const conditioningOnB = dir === 'given-B'
  const conditioningLabel = conditioningOnB ? 'sum = 7 (B)' : 'first die = 4 (A)'
  const questionLabel = conditioningOnB ? 'first die = 4 (A)' : 'sum = 7 (B)'
  const focusValue = conditioningOnB ? probAgivenB : probBgivenA

  const narration = `Bayes switch in position: given ${conditioningOnB ? 'B' : 'A'}, asking about ${conditioningOnB ? 'A' : 'B'}. P of ${conditioningOnB ? 'A given B' : 'B given A'} is ${focusValue.toFixed(3)}. Bayes' theorem keeps the joint probability constant: P(A) times P(B given A) equals P(B) times P(A given B) equals ${probJoint.toFixed(3)}.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="high" />

      {/* Direction switch — HTML so it gets native button semantics. */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <span
          className="font-sans uppercase tracking-[0.18em]"
          style={{
            fontSize: '11px',
            color: conditioningOnB ? 'var(--color-vermilion)' : 'var(--color-dim)',
          }}
        >
          P(A | B)
        </span>
        <button
          ref={switchRef}
          type="button"
          role="switch"
          aria-checked={!conditioningOnB}
          aria-label={`Direction of the filter. Currently conditioning on ${conditioningOnB ? 'B (sum equals seven)' : 'A (first die equals four)'}. Click or press space to swap.`}
          onClick={toggle}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-full"
          style={{
            position: 'relative',
            width: 56,
            height: 26,
            borderRadius: 14,
            backgroundColor: 'var(--color-graph-fade)',
            border: '1px solid var(--color-graph-ink)',
            cursor: 'pointer',
            transition: 'background-color 150ms',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 2,
              left: conditioningOnB ? 2 : 28,
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: 'var(--color-vermilion)',
              transition: 'left 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </button>
        <span
          className="font-sans uppercase tracking-[0.18em]"
          style={{
            fontSize: '11px',
            color: !conditioningOnB ? 'var(--color-vermilion)' : 'var(--color-dim)',
          }}
        >
          P(B | A)
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Sample space grid. Direction switch reads ${conditioningOnB ? 'P(A given B)' : 'P(B given A)'}. The filter highlights ${conditioningLabel}; the question highlights ${questionLabel}.`}
      >
        {/* Headers */}
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <text
            key={`col-${d}`}
            x={GRID_LEFT + (d - 1) * CELL + CELL / 2}
            y={GRID_TOP - 6}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fontWeight={d === 4 ? 600 : 400}
            fill={d === 4 ? 'var(--color-vermilion)' : 'var(--color-dim)'}
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
        {[1, 2, 3, 4, 5, 6].map((d1) =>
          [1, 2, 3, 4, 5, 6].map((d2) => {
            const x = GRID_LEFT + (d1 - 1) * CELL
            const y = GRID_TOP + (d2 - 1) * CELL
            const inGiven = conditioningOnB ? isB(d1, d2) : isA(d1)
            const inAsked = conditioningOnB ? isA(d1) : isB(d1, d2)
            const inJoint = inGiven && inAsked

            let fill: string
            let fillOp: number
            let stroke: string
            let textFill: string
            let textOp: number
            if (inJoint) {
              fill = 'var(--color-vermilion)'
              fillOp = 0.4
              stroke = 'var(--color-vermilion)'
              textFill = 'var(--color-vermilion)'
              textOp = 1
            } else if (inGiven) {
              fill = 'var(--color-vermilion)'
              fillOp = 0.1
              stroke = 'var(--color-graph-ink)'
              textFill = 'var(--color-ink)'
              textOp = 1
            } else if (inAsked) {
              fill = 'transparent'
              fillOp = 0
              stroke = 'var(--color-graph-ink)'
              textFill = 'var(--color-graph-ink)'
              textOp = 0.7
            } else {
              fill = 'transparent'
              fillOp = 0
              stroke = 'var(--color-graph-fade)'
              textFill = 'var(--color-graph-fade)'
              textOp = 0.5
            }

            return (
              <g key={`${d1}-${d2}`}>
                <rect
                  x={x + 2}
                  y={y + 2}
                  width={CELL - 4}
                  height={CELL - 4}
                  fill={fill}
                  fillOpacity={fillOp}
                  stroke={stroke}
                  strokeWidth={inJoint ? 2 : inGiven ? 1.5 : 1}
                  rx={3}
                />
                <text
                  x={x + CELL / 2}
                  y={y + CELL / 2 + 5}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="14"
                  fontWeight={inJoint ? 600 : 400}
                  fill={textFill}
                  fillOpacity={textOp}
                >
                  {d1 + d2}
                </text>
              </g>
            )
          }),
        )}

        {/* Side panel */}
        <g transform={`translate(${GRID_LEFT + 6 * CELL + 24}, ${GRID_TOP})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            GIVEN
          </text>
          <text
            y="18"
            fontFamily="Source Serif 4, Georgia, serif"
            fontSize="13"
            fill="var(--color-vermilion)"
          >
            {conditioningLabel}
          </text>
          <text y="42" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            ASK
          </text>
          <text y="60" fontFamily="Source Serif 4, Georgia, serif" fontSize="13" fill="var(--color-ink)">
            {questionLabel}
          </text>

          <line x1="0" y1="78" x2="80" y2="78" stroke="var(--color-graph-fade)" strokeWidth="1" />

          <text y={102} fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
            {conditioningOnB ? 'P(A|B)' : 'P(B|A)'} = {focusValue.toFixed(3)}
          </text>
          <text y={122} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            {conditioningOnB ? 'P(B|A)' : 'P(A|B)'} = {(conditioningOnB ? probBgivenA : probAgivenB).toFixed(3)}
          </text>
          <text y={150} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            P(A)   = {probA.toFixed(3)}
          </text>
          <text y={168} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            P(B)   = {probB.toFixed(3)}
          </text>
          <text y={186} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            P(A∩B) = {probJoint.toFixed(3)}
          </text>

          <line x1="0" y1="202" x2="80" y2="202" stroke="var(--color-graph-fade)" strokeWidth="1" />

          <text
            y={224}
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-dim)"
          >
            P(A)·P(B|A) =
          </text>
          <text y={240} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            {probA.toFixed(3)} · {probBgivenA.toFixed(3)} = {(probA * probBgivenA).toFixed(3)}
          </text>
          <text
            y={262}
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-dim)"
          >
            P(B)·P(A|B) =
          </text>
          <text y={278} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            {probB.toFixed(3)} · {probAgivenB.toFixed(3)} = {(probB * probAgivenB).toFixed(3)}
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6 — Bayes: the algebra of switching the filter
      </figcaption>
    </figure>
  )
}
