import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Cold-open for the Expectation chapter. A hand-drawn sketch of the
 * Chevalier de Méré at a Paris gambling table, jeton stacks shrinking, a
 * candle burning down, the gambler hunched over a slip of paper covered
 * in ratios that don't quite add up. Static — no interaction. The teaching
 * happens in the prose; the canvas just sets the question.
 *
 * The leap this scene stages: Probability told the chevalier *which*
 * outcomes were possible. It did not tell him *how much he should expect
 * to win or lose* on any given evening. That gap is what Huygens, in 1657,
 * names *expectatio* — what we now call expected value.
 */
export function GamblerLoss() {
  // Six-by-six grid of jeton stacks (the gambler's losses), each a tiny
  // chip stack. Some are tall, most are short, and a single vermilion stack
  // on the right marks the *house*.
  const stacks = [
    { x: 122, y: 372, count: 2 },
    { x: 156, y: 372, count: 5 },
    { x: 190, y: 372, count: 1 },
    { x: 224, y: 372, count: 3 },
    { x: 258, y: 372, count: 1 },
  ]

  function ChipStack({ x, y, count }: { x: number; y: number; count: number }) {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {Array.from({ length: count }, (_, i) => (
          <ellipse
            key={i}
            cx={0}
            cy={-i * 4}
            rx={9}
            ry={2.5}
            fill={i === count - 1 ? '#C9A24A' : '#A88838'}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.6"
          />
        ))}
      </g>
    )
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A hand-drawn sketch: the Chevalier de Méré hunched over a card table in a candlelit Paris room, jeton stacks scattered before him, a slip of paper covered in ratios in his left hand. He's losing more than he expected. The question the chapter answers: how much should he have expected to lose?"
        priority="normal"
      />
      <svg
        viewBox="0 0 600 480"
        className="w-full h-auto"
        role="img"
        aria-label="A 17th-century Paris gambling table at night. The Chevalier de Méré sits behind dwindling jeton stacks, holding a slip of paper covered in arithmetic. A candle burns at his elbow. The historical setup for the expected-value question."
      >
        {/* Wall + floor */}
        <rect width="600" height="320" y="0" fill="#EFE6D2" />
        <rect width="600" height="160" y="320" fill="#D9C9A7" />
        <line x1="0" y1="320" x2="600" y2="320" stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.35" />

        {/* Paneling */}
        {[120, 300, 480].map((cx) => (
          <rect
            key={cx}
            x={cx - 60}
            y={50}
            width={120}
            height={230}
            fill="none"
            stroke="var(--color-graph-ink)"
            strokeWidth="0.5"
            strokeOpacity="0.3"
            rx={4}
          />
        ))}

        {/* Card table — green baize */}
        <ellipse cx="300" cy="390" rx="250" ry="48" fill="#9DAA6E" stroke="var(--color-graph-ink)" strokeWidth="1" />
        <ellipse cx="300" cy="400" rx="250" ry="14" fill="#6F5232" stroke="var(--color-graph-ink)" strokeWidth="0.8" />
        <line x1="90" y1="400" x2="70" y2="478" stroke="#503820" strokeWidth="3" />
        <line x1="510" y1="400" x2="530" y2="478" stroke="#503820" strokeWidth="3" />

        {/* The chevalier — silhouette behind the table, slumped */}
        <g transform="translate(420, 130)">
          {/* Body */}
          <path
            d="M -40 200 Q -50 140 -32 100 Q -28 75 -20 60 L 20 60 Q 28 75 32 100 Q 50 140 40 200 Z"
            fill="#5B4A36"
            stroke="var(--color-graph-ink)"
            strokeWidth="0.8"
          />
          {/* Collar */}
          <path d="M -22 62 Q 0 55 22 62 L 18 80 L -18 80 Z" fill="#F4ECDB" stroke="var(--color-graph-ink)" strokeWidth="0.6" />
          {/* Head */}
          <circle cx="0" cy="38" r="22" fill="#E4C9A0" stroke="var(--color-graph-ink)" strokeWidth="0.8" />
          {/* Hair — long curls of a 1650s nobleman */}
          <path d="M -22 35 Q -30 14 -14 6 Q 0 -2 14 6 Q 30 14 22 35 Q 20 50 14 56 L -14 56 Q -20 50 -22 35 Z" fill="#3C2A1A" stroke="var(--color-graph-ink)" strokeWidth="0.6" />
          {/* Eye sockets — downward gaze */}
          <ellipse cx="-7" cy="40" rx="2" ry="1.4" fill="var(--color-graph-ink)" fillOpacity="0.85" />
          <ellipse cx="7" cy="40" rx="2" ry="1.4" fill="var(--color-graph-ink)" fillOpacity="0.85" />
          {/* Mouth, tense */}
          <line x1="-5" y1="50" x2="5" y2="50" stroke="var(--color-graph-ink)" strokeWidth="0.8" />
          {/* Arm reaching forward to paper */}
          <path d="M -34 100 Q -68 130 -94 160" stroke="#5B4A36" strokeWidth="22" strokeLinecap="round" fill="none" />
        </g>

        {/* Slip of paper covered in scribbled ratios */}
        <g transform="translate(290, 340)">
          <rect x="-30" y="-22" width="64" height="34" fill="#F8F2DF" stroke="var(--color-graph-ink)" strokeWidth="0.8" rx={1} transform="rotate(-6)" />
          <g transform="rotate(-6)">
            <text x="-24" y="-10" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="7" fill="var(--color-ink)">
              4/6 ?
            </text>
            <text x="-24" y="0" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="7" fill="var(--color-ink)">
              24/36 ?
            </text>
            <text x="-24" y="9" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="7" fill="var(--color-vermilion)">
              −12 livres
            </text>
          </g>
        </g>

        {/* Jeton stacks on the table — gambler's side, dwindling */}
        {stacks.map((s) => (
          <ChipStack key={`${s.x}`} x={s.x} y={s.y} count={s.count} />
        ))}
        {/* House stack — vermilion, tall, far right */}
        <g transform="translate(360, 372)">
          {Array.from({ length: 9 }, (_, i) => (
            <ellipse
              key={i}
              cx={0}
              cy={-i * 4}
              rx={9}
              ry={2.5}
              fill={i === 8 ? 'var(--color-vermilion)' : 'var(--color-vermilion-deep)'}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.6"
            />
          ))}
        </g>

        {/* Candle — far left */}
        <g transform="translate(120, 268)">
          <rect x="-10" y="68" width="20" height="8" fill="#C9A24A" stroke="var(--color-graph-ink)" strokeWidth="0.6" />
          <ellipse cx="0" cy="68" rx="10" ry="2.6" fill="#C9A24A" stroke="var(--color-graph-ink)" strokeWidth="0.6" />
          <rect x="-3" y="22" width="6" height="46" fill="#F2E8C7" stroke="var(--color-graph-ink)" strokeWidth="0.6" />
          <line x1="0" y1="22" x2="0" y2="16" stroke="var(--color-graph-ink)" strokeWidth="0.8" />
          <path d="M 0 16 Q -4 10 0 2 Q 4 10 0 16 Z" fill="var(--color-vermilion)" fillOpacity="0.85" />
          <path d="M 0 14 Q -2 10 0 6 Q 2 10 0 14 Z" fill="#FFE0A0" />
          {/* Halo of candlelight */}
          <circle cx="0" cy="8" r="56" fill="#FFE0A0" fillOpacity="0.06" />
        </g>

        {/* Dice on the table, scattered */}
        <g transform="translate(220, 366) rotate(14)">
          <rect x={-9} y={-9} width={18} height={18} rx={2} fill="#F4ECDB" stroke="var(--color-graph-ink)" strokeWidth="0.8" />
          <circle cx={-3} cy={-3} r={1.4} fill="var(--color-ink)" />
          <circle cx={3} cy={3} r={1.4} fill="var(--color-ink)" />
        </g>
        <g transform="translate(196, 358) rotate(-12)">
          <rect x={-9} y={-9} width={18} height={18} rx={2} fill="#F4ECDB" stroke="var(--color-graph-ink)" strokeWidth="0.8" />
          <circle cx={0} cy={0} r={1.4} fill="var(--color-ink)" />
          <circle cx={-4} cy={-4} r={1.4} fill="var(--color-ink)" />
          <circle cx={4} cy={4} r={1.4} fill="var(--color-ink)" />
        </g>

        {/* Place & date whisper */}
        <text
          x="300"
          y="50"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          Paris, late summer 1654
        </text>

        {/* A small caption on the table */}
        <text
          x="300"
          y="448"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-dim)"
        >
          the chevalier's stacks dwindling, the house's growing
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0 — How much should he have expected to lose?
      </figcaption>
    </figure>
  )
}
