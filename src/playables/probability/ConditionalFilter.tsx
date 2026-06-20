import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Conditional probability: the same 6x6 grid, plus a draggable constraint
 * handle that lives on the "first die" axis. Cells that don't match the
 * constraint (first die = k) are faded out — they're outside the conditional
 * sample space. Among the *remaining* six cells, the ones in event A
 * ("sum = 7") highlight vermilion.
 *
 * The teaching: P(A | B) = (matching cells in B) / (cells in B), not
 * (matching cells) / 36. The denominator shrank.
 */

const VIEW_W = 600
const VIEW_H = 480
const GRID_LEFT = 90
const GRID_TOP = 60
const CELL = 56

export function ConditionalFilter() {
  const handleRef = useRef<SVGGElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  // Constraint: first die equals constraintValue (1..6).
  const [constraint, setConstraint] = useState(4)
  const startConstraintRef = useRef<number | null>(null)

  const updateConstraint = useCallback((v: number) => {
    setConstraint(Math.max(1, Math.min(6, Math.round(v))))
  }, [])

  // The constraint handle slides horizontally across the column headers.
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

  // Cells in B (first die = constraint): 6
  // Cells in A ∩ B (first die = constraint AND sum = 7): 1 (when (constraint, 7-constraint) is valid, i.e. always for 1..6)
  // So P(A | B) = 1/6 = 0.167 for any constraint, which is the same as P(A).
  // That's a *teaching* fact (sum=7 is independent of first die) and it
  // sets up the independence act nicely.
  const cellsInB = 6
  const cellsInAandB = 1
  const probAgivenB = cellsInAandB / cellsInB

  // We pick the column that satisfies first die = constraint.
  const constraintHandleX = GRID_LEFT + (constraint - 1) * CELL + CELL / 2

  const narration = `Constraint: first die equals ${constraint}. Six of thirty-six outcomes remain. Among those, one outcome sums to seven. P of sum equals seven given first die equals ${constraint} is one in six, about ${probAgivenB.toFixed(3)}.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="high" />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Sample space grid with constraint first die equals ${constraint}. P sum equals seven given first die equals ${constraint} equals ${probAgivenB.toFixed(3)}.`}
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
            const inB = d1 === constraint
            const inA = d1 + d2 === 7
            const matching = inA && inB

            // Three states: out-of-B (faded), in-B-not-A (dim), in-A∩B (vermilion).
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

        {/* Constraint handle — a draggable arrow above the chosen column */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Constraint on first die. Currently ${constraint}. Drag or use arrow keys to change.`}
          aria-valuemin={1}
          aria-valuemax={6}
          aria-valuenow={constraint}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_path:last-of-type]:fill-vermilion-deep"
        >
          {/* Hit area — wider than visible */}
          <rect
            x={GRID_LEFT}
            y={GRID_TOP - 48}
            width={6 * CELL}
            height={32}
            fill="transparent"
          />
          {/* Pointer triangle */}
          <path
            d={`M ${constraintHandleX} ${GRID_TOP - 36} L ${constraintHandleX - 10} ${GRID_TOP - 52} L ${constraintHandleX + 10} ${GRID_TOP - 52} Z`}
            fill="var(--color-vermilion)"
          />
        </g>

        {/* Vertical column tint to make the conditional sample space pop */}
        <rect
          x={GRID_LEFT + (constraint - 1) * CELL}
          y={GRID_TOP}
          width={CELL}
          height={6 * CELL}
          fill="var(--color-vermilion)"
          fillOpacity="0.07"
          pointerEvents="none"
        />

        {/* Readout */}
        <g transform={`translate(${GRID_LEFT + 6 * CELL + 24}, ${GRID_TOP})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            A
          </text>
          <text y="18" fontFamily="Source Serif 4, Georgia, serif" fontSize="13" fill="var(--color-ink)">
            sum = 7
          </text>
          <text y="48" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            B
          </text>
          <text y="66" fontFamily="Source Serif 4, Georgia, serif" fontSize="13" fill="var(--color-ink)">
            d₁ = {constraint}
          </text>
          <line
            x1="0"
            y1="86"
            x2="80"
            y2="86"
            stroke="var(--color-graph-fade)"
            strokeWidth="1"
          />
          <text y="108" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            |B| = {cellsInB}
          </text>
          <text y="126" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            |A∩B| = {cellsInAandB}
          </text>
          <text y="158" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
            P(A|B) =
          </text>
          <text y="178" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
            {cellsInAandB}/{cellsInB} = {probAgivenB.toFixed(3)}
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4 — Conditional: filter shrinks the denominator
      </figcaption>
    </figure>
  )
}
