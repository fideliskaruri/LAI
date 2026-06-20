import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  ROME_TREE,
  type SubgoalNode,
  clamp,
} from './agents'

/**
 * Act 3 — planning, a subgoal tree.
 *
 *  Left  : the Rome-trip goal at the top. A depth slider on the side
 *          (0..2). At depth 0 the reader sees only the root; at depth 1,
 *          the immediate subgoals; at depth 2, the leaves.
 *  Right : a focused view of the currently selected subgoal — its name, its
 *          children, and (at leaves) the concrete tool call that would
 *          execute it. Click any node on the left to select it.
 *
 * Left-drives-right.
 */

export interface PlanningState {
  /** Slider position, 0 (root only), 1, 2 (full). */
  depth: number
  /** The currently selected node id (drives the right pane). */
  selectedId: string
  interacting: boolean
}

export const INITIAL_PLANNING: PlanningState = {
  depth: 1,
  selectedId: 'root',
  interacting: false,
}

const MAX_DEPTH = 2

/* ============================================================== */
/* LEFT PANE — collapsible tree + depth slider                     */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: PlanningState
  onChange: (s: PlanningState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const sliderRef = useRef<SVGGElement | null>(null)
  const startDepthRef = useRef<number | null>(null)

  const setDepth = useCallback(
    (d: number, interacting: boolean) =>
      onChange({
        depth: clamp(Math.round(d), 0, MAX_DEPTH),
        selectedId: state.selectedId,
        interacting,
      }),
    [state.selectedId, onChange],
  )

  const select = useCallback(
    (id: string) =>
      onChange({
        depth: state.depth,
        selectedId: id,
        interacting: false,
      }),
    [state.depth, onChange],
  )

  // Slider geometry — a vertical bar on the left edge of the canvas.
  const SLIDER_X = 40
  const SLIDER_TOP = 110
  const SLIDER_H = 240
  const trackY = (d: number) =>
    SLIDER_TOP + (1 - d / MAX_DEPTH) * SLIDER_H

  const bind = useDrag(({ first, last, movement: [, my] }) => {
    if (first) startDepthRef.current = state.depth
    const start = startDepthRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sy = VIEW_H / rect.height
    // Convert pixel movement to depth delta.
    const deltaDepth = -(my * sy) / (SLIDER_H / MAX_DEPTH)
    setDepth(start + deltaDepth, !last)
  })

  useKeyNudge(
    sliderRef,
    useCallback(
      (_dx: number, dy: number) => {
        if (dy === 0) return
        setDepth(state.depth + Math.sign(dy), false)
      },
      [state.depth, setDepth],
    ),
  )

  // Tree layout — root at top, children fanning out, leaves at depth 2.
  const ROOT_Y = 100
  const LEVEL_GAP = 130
  const TREE_LEFT = 110
  const TREE_W = VIEW_W - TREE_LEFT - 40

  const root = ROME_TREE
  const childCount = root.children.length

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A planning tree for the Rome-trip goal. Depth slider currently at ${state.depth}. ${
          state.depth === 0
            ? 'Only the root goal is shown.'
            : state.depth === 1
              ? `Five subgoals visible: ${root.children.map((c) => c.label.toLowerCase()).join(', ')}.`
              : 'Subgoals are expanded into their concrete leaf actions.'
        } Selected: ${state.selectedId}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A goal tree rooted at "Plan a 3-day Rome trip", expanded to depth ${state.depth}.`}
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
          A SUBGOAL TREE · DRAG DEPTH
        </text>

        {/* Depth slider (vertical) */}
        <text
          x={SLIDER_X}
          y={SLIDER_TOP - 16}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DEPTH
        </text>
        <line
          x1={SLIDER_X}
          y1={SLIDER_TOP}
          x2={SLIDER_X}
          y2={SLIDER_TOP + SLIDER_H}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        {[0, 1, 2].map((d) => (
          <g key={d}>
            <line
              x1={SLIDER_X - 5}
              y1={trackY(d)}
              x2={SLIDER_X + 5}
              y2={trackY(d)}
              stroke="var(--color-graph-ink)"
              strokeWidth="1"
            />
            <text
              x={SLIDER_X - 12}
              y={trackY(d) + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {d}
            </text>
          </g>
        ))}
        <g
          {...bind()}
          ref={sliderRef}
          tabIndex={0}
          role="slider"
          aria-label="Depth slider"
          aria-valuemin={0}
          aria-valuemax={MAX_DEPTH}
          aria-valuenow={state.depth}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_.knob]:stroke-vermilion-deep"
        >
          <circle
            className="knob"
            cx={SLIDER_X}
            cy={trackY(state.depth)}
            r="10"
            fill="var(--color-vermilion)"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        </g>

        {/* Root node */}
        <Node
          x={TREE_LEFT + TREE_W / 2}
          y={ROOT_Y}
          label={truncate(root.label, 36)}
          selected={state.selectedId === root.id}
          onSelect={() => select(root.id)}
        />

        {/* Depth-1 children */}
        {state.depth >= 1 &&
          root.children.map((child, i) => {
            const cx = TREE_LEFT + ((i + 0.5) * TREE_W) / childCount
            const cy = ROOT_Y + LEVEL_GAP
            return (
              <g key={child.id}>
                <line
                  x1={TREE_LEFT + TREE_W / 2}
                  y1={ROOT_Y + 18}
                  x2={cx}
                  y2={cy - 18}
                  stroke="var(--color-graph-fade)"
                  strokeWidth="1.2"
                />
                <Node
                  x={cx}
                  y={cy}
                  label={truncate(child.label, 16)}
                  selected={state.selectedId === child.id}
                  onSelect={() => select(child.id)}
                  small
                />
                {state.depth >= 2 &&
                  child.children.map((leaf, j) => {
                    const lx =
                      cx + (j - (child.children.length - 1) / 2) * 28
                    const ly = cy + 70
                    return (
                      <g key={leaf.id}>
                        <line
                          x1={cx}
                          y1={cy + 12}
                          x2={lx}
                          y2={ly - 6}
                          stroke="var(--color-graph-fade)"
                          strokeWidth="0.9"
                        />
                        <circle
                          cx={lx}
                          cy={ly}
                          r="5"
                          fill={
                            state.selectedId === leaf.id
                              ? 'var(--color-vermilion)'
                              : 'var(--color-cream)'
                          }
                          stroke="var(--color-vermilion)"
                          strokeWidth="1.3"
                          style={{ cursor: 'pointer' }}
                          onClick={() => select(leaf.id)}
                        />
                      </g>
                    )
                  })}
              </g>
            )
          })}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 22}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG SLIDER · TAP A NODE · WATCH RIGHT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3a &mdash; A plan, expanded a layer at a time
      </figcaption>
    </figure>
  )
}

function Node({
  x,
  y,
  label,
  selected,
  onSelect,
  small = false,
}: {
  x: number
  y: number
  label: string
  selected: boolean
  onSelect: () => void
  small?: boolean
}) {
  const w = small ? 110 : 240
  const h = small ? 32 : 40
  return (
    <g
      onClick={onSelect}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={label}
    >
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx="3"
        fill={selected ? 'var(--color-vermilion)' : 'var(--color-cream)'}
        stroke="var(--color-vermilion)"
        strokeWidth={selected ? 1.8 : 1.2}
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize={small ? 11 : 13}
        fill={selected ? 'var(--color-cream)' : 'var(--color-ink)'}
      >
        {label}
      </text>
    </g>
  )
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1) + '…'
}

/* ============================================================== */
/* RIGHT PANE — focused view of selected node                      */
/* ============================================================== */

function findNode(node: SubgoalNode, id: string): SubgoalNode | null {
  if (node.id === id) return node
  for (const c of node.children) {
    const r = findNode(c, id)
    if (r) return r
  }
  return null
}

export function RightPane({ state }: { state: PlanningState }) {
  const node = findNode(ROME_TREE, state.selectedId) ?? ROME_TREE
  const isLeaf = node.children.length === 0
  const isRoot = node.id === 'root'

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Selected node: ${node.label}. ${
          isLeaf
            ? `Leaf action — would execute: ${node.action ?? '—'}.`
            : `It has ${node.children.length} child ${node.children.length === 1 ? 'subgoal' : 'subgoals'}.`
        }`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Focused view of the selected node "${node.label}".`}
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
          NODE · {isRoot ? 'ROOT GOAL' : isLeaf ? 'LEAF ACTION' : 'SUBGOAL'}
        </text>

        {/* Label card */}
        <rect
          x="40"
          y="68"
          width={VIEW_W - 80}
          height="76"
          rx="3"
          fill="#fff0e7"
          stroke="var(--color-vermilion)"
          strokeWidth="1.6"
        />
        <text
          x={VIEW_W / 2}
          y="98"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          GOAL
        </text>
        <text
          x={VIEW_W / 2}
          y="124"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          {truncate(node.label, 58)}
        </text>

        {/* Children list, or leaf action */}
        {!isLeaf && (
          <g>
            <text
              x="56"
              y="186"
              fontFamily="Inter, sans-serif"
              fontSize="9"
              letterSpacing="0.22em"
              fill="var(--color-dim)"
            >
              IT BREAKS INTO
            </text>
            {node.children.map((c, i) => {
              const y = 210 + i * 30
              return (
                <g key={c.id}>
                  <circle
                    cx="64"
                    cy={y - 4}
                    r="4"
                    fill="var(--color-vermilion)"
                  />
                  <text
                    x="80"
                    y={y}
                    fontFamily="Source Serif 4, Georgia, serif"
                    fontStyle="italic"
                    fontSize="13"
                    fill="var(--color-ink)"
                  >
                    {truncate(c.label, 56)}
                  </text>
                </g>
              )
            })}
          </g>
        )}

        {isLeaf && node.action && (
          <g>
            <text
              x="56"
              y="186"
              fontFamily="Inter, sans-serif"
              fontSize="9"
              letterSpacing="0.22em"
              fill="var(--color-dim)"
            >
              CONCRETE ACTION
            </text>
            <rect
              x="56"
              y="200"
              width={VIEW_W - 112}
              height="64"
              rx="3"
              fill="var(--color-cream)"
              stroke="var(--color-vermilion)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <text
              x="72"
              y="236"
              fontFamily="JetBrains Mono, monospace"
              fontSize="11.5"
              fill="var(--color-vermilion)"
            >
              {truncate(node.action, 52)}
            </text>
            <text
              x="56"
              y="298"
              fontFamily="Source Serif 4, Georgia, serif"
              fontStyle="italic"
              fontSize="12"
              fill="var(--color-dim)"
            >
              at this depth the plan has become an act.
            </text>
          </g>
        )}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 60}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          one goal · many subgoals · many actions
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 40}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the tree is the plan
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3b &mdash; A close-up of one node in the plan
      </figcaption>
    </figure>
  )
}
