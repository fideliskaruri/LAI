import { useCallback, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  REFLECTION_TRACE,
  clamp,
} from './agents'

/**
 * Act 5 — reflection (Shinn et al., March 2023).
 *
 *  Left  : a stack of attempt cards. The agent attempts the anagram TEORS,
 *          is rejected, reflects, retries. The user steps one attempt at a
 *          time and sees the model's guess, the verdict, and the written
 *          reflection that follows.
 *  Right : an accuracy curve over iterations. The vermilion dot tracks the
 *          current step and the line climbs to 1.0 by iteration 6.
 *
 * Co-mutating: the iteration index drives both panes (we use
 * left-drives-right wiring + co-mutation in the route's act spec).
 */

export interface ReflectionState {
  step: number
  interacting: boolean
}

export const INITIAL_REFLECTION: ReflectionState = {
  step: 0,
  interacting: false,
}

const N = REFLECTION_TRACE.length

/* ============================================================== */
/* LEFT PANE — attempt cards                                       */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: ReflectionState
  onChange: (s: ReflectionState) => void
}) {
  const buttonRef = useRef<SVGGElement | null>(null)

  const advance = useCallback(() => {
    onChange({ step: clamp(state.step + 1, 0, N - 1), interacting: false })
  }, [state.step, onChange])

  const retreat = useCallback(() => {
    onChange({ step: clamp(state.step - 1, 0, N - 1), interacting: false })
  }, [state.step, onChange])

  useKeyNudge(
    buttonRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        if (dx > 0) advance()
        else retreat()
      },
      [advance, retreat],
    ),
  )

  const current = REFLECTION_TRACE[state.step]
  const verdictColor =
    current.verdict === 'right'
      ? 'var(--color-vermilion)'
      : current.verdict === 'closer'
        ? 'var(--color-vermilion-deep)'
        : 'var(--color-graph-ink)'

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Attempt ${state.step + 1} of ${N}. The model guessed ${current.guess}; the verifier says ${current.verdict}. ${
          current.reflection
            ? 'The reflection has been written.'
            : 'No reflection needed — the answer was correct.'
        }`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Reflexion attempt ${state.step + 1} of ${N} on the anagram TEORS.`}
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />

        <text
          x={VIEW_W / 2}
          y="40"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TASK · ANAGRAM · TEORS
        </text>
        <text
          x={VIEW_W / 2}
          y="62"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          “Rearrange TEORS into a common English word.”
        </text>

        {/* Attempt card */}
        <rect
          x="40"
          y="92"
          width={VIEW_W - 80}
          height="106"
          rx="3"
          fill="#fff0e7"
          stroke="var(--color-vermilion)"
          strokeWidth="1.6"
        />
        <text
          x="56"
          y="116"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          ATTEMPT {state.step + 1} · GUESS
        </text>
        <text
          x="56"
          y="160"
          fontFamily="JetBrains Mono, monospace"
          fontSize="28"
          fontWeight="600"
          fill="var(--color-ink)"
          letterSpacing="0.18em"
        >
          {current.guess}
        </text>
        <text
          x={VIEW_W - 56}
          y="160"
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill={verdictColor}
        >
          VERDICT · {current.verdict.toUpperCase()}
        </text>

        {/* Reflection card */}
        {current.reflection && (
          <g>
            <rect
              x="40"
              y="218"
              width={VIEW_W - 80}
              height="124"
              rx="3"
              fill="var(--color-cream)"
              stroke="var(--color-graph-ink)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <text
              x="56"
              y="240"
              fontFamily="Inter, sans-serif"
              fontSize="9"
              letterSpacing="0.22em"
              fill="var(--color-dim)"
            >
              REFLECTION · WRITTEN, NOT BACKPROP
            </text>
            <foreignObject x="56" y="252" width={VIEW_W - 112} height="84">
              <p
                style={{
                  margin: 0,
                  fontFamily: 'Source Serif 4, Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: 'var(--color-ink)',
                }}
              >
                {current.reflection}
              </p>
            </foreignObject>
          </g>
        )}
        {!current.reflection && (
          <text
            x={VIEW_W / 2}
            y="278"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-vermilion)"
          >
            answer correct · loop closes
          </text>
        )}

        {/* Step button */}
        <g
          ref={buttonRef}
          tabIndex={0}
          role="button"
          aria-label={`Step. Attempt ${state.step + 1} of ${N}.`}
          onClick={advance}
          style={{ cursor: state.step < N - 1 ? 'pointer' : 'default' }}
          className="focus-visible:outline-none [&:focus-visible_.rframe]:stroke-vermilion-deep"
        >
          <rect
            className="rframe"
            x={VIEW_W - 168}
            y={VIEW_H - 56}
            width={130}
            height={36}
            rx="3"
            fill={
              state.step < N - 1 ? 'var(--color-vermilion)' : 'var(--color-cream)'
            }
            stroke={
              state.step < N - 1
                ? 'var(--color-vermilion)'
                : 'var(--color-graph-fade)'
            }
            strokeWidth="1.4"
          />
          <text
            x={VIEW_W - 103}
            y={VIEW_H - 33}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill={
              state.step < N - 1 ? 'var(--color-cream)' : 'var(--color-dim)'
            }
          >
            {state.step < N - 1 ? 'NEXT ATTEMPT →' : 'SOLVED'}
          </text>
        </g>

        <text
          x="40"
          y={VIEW_H - 30}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ATTEMPT {state.step + 1} / {N}
        </text>
        <text
          x="40"
          y={VIEW_H - 14}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          arrows nudge · tap to step
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5a &mdash; Try, fail, write down why, try again
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — accuracy curve                                     */
/* ============================================================== */

