import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { topics, type Topic } from '../../data/constellation'
import { Glyph } from './Glyph'
import { EdgeLayer } from './EdgeLayer'

const VIEW_W = 1280
const VIEW_H = 800

const STORAGE_KEY = 'learn-ai:v1:state'
const POINTER_DISMISS_MS = 8000

interface StoredState {
  schema: 1
  lastVisited?: string
  completed?: string[]
}

function readStored(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredState>
    if (parsed.schema !== 1) return null
    return parsed as StoredState
  } catch {
    return null
  }
}

function writeStored(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage may be disabled (private mode etc) — non-fatal
  }
}

export function Constellation() {
  const navigate = useNavigate()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [pointerVisible, setPointerVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useRef(false)

  // Detect first visit + decide if start-here pointer should fire
  useEffect(() => {
    const stored = readStored()
    if (!stored) {
      setPointerVisible(true)
      const timer = window.setTimeout(() => setPointerVisible(false), POINTER_DISMISS_MS)
      return () => clearTimeout(timer)
    }
    // Revisit: in v1 we don't move the pointer; that's M5 polish.
  }, [])

  // Reduced-motion check
  useEffect(() => {
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      prefersReducedMotion.current = mq.matches
    }
  }, [])

  // Mouse parallax: glyphs drift ~6px opposite cursor
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion.current) return
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width - 0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5
      setParallax({ x: -nx * 12, y: -ny * 12 })
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  const handleSelect = (id: string) => {
    setPointerVisible(false)
    writeStored({ schema: 1, lastVisited: id })
    navigate(`/${id}`)
  }

  const vectorsTopic: Topic | undefined = topics.find((t) => t.id === 'vectors')

  return (
    <div ref={containerRef} className="relative w-full min-h-screen overflow-hidden">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-screen"
        role="region"
        aria-label="A constellation of playgrounds"
      >
        {/* Title */}
        <text
          x="60"
          y="74"
          fontFamily="Inter, sans-serif"
          fontSize="13"
          fontStyle="italic"
          fill="var(--color-dim)"
          letterSpacing="0.02em"
        >
          A constellation of playgrounds
        </text>
        <text
          x="60"
          y="92"
          fontFamily="Inter, sans-serif"
          fontSize="13"
          fontStyle="italic"
          fill="var(--color-dim)"
        >
          for the math behind machines that learn.
        </text>

        {/* Part labels (subtle) */}
        <text x="60" y="780" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-fade)">
          PART I · FOUNDATIONS
        </text>
        <text x="540" y="780" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-fade)">
          PART II · MODELS
        </text>
        <text x="900" y="780" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-fade)">
          PART III · NETS
        </text>
        <text x="1100" y="780" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-fade)">
          PART IV · FRONTIER
        </text>

        {/* Parallaxed group */}
        <g
          transform={`translate(${parallax.x}, ${parallax.y})`}
          style={{ transition: 'transform 200ms ease-out' }}
        >
          <EdgeLayer topics={topics} hoveredId={hoveredId} />

          {topics.map((t) => (
            <Glyph
              key={t.id}
              topic={t}
              isHovered={hoveredId === t.id}
              onHover={setHoveredId}
              onSelect={handleSelect}
            />
          ))}

          {/* Start-here pointer */}
          {pointerVisible && vectorsTopic && (
            <g style={{ pointerEvents: 'none' }}>
              <text
                x={vectorsTopic.x - 110}
                y={vectorsTopic.y + 30}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="15"
                fill="var(--color-vermilion)"
              >
                start here →
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  )
}
