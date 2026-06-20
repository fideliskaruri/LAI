import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Linearity of expectation. Two stacked histograms — one for X, one for Y —
 * each with three outcomes (we keep it small so the visual reads). Drag a
 * bar on either; that bar's probability changes and the other bars in the
 * same histogram rebalance to keep the row summing to 1.
 *
 * Three rulers at the bottom: E[X] (vermilion, top), E[Y] (vermilion, middle),
 * and E[X+Y] = E[X] + E[Y] (vermilion-deep, bottom). The bottom ruler is
 * always the sum of the top two — that's the point of the act. Linearity
 * holds whether X and Y are independent or not; we don't even tell you how
 * they're coupled.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const N = 3
// Outcomes for X and Y: 1, 2, 3 (small numbers to keep the sum on-axis).
const OUTCOMES_X = [1, 2, 3]
const OUTCOMES_Y = [1, 2, 3]

const HIST_LEFT = 80
const HIST_W = 220
const COL_W = HIST_W / N
const BAR_MAX_H = 70
const X_HIST_BOTTOM = 130
const Y_HIST_BOTTOM = 270

// Three rulers stacked at the bottom.
const RULER_LEFT = 80
const RULER_RIGHT = 520
const RULER_X_RANGE_MIN = 1
const RULER_X_RANGE_MAX = 6 // sum of X+Y can reach 3+3 = 6
const RULER_Y_EX = 340
const RULER_Y_EY = 380
const RULER_Y_SUM = 420

const valueToRulerX = (v: number) =>
  RULER_LEFT + ((v - RULER_X_RANGE_MIN) / (RULER_X_RANGE_MAX - RULER_X_RANGE_MIN)) * (RULER_RIGHT - RULER_LEFT)

function expectedValue(probs: number[], outcomes: number[]) {
  let s = 0
  for (let i = 0; i < probs.length; i++) s += outcomes[i] * probs[i]
  return s
}

function rebalance(probs: number[], idx: number, target: number): number[] {
  const clamped = Math.max(0, Math.min(1, target))
  const others = probs.reduce((s, p, i) => (i === idx ? s : s + p), 0)
  const remaining = 1 - clamped
  const out = probs.slice()
  if (others <= 1e-9) {
    const each = remaining / (probs.length - 1)
    for (let i = 0; i < probs.length; i++) out[i] = i === idx ? clamped : each
  } else {
    const scale = remaining / others
    for (let i = 0; i < probs.length; i++) out[i] = i === idx ? clamped : probs[i] * scale
  }
  return out
}

function narrate(EX: number, EY: number): { text: string; priority: 'normal' | 'high' } {
  const sum = EX + EY
  return {
    text: `Expected value of X is ${EX.toFixed(2)}. Expected value of Y is ${EY.toFixed(2)}. Their sum, the expected value of X plus Y, is ${sum.toFixed(2)} — the bottom ruler tracks the top two rulers added together.`,
    priority: 'normal',
  }
}

