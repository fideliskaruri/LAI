import { useCallback, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { VIEW_W, VIEW_H, clamp } from './agents'

/**
 * Act 4 — memory: working, episodic, semantic.
 *
 *  Left  : three labelled regions stacked vertically. Working memory is a
 *          sliding window of recent tokens. Episodic memory is a list of
 *          recent task transcripts, each a tiny card. Semantic memory is a
 *          tiny knowledge graph of facts the agent has accumulated. Tap a
 *          region to "expand" it on the right.
 *  Right : a card explaining what the active memory holds, how it's
 *          written, how it's read, and what eviction looks like.
 *
 * Left-drives-right via the selected memory kind.
 */

export type MemoryKind = 'working' | 'episodic' | 'semantic'

export interface MemoryState {
  active: MemoryKind
  interacting: boolean
}

export const INITIAL_MEMORY: MemoryState = {
  active: 'working',
  interacting: false,
}

const ORDER: MemoryKind[] = ['working', 'episodic', 'semantic']

/* ============================================================== */
/* LEFT PANE — three regions                                       */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: MemoryState
  onChange: (s: MemoryState) => void
}) {
  const groupRef = useRef<SVGGElement | null>(null)

  const select = useCallback(
    (k: MemoryKind) => onChange({ active: k, interacting: false }),
    [onChange],
  )

  useKeyNudge(
    groupRef,
    useCallback(
      (dx: number, dy: number) => {
        const step = Math.sign(dx) - Math.sign(dy)
        if (step === 0) return
        const idx = ORDER.indexOf(state.active)
        const next = clamp(idx + Math.sign(step), 0, ORDER.length - 1)
        select(ORDER[next])
      },
      [state.active, select],
    ),
  )

  const REGION_X = 40
  const REGION_W = VIEW_W - 80
  const REGION_H = 116
  const REGION_GAP = 12
  const REGION_TOP = 80

  const regionY = (i: number) => REGION_TOP + i * (REGION_H + REGION_GAP)

  // Tokens for the working-memory window.
  const tokens = [
    'the',
    'agent',
    'is',
    'planning',
    'a',
    'trip',
    'to',
    'rome',
    'next',
    'october',
    '.',
    'the',
    'budget',
    'is',
    'one',
    'thousand',
    'euros',
    '.',
  ]
  const windowStart = 8
  const windowEnd = tokens.length

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Three memory regions: working, episodic, semantic. Active: ${state.active}. Tap a region or use arrow keys to choose.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Three memory regions for an agent — working, episodic, semantic. Active: ${state.active}.`}
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
          THREE KINDS OF MEMORY · ONE AGENT
        </text>

        <g ref={groupRef} tabIndex={0} role="radiogroup" aria-label="Memory kind">
          {/* Working memory — token strip with window */}
          <g
            onClick={() => select('working')}
            style={{ cursor: 'pointer' }}
            role="radio"
            aria-checked={state.active === 'working'}
            aria-label="Working memory"
          >
            <Region
              x={REGION_X}
              y={regionY(0)}
              w={REGION_W}
              h={REGION_H}
              active={state.active === 'working'}
            />
            <text
              x={REGION_X + 16}
              y={regionY(0) + 24}
              fontFamily="Inter, sans-serif"
              fontSize="10"
              letterSpacing="0.22em"
              fill={
                state.active === 'working'
                  ? 'var(--color-vermilion)'
                  : 'var(--color-dim)'
              }
            >
              WORKING · THE CONTEXT WINDOW
            </text>
            {tokens.map((t, i) => {
              const inWindow = i >= windowStart && i < windowEnd
              const x = REGION_X + 16 + (i % 9) * 56
              const y = regionY(0) + 56 + Math.floor(i / 9) * 26
              return (
                <g key={i}>
                  {inWindow && (
                    <rect
                      x={x - 4}
                      y={y - 14}
                      width="50"
                      height="20"
                      rx="2"
                      fill="var(--color-vermilion)"
                      fillOpacity="0.12"
                    />
                  )}
                  <text
                    x={x}
                    y={y}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    fill={
                      inWindow ? 'var(--color-vermilion)' : 'var(--color-dim)'
                    }
                  >
                    {t}
                  </text>
                </g>
              )
            })}
          </g>

          {/* Episodic memory — small transcript cards */}
          <g
            onClick={() => select('episodic')}
            style={{ cursor: 'pointer' }}
            role="radio"
            aria-checked={state.active === 'episodic'}
            aria-label="Episodic memory"
          >
            <Region
              x={REGION_X}
              y={regionY(1)}
              w={REGION_W}
              h={REGION_H}
              active={state.active === 'episodic'}
            />
            <text
              x={REGION_X + 16}
              y={regionY(1) + 24}
              fontFamily="Inter, sans-serif"
              fontSize="10"
              letterSpacing="0.22em"
              fill={
                state.active === 'episodic'
                  ? 'var(--color-vermilion)'
                  : 'var(--color-dim)'
              }
            >
              EPISODIC · PAST TRANSCRIPTS
            </text>
            {['booked flight LON→FCO', 'reserved Hotel Forum', 'failed to book Da Enzo'].map(
              (txt, i) => {
                const x = REGION_X + 16 + i * 175
                const y = regionY(1) + 44
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={y}
                      width="160"
                      height="58"
                      rx="3"
                      fill="var(--color-cream)"
                      stroke="var(--color-graph-ink)"
                      strokeWidth="0.9"
                    />
                    <text
                      x={x + 10}
                      y={y + 18}
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="9"
                      fill="var(--color-dim)"
                    >
                      task #{i + 1}
                    </text>
                    <text
                      x={x + 10}
                      y={y + 38}
                      fontFamily="Source Serif 4, Georgia, serif"
                      fontStyle="italic"
                      fontSize="11"
                      fill="var(--color-ink)"
                    >
                      {txt}
                    </text>
                  </g>
                )
              },
            )}
          </g>

          {/* Semantic memory — knowledge graph */}
          <g
            onClick={() => select('semantic')}
            style={{ cursor: 'pointer' }}
            role="radio"
            aria-checked={state.active === 'semantic'}
            aria-label="Semantic memory"
          >
            <Region
              x={REGION_X}
              y={regionY(2)}
              w={REGION_W}
              h={REGION_H}
              active={state.active === 'semantic'}
            />
            <text
              x={REGION_X + 16}
              y={regionY(2) + 24}
              fontFamily="Inter, sans-serif"
              fontSize="10"
              letterSpacing="0.22em"
              fill={
                state.active === 'semantic'
                  ? 'var(--color-vermilion)'
                  : 'var(--color-dim)'
              }
            >
              SEMANTIC · KNOWLEDGE GRAPH
            </text>
            {(() => {
              const cx = REGION_X + 100
              const cy = regionY(2) + 78
              const nodes = [
                { id: 'rome', label: 'Rome', x: cx, y: cy },
                { id: 'italy', label: 'Italy', x: cx + 110, y: cy - 24 },
                { id: 'eur', label: 'EUR', x: cx + 220, y: cy + 18 },
                { id: 'lan', label: 'IT', x: cx + 330, y: cy - 18 },
                { id: 'apt', label: 'Hotel Forum', x: cx + 110, y: cy + 28 },
              ]
              const edges = [
                ['rome', 'italy'],
                ['italy', 'eur'],
                ['italy', 'lan'],
                ['rome', 'apt'],
              ]
              return (
                <>
                  {edges.map(([a, b], i) => {
                    const na = nodes.find((n) => n.id === a)!
                    const nb = nodes.find((n) => n.id === b)!
                    return (
                      <line
                        key={i}
                        x1={na.x}
                        y1={na.y}
                        x2={nb.x}
                        y2={nb.y}
                        stroke="var(--color-graph-fade)"
                        strokeWidth="1"
                      />
                    )
                  })}
                  {nodes.map((n) => (
                    <g key={n.id}>
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r="5"
                        fill="var(--color-vermilion)"
                      />
                      <text
                        x={n.x + 8}
                        y={n.y + 4}
                        fontFamily="Source Serif 4, Georgia, serif"
                        fontStyle="italic"
                        fontSize="11"
                        fill="var(--color-ink)"
                      >
                        {n.label}
                      </text>
                    </g>
                  ))}
                </>
              )
            })()}
          </g>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4a &mdash; Three regions, three time-scales
      </figcaption>
    </figure>
  )
}

function Region({
  x,
  y,
  w,
  h,
  active,
}: {
  x: number
  y: number
  w: number
  h: number
  active: boolean
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx="3"
      fill={active ? '#fff0e7' : 'var(--color-cream)'}
      stroke={active ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
      strokeWidth={active ? 1.6 : 1}
    />
  )
}

/* ============================================================== */
/* RIGHT PANE — explainer card                                     */
/* ============================================================== */

const EXPLAINERS: Record<
  MemoryKind,
  { title: string; holds: string; written: string; read: string; evicts: string }
> = {
  working: {
    title: 'Working memory',
    holds: 'recent tokens the model is staring at right now',
    written: 'each new turn appends to the end of the window',
    read: 'every forward pass uses the whole window',
    evicts: 'oldest tokens drop off when the window fills',
  },
  episodic: {
    title: 'Episodic memory',
    holds: 'a small library of past task transcripts',
    written: 'after a task ends, its trace is embedded and stored',
    read: 'before a new task, similar past traces are retrieved',
    evicts: 'rarely retrieved traces are pruned on a slow schedule',
  },
  semantic: {
    title: 'Semantic memory',
    holds: 'distilled facts and relations, a small graph of the world',
    written: 'the agent or a curator adds nodes and edges as needed',
    read: 'queries traverse the graph or retrieve by embedding',
    evicts: 'almost never; stale facts are corrected, not deleted',
  },
}

export function RightPane({ state }: { state: MemoryState }) {
  const e = EXPLAINERS[state.active]
  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Card for ${e.title}. It holds ${e.holds}. Written: ${e.written}. Read: ${e.read}. Evicted: ${e.evicts}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Explainer card for ${e.title}.`}
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
          {e.title.toUpperCase()}
        </text>

        <Row y={100} label="HOLDS" value={e.holds} accent />
        <Row y={184} label="WRITTEN" value={e.written} />
        <Row y={268} label="READ" value={e.read} />
        <Row y={352} label="EVICTS" value={e.evicts} />

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 24}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          a memory is what you can look up later
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4b &mdash; What this memory holds and how it changes
      </figcaption>
    </figure>
  )
}

function Row({
  y,
  label,
  value,
  accent = false,
}: {
  y: number
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <g>
      <text
        x="56"
        y={y}
        fontFamily="Inter, sans-serif"
        fontSize="9"
        letterSpacing="0.22em"
        fill="var(--color-dim)"
      >
        {label}
      </text>
      <text
        x="56"
        y={y + 26}
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize="14"
        fill={accent ? 'var(--color-vermilion)' : 'var(--color-ink)'}
      >
        {value}
      </text>
      <line
        x1="56"
        y1={y + 42}
        x2={VIEW_W - 56}
        y2={y + 42}
        stroke="var(--color-graph-fade)"
        strokeWidth="0.6"
      />
    </g>
  )
}
