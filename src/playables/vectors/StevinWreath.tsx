import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Stevin's wreath of spheres (1586).
 *
 * A triangular wedge with a closed chain of 14 beads draped over it. The chain
 * hangs in equilibrium — Stevin's clootcrans (wreath) — and his argument that
 * the chain cannot move is what gave us the parallelogram law of force addition.
 *
 * Phase 1 implementation: visual draggable response only. Real chain physics
 * (redistribution along the perimeter as you drag) is a Phase 2 polish.
 *
 * Phase 5 accessibility: each bead is tabbable; arrow keys nudge by 1 unit
 * (6 px), Shift+arrow by 5 units (30 px). A CanvasNarrative announces drag
 * state in prose.
 */

const VIEW_W = 600
const VIEW_H = 480

// Wedge: apex at top-center, base spans the bottom.
const APEX = { x: VIEW_W / 2, y: 80 }
const LEFT_BASE = { x: 100, y: 380 }
const RIGHT_BASE = { x: VIEW_W - 100, y: 380 }

// 1 nudge unit = 6 px; Shift step = 5 units = 30 px (useKeyNudge largeStep=5)
const NUDGE_PX = 6
const SHIFT_STEP = 5

interface Point {
  x: number
  y: number
}

/**
 * Compute the natural bead positions: 4 on the left slope, 6 along the bottom
 * loop (slightly drooping), 4 on the right slope.
 */
function naturalBeadPositions(): Point[] {
  const beads: Point[] = []

  // Left slope: apex → left_base (4 beads, evenly spaced)
  for (let i = 1; i <= 4; i++) {
    const t = i / 5
    beads.push({
      x: APEX.x + (LEFT_BASE.x - APEX.x) * t,
      y: APEX.y + (LEFT_BASE.y - APEX.y) * t,
    })
  }

  // Bottom loop: left_base → right_base, drooping
  for (let i = 0; i < 6; i++) {
    const t = i / 5
    beads.push({
      x: LEFT_BASE.x + (RIGHT_BASE.x - LEFT_BASE.x) * t,
      y: LEFT_BASE.y + 48 * Math.sin(Math.PI * t),
    })
  }

  // Right slope: right_base → apex (4 beads)
  for (let i = 1; i <= 4; i++) {
    const t = i / 5
    beads.push({
      x: RIGHT_BASE.x + (APEX.x - RIGHT_BASE.x) * t,
      y: RIGHT_BASE.y + (APEX.y - RIGHT_BASE.y) * t,
    })
  }

  return beads // 14 beads total
}

const NATURAL = naturalBeadPositions()

export function StevinWreath() {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const [offsets, setOffsets] = useState<Map<number, Point>>(new Map())

  const positions = NATURAL.map((p, i) => {
    const off = offsets.get(i)
    return off ? { x: p.x + off.x, y: p.y + off.y } : p
  })

  // Closed loop chain path
  const chainPath = (() => {
    if (positions.length === 0) return ''
    let d = `M ${positions[0].x} ${positions[0].y}`
    for (let i = 1; i < positions.length; i++) {
      d += ` L ${positions[i].x} ${positions[i].y}`
    }
    d += ' Z'
    return d
  })()

  const handleDrag = (i: number, dx: number, dy: number, down: boolean) => {
    if (down) {
      setDraggedIndex(i)
      setOffsets((prev) => new Map(prev).set(i, { x: dx, y: dy }))
    } else {
      // On release, snap back to natural position
      setDraggedIndex(null)
      setOffsets((prev) => {
        const next = new Map(prev)
        next.delete(i)
        return next
      })
    }
  }

  const handleNudge = useCallback((i: number, dx: number, dy: number) => {
    setOffsets((prev) => {
      const next = new Map(prev)
      const cur = next.get(i) ?? { x: 0, y: 0 }
      next.set(i, {
        x: cur.x + dx * NUDGE_PX,
        // Up arrow comes in as positive dy from useKeyNudge; SVG y is inverted
        y: cur.y - dy * NUDGE_PX,
      })
      return next
    })
  }, [])

  const narrative =
    draggedIndex !== null
      ? {
          text: `Bead ${draggedIndex + 1} of 14 has been pulled aside; release to let the chain settle.`,
          priority: 'high' as const,
        }
      : {
          text: 'A triangular wedge with a chain of fourteen beads draped over it. Tab to focus a bead, arrow keys to nudge.',
          priority: 'normal' as const,
        }

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrative.text} priority={narrative.priority} />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A triangular wedge. A closed chain of fourteen beads drapes over the wedge — four on the steeper left slope, six along the drooping bottom, four on the shallower right slope. Drag any bead to feel that the chain stays in equilibrium."
      >
        {/* Wedge outline */}
        <polygon
          points={`${APEX.x},${APEX.y} ${LEFT_BASE.x},${LEFT_BASE.y} ${RIGHT_BASE.x},${RIGHT_BASE.y}`}
          fill="none"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* Chain path */}
        <path
          d={chainPath}
          fill="none"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.1"
          strokeOpacity="0.5"
          style={{ transition: draggedIndex === null ? 'd 150ms ease-out' : 'none' }}
        />

        {/* Beads */}
        {positions.map((p, i) => (
          <DraggableBead
            key={i}
            index={i}
            cx={p.x}
            cy={p.y}
            active={draggedIndex === i}
            focused={focusedIndex === i}
            onDrag={(dx, dy, down) => handleDrag(i, dx, dy, down)}
            onNudge={(dx, dy) => handleNudge(i, dx, dy)}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex((cur) => (cur === i ? null : cur))}
          />
        ))}

        {/* Hint label, lower-left */}
        <text
          x="32"
          y={VIEW_H - 18}
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG ANY BEAD  ·  TAB + ARROWS
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1 — Stevin's wreath of spheres, 1586
      </figcaption>
    </figure>
  )
}

interface DraggableBeadProps {
  index: number
  cx: number
  cy: number
  active: boolean
  focused: boolean
  onDrag: (dx: number, dy: number, down: boolean) => void
  onNudge: (dx: number, dy: number) => void
  onFocus: () => void
  onBlur: () => void
}

function DraggableBead({ index, cx, cy, active, focused, onDrag, onNudge, onFocus, onBlur }: DraggableBeadProps) {
  const groupRef = useRef<SVGGElement | null>(null)
  const bind = useDrag(
    ({ down, movement: [mx, my] }) => {
      onDrag(mx, my, down)
    },
    { from: () => [0, 0] },
  )

  useKeyNudge(groupRef, onNudge, { largeStep: SHIFT_STEP })

  const highlighted = active || focused

  return (
    <g
      {...bind()}
      ref={groupRef}
      tabIndex={0}
      role="button"
      aria-label={`Bead ${index + 1} of 14, draggable`}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{ cursor: active ? 'grabbing' : 'grab', touchAction: 'none' }}
      className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
    >
      {/* Invisible 22px-radius hit target (44px tap zone, PLAN §11.2) */}
      <circle cx={cx} cy={cy} r="22" fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={highlighted ? 8.5 : 7}
        fill={highlighted ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
        stroke="var(--color-cream)"
        strokeWidth="1.5"
        style={{
          transition: active ? 'none' : 'r 150ms ease-out, fill 150ms ease-out',
        }}
      />
    </g>
  )
}
