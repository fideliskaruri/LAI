import type { Topic } from '../../data/constellation'

interface EdgeLayerProps {
  topics: Topic[]
  hoveredId: string | null
}

/**
 * Draws faint hand-feel lines from the hovered topic back to its direct
 * prerequisites (back-edges) and forward to its dependents (forward-edges).
 * Per PLAN §11.9.
 */
export function EdgeLayer({ topics, hoveredId }: EdgeLayerProps) {
  if (!hoveredId) return null

  const hovered = topics.find((t) => t.id === hoveredId)
  if (!hovered) return null

  // Back edges: hovered → its prereqs
  const backTargets = hovered.prereqs
    .map((id) => topics.find((t) => t.id === id))
    .filter((t): t is Topic => !!t)

  // Forward edges: topics whose prereqs include `hoveredId`
  const forwardTargets = topics.filter((t) => t.prereqs.includes(hoveredId))

  return (
    <g>
      {backTargets.map((target) => (
        <line
          key={`back-${target.id}`}
          x1={hovered.x}
          y1={hovered.y}
          x2={target.x}
          y2={target.y}
          stroke="var(--color-vermilion)"
          strokeWidth="0.8"
          strokeOpacity="0.3"
          strokeDasharray="4 4"
        />
      ))}
      {forwardTargets.map((target) => (
        <line
          key={`fwd-${target.id}`}
          x1={hovered.x}
          y1={hovered.y}
          x2={target.x}
          y2={target.y}
          stroke="var(--color-dim)"
          strokeWidth="0.6"
          strokeOpacity="0.2"
        />
      ))}
    </g>
  )
}
