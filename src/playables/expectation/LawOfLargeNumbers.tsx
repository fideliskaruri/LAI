import { useCallback, useEffect, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * The law of large numbers. Roll one fair die N times; plot the running
 * sample mean as a line. The line wobbles wildly for small N and snaps
 * onto 3.5 as N grows.
 *
 * Controls:
 *  - "Roll" button: add one roll
 *  - "Auto-run" toggle: keep rolling until N hits the slider's value
 *  - "Reset" button: clear the history
 *  - Slider: target N from 1 to 1000
 *
 * The slider has its own focus and keyboard nudge. The Roll/Auto/Reset
 * buttons each take focus normally.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

// Plot area for the running-mean line.
const PLOT_LEFT = 80
const PLOT_RIGHT = 540
const PLOT_TOP = 90
const PLOT_BOTTOM = 290
const PLOT_W = PLOT_RIGHT - PLOT_LEFT
const PLOT_H = PLOT_BOTTOM - PLOT_TOP

// Y-axis: running mean ranges 1..6
const Y_MIN = 1
const Y_MAX = 6
const yToPx = (v: number) =>
  PLOT_TOP + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * PLOT_H

// Slider for target N.
const SLIDER_Y = 410
const SLIDER_LEFT = PLOT_LEFT
const SLIDER_RIGHT = PLOT_RIGHT
const N_MIN = 1
const N_MAX = 1000
// Log scale for the slider so small N is still distinguishable.
const nToSliderX = (n: number) =>
  SLIDER_LEFT + (Math.log(n) / Math.log(N_MAX)) * (SLIDER_RIGHT - SLIDER_LEFT)
const sliderXToN = (x: number) => {
  const t = (x - SLIDER_LEFT) / (SLIDER_RIGHT - SLIDER_LEFT)
  const clampedT = Math.max(0, Math.min(1, t))
  return Math.round(Math.exp(clampedT * Math.log(N_MAX)))
}

const ROLLS_PER_FRAME = 4

function rollDie() {
  return 1 + Math.floor(Math.random() * 6)
}

function narrate(n: number, mean: number | null, autoRunning: boolean): { text: string; priority: 'normal' | 'high' } {
  if (n === 0) {
    return {
      text: 'No rolls yet. Press the roll button to add a roll, or start auto-run to fill up to the target sample size. The expected value is three point five, the dotted horizontal ruler.',
      priority: 'normal',
    }
  }
  const dist = Math.abs((mean ?? 0) - 3.5)
  if (n >= 200 && dist < 0.1) {
    return {
      text: `After ${n} rolls the sample mean is ${mean!.toFixed(3)}, within a tenth of the expected value three point five. The law of large numbers in action.`,
      priority: 'high',
    }
  }
  return {
    text: `After ${n} roll${n === 1 ? '' : 's'} the running sample mean is ${mean!.toFixed(3)}. ${autoRunning ? 'Auto-run in progress.' : 'Press roll to add another, or auto-run to fill to target.'}`,
    priority: 'normal',
  }
}

export function LawOfLargeNumbers() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const sliderHandleRef = useRef<SVGGElement | null>(null)

  // History of running means after each roll (indexed by roll count - 1).
  // Stored in a ref to avoid copying a long array on every push; React state
  // tracks just the count so the chart re-renders.
  const meansRef = useRef<number[]>([])
  const runningSumRef = useRef(0)
  const [count, setCount] = useState(0)
  const [target, setTarget] = useState(100)
  const [autoRunning, setAutoRunning] = useState(false)
  const startTargetRef = useRef<number | null>(null)

  const doRoll = useCallback(() => {
    const r = rollDie()
    runningSumRef.current += r
    const nextCount = meansRef.current.length + 1
    meansRef.current.push(runningSumRef.current / nextCount)
    setCount(nextCount)
  }, [])

  const reset = useCallback(() => {
    meansRef.current = []
    runningSumRef.current = 0
    setCount(0)
    setAutoRunning(false)
  }, [])

  const updateTarget = useCallback((v: number) => {
    setTarget(Math.max(N_MIN, Math.min(N_MAX, Math.round(v))))
  }, [])

  // Auto-run loop — adds rolls each animation frame until count reaches target.
  useEffect(() => {
    if (!autoRunning) return
    let raf = 0
    const step = () => {
      const remaining = target - meansRef.current.length
      if (remaining <= 0) {
        setAutoRunning(false)
        return
      }
      const batch = Math.min(ROLLS_PER_FRAME, remaining)
      for (let i = 0; i < batch; i++) {
        const r = rollDie()
        runningSumRef.current += r
        const nextCount = meansRef.current.length + 1
        meansRef.current.push(runningSumRef.current / nextCount)
      }
      setCount(meansRef.current.length)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [autoRunning, target])

  const bindSlider = useDrag(({ first, movement: [mx] }) => {
    if (first) startTargetRef.current = target
    const start = startTargetRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const dxSvg = mx * sx
    const startX = nToSliderX(start)
    const newX = Math.max(SLIDER_LEFT, Math.min(SLIDER_RIGHT, startX + dxSvg))
    updateTarget(sliderXToN(newX))
  })

  useKeyNudge(
    sliderHandleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        // Multiplicative step on log scale: 1.2x per nudge, 2x for shift.
        const factor = Math.abs(dx) >= 10 ? 2 : 1.2
        updateTarget(dx > 0 ? target * factor : target / factor)
      },
      [target, updateTarget],
    ),
  )

  const means = meansRef.current
  const lastMean = means.length > 0 ? means[means.length - 1] : null
  // Build a polyline path from means. Map roll-index 1..count to x-position
  // on the plot using a log scale so early wobbles are visible.
  const indexToX = (i: number) =>
    PLOT_LEFT + (Math.log(i + 1) / Math.log(Math.max(N_MAX, count + 1))) * PLOT_W

  // For performance, sample down if count is large (we only need a few hundred points).
  const samples = (() => {
    if (means.length <= 400) {
      return means.map((m, i) => ({ x: indexToX(i + 1), y: yToPx(m) }))
    }
    const stride = Math.ceil(means.length / 400)
    const out: { x: number; y: number }[] = []
    for (let i = 0; i < means.length; i += stride) {
      out.push({ x: indexToX(i + 1), y: yToPx(means[i]) })
    }
    // Always include the last point.
    if (out.length === 0 || out[out.length - 1].x !== indexToX(means.length)) {
      out.push({ x: indexToX(means.length), y: yToPx(means[means.length - 1]) })
    }
    return out
  })()

  const polylinePts = samples.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const narration = narrate(count, lastMean, autoRunning)
  const sliderX = nToSliderX(target)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration.text}
        priority={narration.priority}
        isInteracting={autoRunning}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Law of large numbers: ${count} rolls, running mean ${lastMean === null ? 'none' : lastMean.toFixed(3)}, target ${target}.`}
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
          Roll a die. Watch the average converge.
        </text>

        {/* Plot frame */}
        <rect
          x={PLOT_LEFT}
          y={PLOT_TOP}
          width={PLOT_W}
          height={PLOT_H}
          fill="transparent"
          stroke="var(--color-graph-fade)"
          strokeWidth="0.6"
        />
        {/* Y-axis ticks at 1,2,3,4,5,6 with the 3.5 line emphasized */}
        {[1, 2, 3, 4, 5, 6].map((v) => (
          <g key={v}>
            <line
              x1={PLOT_LEFT - 4}
              y1={yToPx(v)}
              x2={PLOT_LEFT}
              y2={yToPx(v)}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.8"
            />
            <text
              x={PLOT_LEFT - 8}
              y={yToPx(v) + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {v}
            </text>
          </g>
        ))}
        {/* The 3.5 line — vermilion dashed, the asymptote */}
        <line
          x1={PLOT_LEFT}
          y1={yToPx(3.5)}
          x2={PLOT_RIGHT}
          y2={yToPx(3.5)}
          stroke="var(--color-vermilion)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <text
          x={PLOT_RIGHT + 6}
          y={yToPx(3.5) + 4}
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          E[X] = 3.5
        </text>

        {/* Running-mean polyline */}
        {samples.length > 1 && (
          <polyline
            points={polylinePts}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        )}
        {samples.length === 1 && (
          <circle cx={samples[0].x} cy={samples[0].y} r="3" fill="var(--color-ink)" />
        )}

        {/* X-axis label */}
        <text
          x={(PLOT_LEFT + PLOT_RIGHT) / 2}
          y={PLOT_BOTTOM + 16}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          NUMBER OF ROLLS (LOG SCALE)
        </text>

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            SAMPLE MEAN AFTER {count} ROLL{count === 1 ? '' : 'S'}
          </text>
          <text y={22} fontFamily="JetBrains Mono, monospace" fontSize="16" fill="var(--color-vermilion)">
            {lastMean === null ? '—' : lastMean.toFixed(3)}
          </text>
        </g>

        {/* Buttons */}
        <g transform="translate(80, 320)">
          <RollButton onClick={doRoll} label="Roll" x={0} />
          <RollButton
            onClick={() => setAutoRunning((v) => !v)}
            label={autoRunning ? 'Pause' : 'Auto-run'}
            x={80}
            primary
          />
          <RollButton onClick={reset} label="Reset" x={180} />
        </g>

        {/* Target slider */}
        <g>
          <text
            x={SLIDER_LEFT}
            y={SLIDER_Y - 14}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            TARGET SAMPLE SIZE — {target}
          </text>
          <line
            x1={SLIDER_LEFT}
            y1={SLIDER_Y}
            x2={SLIDER_RIGHT}
            y2={SLIDER_Y}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
          {[1, 10, 100, 1000].map((v) => (
            <g key={v}>
              <line
                x1={nToSliderX(v)}
                y1={SLIDER_Y - 5}
                x2={nToSliderX(v)}
                y2={SLIDER_Y + 5}
                stroke="var(--color-graph-ink)"
                strokeWidth="0.8"
              />
              <text
                x={nToSliderX(v)}
                y={SLIDER_Y + 20}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fill="var(--color-dim)"
              >
                {v}
              </text>
            </g>
          ))}
          <g
            {...bindSlider()}
            ref={sliderHandleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Target sample size. Currently ${target}. Drag or arrow-key to change.`}
            aria-valuemin={N_MIN}
            aria-valuemax={N_MAX}
            aria-valuenow={target}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={sliderX} cy={SLIDER_Y} r="20" fill="transparent" />
            <circle
              cx={sliderX}
              cy={SLIDER_Y}
              r="7"
              fill="var(--color-vermilion)"
              stroke="var(--color-cream)"
              strokeWidth="2"
            />
          </g>
        </g>

        {/* Help text */}
        <text
          x={SLIDER_LEFT}
          y={VIEW_H - 14}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          ROLL · AUTO-RUN · RESET · DRAG SLIDER FOR TARGET N
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3 — The sample mean lurches, then settles on E[X]
      </figcaption>
    </figure>
  )
}

function RollButton({
  onClick,
  label,
  x,
  primary = false,
}: {
  onClick: () => void
  label: string
  x: number
  primary?: boolean
}) {
  const W = primary ? 90 : 70
  return (
    <g
      transform={`translate(${x}, 0)`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      tabIndex={0}
      role="button"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
    >
      <rect
        x={0}
        y={0}
        width={W}
        height={28}
        rx={3}
        fill={primary ? 'var(--color-vermilion)' : 'transparent'}
        stroke={primary ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
        strokeWidth="1.2"
      />
      <text
        x={W / 2}
        y={18}
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="11"
        letterSpacing="0.12em"
        fill={primary ? 'var(--color-cream)' : 'var(--color-ink)'}
      >
        {label.toUpperCase()}
      </text>
    </g>
  )
}
