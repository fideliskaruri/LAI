import { useCallback, useRef, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * The geometry of meaning. A 2D scatter of about 30 words at hand-tuned
 * positions that loosely approximate what t-SNE or UMAP does to real
 * word2vec vectors: words that mean similar things cluster.
 *
 * Click a word → that word and its 5 precomputed nearest neighbors light
 * up; everything else fades. The five clusters are visible by eye:
 *
 *   monarchy:   king, queen, prince, princess
 *   gender:     man, woman, boy, girl
 *   geography:  paris, london, france, england, berlin, germany, rome, italy
 *   animals:    dog, cat, puppy, kitten, horse, wolf
 *   verbs:      run, walk, fast, slow, sprint, stroll
 */

const VIEW_W = 600
const VIEW_H = 480

interface Word {
  w: string
  x: number
  y: number
  /** Precomputed 5 nearest neighbors by id (= word string itself) */
  neighbors: string[]
}

// Positions chosen so each cluster occupies a distinct region of the plane.
// Loose t-SNE-style layout; no actual embedding math.
const words: Word[] = [
  // monarchy cluster — upper-right
  { w: 'king', x: 480, y: 100, neighbors: ['queen', 'prince', 'princess', 'man', 'duke'] },
  { w: 'queen', x: 500, y: 130, neighbors: ['king', 'princess', 'prince', 'woman', 'duchess'] },
  { w: 'prince', x: 460, y: 140, neighbors: ['princess', 'king', 'queen', 'boy', 'duke'] },
  { w: 'princess', x: 490, y: 165, neighbors: ['prince', 'queen', 'king', 'girl', 'duchess'] },
  { w: 'duke', x: 440, y: 110, neighbors: ['king', 'prince', 'queen', 'duchess', 'princess'] },
  { w: 'duchess', x: 455, y: 175, neighbors: ['duke', 'queen', 'princess', 'prince', 'king'] },

  // gender / people — upper-left
  { w: 'man', x: 160, y: 110, neighbors: ['woman', 'boy', 'king', 'girl', 'prince'] },
  { w: 'woman', x: 130, y: 140, neighbors: ['man', 'girl', 'queen', 'boy', 'princess'] },
  { w: 'boy', x: 195, y: 145, neighbors: ['girl', 'man', 'woman', 'prince', 'king'] },
  { w: 'girl', x: 165, y: 175, neighbors: ['boy', 'woman', 'man', 'princess', 'queen'] },

  // geography — middle, slightly right
  { w: 'paris', x: 340, y: 250, neighbors: ['france', 'london', 'rome', 'berlin', 'england'] },
  { w: 'london', x: 370, y: 235, neighbors: ['england', 'paris', 'berlin', 'rome', 'france'] },
  { w: 'france', x: 320, y: 280, neighbors: ['paris', 'germany', 'italy', 'england', 'london'] },
  { w: 'england', x: 395, y: 265, neighbors: ['london', 'france', 'germany', 'italy', 'paris'] },
  { w: 'berlin', x: 290, y: 240, neighbors: ['germany', 'paris', 'rome', 'london', 'france'] },
  { w: 'germany', x: 275, y: 275, neighbors: ['berlin', 'france', 'italy', 'england', 'paris'] },
  { w: 'rome', x: 410, y: 230, neighbors: ['italy', 'paris', 'london', 'berlin', 'france'] },
  { w: 'italy', x: 425, y: 275, neighbors: ['rome', 'france', 'germany', 'england', 'paris'] },

  // animals — lower-left
  { w: 'dog', x: 110, y: 340, neighbors: ['cat', 'puppy', 'kitten', 'wolf', 'horse'] },
  { w: 'cat', x: 145, y: 365, neighbors: ['dog', 'kitten', 'puppy', 'wolf', 'horse'] },
  { w: 'puppy', x: 90, y: 380, neighbors: ['kitten', 'dog', 'cat', 'wolf', 'horse'] },
  { w: 'kitten', x: 125, y: 400, neighbors: ['puppy', 'cat', 'dog', 'wolf', 'horse'] },
  { w: 'horse', x: 180, y: 345, neighbors: ['wolf', 'dog', 'cat', 'puppy', 'kitten'] },
  { w: 'wolf', x: 195, y: 385, neighbors: ['horse', 'dog', 'cat', 'puppy', 'kitten'] },

  // verbs — lower-right
  { w: 'run', x: 460, y: 345, neighbors: ['sprint', 'walk', 'fast', 'stroll', 'slow'] },
  { w: 'walk', x: 490, y: 365, neighbors: ['stroll', 'run', 'slow', 'sprint', 'fast'] },
  { w: 'fast', x: 440, y: 385, neighbors: ['slow', 'sprint', 'run', 'walk', 'stroll'] },
  { w: 'slow', x: 475, y: 405, neighbors: ['fast', 'stroll', 'walk', 'run', 'sprint'] },
  { w: 'sprint', x: 430, y: 320, neighbors: ['run', 'fast', 'walk', 'slow', 'stroll'] },
  { w: 'stroll', x: 510, y: 395, neighbors: ['walk', 'slow', 'run', 'fast', 'sprint'] },
]

const wordByName = new Map(words.map((w) => [w.w, w]))

function narrate(selected: string | null): { text: string; priority: 'normal' | 'high' } {
  if (!selected) {
    return {
      text: 'A 2D map of thirty words. Five clusters are visible: monarchy upper-right, gender words upper-left, capitals and countries in the middle, animals lower-left, verbs lower-right. Click any word to see its five nearest neighbors.',
      priority: 'normal',
    }
  }
  const w = wordByName.get(selected)
  if (!w) return { text: '', priority: 'normal' }
  return {
    text: `Selected: ${selected}. Five nearest neighbors highlighted: ${w.neighbors.join(', ')}.`,
    priority: 'high',
  }
}

export function NearestNeighbors() {
  const [selected, setSelected] = useState<string | null>(null)
  const containerRef = useRef<SVGSVGElement | null>(null)

  // Keyboard: arrow keys cycle through the word list when SVG has focus.
  useKeyNudge(
    containerRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const idx = selected ? words.findIndex((w) => w.w === selected) : -1
        const next = (idx + (dx > 0 ? 1 : -1) + words.length) % words.length
        setSelected(words[next].w)
      },
      [selected],
    ),
  )

  const sel = selected ? wordByName.get(selected) : null
  const neighborSet = sel ? new Set(sel.neighbors) : new Set<string>()

  const narration = narrate(selected)

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration.text} priority={narration.priority} />
      <svg
        ref={containerRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto focus-visible:outline-none"
        role="application"
        aria-label="A 2D scatter of thirty words. Click any word to highlight its five nearest neighbors."
        tabIndex={0}
      >
        {/* Faint cluster halos — purely decorative, hint the geography */}
        <g opacity="0.05">
          <ellipse cx="475" cy="140" rx="70" ry="55" fill="var(--color-vermilion)" />
          <ellipse cx="160" cy="145" rx="60" ry="50" fill="var(--color-vermilion)" />
          <ellipse cx="350" cy="255" rx="100" ry="40" fill="var(--color-vermilion)" />
          <ellipse cx="140" cy="370" rx="75" ry="50" fill="var(--color-vermilion)" />
          <ellipse cx="470" cy="365" rx="80" ry="60" fill="var(--color-vermilion)" />
        </g>

        {/* Connector lines from selected to its neighbors */}
        {sel &&
          sel.neighbors.map((n, i) => {
            const target = wordByName.get(n)
            if (!target) return null
            return (
              <line
                key={i}
                x1={sel.x}
                y1={sel.y}
                x2={target.x}
                y2={target.y}
                stroke="var(--color-vermilion)"
                strokeWidth="0.8"
                strokeOpacity="0.4"
              />
            )
          })}

        {/* Word dots + labels */}
        {words.map((w) => {
          const isSelected = w.w === selected
          const isNeighbor = neighborSet.has(w.w)
          const isHighlighted = isSelected || isNeighbor
          const isDim = selected !== null && !isHighlighted
          const fill = isSelected
            ? 'var(--color-vermilion)'
            : isNeighbor
              ? 'var(--color-vermilion)'
              : 'var(--color-ink)'
          const labelColor = isSelected
            ? 'var(--color-vermilion)'
            : isDim
              ? 'var(--color-graph-fade)'
              : isNeighbor
                ? 'var(--color-vermilion)'
                : 'var(--color-ink)'

          return (
            <g
              key={w.w}
              role="button"
              tabIndex={-1}
              aria-label={`${w.w}${isSelected ? ' (selected)' : isNeighbor ? ' (neighbor)' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelected(w.w === selected ? null : w.w)}
              opacity={isDim ? 0.35 : 1}
            >
              <circle
                cx={w.x}
                cy={w.y}
                r={isSelected ? 5 : isNeighbor ? 4 : 3}
                fill={fill}
                stroke={isSelected ? 'var(--color-cream)' : 'none'}
                strokeWidth={isSelected ? 1.5 : 0}
              />
              <text
                x={w.x + 7}
                y={w.y + 4}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize={isSelected ? '14' : '12'}
                fontWeight={isSelected ? 600 : 400}
                fill={labelColor}
              >
                {w.w}
              </text>
            </g>
          )
        })}

        {/* HUD */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            NEAREST NEIGHBORS
          </text>
          <text
            y="22"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-ink)"
          >
            {selected ? `${selected} →  ${sel?.neighbors.join(', ')}` : 'Click any word.'}
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3 — Clusters emerge from raw text alone
      </figcaption>
    </figure>
  )
}
