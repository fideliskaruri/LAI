import { useCallback, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  WEATHER_TRACE,
  KIND_COLORS,
  clamp,
} from './agents'

/**
 * Act 1 — the thought / action / observation loop.
 *
 *  Left  : a REPL-style trace. Lines tagged THOUGHT / ACTION / OBSERVATION
 *          accumulate as the user advances. A step button advances one line.
 *  Right : a schematic of the loop itself — the four stations (model,
 *          parser, tool, runtime) wired in a ring. The current station
 *          highlights in vermilion as the user steps.
 *
 * Left-drives-right via the shared step index, but the act is wired as
 * co-mutating in TopicPageSplit (both panes share the same state object).
 */

export interface LoopState {
  /** Index into WEATHER_TRACE — how many lines are revealed (1..N). */
  step: number
  interacting: boolean
}

export const INITIAL_LOOP: LoopState = { step: 1, interacting: false }

const N = WEATHER_TRACE.length

/* ============================================================== */
/* LEFT PANE — REPL-style trace                                    */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: LoopState
  onChange: (s: LoopState) => void
}) {
  const stepButtonRef = useRef<SVGGElement | null>(null)

  const advance = useCallback(() => {
    onChange({ step: clamp(state.step + 1, 1, N), interacting: false })
  }, [state.step, onChange])

  const retreat = useCallback(() => {
    onChange({ step: clamp(state.step - 1, 1, N), interacting: false })
  }, [state.step, onChange])

  useKeyNudge(
    stepButtonRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        if (dx > 0) advance()
        else retreat()
      },
      [advance, retreat],
    ),
  )

  const visible = WEATHER_TRACE.slice(0, state.step)
  const ROW_H = 38
  const ROW_TOP = 90
  const ROW_LEFT = 38

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Showing ${state.step} of ${N} lines of a ReAct trace. The model is comparing today's weather in Berlin and Tokyo. Press step to advance.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A REPL-style ReAct trace, ${state.step} of ${N} lines revealed.`}
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
          ReAct TRACE · ONE STEP AT A TIME
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
          “What’s the weather in Berlin in Celsius, and how does it compare to Tokyo?”
        </text>

        {visible.map((line, i) => {
          const y = ROW_TOP + i * ROW_H
          const isCurrent = i === state.step - 1
          return (
            <g key={i}>
              {isCurrent && (
                <rect
                  x={ROW_LEFT - 8}
                  y={y - 18}
                  width={VIEW_W - 2 * (ROW_LEFT - 8)}
                  height={ROW_H - 4}
                  fill="var(--color-vermilion)"
                  fillOpacity="0.06"
                  stroke="none"
                />
              )}
              <text
                x={ROW_LEFT}
                y={y}
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                letterSpacing="0.18em"
                fill={KIND_COLORS[line.kind]}
              >
                {line.tag}
              </text>
              <text
                x={ROW_LEFT + 110}
                y={y}
                fontFamily={
                  line.kind === 'action'
                    ? 'JetBrains Mono, monospace'
                    : 'Source Serif 4, Georgia, serif'
                }
                fontStyle={line.kind === 'thought' ? 'italic' : 'normal'}
                fontSize={line.kind === 'action' ? 11 : 12.5}
                fill="var(--color-ink)"
              >
                {clip(line.text, 58)}
              </text>
            </g>
          )
        })}

        {/* Step button */}
        <g
          ref={stepButtonRef}
          tabIndex={0}
          role="button"
          aria-label={`Step. Currently at line ${state.step} of ${N}.`}
          onClick={advance}
          style={{ cursor: state.step < N ? 'pointer' : 'default' }}
          className="focus-visible:outline-none [&:focus-visible_.step-frame]:stroke-vermilion-deep"
        >
          <rect
            className="step-frame"
            x={VIEW_W - 168}
            y={VIEW_H - 56}
            width={130}
            height={36}
            rx="3"
            fill={state.step < N ? 'var(--color-vermilion)' : 'var(--color-cream)'}
            stroke={
              state.step < N ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'
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
            fill={state.step < N ? 'var(--color-cream)' : 'var(--color-dim)'}
          >
            {state.step < N ? 'STEP →' : 'TRACE DONE'}
          </text>
        </g>

        <text
          x={ROW_LEFT}
          y={VIEW_H - 30}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          LINE {state.step} / {N}
        </text>
        <text
          x={ROW_LEFT}
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
        Fig. 1a &mdash; The loop, narrated
      </figcaption>
    </figure>
  )
}

