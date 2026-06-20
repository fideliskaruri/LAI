import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Closing scene for the embeddings chapter. A sentence is broken into
 * tokens; each token becomes a short stack of decimal numbers (an
 * embedding). Faint arrows fan out between the stacks, hinting at how
 * the next chapter — attention — lets vectors talk to each other.
 *
 * Read-only. The teaching is the prose; the visual stages the handoff
 * to attention.
 */

const VIEW_W = 600
const VIEW_H = 480

const tokens = ['the', 'cat', 'sat', 'on', 'mat']

// Faint, plausible decimal columns — five rows shown per token.
const vectorRows: string[][] = [
  ['0.21', '-0.04', '0.55', '0.12', '-0.31'],
  ['-0.18', '0.42', '0.07', '-0.23', '0.36'],
  ['0.33', '0.11', '-0.27', '0.48', '-0.05'],
  ['0.09', '-0.16', '0.39', '0.02', '-0.41'],
  ['0.27', '0.05', '-0.14', '0.31', '0.19'],
]

export function Closing() {
  const tokenW = 80
  const tokenGap = 32
  const totalW = tokens.length * tokenW + (tokens.length - 1) * tokenGap
  const startX = (VIEW_W - totalW) / 2

  const centers = tokens.map((_, i) => startX + i * (tokenW + tokenGap) + tokenW / 2)
  const stackTop = 140
  const stackBottom = 340

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A short sentence — the cat sat on mat — broken into five tokens. Each token becomes a vertical stack of decimal numbers, an embedding. Faint arrows fan between the stacks: in the next chapter, attention will let these vectors look at each other and decide which to listen to."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="The sentence 'the cat sat on mat' shown as five vector stacks. Faint arrows fan between them, foreshadowing attention."
      >
        {/* HUD */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            FORWARD — TO ATTENTION
          </text>
          <text
            y="22"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-dim)"
          >
            every word becomes a vector first.
          </text>
        </g>

        {/* Sentence row */}
        {tokens.map((t, i) => (
          <text
            key={`tok-${i}`}
            x={centers[i]}
            y={110}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="16"
            fill="var(--color-ink)"
          >
            {t}
          </text>
        ))}

        {/* Down-arrows from token → vector stack */}
        {centers.map((cx, i) => (
          <g key={`arrow-${i}`}>
            <line
              x1={cx}
              y1={120}
              x2={cx}
              y2={stackTop - 4}
              stroke="var(--color-vermilion)"
              strokeWidth="1"
              strokeOpacity="0.7"
            />
            <polygon
              points={`${cx},${stackTop - 4} ${cx - 4},${stackTop - 12} ${cx + 4},${stackTop - 12}`}
              fill="var(--color-vermilion)"
              fillOpacity="0.85"
            />
          </g>
        ))}

        {/* Vector stacks */}
        {centers.map((cx, i) => (
          <g key={`stack-${i}`}>
            <rect
              x={cx - tokenW / 2}
              y={stackTop}
              width={tokenW}
              height={stackBottom - stackTop}
              fill="none"
              stroke="var(--color-graph-fade)"
              strokeWidth="1"
              rx="2"
            />
            {vectorRows.map((row, j) => (
              <text
                key={j}
                x={cx}
                y={stackTop + 22 + j * 22}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill={row[i].startsWith('-') ? 'var(--color-dim)' : 'var(--color-ink)'}
              >
                {row[i]}
              </text>
            ))}
            <text
              x={cx}
              y={stackBottom - 22}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="11"
              fill="var(--color-dim)"
            >
              ⋮
            </text>
          </g>
        ))}

        {/* Foreshadow: fan of faint arrows between all pairs */}
        {centers.map((cx1, i) =>
          centers.map((cx2, j) => {
            if (i >= j) return null
            const y1 = stackBottom + 30
            const y2 = stackBottom + 30
            const cyMid = stackBottom + 70
            return (
              <path
                key={`fan-${i}-${j}`}
                d={`M ${cx1} ${y1} Q ${(cx1 + cx2) / 2} ${cyMid} ${cx2} ${y2}`}
                fill="none"
                stroke="var(--color-vermilion)"
                strokeWidth="0.6"
                strokeOpacity="0.22"
              />
            )
          }),
        )}

        {/* Caption — the bridge */}
        <text
          x={300}
          y={440}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          next: how should these vectors talk to each other?
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6 — Embedding → attention
      </figcaption>
    </figure>
  )
}
