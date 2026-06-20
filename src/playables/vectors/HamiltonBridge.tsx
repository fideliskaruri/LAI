/**
 * A stylized sketch of Brougham Bridge, Dublin, October 16 1843.
 * The carved equation i² = j² = k² = ijk = −1 sits on a plaque on the stone.
 * Read-only — the emotional beat is the prose, not the scene.
 */
export function HamiltonBridge() {
  // Wavy water lines on the canal below
  const waterLines = Array.from({ length: 5 }, (_, i) => 400 + i * 18)

  return (
    <figure className="w-full">
      <svg
        viewBox="0 0 600 480"
        className="w-full h-auto"
        role="img"
        aria-label="A stylized sketch of Brougham Bridge in Dublin, where on October 16 1843, William Rowan Hamilton carved the equation i squared equals j squared equals k squared equals i j k equals minus one into the stone."
      >
        {/* Sky */}
        <rect width="600" height="290" y="0" fill="#FAF6EC" />
        {/* Canal */}
        <rect width="600" height="190" y="290" fill="var(--color-graph-fade)" opacity="0.35" />
        {/* Water lines */}
        {waterLines.map((y, i) => (
          <line
            key={i}
            x1={40 + (i % 2) * 20}
            y1={y}
            x2={560 - (i % 2) * 20}
            y2={y}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.6"
            strokeOpacity="0.35"
            strokeDasharray="2 6"
          />
        ))}

        {/* Bridge body */}
        <path
          d="M 30 365 L 30 290 C 30 230, 80 200, 150 200 L 450 200 C 520 200, 570 230, 570 290 L 570 365 L 30 365 Z"
          fill="#E8E2D4"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.5"
        />

        {/* Arch hollow */}
        <path
          d="M 130 365 L 130 290 C 130 240, 180 220, 230 220 L 370 220 C 420 220, 470 240, 470 290 L 470 365 L 130 365 Z"
          fill="var(--color-graph-fade)"
          fillOpacity="0.6"
        />

        {/* Stones — vertical separators */}
        {Array.from({ length: 7 }, (_, i) => {
          const x = 70 + i * 70
          return (
            <line
              key={i}
              x1={x}
              y1={210}
              x2={x}
              y2={290}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.6"
              strokeOpacity="0.4"
            />
          )
        })}

        {/* Carved equation plaque */}
        <rect
          x="200"
          y="240"
          width="200"
          height="86"
          fill="#D8D0BC"
          stroke="var(--color-vermilion)"
          strokeWidth="1.5"
          rx="2"
        />
        <text
          x="300"
          y="272"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="15"
          fontStyle="italic"
          fill="var(--color-ink)"
        >
          i² = j² = k² =
        </text>
        <text
          x="300"
          y="302"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="15"
          fontStyle="italic"
          fill="var(--color-ink)"
        >
          i&#160;j&#160;k = −1
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 9 — Brougham Bridge · 16 Oct 1843
      </figcaption>
    </figure>
  )
}
