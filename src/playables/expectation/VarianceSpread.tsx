import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Variance as spread. Same six-bar histogram as the WeightedAverage act,
 * but now the readout shows Var[X] = E[(X - μ)²] alongside E[X]. A faint
 * vermilion shading sweeps out from the mean — wider when the distribution
 * is spread, vanishing when all mass is on one bar.
 *
 * Drag any bar; the other bars rebalance and the variance readout updates.
 * The visual "spread" band uses ± one variance-unit shading on the number
 * line, with intensity falling off with distance from the mean. (We'll show
 * standard deviation properly in the next act.)
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
const BAR_MAX_H = 220

const RULER_Y = BAR_BOTTOM + 64
const RULER_LEFT = BAR_LEFT
const RULER_RIGHT = BAR_LEFT + BAR_W
const outcomeToX = (x: number) => BAR_LEFT + (x - 0.5) * COL_W

function expectedValue(probs: number[]) {
  let s = 0
  for (let i = 0; i < probs.length; i++) s += (i + 1) * probs[i]
  return s
}
function variance(probs: number[]) {
  const mu = expectedValue(probs)
  let s = 0
  for (let i = 0; i < probs.length; i++) {
    const d = i + 1 - mu
    s += d * d * probs[i]
  }
  return s
}

function rebalance(probs: number[], idx: number, target: number): number[] {
  const clamped = Math.max(0, Math.min(1, target))
  const others = probs.reduce((s, p, i) => (i === idx ? s : s + p), 0)
  const remaining = 1 - clamped
  const out = probs.slice()
  if (others <= 1e-9) {
    const each = remaining / (N - 1)
    for (let i = 0; i < N; i++) out[i] = i === idx ? clamped : each
  } else {
    const scale = remaining / others
    for (let i = 0; i < N; i++) out[i] = i === idx ? clamped : probs[i] * scale
  }
  return out
}

function narrate(probs: number[]): { text: string; priority: 'normal' | 'high' } {
  const mu = expectedValue(probs)
  const v = variance(probs)
  if (v < 0.05) {
    return {
      text: `Probability is concentrated tightly around ${mu.toFixed(2)}. Variance is ${v.toFixed(3)} — almost nothing — meaning a single sample is almost certain to land near the mean.`,
      priority: 'high',
    }
  }
  if (v > 5) {
    return {
      text: `Probability is spread out toward the extreme outcomes. Variance is ${v.toFixed(2)}, large — meaning a single sample is far from the mean ${mu.toFixed(2)} more often than not.`,
      priority: 'high',
    }
  }
  return {
    text: `Mean is ${mu.toFixed(2)}, variance is ${v.toFixed(2)}. The vermilion shading sweeps out from the mean to mark roughly how spread out the distribution is.`,
    priority: 'normal',
  }
}

export function VarianceSpread() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRefs = useRef<Array<SVGGElement | null>>(Array(N).fill(null))
  const [probs, setProbs] = useState<number[]>(() => Array(N).fill(1 / N))
  const [focusedBar, setFocusedBar] = useState(0)
  const [isInteracting, setIsInteracting] = useState(false)
  const startProbRef = useRef<number | null>(null)

  const updateBar = useCallback((idx: number, target: number) => {
    setProbs((cur) => rebalance(cur, idx, target))
    setFocusedBar(idx)
  }, [])

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
        const dp = -dySvg / BAR_MAX_H
        updateBar(idx, start + dp)
      },
    [probs, updateBar],
  )

  const bind0 = useDrag(makeDragHandler(0))
  const bind1 = useDrag(makeDragHandler(1))
  const bind2 = useDrag(makeDragHandler(2))
  const bind3 = useDrag(makeDragHandler(3))
  const bind4 = useDrag(makeDragHandler(4))
  const bind5 = useDrag(makeDragHandler(5))
  const binds = [bind0, bind1, bind2, bind3, bind4, bind5]

  const handleNudge = useCallback(
    (_dx: number, dy: number) => {
      if (dy === 0) return
      const step = Math.abs(dy) >= 10 ? 0.1 : 0.02
      const sign = Math.sign(dy)
      updateBar(focusedBar, probs[focusedBar] + sign * step)
    },
    [focusedBar, probs, updateBar],
  )
  useKeyNudge(
    { current: handleRefs.current[focusedBar] } as React.RefObject<SVGElement | null>,
    handleNudge,
  )

  const mu = expectedValue(probs)
  const v = variance(probs)
  const sigma = Math.sqrt(v)
  const muX = outcomeToX(mu)
  // Shading: a band of width 2σ around the mean, clipped to the number line.
  const bandLeft = Math.max(RULER_LEFT, outcomeToX(mu - sigma))
  const bandRight = Math.min(RULER_RIGHT, outcomeToX(mu + sigma))

  const narration = narrate(probs)

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
        aria-label={`Same six-bar histogram. Mean is ${mu.toFixed(2)}, variance is ${v.toFixed(2)}. Drag bars to spread or concentrate the distribution.`}
      >
        <g aria-hidden="true" data-origin-x={ORIGIN_X} data-origin-y={ORIGIN_Y} data-unit={UNIT} />

        <text
          x={VIEW_W / 2}
          y={50}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="15"
          fill="var(--color-ink)"
        >
          Variance — how wide is the distribution?
        </text>

        {/* Bars */}
        <line
          x1={BAR_LEFT}
          y1={BAR_BOTTOM}
          x2={BAR_LEFT + BAR_W}
          y2={BAR_BOTTOM}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        {probs.map((p, i) => {
          const x = BAR_LEFT + i * COL_W
          const h = p * BAR_MAX_H
          const isFocused = i === focusedBar
          return (
            <g key={i}>
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
                  fill="var(--color-ink)"
                  fillOpacity={isFocused ? 0.85 : 0.65}
                  stroke="var(--color-graph-ink)"
                  strokeWidth={isFocused ? 1.5 : 0.8}
                />
              </g>
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

        {/* Spread shading — under the bars, fading from the mean */}
        <defs>
          <linearGradient id="spreadGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-vermilion)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--color-vermilion)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-vermilion)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect
          x={bandLeft}
          y={BAR_BOTTOM - 4}
          width={Math.max(0, bandRight - bandLeft)}
          height={RULER_Y - BAR_BOTTOM + 20}
          fill="url(#spreadGrad)"
        />

        {/* Number line + mean marker */}
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
        {/* μ marker */}
        <line
          x1={muX}
          y1={BAR_BOTTOM - 4}
          x2={muX}
          y2={RULER_Y + 14}
          stroke="var(--color-vermilion)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <text
          x={muX}
          y={RULER_Y + 38}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          μ = {mu.toFixed(2)}
        </text>

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            VARIANCE
          </text>
          <text y={22} fontFamily="JetBrains Mono, monospace" fontSize="16" fill="var(--color-vermilion)">
            Var[X] = {v.toFixed(3)}
          </text>
          <text y={42} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            E[(X − μ)²]
          </text>
        </g>

        {/* Help text */}
        <text
          x={BAR_LEFT}
          y={VIEW_H - 14}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          CONCENTRATE THE BARS → VARIANCE SHRINKS · SPREAD THEM → VARIANCE GROWS
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4 — Variance: average squared distance from the mean
      </figcaption>
    </figure>
  )
}
