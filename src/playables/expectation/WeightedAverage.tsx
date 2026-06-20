import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Expectation as the operator. Six bars for the outcomes 1..6 of a die,
 * each bar's height is the probability assigned to that outcome. Dragging
 * one bar's height redistributes the remaining mass uniformly among the
 * other five so that the six probabilities always sum to 1.
 *
 * Vermilion ruler at the bottom slides to E[X] = Σ x · P(X = x). The bar
 * outcomes 1..6 are the *x-values*; their bar heights are the *weights*.
 *
 * Keyboard: tab to a bar; arrow keys nudge its probability by 0.02 (or
 * 0.1 with Shift). The constraint logic clamps so no bar goes below 0.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const N = 6
const BAR_LEFT = 90
const BAR_BOTTOM = 320
const BAR_W = 420
const COL_W = BAR_W / N
// The tallest a bar can ever be is probability 1 → use 240px of headroom.
const BAR_MAX_H = 220

// Convert a probability (0..1) to a bar height in pixels.
const probToPx = (p: number) => p * BAR_MAX_H

// Ruler — the vermilion expectation indicator — sits below the bars.
const RULER_Y = BAR_BOTTOM + 64
const RULER_LEFT = BAR_LEFT
const RULER_RIGHT = BAR_LEFT + BAR_W

// Outcomes are the bar labels 1..6; expected value lives on this same axis.
const outcomeToX = (x: number) => BAR_LEFT + (x - 0.5) * COL_W

// Compute E[X] = Σ i · p_i
function expectedValue(probs: number[]) {
  let s = 0
  for (let i = 0; i < probs.length; i++) s += (i + 1) * probs[i]
  return s
}

// Update one bar's probability and redistribute the remaining mass to the
// other bars proportionally to their *current* shares (so a uniform
// distribution stays uniform if you nudge gently). Falls back to even
// redistribution when the others all share 0 mass.
function rebalance(probs: number[], idx: number, target: number): number[] {
  const clamped = Math.max(0, Math.min(1, target))
  const others = probs.reduce((s, p, i) => (i === idx ? s : s + p), 0)
  const remaining = 1 - clamped
  const out = probs.slice()
  if (others <= 1e-9) {
    // Distribute remainder evenly among the other N-1 bars.
    const each = remaining / (N - 1)
    for (let i = 0; i < N; i++) out[i] = i === idx ? clamped : each
  } else {
    const scale = remaining / others
    for (let i = 0; i < N; i++) out[i] = i === idx ? clamped : probs[i] * scale
  }
  return out
}

function narrate(probs: number[], lastIdx: number): { text: string; priority: 'normal' | 'high' } {
  const E = expectedValue(probs)
  // Uniform → near fair die. Degenerate → all mass on one bar.
  const uniform = probs.every((p) => Math.abs(p - 1 / N) < 0.01)
  const maxP = Math.max(...probs)
  const concentrated = maxP > 0.95
  const concentratedIdx = probs.findIndex((p) => p === maxP)
  if (uniform) {
    return {
      text: `A fair die: every outcome has probability one in six. The expected value is three point five — dead centre of one through six.`,
      priority: 'high',
    }
  }
  if (concentrated) {
    return {
      text: `Nearly all probability sits on outcome ${concentratedIdx + 1}. The expected value collapses to ${E.toFixed(2)} — almost the same as that single outcome.`,
      priority: 'high',
    }
  }
  return {
    text: `Bar ${lastIdx + 1} now holds probability ${probs[lastIdx].toFixed(2)}; the remaining mass spreads across the other bars. Expected value: ${E.toFixed(2)}.`,
    priority: 'normal',
  }
}