export function LinearityCoupled() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const xHandleRefs = useRef<Array<SVGGElement | null>>(Array(N).fill(null))
  const yHandleRefs = useRef<Array<SVGGElement | null>>(Array(N).fill(null))

  const [probsX, setProbsX] = useState<number[]>(() => Array(N).fill(1 / N))
  const [probsY, setProbsY] = useState<number[]>(() => Array(N).fill(1 / N))
  const [focused, setFocused] = useState<{ which: 'X' | 'Y'; idx: number }>({ which: 'X', idx: 0 })
  const [isInteracting, setIsInteracting] = useState(false)

  const startProbXRef = useRef<number | null>(null)
  const startProbYRef = useRef<number | null>(null)

  const updateX = useCallback(
    (idx: number, target: number) => {
      setProbsX((cur) => rebalance(cur, idx, target))
      setFocused({ which: 'X', idx })
    },
    [],
  )
  const updateY = useCallback(
    (idx: number, target: number) => {
      setProbsY((cur) => rebalance(cur, idx, target))
      setFocused({ which: 'Y', idx })
    },
    [],
  )

  const makeXDragHandler = useCallback(
    (idx: number) =>
      ({ first, last, movement: [, my] }: { first: boolean; last: boolean; movement: [number, number] }) => {
        if (first) startProbXRef.current = probsX[idx]
        const start = startProbXRef.current
        if (start === null) return
        setIsInteracting(!last)
        const rect = svgRef.current?.getBoundingClientRect()
        if (!rect) return
        const sy = VIEW_H / rect.height
        const dySvg = my * sy
        const dp = -dySvg / BAR_MAX_H
        updateX(idx, start + dp)
      },
    [probsX, updateX],
  )
  const makeYDragHandler = useCallback(
    (idx: number) =>
      ({ first, last, movement: [, my] }: { first: boolean; last: boolean; movement: [number, number] }) => {
        if (first) startProbYRef.current = probsY[idx]
        const start = startProbYRef.current
        if (start === null) return
        setIsInteracting(!last)
        const rect = svgRef.current?.getBoundingClientRect()
        if (!rect) return
        const sy = VIEW_H / rect.height
        const dySvg = my * sy
        const dp = -dySvg / BAR_MAX_H
        updateY(idx, start + dp)
      },
    [probsY, updateY],
  )

  // Fixed-count bindings.
  const bindX0 = useDrag(makeXDragHandler(0))
  const bindX1 = useDrag(makeXDragHandler(1))
  const bindX2 = useDrag(makeXDragHandler(2))
  const bindY0 = useDrag(makeYDragHandler(0))
  const bindY1 = useDrag(makeYDragHandler(1))
  const bindY2 = useDrag(makeYDragHandler(2))
  const xBinds = [bindX0, bindX1, bindX2]
  const yBinds = [bindY0, bindY1, bindY2]

  // Keyboard nudge on the focused bar.
  const onNudge = useCallback(
    (_dx: number, dy: number) => {
      if (dy === 0) return
      const step = Math.abs(dy) >= 10 ? 0.1 : 0.02
      const sign = Math.sign(dy)
      if (focused.which === 'X') updateX(focused.idx, probsX[focused.idx] + sign * step)
      else updateY(focused.idx, probsY[focused.idx] + sign * step)
    },
    [focused, probsX, probsY, updateX, updateY],
  )
  const focusedRef = focused.which === 'X'
    ? ({ current: xHandleRefs.current[focused.idx] } as React.RefObject<SVGElement | null>)
    : ({ current: yHandleRefs.current[focused.idx] } as React.RefObject<SVGElement | null>)
  useKeyNudge(focusedRef, onNudge)

  const EX = expectedValue(probsX, OUTCOMES_X)
  const EY = expectedValue(probsY, OUTCOMES_Y)
  const ESum = EX + EY
  const narration = narrate(EX, EY)

  // Helper to render one histogram.
  function Histogram({
    probs,
    bottom,
    outcomes,
    label,
    binds,
    handleRefs,
    which,
  }: {
    probs: number[]
    bottom: number
    outcomes: number[]
    label: string
    binds: Array<() => Record<string, unknown>>
    handleRefs: React.MutableRefObject<Array<SVGGElement | null>>
    which: 'X' | 'Y'
  }) {
    return (
      <g>
        <text
          x={HIST_LEFT - 14}
          y={bottom - BAR_MAX_H - 16}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          {label}
        </text>
        <line
          x1={HIST_LEFT}
          y1={bottom}
          x2={HIST_LEFT + HIST_W}
          y2={bottom}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />
        {probs.map((p, i) => {
          const x = HIST_LEFT + i * COL_W
          const h = p * BAR_MAX_H
          const isFocused = focused.which === which && focused.idx === i
          return (
            <g key={i}>
              <g
                {...binds[i]()}
                ref={(el) => {
                  handleRefs.current[i] = el
                }}
                tabIndex={0}
                role="slider"
                aria-label={`Histogram ${which}, probability of outcome ${outcomes[i]}. Currently ${p.toFixed(2)}. Drag vertically or use up and down arrow keys.`}
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={Number(p.toFixed(3))}
                onFocus={() => setFocused({ which, idx: i })}
                style={{ cursor: 'ns-resize', touchAction: 'none' }}
                className="focus-visible:outline-none [&:focus-visible_rect.bar-fill]:stroke-vermilion-deep"
              >
                <rect
                  x={x + 4}
                  y={bottom - BAR_MAX_H - 8}
                  width={COL_W - 8}
                  height={BAR_MAX_H + 12}
                  fill="transparent"
                />
                <rect
                  className="bar-fill"
                  x={x + 4}
                  y={bottom - h}
                  width={COL_W - 8}
                  height={h}
                  fill="var(--color-ink)"
                  fillOpacity={isFocused ? 0.85 : 0.65}
                  stroke="var(--color-graph-ink)"
                  strokeWidth={isFocused ? 1.5 : 0.8}
                />
              </g>
              <text
                x={x + COL_W / 2}
                y={bottom + 14}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-dim)"
              >
                {outcomes[i]}
              </text>
              <text
                x={x + COL_W / 2}
                y={bottom - h - 4}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill={isFocused ? 'var(--color-vermilion)' : 'var(--color-dim)'}
              >
                {p.toFixed(2)}
              </text>
            </g>
          )
        })}
      </g>
    )
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration.text}
        priority={narration.priority}
        isInteracting={isInteracting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Two coupled histograms, X and Y. Expected value of X is ${EX.toFixed(2)}, expected value of Y is ${EY.toFixed(2)}, and their sum is ${ESum.toFixed(2)}.`}
      >
        <g aria-hidden="true" data-origin-x={ORIGIN_X} data-origin-y={ORIGIN_Y} data-unit={UNIT} />

        <text
          x={VIEW_W / 2}
          y={42}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="15"
          fill="var(--color-ink)"
        >
          Two random things — drag a bar on either
        </text>

        <Histogram
          probs={probsX}
          bottom={X_HIST_BOTTOM}
          outcomes={OUTCOMES_X}
          label="X — OUTCOMES"
          binds={xBinds}
          handleRefs={xHandleRefs}
          which="X"
        />
        <Histogram
          probs={probsY}
          bottom={Y_HIST_BOTTOM}
          outcomes={OUTCOMES_Y}
          label="Y — OUTCOMES"
          binds={yBinds}
          handleRefs={yHandleRefs}
          which="Y"
        />

        {/* Sidebar readout for the two histograms */}
        <g transform="translate(340, 80)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            EXPECTATIONS
          </text>
          <text y={20} fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
            E[X]  = {EX.toFixed(2)}
          </text>
          <text y={40} fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
            E[Y]  = {EY.toFixed(2)}
          </text>
          <line x1={0} y1={52} x2={140} y2={52} stroke="var(--color-graph-fade)" strokeWidth="1" />
          <text y={70} fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion-deep)">
            E[X+Y] = {ESum.toFixed(2)}
          </text>
          <text y={92} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            E[X+Y] = E[X] + E[Y]
          </text>
          <text y={108} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="10" fill="var(--color-dim)">
            (no matter how X and Y are coupled)
          </text>
        </g>

        {/* Three rulers — E[X], E[Y], and their sum. */}
        {[
          { y: RULER_Y_EX, val: EX, label: 'E[X]', color: 'var(--color-vermilion)' },
          { y: RULER_Y_EY, val: EY, label: 'E[Y]', color: 'var(--color-vermilion)' },
          { y: RULER_Y_SUM, val: ESum, label: 'E[X+Y]', color: 'var(--color-vermilion-deep)' },
        ].map(({ y, val, label, color }) => (
          <g key={label}>
            <line
              x1={RULER_LEFT}
              y1={y}
              x2={RULER_RIGHT}
              y2={y}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.8"
            />
            {[1, 2, 3, 4, 5, 6].map((v) => (
              <g key={v}>
                <line
                  x1={valueToRulerX(v)}
                  y1={y - 4}
                  x2={valueToRulerX(v)}
                  y2={y + 4}
                  stroke="var(--color-graph-ink)"
                  strokeWidth="0.8"
                />
                <text
                  x={valueToRulerX(v)}
                  y={y + 16}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9"
                  fill="var(--color-dim)"
                >
                  {v}
                </text>
              </g>
            ))}
            <text
              x={RULER_LEFT - 8}
              y={y + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {label}
            </text>
            <polygon
              points={`${valueToRulerX(val)},${y - 10} ${valueToRulerX(val) - 6},${y - 1} ${valueToRulerX(val) + 6},${y - 1}`}
              fill={color}
            />
          </g>
        ))}

        {/* Help text */}
        <text
          x={RULER_LEFT}
          y={VIEW_H - 14}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          BOTTOM RULER ALWAYS EQUALS TOP TWO RULERS ADDED
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2 — Linearity: E[X+Y] = E[X] + E[Y]
      </figcaption>
    </figure>
  )
}
