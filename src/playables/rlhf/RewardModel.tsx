import { useCallback, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  PREFERENCE_BANK,
  bradleyTerry,
  rewardScatter,
  fmt2,
  fmtInt,
} from './rlhf'

/**
 * Act 4 — the reward model.
 *
 *  Left  : a small reward-model card. Input = (prompt, response). Output =
 *          a scalar reward. A step button advances one training example;
 *          each comparison nudges the model. The Bradley-Terry pair-loss
 *          P(A > B) = σ(r(A) − r(B)) appears at the bottom.
 *  Right : a scatter plot of (human rank vs reward-model score). Starts
 *          noisy. As training advances, the cloud tightens toward the
 *          diagonal.
 *
 * Left-drives-right: the step counter on the left is the source; the right
 * pane is a derived scatter at that progress level.
 */

export interface RmState {
  /** Number of training comparisons absorbed so far. */
  step: number
  interacting: boolean
}

export const INITIAL_RM: RmState = { step: 0, interacting: false }

const TOTAL_STEPS = 32
const PROGRESS_SCALE = (s: number) => Math.min(1, s / TOTAL_STEPS)

/* ============================================================== */
/* LEFT PANE — reward-model card                                   */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: RmState
  onChange: (s: RmState) => void
}) {
  const stepRef = useRef<SVGGElement | null>(null)

  const advance = useCallback(
    () => onChange({ step: state.step + 1, interacting: false }),
    [state.step, onChange],
  )
  const reset = useCallback(() => onChange({ step: 0, interacting: false }), [onChange])

  useKeyNudge(
    stepRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        if (dx > 0) advance()
        else reset()
      },
      [advance, reset],
    ),
  )

  const pair = PREFERENCE_BANK[state.step % PREFERENCE_BANK.length]
  const progress = PROGRESS_SCALE(state.step)
  // Stylised: as progress grows, the model's r(A) and r(B) become more aligned
  // with the gold label. Start near 0 with noise; end with confident split.
  const baseGood = 0.2 + 1.6 * progress
  const baseBad = -0.1 - 0.7 * progress
  const rA = pair.gold === 'a' ? baseGood : baseBad
  const rB = pair.gold === 'b' ? baseGood : baseBad
  const probAOverB = bradleyTerry(rA, rB)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A small reward model in training. Step ${state.step}. The Bradley-Terry pair-loss says the probability that the model prefers A over B equals the logistic of r of A minus r of B. With current weights, that probability is ${(probAOverB * 100).toFixed(0)} percent.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Reward model card. Step ${state.step} of ${TOTAL_STEPS}. P(A > B) is ${(probAOverB * 100).toFixed(0)} percent.`}
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />

        <text
          x={VIEW_W / 2}
          y="34"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          A JUDGE LEARNS TO JUDGE
        </text>

        {/* Card frame */}
        <rect
          x="40"
          y="60"
          width={VIEW_W - 80}
          height={280}
          fill="var(--color-paper)"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x="60"
          y="90"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          INPUT · (PROMPT, RESPONSE)
        </text>
        <text
          x="60"
          y="112"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          {pair.prompt}
        </text>

        {/* Two response chips with their scalar rewards */}
        <g>
          <RewardChip
            x={60}
            y={140}
            width={(VIEW_W - 140) / 2}
            label="A"
            value={rA}
            highlight={pair.gold === 'a'}
          />
          <RewardChip
            x={VIEW_W / 2 + 10}
            y={140}
            width={(VIEW_W - 140) / 2}
            label="B"
            value={rB}
            highlight={pair.gold === 'b'}
          />
        </g>

        {/* Bradley-Terry */}
        <line
          x1="60"
          y1="246"
          x2={VIEW_W - 60}
          y2="246"
          stroke="var(--color-graph-fade)"
          strokeWidth="0.8"
        />

        <text
          x="60"
          y="268"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          BRADLEY-TERRY PAIR-LOSS
        </text>
        <text
          x="60"
          y="292"
          fontFamily="JetBrains Mono, monospace"
          fontSize="14"
          fill="var(--color-paper-ink)"
        >
          P(A &gt; B) = σ(r(A) − r(B)) = σ({fmt2(rA - rB).trim()})
        </text>
        <text
          x="60"
          y="316"
          fontFamily="JetBrains Mono, monospace"
          fontSize="14"
          fill="var(--color-vermilion)"
        >
          = {(probAOverB * 100).toFixed(1)}%
        </text>

        {/* Step controls */}
        <g
          ref={stepRef}
          tabIndex={0}
          role="group"
          aria-label="Reward model training controls"
          style={{ outline: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_.rm-btn]:stroke-vermilion-deep"
        >
          <g onClick={advance} style={{ cursor: 'pointer' }}>
            <rect
              className="rm-btn"
              x={VIEW_W / 2 - 100}
              y="358"
              width="120"
              height="38"
              fill="var(--color-vermilion)"
              stroke="var(--color-vermilion)"
              strokeWidth="1.4"
              rx="3"
            />
            <text
              x={VIEW_W / 2 - 40}
              y="382"
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontSize="11"
              letterSpacing="0.22em"
              fill="var(--color-cream)"
            >
              STEP ▸
            </text>
          </g>
          <g onClick={reset} style={{ cursor: 'pointer' }}>
            <rect
              className="rm-btn"
              x={VIEW_W / 2 + 20}
              y="358"
              width="80"
              height="38"
              fill="var(--color-cream)"
              stroke="var(--color-graph-ink)"
              strokeWidth="1.4"
              rx="3"
            />
            <text
              x={VIEW_W / 2 + 60}
              y="382"
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontSize="11"
              letterSpacing="0.22em"
              fill="var(--color-ink)"
            >
              RESET
            </text>
          </g>
        </g>

        <text
          x="60"
          y={VIEW_H - 22}
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-dim)"
        >
          step {fmtInt(state.step)} / {TOTAL_STEPS}
        </text>
        <text
          x={VIEW_W - 60}
          y={VIEW_H - 22}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          {(progress * 100).toFixed(0)}% TRAINED
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4a &mdash; The reward model, training
      </figcaption>
    </figure>
  )
}

function RewardChip({
  x,
  y,
  width,
  label,
  value,
  highlight,
}: {
  x: number
  y: number
  width: number
  label: string
  value: number
  highlight: boolean
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={92}
        fill={highlight ? '#fff0e7' : 'var(--color-cream)'}
        stroke={highlight ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
        strokeWidth={highlight ? 1.6 : 1}
        rx="2"
      />
      <text
        x={x + 12}
        y={y + 20}
        fontFamily="Inter, sans-serif"
        fontSize="9"
        letterSpacing="0.22em"
        fill="var(--color-dim)"
      >
        RESPONSE {label}
      </text>
      <text
        x={x + 12}
        y={y + 50}
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize="11"
        fill="var(--color-dim)"
      >
        … model output …
      </text>
      <text
        x={x + 12}
        y={y + 78}
        fontFamily="Inter, sans-serif"
        fontSize="9"
        letterSpacing="0.22em"
        fill="var(--color-dim)"
      >
        r =
      </text>
      <text
        x={x + 48}
        y={y + 78}
        fontFamily="JetBrains Mono, monospace"
        fontSize="14"
        fill={highlight ? 'var(--color-vermilion)' : 'var(--color-ink)'}
      >
        {fmt2(value)}
      </text>
    </g>
  )
}

/* ============================================================== */
/* RIGHT PANE — scatter, tightening                                */
/* ============================================================== */

export function RightPane({ state }: { state: RmState }) {
  const progress = PROGRESS_SCALE(state.step)
  const points = rewardScatter(progress)

  // Plot rect
  const PX0 = 100
  const PX1 = VIEW_W - 60
  const PY0 = 100
  const PY1 = 400
  const PW = PX1 - PX0
  const PH = PY1 - PY0
  const xToPx = (x: number) => PX0 + x * PW
  const yToPx = (y: number) => PY1 - y * PH

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A scatter of the reward model's score against the contractor's preference rank. As training advances, the cloud tightens toward the diagonal — the model agrees with the humans more often. Current step ${state.step} of ${TOTAL_STEPS}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Scatter plot of human rank versus model score. Progress ${(progress * 100).toFixed(0)} percent.`}
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />

        <text
          x={VIEW_W / 2}
          y="36"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          MODEL SCORE vs HUMAN RANK
        </text>

        {/* Axes */}
        <line
          x1={PX0}
          y1={PY1}
          x2={PX1}
          y2={PY1}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />
        <line
          x1={PX0}
          y1={PY0}
          x2={PX0}
          y2={PY1}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />
        <text
          x={(PX0 + PX1) / 2}
          y={PY1 + 28}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          HUMAN RANK →
        </text>
        <text
          x={PX0 - 30}
          y={(PY0 + PY1) / 2}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
          transform={`rotate(-90 ${PX0 - 30} ${(PY0 + PY1) / 2})`}
          textAnchor="middle"
        >
          MODEL SCORE →
        </text>

        {/* Diagonal */}
        <line
          x1={xToPx(0)}
          y1={yToPx(0)}
          x2={xToPx(1)}
          y2={yToPx(1)}
          stroke="var(--color-graph-fade)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        <text
          x={xToPx(0.92)}
          y={yToPx(0.95) - 4}
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-dim)"
        >
          perfect agreement
        </text>

        {/* Scatter points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xToPx(p.human)}
            cy={yToPx(p.model)}
            r="4"
            fill="var(--color-vermilion)"
            opacity={0.5 + 0.4 * progress}
          />
        ))}

        {/* Progress bar inside the plot */}
        <g transform={`translate(${PX0}, ${PY0 - 28})`}>
          <rect x="0" y="0" width={PW} height="6" fill="var(--color-graph-fade)" rx="3" />
          <rect
            x="0"
            y="0"
            width={Math.max(2, PW * progress)}
            height="6"
            fill="var(--color-vermilion)"
            rx="3"
          />
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 18}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the cloud finds the line
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4b &mdash; The reward model finds the humans
      </figcaption>
    </figure>
  )
}
