import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Independence act: same constraint-on-first-die setup as ConditionalFilter,
 * but the event A is "second die is even." The conditional probability
 * stays exactly 0.5 no matter where you drag the constraint — that's the
 * picture of independence. We also overlay the unconditional probability
 * P(A) = 0.5 next to P(A|B) so the reader can see they're literally the
 * same number.
 */

const VIEW_W = 600
const VIEW_H = 480
const GRID_LEFT = 90
const GRID_TOP = 60
const CELL = 56

export function IndependenceCheck() {
  const handleRef = useRef<SVGGElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [constraint, setConstraint] = useState(3)
  const startConstraintRef = useRef<number | null>(null)

  const updateConstraint = useCallback((v: number) => {
    setConstraint(Math.max(1, Math.min(6, Math.round(v))))
  }, [])

  const bind = useDrag(({ first, movement: [mx] }) => {
    if (first) startConstraintRef.current = constraint
    const start = startConstraintRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const dxSvg = mx * sx
    const dxCols = dxSvg / CELL
    updateConstraint(start + dxCols)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        updateConstraint(constraint + Math.sign(dx))
      },
      [constraint, updateConstraint],
    ),
  )

  // P(A) = P(second die even) = 3/6 = 0.5
  // P(A | B) = P(second die even | first die = constraint) = 3/6 = 0.5
  // Always. That's independence.
  const cellsInB = 6
  const cellsInAandB = 3
  const probA = 0.5
  const probAgivenB = cellsInAandB / cellsInB

  const constraintHandleX = GRID_LEFT + (constraint - 1) * CELL + CELL / 2

  const narration = `Constraint: first die equals ${constraint}. P of second die even given that constraint is ${probAgivenB.toFixed(2)} — identical to the unconditional probability ${probA.toFixed(2)}. The two events are independent.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="high" />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Sample space grid with constraint first die equals ${constraint}. P second die is even given that constraint stays at ${probAgivenB.toFixed(2)}, equal to the unconditional probability.`}
      >
        {/* Axis labels */}
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
          y={GRID_TOP - 32}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          FIRST DIE
        </text>
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <text
            key={`col-${d}`}
            x={GRID_LEFT + (d - 1) * CELL + CELL / 2}
            y={GRID_TOP - 14}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fontWeight={d === constraint ? 600 : 400}
            fill={d === constraint ? 'var(--color-vermilion)' : 'var(--color-dim)'}
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
            fontWeight={d % 2 === 0 ? 600 : 400}
            fill={d % 2 === 0 ? 'var(--color-vermilion)' : 'var(--color-dim)'}
          >
            {d}
          </text>
        ))}

        {[1, 2, 3, 4, 5, 6].map((d1) =>
          [1, 2, 3, 4, 5, 6].map((d2) => {
            const x = GRID_LEFT + (d1 - 1) * CELL
            const y = GRID_TOP + (d2 - 1) * CELL
            const inB = d1 === constraint
            const inA = d2 % 2 === 0
            const matching = inA && inB

            let fill: string
            let fillOp: number
            let stroke: string
            let textFill: string
            let textOp: number
            if (matching) {
              fill = 'var(--color-vermilion)'
              fillOp = 0.32
              stroke = 'var(--color-vermilion)'
              textFill = 'var(--color-vermilion)'
              textOp = 1
            } else if (inB) {
              fill = 'transparent'
              fillOp = 0
              stroke = 'var(--color-graph-ink)'
              textFill = 'var(--color-ink)'
              textOp = 1
            } else if (inA) {
              // Even-second-die rows outside B — show faintly tinted vermilion
              // so the unconditional P(A) is visible at a glance.
              fill = 'var(--color-vermilion)'
              fillOp = 0.08
              stroke = 'var(--color-graph-fade)'
              textFill = 'var(--color-vermilion)'
              textOp = 0.55
            } else {
              fill = 'transparent'
              fillOp = 0
              stroke = 'var(--color-graph-fade)'
              textFill = 'var(--color-graph-fade)'
              textOp = 0.45
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
                  strokeWidth={matching ? 2 : inB ? 1.5 : 1}
                  rx={3}
                />
                <text
                  x={x + CELL / 2}
                  y={y + CELL / 2 + 5}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="14"
                  fontWeight={matching ? 600 : 400}
                  fill={textFill}
                  fillOpacity={textOp}
                >
                  {d1 + d2}
                </text>
              </g>
            )
          }),
        )}

        {/* Constraint handle */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Constraint on first die. Currently ${constraint}. Drag or use arrow keys.`}
          aria-valuemin={1}
          aria-valuemax={6}
          aria-valuenow={constraint}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_path:last-of-type]:fill-vermilion-deep"
        >
          <rect
            x={GRID_LEFT}
            y={GRID_TOP - 48}
            width={6 * CELL}
            height={32}
            fill="transparent"
          />
          <path
            d={`M ${constraintHandleX} ${GRID_TOP - 36} L ${constraintHandleX - 10} ${GRID_TOP - 52} L ${constraintHandleX + 10} ${GRID_TOP - 52} Z`}
            fill="var(--color-vermilion)"
          />
        </g>

        {/* Vertical column tint */}
        <rect
          x={GRID_LEFT + (constraint - 1) * CELL}
          y={GRID_TOP}
          width={CELL}
          height={6 * CELL}
          fill="var(--color-vermilion)"
          fillOpacity="0.07"
          pointerEvents="none"
        />

        {/* Comparison readout */}
        <g transform={`translate(${GRID_LEFT + 6 * CELL + 24}, ${GRID_TOP})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            A
          </text>
          <text y="18" fontFamily="Source Serif 4, Georgia, serif" fontSize="13" fill="var(--color-ink)">
            d₂ even
          </text>

          <text y={48} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            P(A)     = {probA.toFixed(2)}
          </text>
          <text y={68} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
            P(A|B) = {probAgivenB.toFixed(2)}
          </text>

          <line x1="0" y1="86" x2="80" y2="86" stroke="var(--color-graph-fade)" strokeWidth="1" />

          <text
            y={108}
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-vermilion)"
          >
            equal — independent
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5 — Independence: the conditional doesn't move
      </figcaption>
    </figure>
  )
}
