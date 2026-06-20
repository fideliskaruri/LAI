import { useCallback, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { VIEW_W, VIEW_H, ppoReward, ppoKl, fmt2 } from './rlhf'

/**
 * Act 5 — PPO. Schulman, Wolski, Dhariwal, Radford, Klimov · OpenAI ·
 * Proximal Policy Optimization Algorithms, arXiv:1707.06347, July 2017.
 *
 *  Left  : a stylised diagram of the PPO update loop — sample, score with
 *          reward model, compute advantage, take a clipped gradient step,
 *          repeat. A step button advances one PPO iteration; the highlighted
 *          stage cycles around the ring.
 *  Right : two curves. The policy's reward over training (rises). Its KL
 *          divergence from the base model (also rises — the risk). A
 *          vermilion dot sits on each curve at the current step.
 *
 * Left-drives-right: the step counter drives the curves.
 */

export interface PpoState {
  step: number
  interacting: boolean
}

export const INITIAL_PPO: PpoState = { step: 0, interacting: false }

const TOTAL_STEPS = 40
const STAGES = [
  { label: 'SAMPLE', sub: 'roll out the current policy on prompts' },
  { label: 'SCORE', sub: 'reward model assigns r per response' },
  { label: 'ADVANTAGE', sub: 'how much better than the baseline?' },
  { label: 'CLIPPED STEP', sub: "gradient step, ratio clipped to ±ε" },
] as const

// Keep β fixed at 0.18 here — Act 6 explores varying it.
const BETA = 0.18

/* ============================================================== */
/* LEFT PANE — PPO loop ring with step button                      */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: PpoState
  onChange: (s: PpoState) => void
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

  const stageIdx = state.step % STAGES.length
  const cx = VIEW_W / 2
  const cy = 220
  const R = 110

  const nodes = STAGES.map((s, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / STAGES.length
    return {
      ...s,
      x: cx + R * Math.cos(angle),
      y: cy + R * Math.sin(angle),
      active: i === stageIdx,
    }
  })

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The PPO loop. Sample, score with the reward model, compute advantage, take a clipped gradient step, repeat. Current iteration ${state.step} of ${TOTAL_STEPS}. The highlighted stage is ${STAGES[stageIdx].label.toLowerCase()}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`PPO update loop. Step ${state.step} of ${TOTAL_STEPS}. Active stage: ${STAGES[stageIdx].label}.`}
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
          PPO · ONE LOOP, REPEATED
        </text>

        {/* The ring */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1.4"
          strokeDasharray="4 4"
        />

        {/* Arrows around the ring */}
        {nodes.map((n, i) => {
          const next = nodes[(i + 1) % nodes.length]
          // Arc midpoint angle for the arrow
          const a1 = Math.atan2(n.y - cy, n.x - cx)
          const a2 = Math.atan2(next.y - cy, next.x - cx)
          const am = a1 + ((a2 - a1 + 2 * Math.PI) % (2 * Math.PI)) / 2
          const ax = cx + (R + 18) * Math.cos(am)
          const ay = cy + (R + 18) * Math.sin(am)
          return (
            <text
              key={`arr-${i}`}
              x={ax}
              y={ay + 4}
              textAnchor="middle"
              fontFamily="Source Serif 4, Georgia, serif"
              fontSize="16"
              fill="var(--color-vermilion)"
            >
              →
            </text>
          )
        })}

        {/* Nodes */}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r="36"
              fill={n.active ? 'var(--color-vermilion)' : 'var(--color-cream)'}
              stroke={n.active ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
              strokeWidth="1.6"
            />
            <text
              x={n.x}
              y={n.y + 4}
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontSize="10"
              fontWeight="600"
              letterSpacing="0.14em"
              fill={n.active ? 'var(--color-cream)' : 'var(--color-ink)'}
            >
              {n.label}
            </text>
          </g>
        ))}

        {/* Active stage description */}
        <text
          x={cx}
          y={cy + R + 60}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          {STAGES[stageIdx].sub}
        </text>

        {/* Step controls */}
        <g
          ref={stepRef}
          tabIndex={0}
          role="group"
          aria-label="PPO step controls"
          style={{ outline: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_.ppo-btn]:stroke-vermilion-deep"
        >
          <g onClick={advance} style={{ cursor: 'pointer' }}>
            <rect
              className="ppo-btn"
              x={cx - 110}
              y="410"
              width="120"
              height="38"
              fill="var(--color-vermilion)"
              stroke="var(--color-vermilion)"
              strokeWidth="1.4"
              rx="3"
            />
            <text
              x={cx - 50}
              y="434"
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
              className="ppo-btn"
              x={cx + 10}
              y="410"
              width="100"
              height="38"
              fill="var(--color-cream)"
              stroke="var(--color-graph-ink)"
              strokeWidth="1.4"
              rx="3"
            />
            <text
              x={cx + 60}
              y="434"
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
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5a &mdash; The loop, four moves around
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — reward curve + KL curve, dot moves                 */
/* ============================================================== */

export function RightPane({ state }: { state: PpoState }) {
  // Two stacked plots.
  const PX0 = 90
  const PX1 = VIEW_W - 60
  const PW = PX1 - PX0
  const REWARD_Y0 = 70
  const REWARD_Y1 = 230
  const KL_Y0 = 280
  const KL_Y1 = 430

  const samples = Array.from({ length: TOTAL_STEPS + 1 }, (_, i) => i)
  const rewardPath = samples
    .map((s) => {
      const x = PX0 + (s / TOTAL_STEPS) * PW
      const r = ppoReward(s, TOTAL_STEPS, 0.18)
      const y = REWARD_Y1 - r * (REWARD_Y1 - REWARD_Y0)
      return `${s === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
  const klPath = samples
    .map((s) => {
      const x = PX0 + (s / TOTAL_STEPS) * PW
      const k = ppoKl(s, TOTAL_STEPS, 0.18)
      const norm = Math.min(1, k / 2.5)
      const y = KL_Y1 - norm * (KL_Y1 - KL_Y0)
      return `${s === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')

  const sNow = Math.min(state.step, TOTAL_STEPS)
  const rewardNow = ppoReward(sNow, TOTAL_STEPS, BETA)
  const klNow = ppoKl(sNow, TOTAL_STEPS, BETA)
  const xNow = PX0 + (sNow / TOTAL_STEPS) * PW
  const rewardYNow = REWARD_Y1 - rewardNow * (REWARD_Y1 - REWARD_Y0)
  const klYNow = KL_Y1 - Math.min(1, klNow / 2.5) * (KL_Y1 - KL_Y0)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Two curves over training steps. The top is the policy's average reward — it rises, with diminishing returns. The bottom is the KL divergence from the base model — it also rises, which is the risk. At step ${sNow}, reward is ${fmt2(rewardNow).trim()} and KL is ${fmt2(klNow).trim()}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Reward and KL curves. Step ${sNow} of ${TOTAL_STEPS}. Reward ${fmt2(rewardNow).trim()}. KL ${fmt2(klNow).trim()}.`}
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
          TWO CURVES · ONE GOES UP, ONE GOES UP
        </text>

        {/* Reward plot */}
        <text
          x={PX0}
          y={REWARD_Y0 - 12}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          REWARD ↑
        </text>
        <line x1={PX0} y1={REWARD_Y1} x2={PX1} y2={REWARD_Y1} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <line x1={PX0} y1={REWARD_Y0} x2={PX0} y2={REWARD_Y1} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <path d={rewardPath} stroke="var(--color-vermilion)" strokeWidth="2" fill="none" />
        <line
          x1={xNow}
          y1={REWARD_Y0}
          x2={xNow}
          y2={REWARD_Y1}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <circle cx={xNow} cy={rewardYNow} r="6" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
        <text
          x={xNow}
          y={rewardYNow - 14}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-vermilion)"
        >
          {fmt2(rewardNow).trim()}
        </text>

        {/* KL plot */}
        <text
          x={PX0}
          y={KL_Y0 - 12}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-graph-ink)"
        >
          KL FROM BASE ↑
        </text>
        <line x1={PX0} y1={KL_Y1} x2={PX1} y2={KL_Y1} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <line x1={PX0} y1={KL_Y0} x2={PX0} y2={KL_Y1} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <path d={klPath} stroke="var(--color-graph-ink)" strokeWidth="2" fill="none" />
        <line
          x1={xNow}
          y1={KL_Y0}
          x2={xNow}
          y2={KL_Y1}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <circle cx={xNow} cy={klYNow} r="6" fill="var(--color-graph-ink)" stroke="var(--color-cream)" strokeWidth="2" />
        <text
          x={xNow}
          y={klYNow - 14}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-graph-ink)"
        >
          {fmt2(klNow).trim()}
        </text>

        {/* X axis label */}
        <text
          x={(PX0 + PX1) / 2}
          y={KL_Y1 + 28}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          PPO ITERATIONS →
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 14}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          climbing reward · drifting from base
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5b &mdash; The risk lives in the lower curve
      </figcaption>
    </figure>
  )
}
