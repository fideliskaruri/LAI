import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { topics, type Topic } from '../../data/constellation'
import { Glyph } from './Glyph'
import { EdgeLayer } from './EdgeLayer'
import { DueIndicator } from '../recall/DueIndicator'

const VIEW_W = 1280
const VIEW_H = 800

const STORAGE_KEY = 'learn-ai:v1:state'

interface StoredState {
  schema: 1
  lastVisited?: string
  completed?: string[]
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
  const containerRef = useRef<HTMLDivElement>(null)
  // Lazy initializer reads matchMedia synchronously at mount so the very first
  // mousemove handler runs with the correct value — without this, the first
  // paint always uses `false`, which leaks a frame of parallax to users who
  // have prefers-reduced-motion ON.
  const prefersReducedMotion = useRef<boolean>(
    typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  // Persistent — the only built chapter is Vectors; the pointer should always be on
  // until the user clicks it. No 8-second dismiss.
  const pointerVisible = true

  // Keep the ref in sync if the OS preference changes mid-session.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq: MediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      prefersReducedMotion.current = mq.matches
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
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
        {/* Title block */}
        <text
          x="60"
          y="56"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.28em"
          fill="var(--color-dim)"
        >
          AN INTERACTIVE BOOK
        </text>
        <text
          x="60"
          y="86"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="20"
          fill="var(--color-ink)"
        >
          The math behind machines that learn.
        </text>
        <text
          x="60"
          y="112"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          Twenty-six chapters. One is open. Click the vermilion star to begin.
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

          {/* Start-here pointer: italic words + hand-drawn curving arrow */}
          {pointerVisible && vectorsTopic && (
            <g style={{ pointerEvents: 'none' }}>
              <text
                x={vectorsTopic.x - 138}
                y={vectorsTopic.y + 44}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="16"
                fill="var(--color-vermilion)"
              >
                start here
              </text>
              {/* Sketchy curving arrow from the text up-left toward the glyph */}
              <path
                d={`
                  M ${vectorsTopic.x - 46} ${vectorsTopic.y + 40}
                  C ${vectorsTopic.x - 28} ${vectorsTopic.y + 36},
                    ${vectorsTopic.x - 18} ${vectorsTopic.y + 24},
                    ${vectorsTopic.x - 10} ${vectorsTopic.y + 14}
                `}
                stroke="var(--color-vermilion)"
                strokeWidth="1.25"
                strokeLinecap="round"
                fill="none"
                opacity="0.85"
              />
              {/* Arrowhead — two short strokes, slightly off-axis for a hand-drawn feel */}
              <path
                d={`
                  M ${vectorsTopic.x - 10} ${vectorsTopic.y + 14}
                  L ${vectorsTopic.x - 16} ${vectorsTopic.y + 19}
                  M ${vectorsTopic.x - 10} ${vectorsTopic.y + 14}
                  L ${vectorsTopic.x - 4} ${vectorsTopic.y + 18}
                `}
                stroke="var(--color-vermilion)"
                strokeWidth="1.25"
                strokeLinecap="round"
                fill="none"
                opacity="0.85"
              />
            </g>
          )}
        </g>
      </svg>

      {/* Persistent CTA — HTML overlay positioned over the SVG title block.
          Placed below the italic subtitle (SVG y≈112) to give users a clear,
          obviously-clickable backup path to the only open chapter. */}
      <button
        type="button"
        onClick={() => handleSelect('vectors')}
        className="absolute font-serif italic text-vermilion underline decoration-1 underline-offset-4 hover:text-vermilion-deep focus-visible:outline-none focus-visible:text-vermilion-deep transition-colors"
        style={{
          // SVG coords (60, 140) → percentages of viewBox (1280 × 800)
          left: `${(60 / VIEW_W) * 100}%`,
          top: `${(140 / VIEW_H) * 100}%`,
          fontSize: '17px',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        Begin → Vectors
      </button>

      {/* Spaced-review tray (FEATURES § Feature 1). Mirrors the "Begin → Vectors"
          overlay pattern — absolutely positioned in viewport coords on the
          right side, opposite the title block. Renders nothing if nothing
          is due, so it doesn't compete with the first-visit invitation. */}
      <div
        className="absolute"
        style={{ right: '60px', top: '56px' }}
      >
        <DueIndicator />
      </div>
    </div>
  )
}
