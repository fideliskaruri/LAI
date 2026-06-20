import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Cold-open: a stylized internal-memo title page from Bell Telephone
 * Laboratories, summer 1957. Stuart Lloyd's manuscript on "Least Squares
 * Quantization in PCM" — the paper that invented what we now call K-means,
 * for the purpose of compressing pulse-code-modulated telephone signals.
 *
 * The paper circulated as an internal memo for 25 years before Lloyd
 * finally published it in IEEE Transactions on Information Theory in 1982.
 * In the interim, others (Forgy 1965, MacQueen 1967) rediscovered the same
 * algorithm independently. Centroid-based clustering was invented for
 * signal compression — not for pattern recognition.
 *
 * No interaction. The teaching is the prose.
 */
export function LloydMemo() {
  // Wavy lines stand in for typed body text.
  const lines = Array.from({ length: 14 }, (_, i) => ({
    y: 240 + i * 14,
    len: 360 - ((i * 13) % 80),
  }))

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A stylized title page of an internal Bell Labs memo from 1957: Stuart Lloyd's Least Squares Quantization in PCM. The paper that invented K-means clustering, written for telephone signal compression, not for pattern recognition. It circulated internally for twenty-five years before publication."
        priority="normal"
      />
      <svg
        viewBox="0 0 600 480"
        className="w-full h-auto"
        role="img"
        aria-label="A stylized mockup of the title page of Stuart Lloyd's 1957 internal Bell Labs memo, Least Squares Quantization in PCM. Wavy lines represent the typed body text. A stamp reads INTERNAL — NOT FOR PUBLICATION."
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

        {/* Letterhead */}
        <text
          x="84"
          y="76"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          BELL TELEPHONE LABORATORIES, INCORPORATED
        </text>
        <text
          x="84"
          y="90"
          fontFamily="Inter, sans-serif"
          fontSize="8"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          MURRAY HILL · NEW JERSEY
        </text>
        <line
          x1="84"
          y1="100"
          x2="516"
          y2="100"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.8"
        />

        {/* Memo header */}
        <text
          x="84"
          y="128"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          TECHNICAL MEMORANDUM
        </text>
        <text
          x="84"
          y="146"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          fill="var(--color-dim)"
        >
          MM-57-1127-12   ·   31 JULY 1957
        </text>

        {/* Title */}
        <text
          x="84"
          y="186"
          fontFamily="Georgia, serif"
          fontSize="17"
          fontWeight="700"
          fill="var(--color-paper-ink)"
        >
          LEAST SQUARES QUANTIZATION
        </text>
        <text
          x="84"
          y="208"
          fontFamily="Georgia, serif"
          fontSize="17"
          fontWeight="700"
          fill="var(--color-paper-ink)"
        >
          IN PCM
        </text>

        {/* Author */}
        <text
          x="84"
          y="228"
          fontFamily="Georgia, serif"
          fontSize="11"
          fontStyle="italic"
          fill="var(--color-dim)"
        >
          Stuart P. Lloyd
        </text>

        {/* Body lines (abstract) */}
        {lines.map((l, i) => (
          <line
            key={i}
            x1="84"
            y1={l.y}
            x2={84 + l.len}
            y2={l.y}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.5"
            strokeOpacity="0.55"
          />
        ))}

        {/* Diagonal stamp */}
        <g transform="translate(390, 320) rotate(-14)">
          <rect
            x="-78"
            y="-18"
            width="156"
            height="36"
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="1.5"
          />
          <text
            textAnchor="middle"
            y="-3"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-vermilion)"
          >
            INTERNAL
          </text>
          <text
            textAnchor="middle"
            y="11"
            fontFamily="Inter, sans-serif"
            fontSize="8"
            letterSpacing="0.18em"
            fill="var(--color-vermilion)"
          >
            NOT FOR PUBLICATION
          </text>
        </g>

        {/* Footer */}
        <text
          x="84"
          y="434"
          fontFamily="Inter, sans-serif"
          fontSize="8"
          letterSpacing="0.16em"
          fill="var(--color-dim)"
        >
          PROPERTY OF BELL TELEPHONE LABORATORIES, INCORPORATED
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0 &mdash; Lloyd memo, Bell Labs, July 1957
      </figcaption>
    </figure>
  )
}
