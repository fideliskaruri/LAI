import type { Topic } from '../../data/constellation'

interface GlyphProps {
  topic: Topic
  isHovered: boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

export function Glyph({ topic, isHovered, onHover, onSelect }: GlyphProps) {
  const isAvailable = topic.status === 'available'
  const labelFill = isAvailable
    ? 'var(--color-ink)'
    : 'var(--color-fade)'
  const dotFill = isAvailable ? 'var(--color-vermilion)' : 'var(--color-fade)'

  const handleClick = () => {
    if (isAvailable) onSelect(topic.id)
  }
  const handleKeyDown = (e: React.KeyboardEvent<SVGGElement>) => {
    if (!isAvailable) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(topic.id)
    }
  }

  return (
    <g
      onMouseEnter={() => onHover(topic.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(topic.id)}
      onBlur={() => onHover(null)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isAvailable ? 0 : -1}
      role={isAvailable ? 'link' : 'presentation'}
      aria-label={isAvailable ? `${topic.name} — open chapter` : `${topic.name} — coming soon`}
      style={{ cursor: isAvailable ? 'pointer' : 'default' }}
      className="outline-none focus-visible:[&_circle:first-of-type]:fill-[var(--color-vermilion)] focus-visible:[&_circle:first-of-type]:fill-opacity-25"
    >
      {/* Hover/focus halo */}
      {isAvailable && (
        <circle
          cx={topic.x}
          cy={topic.y}
          r="14"
          fill={isHovered ? 'var(--color-vermilion)' : 'transparent'}
          fillOpacity={isHovered ? 0.15 : 0}
          style={{ transition: 'fill-opacity 150ms ease-out' }}
        />
      )}
      {/* Dot */}
      <circle
        cx={topic.x}
        cy={topic.y}
        r={isAvailable ? 5 : 3.5}
        fill={dotFill}
      />
      {/* Label */}
      <text
        x={topic.x + 12}
        y={topic.y + 5}
        fontFamily="Source Serif 4, Georgia, serif"
        fontSize="14"
        fill={labelFill}
        style={{
          textDecoration: isHovered && isAvailable ? 'underline' : 'none',
          textDecorationColor: 'var(--color-vermilion)',
          textUnderlineOffset: '4px',
        }}
      >
        {topic.name}
      </text>
    </g>
  )
}
