/**
 * The closing scene of the chapter: Stevin's chain dissolves into a column of
 * 768 decimal numbers — a real word2vec vector for "king". Static visual,
 * no interaction. The teaching is the *thread* — same kind of object, four
 * centuries later.
 */
export function ClosingThread() {
  const numbers = [
    '0.341',
    '-0.118',
    '0.776',
    '0.045',
    '-0.502',
    '0.193',
    '0.022',
    '0.667',
    '⋮',
    '0.084',
    '-0.391',
    '0.215',
  ]

  // Tiny Stevin chain on the left — apex at top, draped beads
  const chain = [
    { x: 80, y: 100 },
    { x: 70, y: 130 },
    { x: 60, y: 160 },
    { x: 50, y: 190 },
    { x: 60, y: 220 },
    { x: 80, y: 240 },
    { x: 100, y: 250 },
    { x: 120, y: 248 },
    { x: 140, y: 240 },
    { x: 160, y: 220 },
    { x: 150, y: 190 },
    { x: 130, y: 160 },
    { x: 110, y: 130 },
    { x: 90, y: 105 },
  ]

  const chainPath =
    `M ${chain[0].x} ${chain[0].y} ` +
    chain
      .slice(1)
      .map((p) => `L ${p.x} ${p.y}`)
      .join(' ') +
    ' Z'

  return (
    <figure className="w-full">
      <svg
        viewBox="0 0 600 480"
        className="w-full h-auto"
        role="img"
        aria-label="On the left, a tiny sketch of Stevin's wreath of spheres. An arrow points right. On the right, a column of decimal numbers in monospace — a word embedding for the word 'king'."
      >
        {/* Left: tiny Stevin chain */}
        <g transform="translate(60, 80)">
          <polygon
            points="100,0 20,160 180,160"
            fill="none"
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
          <path
            d={chainPath}
            fill="none"
            stroke="var(--color-graph-ink)"
            strokeWidth="0.8"
            strokeOpacity="0.5"
          />
          {chain.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--color-graph-ink)" />
          ))}
        </g>

        {/* Arrow to numbers */}
        <line
          x1="280"
          y1="230"
          x2="370"
          y2="230"
          stroke="var(--color-vermilion)"
          strokeWidth="1.5"
        />
        <polygon points="376,230 368,225 368,235" fill="var(--color-vermilion)" />
        <text
          x="325"
          y="220"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          KIND OF
        </text>

        {/* Right: column of numbers */}
        <g transform="translate(395, 80)">
          <rect
            x="0"
            y="0"
            width="140"
            height="330"
            fill="none"
            stroke="var(--color-graph-fade)"
            strokeWidth="1"
          />
          {numbers.map((n, i) => (
            <text
              key={i}
              x="70"
              y={28 + i * 26}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="12"
              fill="var(--color-ink)"
            >
              {n}
            </text>
          ))}
        </g>
        <text
          x="465"
          y="440"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          'king', as a 768-dimensional vector
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 12 — Stevin's chain → embedding
      </figcaption>
    </figure>
  )
}
