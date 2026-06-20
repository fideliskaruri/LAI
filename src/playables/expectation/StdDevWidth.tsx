import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Standard deviation. Same six-bar histogram, but the readout shows σ = √Var
 * as a horizontal vermilion "width-bar" centered on the mean. The width-bar
 * is in the same units as the outcomes (1..6), so it lives directly on the
 * number line and you can read off "how far from the mean a typical sample
 * lands" without translating units.
 *
 * The teaching: variance lives in *squared* units (pips²); standard deviation
 * brings us back to pips. That's why every calculator output uses σ.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const N = 6
const BAR_LEFT = 90
const BAR_BOTTOM = 280
const BAR_W = 420
const COL_W = BAR_W / N
const BAR_MAX_H = 190

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

function narrate(mu: number, sigma: number): { text: string; priority: 'normal' | 'high' } {
  if (sigma < 0.1) {
    return {
      text: `Standard deviation is essentially zero. The width-bar shrinks to nothing — every sample lands at the mean ${mu.toFixed(2)}.`,
      priority: 'high',
    }
  }
  return {
    text: `Mean is ${mu.toFixed(2)}. Standard deviation σ is ${sigma.toFixed(2)} pips — a typical roll lands within about that distance of the mean. The vermilion bar shows ± one σ around μ.`,
    priority: 'normal',
  }
}

export function StdDevWidth() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRefs = useRef<Array<SVGGElement | null>>(Array(N).fill(null))
  // A non-uniform default so σ starts at a readable size.
  const [probs, setProbs] = useState<number[]>(() => [0.05, 0.15, 0.30, 0.30, 0.15, 0.05])
  const [focusedBar, setFocusedBar] = useState(2)
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
  const sigmaBarLeft = Math.max(RULER_LEFT, outcomeToX(mu - sigma))
  const sigmaBarRight = Math.min(RULER_RIGHT, outcomeToX(mu + sigma))
  const sigmaBarY = RULER_Y - 22

  const narration = narrate(mu, sigma)

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
        aria-label={`Histogram with standard deviation overlay. Mean ${mu.toFixed(2)}, sigma ${sigma.toFixed(2)}.`}
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
          σ = √Var — back in the units of X
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
                  y={BAR_BOTTOM - BAR_MAX_H - 16}
                  width={COL_W - 8}
                  height={BAR_MAX_H + 22}
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
                y={BAR_BOTTOM + 16}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-dim)"
              >
                {i + 1}
              </text>
              <text
                x={x + COL_W / 2}
                y={BAR_BOTTOM - h - 4}
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

        {/* σ width-bar */}
        <g>
          {/* Capped bar showing the ± σ window on the number line */}
          <rect
            x={sigmaBarLeft}
            y={sigmaBarY - 6}
            width={Math.max(0, sigmaBarRight - sigmaBarLeft)}
            height={12}
            fill="var(--color-vermilion)"
            fillOpacity="0.18"
            stroke="var(--color-vermilion)"
            strokeWidth="1"
            rx={2}
          />
          {/* End caps */}
          <line x1={sigmaBarLeft} y1={sigmaBarY - 10} x2={sigmaBarLeft} y2={sigmaBarY + 10} stroke="var(--color-vermilion)" strokeWidth="1.5" />
          <line x1={sigmaBarRight} y1={sigmaBarY - 10} x2={sigmaBarRight} y2={sigmaBarY + 10} stroke="var(--color-vermilion)" strokeWidth="1.5" />
          {/* Label */}
          <text
            x={(sigmaBarLeft + sigmaBarRight) / 2}
            y={sigmaBarY - 16}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill="var(--color-vermilion)"
          >
            ± 1σ = ± {sigma.toFixed(2)}
          </text>
        </g>

        {/* Number line + mean */}
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
        {/* μ dotted line */}
        <line
          x1={muX}
          y1={sigmaBarY - 12}
          x2={muX}
          y2={RULER_Y + 14}
          stroke="var(--color-vermilion)"
          strokeWidth="1.2"
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
        <g transform="translate(36, 60)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            STANDARD DEVIATION
          </text>
          <text y={22} fontFamily="JetBrains Mono, monospace" fontSize="16" fill="var(--color-vermilion)">
            σ = {sigma.toFixed(3)}
          </text>
          <text y={42} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            Var[X] = {v.toFixed(3)}
          </text>
          <text y={60} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            σ = √Var[X]
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
          WIDER VERMILION BAR → MORE TYPICAL SPREAD AROUND THE MEAN
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5 — Standard deviation, in pips
      </figcaption>
    </figure>
  )
}
