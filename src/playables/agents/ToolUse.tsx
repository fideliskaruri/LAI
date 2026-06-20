import { useCallback, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { VIEW_W, VIEW_H, TOOL_CATALOG, clamp } from './agents'

/**
 * Act 2 — tool use.
 *
 *  Left  : a stacked list of five tool cards (web_search, calculator,
 *          file_read, code_exec, calendar_create). Each card shows the tool
 *          name, a one-line description, and the JSON schema. Tap or arrow
 *          to select.
 *  Right : for the selected tool, the natural-language reasoning that led
 *          to the call, the structured JSON call, and the structured result
 *          coming back — three stacked panels mirroring the model →
 *          runtime → model round trip.
 *
 * Left-drives-right via the selected tool index.
 */

export interface ToolUseState {
  /** Index into TOOL_CATALOG. */
  toolIdx: number
  interacting: boolean
}

export const INITIAL_TOOLUSE: ToolUseState = {
  toolIdx: 0,
  interacting: false,
}

const N_TOOLS = TOOL_CATALOG.length

const PAD = 30
const CARD_H = 70
const CARD_TOP = 80
const CARD_GAP = 4

/* ============================================================== */
/* LEFT PANE — list of tool cards                                  */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: ToolUseState
  onChange: (s: ToolUseState) => void
}) {
  const groupRef = useRef<SVGGElement | null>(null)

  const select = useCallback(
    (i: number) =>
      onChange({ toolIdx: clamp(i, 0, N_TOOLS - 1), interacting: false }),
    [onChange],
  )

  useKeyNudge(
    groupRef,
    useCallback(
      (dx: number, dy: number) => {
        const step = -Math.sign(dy) + Math.sign(dx)
        if (step === 0) return
        select(state.toolIdx + Math.sign(step))
      },
      [state.toolIdx, select],
    ),
  )

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Tool catalogue. Five tools available. Currently selected: ${TOOL_CATALOG[state.toolIdx].name}. Tap a card or use arrow keys to choose.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A list of five tool cards, with ${TOOL_CATALOG[state.toolIdx].name} selected.`}
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
          TOOL CATALOGUE · FIVE HANDS
        </text>

        <g ref={groupRef} tabIndex={0} role="listbox" aria-label="Tool catalogue">
          {TOOL_CATALOG.map((tool, i) => {
            const y = CARD_TOP + i * (CARD_H + CARD_GAP)
            const isActive = i === state.toolIdx
            return (
              <g
                key={tool.id}
                onClick={() => select(i)}
                style={{ cursor: 'pointer' }}
                role="option"
                aria-selected={isActive}
                aria-label={tool.name}
              >
                <rect
                  x={PAD}
                  y={y}
                  width={VIEW_W - 2 * PAD}
                  height={CARD_H}
                  rx="3"
                  fill={isActive ? '#fff0e7' : 'var(--color-cream)'}
                  stroke={
                    isActive
                      ? 'var(--color-vermilion)'
                      : 'var(--color-graph-fade)'
                  }
                  strokeWidth={isActive ? 1.8 : 1}
                />
                <text
                  x={PAD + 16}
                  y={y + 22}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="13"
                  fill={
                    isActive ? 'var(--color-vermilion)' : 'var(--color-ink)'
                  }
                >
                  {tool.name}
                </text>
                <text
                  x={PAD + 16}
                  y={y + 40}
                  fontFamily="Source Serif 4, Georgia, serif"
                  fontStyle="italic"
                  fontSize="12"
                  fill="var(--color-dim)"
                >
                  {tool.short}
                </text>
                <text
                  x={PAD + 16}
                  y={y + 58}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.5"
                  fill={isActive ? 'var(--color-ink)' : 'var(--color-dim)'}
                >
                  {tool.schema}
                </text>
              </g>
            )
          })}
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 16}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TAP A CARD · ARROWS CYCLE · WATCH RIGHT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2a &mdash; A small workshop of hands
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — one call, three panels                             */
/* ============================================================== */

export function RightPane({ state }: { state: ToolUseState }) {
  const tool = TOOL_CATALOG[state.toolIdx]

  // Per-tool reasoning blurb. Kept short; the point is the round-trip
  // shape, not these specific words.
  const REASONING: Record<string, string> = {
    web_search: 'I need a current fact I don’t have memorised.',
    calculator: 'Arithmetic — I shouldn’t guess. Hand it to the tool.',
    file_read: 'There’s a local file with the answer. Open it.',
    code_exec: 'A short snippet will compute the right value.',
    calendar_create:
      'I should commit this to the calendar so it’s a real thing.',
  }

  const PANEL_W = VIEW_W - 80
  const PANEL_LEFT = 40
  const PANEL_H_REASON = 78
  const PANEL_H_CALL = 88
  const PANEL_H_RESULT = 88
  const TOP_REASON = 70
  const TOP_CALL = TOP_REASON + PANEL_H_REASON + 16
  const TOP_RESULT = TOP_CALL + PANEL_H_CALL + 16

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A round-trip for ${tool.name}. The model reasons, emits a JSON call, and reads a structured result. Each tool name is the same English the user might have typed; the JSON is the contract.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A tool round-trip for ${tool.name}: reason, call, result.`}
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
          ONE CALL · THREE STATIONS
        </text>

        {/* Reasoning panel */}
        <Panel
          x={PANEL_LEFT}
          y={TOP_REASON}
          w={PANEL_W}
          h={PANEL_H_REASON}
          tag="REASONING · NATURAL LANGUAGE"
        >
          <text
            x={PANEL_LEFT + 16}
            y={TOP_REASON + 50}
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="13"
            fill="var(--color-ink)"
          >
            {REASONING[tool.id] ?? 'I should call this tool.'}
          </text>
        </Panel>

        {/* Down arrow */}
        <Arrow x={VIEW_W / 2} y={TOP_REASON + PANEL_H_REASON + 4} dir="down" />

        {/* Structured call */}
        <Panel
          x={PANEL_LEFT}
          y={TOP_CALL}
          w={PANEL_W}
          h={PANEL_H_CALL}
          tag="CALL · STRUCTURED JSON"
          accent
        >
          <text
            x={PANEL_LEFT + 16}
            y={TOP_CALL + 48}
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-vermilion)"
          >
            {clip(tool.exampleCall, 56)}
          </text>
          <text
            x={PANEL_LEFT + 16}
            y={TOP_CALL + 68}
            fontFamily="JetBrains Mono, monospace"
            fontSize="9.5"
            fill="var(--color-dim)"
          >
            {tool.schema}
          </text>
        </Panel>

        {/* Down arrow */}
        <Arrow x={VIEW_W / 2} y={TOP_CALL + PANEL_H_CALL + 4} dir="down" />

        {/* Result */}
        <Panel
          x={PANEL_LEFT}
          y={TOP_RESULT}
          w={PANEL_W}
          h={PANEL_H_RESULT}
          tag="RESULT · STRUCTURED RETURN"
        >
          <text
            x={PANEL_LEFT + 16}
            y={TOP_RESULT + 50}
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-ink)"
          >
            {clip(tool.exampleResult, 56)}
          </text>
          <text
            x={PANEL_LEFT + 16}
            y={TOP_RESULT + 72}
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            the model reads this back in its next turn
          </text>
        </Panel>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2b &mdash; The contract between the model and the world
      </figcaption>
    </figure>
  )
}

function Panel({
  x,
  y,
  w,
  h,
  tag,
  accent = false,
  children,
}: {
  x: number
  y: number
  w: number
  h: number
  tag: string
  accent?: boolean
  children?: React.ReactNode
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="3"
        fill={accent ? '#fff0e7' : 'var(--color-cream)'}
        stroke={accent ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
        strokeWidth={accent ? 1.6 : 1}
      />
      <text
        x={x + 16}
        y={y + 22}
        fontFamily="Inter, sans-serif"
        fontSize="9"
        letterSpacing="0.22em"
        fill={accent ? 'var(--color-vermilion)' : 'var(--color-dim)'}
      >
        {tag}
      </text>
      {children}
    </g>
  )
}

function Arrow({ x, y, dir }: { x: number; y: number; dir: 'down' }) {
  // Small downward arrow centred at (x, y).
  return (
    <g aria-hidden="true">
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={y + (dir === 'down' ? 8 : -8)}
        stroke="var(--color-graph-ink)"
        strokeWidth="1.2"
      />
      <polygon
        points={`${x - 4},${y + 6} ${x + 4},${y + 6} ${x},${y + 12}`}
        fill="var(--color-graph-ink)"
      />
    </g>
  )
}

function clip(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1) + '…'
}
