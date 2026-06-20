import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Cold-open: a 17th-century Parisian salon. Two dice rest on a small card
 * table; candle to the right, half-empty wineglass on the left. Static —
 * no interaction. The prose tells the Méré-Pascal-Fermat story; the scene
 * is the atmosphere.
 */
export function SalonDice() {
  // Pip positions for a die face, in unit coordinates (-1..1)
  const pips: Record<number, [number, number][]> = {
    3: [
      [-0.5, -0.5],
      [0, 0],
      [0.5, 0.5],
    ],
    5: [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0, 0],
      [-0.5, 0.5],
      [0.5, 0.5],
    ],
  }

  function Die({
    cx,
    cy,
    size,
    face,
    tilt = 0,
  }: {
    cx: number
    cy: number
    size: number
    face: 3 | 5
    tilt?: number
  }) {
    const half = size / 2
    return (
      <g transform={`translate(${cx}, ${cy}) rotate(${tilt})`}>
        <rect
          x={-half}
          y={-half}
          width={size}
          height={size}
          rx={6}
          fill="#F4ECDB"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        {pips[face].map(([px, py], i) => (
          <circle
            key={i}
            cx={px * half * 0.55}
            cy={py * half * 0.55}
            r={size * 0.07}
            fill="var(--color-ink)"
          />
        ))}
      </g>
    )
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A hand-drawn 17th-century Parisian salon. Two ivory dice rest on a small green-baize card table. A candle flickers on the right; a half-empty wineglass sits on the left. Faint paneled walls behind."
        priority="normal"
      />
      <svg
        viewBox="0 0 600 480"
        className="w-full h-auto"
        role="img"
        aria-label="A 17th-century salon, evening. Two ivory dice on a small green-baize card table, a candle on the right, a half-empty wineglass on the left. The setting where Antoine Gombaud, the self-styled Chevalier de Méré, posed his dice puzzle to Blaise Pascal in 1654."
      >
        {/* Wall paneling */}
        <rect width="600" height="300" y="0" fill="#EFE6D2" />
        {/* Wainscot */}
        <rect width="600" height="180" y="300" fill="#D9C9A7" />
        <line
          x1="0"
          y1="300"
          x2="600"
          y2="300"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.8"
          strokeOpacity="0.4"
        />
        {/* Panel lines on wall */}
        {[140, 300, 460].map((x) => (
          <g key={x}>
            <rect
              x={x - 60}
              y={60}
              width={120}
              height={210}
              fill="none"
              stroke="var(--color-graph-ink)"
              strokeWidth="0.6"
              strokeOpacity="0.35"
              rx={4}
            />
          </g>
        ))}

        {/* Card table — green baize */}
        <ellipse
          cx="300"
          cy="370"
          rx="240"
          ry="44"
          fill="#A8B47A"
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />
        {/* Table edge band */}
        <ellipse
          cx="300"
          cy="380"
          rx="240"
          ry="14"
          fill="#7A5B3A"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.8"
        />
        {/* Table legs */}
        <line x1="100" y1="380" x2="80" y2="460" stroke="#5C4128" strokeWidth="3" />
        <line x1="500" y1="380" x2="520" y2="460" stroke="#5C4128" strokeWidth="3" />
        <line x1="300" y1="390" x2="300" y2="460" stroke="#5C4128" strokeWidth="3" />

        {/* Wineglass — left */}
        <g transform="translate(140, 308)">
          <path
            d="M -16 0 Q -16 30 0 32 Q 16 30 16 0 Z"
            fill="#7B2330"
            stroke="var(--color-graph-ink)"
            strokeWidth="0.8"
            fillOpacity="0.7"
          />
          <path
            d="M -16 0 Q -16 -2 0 -2 Q 16 -2 16 0"
            fill="none"
            stroke="var(--color-graph-ink)"
            strokeWidth="0.8"
          />
          <line x1="0" y1="32" x2="0" y2="56" stroke="var(--color-graph-ink)" strokeWidth="1" />
          <ellipse cx="0" cy="58" rx="14" ry="3" fill="none" stroke="var(--color-graph-ink)" strokeWidth="0.8" />
        </g>

        {/* Candle — right */}
        <g transform="translate(470, 280)">
          {/* Holder */}
          <rect x="-12" y="70" width="24" height="10" fill="#C9A24A" stroke="var(--color-graph-ink)" strokeWidth="0.6" />
          <ellipse cx="0" cy="70" rx="12" ry="3" fill="#C9A24A" stroke="var(--color-graph-ink)" strokeWidth="0.6" />
          {/* Candle */}
          <rect x="-4" y="20" width="8" height="50" fill="#F2E8C7" stroke="var(--color-graph-ink)" strokeWidth="0.6" />
          {/* Wick */}
          <line x1="0" y1="20" x2="0" y2="14" stroke="var(--color-graph-ink)" strokeWidth="0.8" />
          {/* Flame */}
          <path
            d="M 0 14 Q -4 8 0 0 Q 4 8 0 14 Z"
            fill="var(--color-vermilion)"
            fillOpacity="0.85"
          />
          <path d="M 0 12 Q -2 8 0 4 Q 2 8 0 12 Z" fill="#FFE0A0" />
        </g>

        {/* Two dice on the table */}
        <Die cx={260} cy={360} size={48} face={5} tilt={-8} />
        <Die cx={332} cy={365} size={44} face={3} tilt={6} />

        {/* Caption-ish whisper at the top */}
        <text
          x="300"
          y="50"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          Paris, summer 1654
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0 — A salon, two dice, a question
      </figcaption>
    </figure>
  )
}