export function RightPane({ state }: { state: ReflectionState }) {
  const PAD_L = 70
  const PAD_R = 50
  const PAD_T = 100
  const PAD_B = 100
  const plotW = VIEW_W - PAD_L - PAD_R
  const plotH = VIEW_H - PAD_T - PAD_B

  const xAt = (iter: number) => PAD_L + (iter / (N - 1)) * plotW
  const yAt = (acc: number) => PAD_T + (1 - acc) * plotH

  const pathD = REFLECTION_TRACE.map(
    (p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p.iter)} ${yAt(p.accuracy)}`,
  ).join(' ')

  const current = REFLECTION_TRACE[state.step]

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Accuracy on a held-out anagram suite, plotted against reflection iteration. Currently at iteration ${current.iter}, accuracy ${(current.accuracy * 100).toFixed(0)}%. The curve climbs as the agent accumulates written reflections.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Reflection accuracy curve, current iteration ${current.iter}, accuracy ${(current.accuracy * 100).toFixed(0)} percent.`}
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />

        <text
          x={VIEW_W / 2}
          y="40"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          REFLEXION · SHINN ET AL. · MARCH 2023
        </text>
        <text
          x={VIEW_W / 2}
          y="62"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          accuracy climbs without a single weight update
        </text>

        {/* Axes */}
        <line
          x1={PAD_L}
          y1={PAD_T}
          x2={PAD_L}
          y2={PAD_T + plotH}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        <line
          x1={PAD_L}
          y1={PAD_T + plotH}
          x2={PAD_L + plotW}
          y2={PAD_T + plotH}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />

        {/* y-tick labels */}
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line
              x1={PAD_L - 4}
              y1={yAt(v)}
              x2={PAD_L + 4}
              y2={yAt(v)}
              stroke="var(--color-graph-ink)"
              strokeWidth="1"
            />
            <text
              x={PAD_L - 8}
              y={yAt(v) + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* x-tick labels */}
        {REFLECTION_TRACE.map((p) => (
          <g key={p.iter}>
            <line
              x1={xAt(p.iter)}
              y1={PAD_T + plotH}
              x2={xAt(p.iter)}
              y2={PAD_T + plotH + 4}
              stroke="var(--color-graph-ink)"
              strokeWidth="1"
            />
            <text
              x={xAt(p.iter)}
              y={PAD_T + plotH + 18}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {p.iter}
            </text>
          </g>
        ))}
        <text
          x={PAD_L + plotW / 2}
          y={PAD_T + plotH + 36}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          REFLECTION ITERATIONS
        </text>
        <text
          x={PAD_L - 50}
          y={PAD_T + plotH / 2}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
          transform={`rotate(-90 ${PAD_L - 50} ${PAD_T + plotH / 2})`}
        >
          ACCURACY
        </text>

        {/* Curve */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--color-vermilion)"
          strokeWidth="2"
        />

        {/* Dots at each iteration */}
        {REFLECTION_TRACE.map((p) => (
          <circle
            key={p.iter}
            cx={xAt(p.iter)}
            cy={yAt(p.accuracy)}
            r="3"
            fill="var(--color-vermilion)"
          />
        ))}

        {/* Active marker */}
        <circle
          cx={xAt(current.iter)}
          cy={yAt(current.accuracy)}
          r="8"
          fill="var(--color-vermilion)"
          stroke="var(--color-cream)"
          strokeWidth="2"
        />

        {/* Readout */}
        <g transform={`translate(${PAD_L + 12}, ${PAD_T + 12})`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            ITER · ACCURACY
          </text>
          <text
            y="22"
            fontFamily="JetBrains Mono, monospace"
            fontSize="14"
            fill="var(--color-vermilion)"
          >
            {current.iter} · {(current.accuracy * 100).toFixed(0)}%
          </text>
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 24}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the weights never change · the prompt does
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5b &mdash; Learning in language, not in weights
      </figcaption>
    </figure>
  )
}
