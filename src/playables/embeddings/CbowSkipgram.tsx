import { useCallback, useRef, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * How word vectors are learned. Two architectures live in the same canvas;
 * a two-position slider switches between them.
 *
 *   CBOW       — context words on the left predict the center word on the
 *                right. Many arrows in, one out.
 *   Skip-gram  — center word on the left predicts each context word.
 *                One arrow in, many out.
 *
 * The sentence used: "the quick brown FOX jumps over the". FOX is the
 * center word; the other six are the context window.
 */

const VIEW_W = 600
const VIEW_H = 480

type Mode = 'cbow' | 'skipgram'

const sentence = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the']
const CENTER_INDEX = 3

interface NarrationOut {
  text: string
  priority: 'normal' | 'high'
}

function narrate(mode: Mode): NarrationOut {
  if (mode === 'cbow') {
    return {
      text: 'CBOW: continuous bag of words. The six context words — the, quick, brown, jumps, over, the — feed into a tiny network that predicts the center word, fox.',
      priority: 'high',
    }
  }
  return {
    text: 'Skip-gram: the center word fox feeds into a tiny network that predicts each of the six context words around it.',
    priority: 'high',
  }
}

export function CbowSkipgram() {
  const [mode, setMode] = useState<Mode>('cbow')
  const handleRef = useRef<SVGGElement | null>(null)

  const toggle = useCallback(() => {
    setMode((m) => (m === 'cbow' ? 'skipgram' : 'cbow'))
  }, [])

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        if (dx > 0) setMode('skipgram')
        else setMode('cbow')
      },
      [],
    ),
  )

  const contextWords = sentence
    .map((w, i) => ({ word: w, i }))
    .filter(({ i }) => i !== CENTER_INDEX)
  const centerWord = sentence[CENTER_INDEX]

  // Layout. Left column = 6 context boxes stacked. Right side = center box.
  // For CBOW, arrows flow left → right. For Skip-gram, arrows flow right → left.
  const LEFT_X = 110
  const RIGHT_X = 460
  const BOX_W = 80
  const BOX_H = 30
  const TOP = 90
  const GAP = 38

  const contextPositions = contextWords.map((c, i) => ({
    word: c.word,
    y: TOP + i * GAP,
  }))

  const centerY = TOP + ((contextWords.length - 1) * GAP) / 2

  const narration = narrate(mode)

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration.text} priority={narration.priority} />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`${mode === 'cbow' ? 'CBOW architecture: six context words predict the center word fox.' : 'Skip-gram architecture: the center word fox predicts each of six surrounding context words.'}`}
      >
        {/* Title */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            ARCHITECTURE
          </text>
          <text
            y="22"
            fontFamily="Source Serif 4, Georgia, serif"
            fontSize="18"
            fontWeight="600"
            fill="var(--color-ink)"
          >
            {mode === 'cbow' ? 'CBOW · context → center' : 'Skip-gram · center → context'}
          </text>
          <text
            y="42"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            "the quick brown {centerWord} jumps over the"
          </text>
        </g>

        {/* Context column on the left */}
        {contextPositions.map((c, i) => (
          <g key={i}>
            <rect
              x={LEFT_X}
              y={c.y - BOX_H / 2}
              width={BOX_W}
              height={BOX_H}
              fill="var(--color-cream)"
              stroke="var(--color-graph-ink)"
              strokeWidth="1"
              rx="2"
            />
            <text
              x={LEFT_X + BOX_W / 2}
              y={c.y + 4}
              textAnchor="middle"
              fontFamily="Source Serif 4, Georgia, serif"
              fontStyle="italic"
              fontSize="13"
              fill="var(--color-ink)"
            >
              {c.word}
            </text>
          </g>
        ))}

        {/* Center word on the right */}
        <rect
          x={RIGHT_X}
          y={centerY - BOX_H / 2}
          width={BOX_W}
          height={BOX_H}
          fill="var(--color-vermilion)"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
          rx="2"
        />
        <text
          x={RIGHT_X + BOX_W / 2}
          y={centerY + 5}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fontWeight="600"
          fill="var(--color-cream)"
        >
          {centerWord}
        </text>

        {/* Arrows — direction depends on mode */}
        {contextPositions.map((c, i) => {
          const fromX = mode === 'cbow' ? LEFT_X + BOX_W : RIGHT_X
          const fromY = mode === 'cbow' ? c.y : centerY
          const toX = mode === 'cbow' ? RIGHT_X : LEFT_X + BOX_W
          const toY = mode === 'cbow' ? centerY : c.y

          // For arrowhead positioning, compute slightly back-off
          const ang = Math.atan2(toY - fromY, toX - fromX)
          const tipX = toX - 4 * Math.cos(ang)
          const tipY = toY - 4 * Math.sin(ang)
          const headLen = 10
          const headWide = 4
          const p1x = tipX - headLen * Math.cos(ang) + headWide * Math.cos(ang + Math.PI / 2)
          const p1y = tipY - headLen * Math.sin(ang) + headWide * Math.sin(ang + Math.PI / 2)
          const p2x = tipX - headLen * Math.cos(ang) - headWide * Math.cos(ang + Math.PI / 2)
          const p2y = tipY - headLen * Math.sin(ang) - headWide * Math.sin(ang + Math.PI / 2)

          return (
            <g key={`arrow-${i}`}>
              <line
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke="var(--color-vermilion)"
                strokeWidth="1.2"
                strokeOpacity="0.65"
              />
              <polygon
                points={`${tipX},${tipY} ${p1x},${p1y} ${p2x},${p2y}`}
                fill="var(--color-vermilion)"
                fillOpacity="0.85"
              />
            </g>
          )
        })}

        {/* Hidden layer dot — the "tiny network" */}
        <circle
          cx={(LEFT_X + BOX_W + RIGHT_X) / 2}
          cy={centerY}
          r="6"
          fill="var(--color-cream)"
          stroke="var(--color-ink)"
          strokeWidth="1"
        />
        <text
          x={(LEFT_X + BOX_W + RIGHT_X) / 2}
          y={centerY - 14}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          HIDDEN
        </text>

        {/* Mode toggle */}
        <g
          ref={handleRef}
          tabIndex={0}
          role="switch"
          aria-checked={mode === 'skipgram'}
          aria-label={`Architecture mode. Current: ${mode === 'cbow' ? 'CBOW' : 'Skip-gram'}. Arrow keys or click to switch.`}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggle()
            }
          }}
          style={{ cursor: 'pointer' }}
          className="focus-visible:outline-none [&:focus-visible_rect:first-of-type]:stroke-vermilion-deep"
        >
          <rect
            x="200"
            y={VIEW_H - 70}
            width="200"
            height="32"
            rx="16"
            fill="var(--color-cream-deep)"
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
          />
          {/* moving pill */}
          <rect
            x={mode === 'cbow' ? 204 : 302}
            y={VIEW_H - 66}
            width="94"
            height="24"
            rx="12"
            fill="var(--color-vermilion)"
            style={{ transition: 'x 200ms' }}
          />
          <text
            x="251"
            y={VIEW_H - 49}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="11"
            letterSpacing="0.12em"
            fill={mode === 'cbow' ? 'var(--color-cream)' : 'var(--color-dim)'}
          >
            CBOW
          </text>
          <text
            x="349"
            y={VIEW_H - 49}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="11"
            letterSpacing="0.12em"
            fill={mode === 'skipgram' ? 'var(--color-cream)' : 'var(--color-dim)'}
          >
            SKIP-GRAM
          </text>
        </g>
        <text
          x="300"
          y={VIEW_H - 22}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          CLICK · ARROWS SWITCH
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2 — Two ways to train a word vector
      </figcaption>
    </figure>
  )
}