function clip(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1) + '…'
}

/* ============================================================== */
/* RIGHT PANE — schematic of the loop                              */
/* ============================================================== */

export function RightPane({ state }: { state: LoopState }) {
  const stations = [
    { id: 'model', label: 'MODEL', sub: 'emits a thought' },
    { id: 'parser', label: 'PARSER', sub: 'sees an action' },
    { id: 'tool', label: 'TOOL', sub: 'runs the call' },
    { id: 'runtime', label: 'RUNTIME', sub: 'feeds it back' },
  ]
  const cx = VIEW_W / 2
  const cy = VIEW_H / 2 + 8
  const R = 130
  const positions = stations.map((_, i) => {
    const theta = -Math.PI / 2 + (i / stations.length) * 2 * Math.PI
    return { x: cx + R * Math.cos(theta), y: cy + R * Math.sin(theta) }
  })

  // Which station is "current" depends on the latest line kind.
  const latest = WEATHER_TRACE[state.step - 1]
  const activeIdx =
    latest.kind === 'thought'
      ? 0
      : latest.kind === 'action'
        ? 1
        : latest.kind === 'observation'
          ? 2
          : 3

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A four-station loop diagram: model, parser, tool, runtime. Currently active: ${stations[activeIdx].label.toLowerCase()} — ${stations[activeIdx].sub}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A schematic loop of four stations. Active: ${stations[activeIdx].label}.`}
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
          THE LOOP · MODEL · PARSER · TOOL · RUNTIME
        </text>

        {/* Arrows between stations */}
        {positions.map((p, i) => {
          const next = positions[(i + 1) % positions.length]
          const mx = (p.x + next.x) / 2
          const my = (p.y + next.y) / 2
          // Curve toward outside of circle.
          const vx = mx - cx
          const vy = my - cy
          const len = Math.hypot(vx, vy)
          const ox = (vx / len) * 22
          const oy = (vy / len) * 22
          const isActive = i === activeIdx
          return (
            <g key={`arc-${i}`}>
              <path
                d={`M ${p.x} ${p.y} Q ${mx + ox} ${my + oy} ${next.x} ${next.y}`}
                fill="none"
                stroke={
                  isActive ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
                }
                strokeWidth={isActive ? 2 : 1.1}
                strokeOpacity={isActive ? 1 : 0.7}
              />
            </g>
          )
        })}

        {/* Stations */}
        {positions.map((p, i) => {
          const isActive = i === activeIdx
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="36"
                fill="var(--color-cream)"
                stroke={
                  isActive
                    ? 'var(--color-vermilion)'
                    : 'var(--color-graph-ink)'
                }
                strokeWidth={isActive ? 2.4 : 1.4}
              />
              <text
                x={p.x}
                y={p.y - 2}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="10"
                letterSpacing="0.22em"
                fill={
                  isActive ? 'var(--color-vermilion)' : 'var(--color-ink)'
                }
              >
                {stations[i].label}
              </text>
              <text
                x={p.x}
                y={p.y + 14}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="11"
                fill="var(--color-dim)"
              >
                {stations[i].sub}
              </text>
            </g>
          )
        })}

        {/* Centre label */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          {latest.tag.toLowerCase()}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          {clipLine(latest.text, 32)}
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 20}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          REASON · ACT · OBSERVE · REPEAT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1b &mdash; A ring with four stations on it
      </figcaption>
    </figure>
  )
}

function clipLine(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1) + '…'
}
