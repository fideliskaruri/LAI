import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * What "king" actually is, inside a trained word2vec model: a column of
 * 300 floating-point numbers. We show the first 12 in JetBrains Mono,
 * then a truncation marker "… 288 more …".
 *
 * The numbers are cosmetic but plausible — generated to look like real
 * word2vec components (mean ~0, sigma ~0.3, mostly small).
 */

const VIEW_W = 600
const VIEW_H = 480

const components = [
  '  0.341',
  ' -0.118',
  '  0.776',
  '  0.045',
  ' -0.502',
  '  0.193',
  '  0.022',
  '  0.667',
  ' -0.284',
  '  0.119',
  '  0.408',
  ' -0.357',
]

export function TheActualDimensions() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The word king represented inside a trained word2vec model: a column of three hundred decimal numbers. The first twelve are shown — 0.341, -0.118, 0.776, 0.045, -0.502, 0.193, 0.022, 0.667, -0.284, 0.119, 0.408, -0.357 — and 288 more below."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="The word vector for king as a column of 300 decimal numbers. First twelve components shown in monospace, then a truncation marker indicating 288 more."
      >
        {/* HUD */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            INSIDE THE MODEL
          </text>
          <text
            y="22"
            fontFamily="Source Serif 4, Georgia, serif"
            fontSize="18"
            fontWeight="600"
            fill="var(--color-ink)"
          >
            <tspan fontStyle="italic">king</tspan> = a vector in ℝ³⁰⁰
          </text>
          <text
            y="42"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            three hundred numbers — the model's internal coordinate system
          </text>
        </g>

        {/* Bracket-and-column visual, like a math vector */}
        <g transform="translate(220, 100)">
          {/* Left square bracket */}
          <path
            d="M 28 0 L 14 0 L 14 320 L 28 320"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="1.5"
          />
          {/* Right square bracket */}
          <path
            d="M 132 0 L 146 0 L 146 320 L 132 320"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="1.5"
          />

          {/* Component index column (faint) */}
          {components.map((_, i) => (
            <text
              key={`idx-${i}`}
              x={32}
              y={22 + i * 19}
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
              opacity="0.7"
            >
              {String(i + 1).padStart(3, '0')}
            </text>
          ))}

          {/* The first 12 numbers */}
          {components.map((c, i) => (
            <text
              key={`val-${i}`}
              x={70}
              y={22 + i * 19}
              fontFamily="JetBrains Mono, monospace"
              fontSize="13"
              fill={c.trim().startsWith('-') ? 'var(--color-dim)' : 'var(--color-ink)'}
            >
              {c}
            </text>
          ))}

          {/* Truncation marker */}
          <text
            x={80}
            y={258}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="13"
            fill="var(--color-dim)"
          >
            ⋮
          </text>
          <text
            x={80}
            y={282}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.18em"
            fill="var(--color-vermilion)"
          >
            288 MORE
          </text>
          <text
            x={80}
            y={298}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-dim)"
          >
            (one row per dimension)
          </text>
          <text
            x={80}
            y={314}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="13"
            fill="var(--color-dim)"
          >
            ⋮
          </text>
        </g>

        {/* Side caption */}
        <g transform="translate(420, 200)">
          <text
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            Each component is a
          </text>
          <text
            y="18"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            coordinate in a 300-
          </text>
          <text
            y="36"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            dimensional space the
          </text>
          <text
            y="54"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            model invented for itself.
          </text>
          <text
            y="86"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-vermilion)"
          >
            No axis is "royal".
          </text>
          <text
            y="104"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-vermilion)"
          >
            No axis is "male".
          </text>
          <text
            y="122"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-vermilion)"
          >
            They emerge from training.
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5 — &lsquo;king&rsquo; as 300 real numbers
      </figcaption>
    </figure>
  )
}
