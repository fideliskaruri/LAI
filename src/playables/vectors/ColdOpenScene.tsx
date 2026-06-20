import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Cold-open: a stylized fragment of an 1893 issue of Nature magazine.
 * No interaction. Abstract — wavy lines stand in for body text; two passages
 * highlighted in vermilion mark the polemic between Tait and Gibbs.
 */
export function ColdOpenScene() {
  const lines = Array.from({ length: 18 }, (_, i) => ({
    y: 175 + i * 14,
    len: 380 - ((i * 11) % 90),
    highlight: i === 4 || i === 12,
  }))

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A stylized fragment of an 1893 issue of Nature magazine. Two passages, highlighted in vermilion, mark the polemic between Tait and Gibbs about quaternions versus vectors."
        priority="normal"
      />
      <svg
        viewBox="0 0 600 480"
        className="w-full h-auto"
        role="img"
        aria-label="A stylized fragment of an 1893 issue of Nature magazine. Two passages are highlighted in vermilion — Tait and Gibbs trading positions about quaternions versus vectors."
      >
        {/* Page */}
        <rect
          x="60"
          y="32"
          width="480"
          height="416"
          fill="var(--color-paper)"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* Masthead */}
        <text x="84" y="74" fontFamily="Georgia, serif" fontSize="22" fontWeight="700" fill="var(--color-paper-ink)">
          NATURE
        </text>
        <text x="84" y="91" fontFamily="Inter, sans-serif" fontSize="9" fill="var(--color-dim)">
          VOL. XLVIII   ·   17 AUGUST 1893   ·   No. 1242
        </text>
        <line x1="84" y1="105" x2="516" y2="105" stroke="var(--color-graph-ink)" strokeWidth="0.8" />

        {/* Article title */}
        <text x="84" y="132" fontFamily="Georgia, serif" fontSize="13" fontWeight="700" fill="var(--color-paper-ink)">
          QUATERNIONS AND VECTOR ANALYSIS
        </text>
        <text x="84" y="148" fontFamily="Georgia, serif" fontSize="9" fontStyle="italic" fill="var(--color-dim)">
          A reply to Professor Tait —
        </text>

        {/* Body lines (abstract) with polemic highlights */}
        {lines.map((l, i) => (
          <g key={i}>
            {l.highlight && (
              <rect
                x="80"
                y={l.y - 9}
                width={l.len + 8}
                height="14"
                fill="var(--color-vermilion)"
                fillOpacity="0.18"
              />
            )}
            <line
              x1="84"
              y1={l.y}
              x2={84 + l.len}
              y2={l.y}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.5"
              strokeOpacity="0.75"
            />
          </g>
        ))}

        {/* Signature */}
        <text x="84" y="438" fontFamily="Georgia, serif" fontSize="10" fontStyle="italic" fill="var(--color-paper-ink)">
          — J. Willard Gibbs
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0 — Nature, 17 Aug 1893
      </figcaption>
    </figure>
  )
}