export function WeightedAverage() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  // One ref per bar so each can take focus.
  const handleRefs = useRef<Array<SVGGElement | null>>(Array(N).fill(null))
  const [probs, setProbs] = useState<number[]>(() => Array(N).fill(1 / N))
  const [focusedBar, setFocusedBar] = useState(0)
  const [isInteracting, setIsInteracting] = useState(false)
  const startProbRef = useRef<number | null>(null)

  const updateBar = useCallback((idx: number, target: number) => {
    setProbs((cur) => rebalance(cur, idx, target))
    setFocusedBar(idx)
  }, [])

  // Build a drag handler given a target-bar index. Returns a useDrag callback
  // that uses the current probability snapshot taken on drag-start.
  const makeDragHandler = useCallback(
    (idx: number) =>
      ({ first, last, movement: [, my] }: { first: boolean; last: boolean; movement: [number, number] }) => {
        if (first) startProbRef.current = probs[idx]
        const start = startProbRef.current
        if (start === null) return
        setIsInteracting(!last)
        const rect = svgRef.current?.getBoundingClientRect()
        if (!rect) return
        const sy = VIEW_H / rect.height
        const dySvg = my * sy
        // Dragging up (negative dy in screen space) should INCREASE probability.
        const dp = -dySvg / BAR_MAX_H
        updateBar(idx, start + dp)
      },
    [probs, updateBar],
  )

  // Six independent useDrag bindings — fixed count, called in stable order
  // so the rules of hooks are satisfied.
  const bind0 = useDrag(makeDragHandler(0))
  const bind1 = useDrag(makeDragHandler(1))
  const bind2 = useDrag(makeDragHandler(2))
  const bind3 = useDrag(makeDragHandler(3))
  const bind4 = useDrag(makeDragHandler(4))
  const bind5 = useDrag(makeDragHandler(5))
  const binds = [bind0, bind1, bind2, bind3, bind4, bind5]

  // Keyboard nudging on the focused bar.
  const handleNudge = useCallback(
    (_dx: number, dy: number) => {
      if (dy === 0) return
      const step = Math.abs(dy) >= 10 ? 0.1 : 0.02
      const sign = Math.sign(dy)
      updateBar(focusedBar, probs[focusedBar] + sign * step)
    },
    [focusedBar, probs, updateBar],
  )
  // Attach to whichever bar has focus.
  useKeyNudge(
    { current: handleRefs.current[focusedBar] } as React.RefObject<SVGElement | null>,
    handleNudge,
  )

  const E = expectedValue(probs)
  const rulerX = outcomeToX(E)
  const narration = narrate(probs, focusedBar)

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
        aria-label={`Six-bar probability histogram for a die. Expected value is ${E.toFixed(2)}. Drag a bar to redistribute probability among the others.`}
      >
        {/* Origin/UNIT scaffold (declared for canonical viewBox geometry) */}
        <g aria-hidden="true" data-origin-x={ORIGIN_X} data-origin-y={ORIGIN_Y} data-unit={UNIT} />

        {/* Title */}
        <text
          x={VIEW_W / 2}
          y={50}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="15"
          fill="var(--color-ink)"
        >
          A die's probability distribution — drag a bar
        </text>

        {/* Axis */}
        <line
          x1={BAR_LEFT}
          y1={BAR_BOTTOM}
          x2={BAR_LEFT + BAR_W}
          y2={BAR_BOTTOM}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />

        {/* Bars */}
        {probs.map((p, i) => {
          const x = BAR_LEFT + i * COL_W
          const h = probToPx(p)
          const isFocused = i === focusedBar
          return (
            <g key={i}>
              {/* Hit-area, including drag-up zone above the bar */}
              <g
                {...binds[i]()}
                ref={(el) => {
                  handleRefs.current[i] = el
                }}
                tabIndex={0}
                role="slider"
                aria-label={`Probability of outcome ${i + 1}. Currently ${p.toFixed(2)}. Drag vertically or use up and down arrow keys.`}
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={Number(p.toFixed(3))}
                onFocus={() => setFocusedBar(i)}
                style={{ cursor: 'ns-resize', touchAction: 'none' }}
                className="focus-visible:outline-none [&:focus-visible_rect.bar-fill]:stroke-vermilion-deep"
              >
                <rect
                  x={x + 4}
                  y={BAR_BOTTOM - BAR_MAX_H - 20}
                  width={COL_W - 8}
                  height={BAR_MAX_H + 26}
                  fill="transparent"
                />
                <rect
                  className="bar-fill"
                  x={x + 4}
                  y={BAR_BOTTOM - h}
                  width={COL_W - 8}
                  height={h}
                  fill={isFocused ? 'var(--color-ink)' : 'var(--color-ink)'}
                  fillOpacity={isFocused ? 0.85 : 0.65}
                  stroke="var(--color-graph-ink)"
                  strokeWidth={isFocused ? 1.5 : 0.8}
                />
              </g>
              {/* Outcome label */}
              <text
                x={x + COL_W / 2}
                y={BAR_BOTTOM + 18}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="12"
                fill="var(--color-dim)"
              >
                {i + 1}
              </text>
              {/* Probability label above the bar */}
              <text
                x={x + COL_W / 2}
                y={BAR_BOTTOM - h - 6}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fill={isFocused ? 'var(--color-vermilion)' : 'var(--color-dim)'}
              >
                {p.toFixed(2)}
              </text>
            </g>
          )
        })}

        {/* Expectation ruler */}
        <g>
          {/* Number line below the bars */}
          <line
            x1={RULER_LEFT}
            y1={RULER_Y}
            x2={RULER_RIGHT}
            y2={RULER_Y}
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
          />
          {[1, 2, 3, 4, 5, 6].map((x) => (
            <g key={x}>
              <line
                x1={outcomeToX(x)}
                y1={RULER_Y - 5}
                x2={outcomeToX(x)}
                y2={RULER_Y + 5}
                stroke="var(--color-graph-ink)"
                strokeWidth="1"
              />
              <text
                x={outcomeToX(x)}
                y={RULER_Y + 20}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-dim)"
              >
                {x}
              </text>
            </g>
          ))}
          {/* Vermilion E[X] marker */}
          <line
            x1={rulerX}
            y1={BAR_BOTTOM - 4}
            x2={rulerX}
            y2={RULER_Y + 16}
            stroke="var(--color-vermilion)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <polygon
            points={`${rulerX},${RULER_Y - 14} ${rulerX - 7},${RULER_Y - 2} ${rulerX + 7},${RULER_Y - 2}`}
            fill="var(--color-vermilion)"
          />
        </g>

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            EXPECTED VALUE
          </text>
          <text y={22} fontFamily="JetBrains Mono, monospace" fontSize="16" fill="var(--color-vermilion)">
            E[X] = {E.toFixed(2)}
          </text>
          <text y={42} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            Σ x · P(X = x)
          </text>
        </g>

        {/* Help text */}
        <text
          x={BAR_LEFT}
          y={VIEW_H - 36}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          DRAG BARS · ARROWS NUDGE · BARS ALWAYS SUM TO 1
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1 — Expected value is the weighted average
      </figcaption>
    </figure>
  )
}
