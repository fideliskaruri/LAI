import { useCallback } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { PixelImage } from './PixelGrid'
import { denoisedImageAt, noisyImageAt, T_STEPS } from './image'

/**
 * Act 6 — Sampling from noise.
 *
 *  Left  : the current sample x_t starting at pure Gaussian noise (t=T) and
 *          getting progressively less noisy as the user clicks "step". After
 *          ~50 reverse steps, the arrow emerges.
 *  Right : a progress strip showing the journey: t still to go, number of
 *          steps taken, and a small "what the model thinks x_0 is right now"
 *          preview.
 *
 * Co-mutating so the step counter shared by both panes lives in one place.
 */

const VIEW_W = 600
const VIEW_H = 480

const TOTAL_STEPS = 50

export interface SamplingState {
  step: number // 0 = pure noise; TOTAL_STEPS = fully denoised
}

export const INITIAL_SAMPLING: SamplingState = { step: 0 }

/** Map step -> t for the discretized reverse chain. */
function stepToT(step: number): number {
  // step=0 → t = T_STEPS (pure noise); step=TOTAL_STEPS → t = 0 (clean).
  const frac = step / TOTAL_STEPS
  return Math.round(T_STEPS * (1 - frac))
}

function narrateLeft(step: number): { text: string; priority: 'normal' | 'high' } {
  if (step === 0) {
    return {
      text: 'Step zero. Pure Gaussian noise — there is no structure in the image yet.',
      priority: 'high',
    }
  }
  if (step >= TOTAL_STEPS) {
    return {
      text: 'Step fifty. The reverse process has finished — the arrow has emerged from noise.',
      priority: 'high',
    }
  }
  return {
    text: `Step ${step} of fifty. Each click removes a little of the predicted noise.`,
    priority: 'normal',
  }
}

