import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  PERMISSION_LADDER,
  clamp,
} from './agents'

/**
 * Act 6 — safety and permissioning.
 *
 *  Left  : a "permission ladder" with four rungs. Drag the vermilion
 *          agent figure up and down. At the bottom: read-only. Then
 *          sandbox-write. Then real-action with approval. At the top:
 *          autonomous.
 *  Right : a risk-of-harm panel that updates with the rung. Short copy
 *          on the open frontier — including Anthropic's Responsible
 *          Scaling Policy and the broader AI safety community.
 *
 * Left-drives-right.
 */

export interface SafetyState {
  level: number // 0..3
  interacting: boolean
}

export const INITIAL_SAFETY: SafetyState = {
  level: 1,
  interacting: false,
}

const MAX_LEVEL = PERMISSION_LADDER.length - 1

/* ============================================================== */
/* LEFT PANE — the ladder with a draggable agent                   */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: SafetyState
  onChange: (s: SafetyState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const knobRef = useRef<SVGGElement | null>(null)
  const startLevelRef = useRef<number | null>(null)

  const setLevel = useCallback(
    (lev: number, interacting: boolean) =>
      onChange({
        level: clamp(Math.round(lev), 0, MAX_LEVEL),
        interacting,
      }),
    [onChange],
  )

  const LADDER_X = VIEW_W / 2
  const LADDER_TOP = 80
  const LADDER_BOTTOM = VIEW_H - 80
  const LADDER_H = LADDER_BOTTOM - LADDER_TOP

  const rungY = (lev: number) =>
    LADDER_BOTTOM - (lev / MAX_LEVEL) * LADDER_H

  const bind = useDrag(({ first, last, movement: [, my] }) => {
    if (first) startLevelRef.current = state.level
    const start = startLevelRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sy = VIEW_H / rect.height
    const deltaLevel = -(my * sy) / (LADDER_H / MAX_LEVEL)
    setLevel(start + deltaLevel, !last)
  })

  useKeyNudge(
    knobRef,
    useCallback(
      (_dx: number, dy: number) => {
        if (dy === 0) return
        setLevel(state.level + Math.sign(dy), false)
      },
      [state.level, setLevel],
    ),
  )

  const activeRung = PERMISSION_LADDER[state.level]

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A permission ladder with four rungs. The agent is currently at level ${state.level}: ${activeRung.label}. ${activeRung.blurb}. Drag the agent up or down the ladder, or use arrow keys.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A permission ladder. Agent at rung ${state.level} of ${MAX_LEVEL}: ${activeRung.label}.`}
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
          THE PERMISSION LADDER
        </text>

        {/* Ladder rails */}
        <line
          x1={LADDER_X - 50}
          y1={LADDER_TOP}
          x2={LADDER_X - 50}
          y2={LADDER_BOTTOM}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
        />
        <line
          x1={LADDER_X + 50}
          y1={LADDER_TOP}
          x2={LADDER_X + 50}
          y2={LADDER_BOTTOM}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
        />

        {/* Rungs and labels */}
        {PERMISSION_LADDER.map((rung) => {
          const y = rungY(rung.level)
          const isActive = rung.level === state.level
          return (
            <g key={rung.level}>
              <line
                x1={LADDER_X - 50}
                y1={y}
                x2={LADDER_X + 50}
                y2={y}
                stroke={
                  isActive
                    ? 'var(--color-vermilion)'
                    : 'var(--color-graph-ink)'
                }
                strokeWidth={isActive ? 2 : 1.4}
              />
              <text
                x={LADDER_X - 70}
                y={y + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fill={
                  isActive ? 'var(--color-vermilion)' : 'var(--color-dim)'
                }
              >
                {rung.level}
              </text>
              <text
                x={LADDER_X + 70}
                y={y - 2}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize={isActive ? 14 : 12}
                fontWeight={isActive ? 600 : 400}
                fill={
                  isActive ? 'var(--color-vermilion)' : 'var(--color-ink)'
                }
              >
                {rung.label}
              </text>
              <text
                x={LADDER_X + 70}
                y={y + 14}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="11"
                fill="var(--color-dim)"
              >
                {rung.blurb}
              </text>
            </g>
          )
        })}

        {/* Agent figure — a draggable vermilion circle on the ladder */}
        <g
          {...bind()}
          ref={knobRef}
          tabIndex={0}
          role="slider"
          aria-label={`Agent position on the permission ladder. Rung ${state.level} of ${MAX_LEVEL}.`}
          aria-valuemin={0}
          aria-valuemax={MAX_LEVEL}
          aria-valuenow={state.level}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_.agent-frame]:stroke-vermilion-deep"
        >
          <circle
            className="agent-frame"
            cx={LADDER_X}
            cy={rungY(state.level)}
            r="13"
            fill="var(--color-vermilion)"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
          <text
            x={LADDER_X}
            y={rungY(state.level) + 4}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill="var(--color-cream)"
          >
            A
          </text>
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 22}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG · ARROWS NUDGE · WATCH RIGHT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6a &mdash; A gradient of capability
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — risk panel                                          */
/* ============================================================== */

export function RightPane({ state }: { state: SafetyState }) {
  const rung = PERMISSION_LADDER[state.level]
  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`At rung ${state.level}, ${rung.label.toLowerCase()}: ${rung.risk} The guardrail at this rung is: ${rung.guardrail}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Risk panel for rung ${state.level}: ${rung.label}.`}
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />

        <text
          x={VIEW_W / 2}
          y="40"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          RISK PROFILE · RUNG {state.level}
        </text>

        {/* Title */}
        <text
          x={VIEW_W / 2}
          y="82"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="22"
          fontWeight="600"
          fill="var(--color-ink)"
        >
          {rung.label}
        </text>

        {/* Risk box */}
        <rect
          x="40"
          y="120"
          width={VIEW_W - 80}
          height="80"
          rx="3"
          fill="#fff0e7"
          stroke="var(--color-vermilion)"
          strokeWidth="1.6"
        />
        <text
          x="56"
          y="142"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          RISK
        </text>
        <text
          x="56"
          y="174"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          {rung.risk}
        </text>

        {/* Guardrail box */}
        <rect
          x="40"
          y="220"
          width={VIEW_W - 80}
          height="80"
          rx="3"
          fill="var(--color-cream)"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        <text
          x="56"
          y="242"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          GUARDRAIL
        </text>
        <text
          x="56"
          y="274"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          {rung.guardrail}
        </text>

        {/* Footer note */}
        <line
          x1={VIEW_W / 2 - 40}
          y1={336}
          x2={VIEW_W / 2 + 40}
          y2={336}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />
        <text
          x={VIEW_W / 2}
          y={364}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          policy at every rung · Anthropic’s RSP, the broader
        </text>
        <text
          x={VIEW_W / 2}
          y={384}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          AI safety community, all watching this gradient.
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 24}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          CAPABILITY · CONSENT · BOTH AT ONCE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6b &mdash; The risk and the guardrail, at this rung
      </figcaption>
    </figure>
  )
}