export function LeftPane({
  state,
  onChange,
}: {
  state: SamplingState
  onChange: (s: SamplingState) => void
}) {
  const t = stepToT(state.step)
  // As we take reverse steps, the sample becomes progressively cleaner. We
  // model this with a strength parameter that ramps up with the step count.
  const cleanness = state.step / TOTAL_STEPS
  const pixels =
    state.step === 0
      ? noisyImageAt(T_STEPS)
      : denoisedImageAt(t, cleanness)
  const handleStep = useCallback(() => {
    if (state.step >= TOTAL_STEPS) return
    onChange({ step: state.step + 1 })
  }, [state.step, onChange])
  const handleReset = useCallback(() => onChange({ step: 0 }), [onChange])
  const narration = narrateLeft(state.step)

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration.text} priority={narration.priority} />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Reverse sample at step ${state.step} of ${TOTAL_STEPS}. Diffusion-step index t equals ${t}.`}
      >
        <text
          x={VIEW_W / 2}
          y="46"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          SAMPLE &middot; x_t
        </text>

        <PixelImage pixels={pixels} cx={VIEW_W / 2} cy={210} cell={17} />

        <text
          x={VIEW_W / 2}
          y={356}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="14"
          fill="var(--color-ink)"
        >
          step {state.step} / {TOTAL_STEPS} &middot; t = {t}
        </text>

        {/* Step button */}
        <g
          tabIndex={0}
          role="button"
          aria-label={`Take one reverse diffusion step. ${TOTAL_STEPS - state.step} steps remaining.`}
          onClick={handleStep}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleStep()
            }
          }}
          style={{ cursor: state.step >= TOTAL_STEPS ? 'default' : 'pointer' }}
          className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
        >
          <rect
            x={VIEW_W / 2 - 120}
            y={388}
            width="140"
            height="36"
            rx="4"
            fill={state.step >= TOTAL_STEPS ? 'var(--color-cream)' : 'var(--color-vermilion)'}
            stroke="var(--color-vermilion)"
            strokeWidth="1.4"
            opacity={state.step >= TOTAL_STEPS ? 0.4 : 1}
          />
          <text
            x={VIEW_W / 2 - 50}
            y={411}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="11"
            letterSpacing="0.22em"
            fill={state.step >= TOTAL_STEPS ? 'var(--color-dim)' : 'var(--color-cream)'}
          >
            {state.step >= TOTAL_STEPS ? 'DONE' : 'STEP →'}
          </text>
        </g>

        {/* Reset button */}
        <g
          tabIndex={0}
          role="button"
          aria-label="Reset sampling to pure noise."
          onClick={handleReset}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleReset()
            }
          }}
          style={{ cursor: 'pointer' }}
          className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
        >
          <rect
            x={VIEW_W / 2 + 10}
            y={388}
            width="110"
            height="36"
            rx="4"
            fill="var(--color-cream)"
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
          <text
            x={VIEW_W / 2 + 65}
            y={411}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="11"
            letterSpacing="0.22em"
            fill="var(--color-ink)"
          >
            RESET
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5a &mdash; Click. Click. Click. Something appears.
      </figcaption>
    </figure>
  )
}

export function RightPane({ state }: { state: SamplingState }) {
  const progress = state.step / TOTAL_STEPS
  const t = stepToT(state.step)
  const PLOT_X0 = 80
  const PLOT_X1 = VIEW_W - 60
  const RAIL_Y = 200
  const railX = PLOT_X0 + progress * (PLOT_X1 - PLOT_X0)
  // Mini thumbnails at four checkpoints
  const checkpoints = [
    { step: 0, label: 'noise' },
    { step: 10, label: 'glimmer' },
    { step: 25, label: 'shape' },
    { step: 50, label: 'arrow' },
  ]

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Progress meter and journey strip. The reverse walk is ${(progress * 100).toFixed(0)} percent complete. Four checkpoint thumbnails below show the typical trajectory from pure noise to a recognizable image.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Sampling progress: ${state.step} of ${TOTAL_STEPS} reverse steps taken.`}
      >
        <text
          x={VIEW_W / 2}
          y="46"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE REVERSE WALK
        </text>

        {/* Progress rail */}
        <text
          x={PLOT_X0}
          y={RAIL_Y - 22}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          PROGRESS
        </text>
        <line x1={PLOT_X0} y1={RAIL_Y} x2={PLOT_X1} y2={RAIL_Y} stroke="var(--color-graph-fade)" strokeWidth="4" strokeLinecap="round" />
        <line x1={PLOT_X0} y1={RAIL_Y} x2={railX} y2={RAIL_Y} stroke="var(--color-vermilion)" strokeWidth="4" strokeLinecap="round" />
        <circle cx={railX} cy={RAIL_Y} r="8" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />

        <text x={PLOT_X0} y={RAIL_Y + 28} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
          t = {T_STEPS}
        </text>
        <text x={PLOT_X1} y={RAIL_Y + 28} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
          t = 0
        </text>
        <text
          x={(PLOT_X0 + PLOT_X1) / 2}
          y={RAIL_Y + 28}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-ink)"
        >
          t = {t}
        </text>

        {/* Checkpoint thumbnails */}
        <text
          x={PLOT_X0}
          y={290}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          CHECKPOINTS
        </text>

        {checkpoints.map((cp, i) => {
          const cx = PLOT_X0 + 40 + i * 120
          const cy = 360
          const reached = state.step >= cp.step
          const cpT = stepToT(cp.step)
          const cleanness = cp.step / TOTAL_STEPS
          const pixels = cp.step === 0 ? noisyImageAt(T_STEPS) : denoisedImageAt(cpT, cleanness)
          return (
            <g key={cp.step} opacity={reached ? 1 : 0.35}>
              <PixelImage pixels={pixels} cx={cx} cy={cy} cell={4} />
              <text
                x={cx}
                y={cy + 50}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fill={reached ? 'var(--color-vermilion)' : 'var(--color-dim)'}
              >
                {cp.step}
              </text>
              <text
                x={cx}
                y={cy + 64}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="11"
                fill="var(--color-dim)"
              >
                {cp.label}
              </text>
            </g>
          )
        })}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 18}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          x_(t&minus;1) = x_t &minus; predicted noise
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5b &mdash; The journey from pure noise to a picture
      </figcaption>
    </figure>
  )
}
