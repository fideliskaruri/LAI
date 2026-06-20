import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 2 — the machine. Static SVG sketch.
 *
 *  Left  : a schematic of the Mark I Perceptron's three stages —
 *           1. a 20×20 photocell array (the "retina"),
 *           2. random wiring to a row of "association units" (A-units),
 *           3. weighted edges into a single "response unit" with a step gate.
 *          Same shape Rosenblatt drew in his 1958 Cornell tech report.
 *  Right : the same machine, reduced to its modern equation —
 *           ŷ = step(w₀ + w₁x₁ + w₂x₂ + … + wₙxₙ).
 *          Vector dot product, then a sign.
 *
 * Static.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  // Retina grid — a 6×6 sketch of the conceptual 20×20 photocell array
  // (six is enough to read; twenty would muddle).
  const RETINA_COLS = 6
  const RETINA_ROWS = 6
  const RETINA_X0 = 80
  const RETINA_Y0 = 130
  const CELL = 16
  const RETINA_X1 = RETINA_X0 + RETINA_COLS * CELL

  // A-units: a vertical column to the right of the retina.
  const A_X = 320
  const A_YS = [160, 210, 260, 310, 360]

  // R-unit (output)
  const R_X = 500
  const R_Y = 260

  // A deterministic "random" wiring from retina cells to A-units.
  // Each A-unit pulls from three pseudo-random retina cells.
  const wiring: { rCol: number; rRow: number; aIdx: number }[] = []
  let seed = 1
  for (let a = 0; a < A_YS.length; a++) {
    for (let k = 0; k < 3; k++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      const rCol = seed % RETINA_COLS
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      const rRow = seed % RETINA_ROWS
      wiring.push({ rCol, rRow, aIdx: a })
    }
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A schematic of the Mark I Perceptron. A grid of photocells on the left feeds randomly wired association units, which feed weighted signals into a single response unit whose gate fires when the weighted sum crosses a threshold. This is the architecture Rosenblatt sketched in his 1958 Cornell technical report."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A schematic of the Mark I Perceptron: a photocell retina feeds randomly wired association units, which feed weighted edges into a single response unit applying a step threshold."
      >
        {/* Outer frame */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="80"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          MARK I PERCEPTRON &middot; ROSENBLATT 1958
        </text>

        {/* Stage labels */}
        <text
          x={(RETINA_X0 + RETINA_X1) / 2}
          y={RETINA_Y0 - 14}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          S &middot; SENSORY
        </text>
        <text
          x={A_X}
          y={A_YS[0] - 18}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          A &middot; ASSOCIATION
        </text>
        <text
          x={R_X}
          y={R_Y - 48}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          R &middot; RESPONSE
        </text>

        {/* Wiring lines from retina to A-units (drawn first so they sit under
            the cells and circles). */}
        <g stroke="var(--color-graph-fade)" strokeWidth="0.7" strokeOpacity="0.55">
          {wiring.map((w, i) => {
            const cx = RETINA_X0 + w.rCol * CELL + CELL / 2
            const cy = RETINA_Y0 + w.rRow * CELL + CELL / 2
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={A_X - 12}
                y2={A_YS[w.aIdx]}
              />
            )
          })}
        </g>

        {/* Retina cells */}
        {Array.from({ length: RETINA_ROWS }).map((_, r) =>
          Array.from({ length: RETINA_COLS }).map((_, c) => {
            // Light pattern: a triangle shape made of "lit" cells (Rosenblatt's
            // demo distinguished triangle from square).
            const lit =
              (r === 1 && c === 3) ||
              (r === 2 && (c === 2 || c === 3 || c === 4)) ||
              (r === 3 && (c === 1 || c === 2 || c === 3 || c === 4 || c === 5))
            return (
              <rect
                key={`${r}-${c}`}
                x={RETINA_X0 + c * CELL}
                y={RETINA_Y0 + r * CELL}
                width={CELL - 1.5}
                height={CELL - 1.5}
                fill={lit ? 'var(--color-ink)' : 'var(--color-cream)'}
                stroke="var(--color-graph-ink)"
                strokeWidth="0.5"
              />
            )
          }),
        )}

        {/* A-units (small circles) */}
        {A_YS.map((y, i) => (
          <g key={i}>
            <circle
              cx={A_X}
              cy={y}
              r="11"
              fill="var(--color-cream)"
              stroke="var(--color-graph-ink)"
              strokeWidth="1.2"
            />
            <text
              x={A_X}
              y={y + 3}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill="var(--color-dim)"
            >
              {`a${i + 1}`}
            </text>
          </g>
        ))}

        {/* Edges A → R with weight labels */}
        {A_YS.map((y, i) => (
          <g key={`e-${i}`}>
            <line
              x1={A_X + 11}
              y1={y}
              x2={R_X - 32}
              y2={R_Y}
              stroke="var(--color-graph-ink)"
              strokeWidth="1"
            />
            <text
              x={(A_X + R_X) / 2}
              y={(y + R_Y) / 2 - 4}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill="var(--color-vermilion)"
            >
              {`w${i + 1}`}
            </text>
          </g>
        ))}

        {/* Response unit — step function gate */}
        <circle
          cx={R_X}
          cy={R_Y}
          r="30"
          fill="var(--color-cream)"
          stroke="var(--color-vermilion)"
          strokeWidth="2"
        />
        {/* A tiny step-function glyph inside the response unit */}
        <g transform={`translate(${R_X - 12}, ${R_Y - 8})`}>
          <line x1="0" y1="14" x2="11" y2="14" stroke="var(--color-vermilion)" strokeWidth="1.5" />
          <line x1="11" y1="14" x2="11" y2="2" stroke="var(--color-vermilion)" strokeWidth="1.5" />
          <line x1="11" y1="2" x2="24" y2="2" stroke="var(--color-vermilion)" strokeWidth="1.5" />
        </g>

        {/* Output arrow */}
        <line
          x1={R_X + 30}
          y1={R_Y}
          x2={R_X + 70}
          y2={R_Y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
        />
        <polygon
          points={`${R_X + 76},${R_Y} ${R_X + 68},${R_Y - 5} ${R_X + 68},${R_Y + 5}`}
          fill="var(--color-graph-ink)"
        />
        <text
          x={R_X + 50}
          y={R_Y - 10}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-ink)"
        >
          ŷ
        </text>

        {/* Bottom caption */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 58}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          twenty-by-twenty photocells &mdash; random wiring &mdash; one threshold
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1a &mdash; The architecture of the Mark I
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The same machine, written as one equation. A perceptron is a vector dot product followed by a hard threshold. Output is one if the weighted sum is at least zero, zero otherwise."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="The perceptron as a single equation: take the weighted sum of inputs plus a bias, then apply the step function."
      >
        {/* Frame */}
        <rect
          x="60"
          y="60"
          width={VIEW_W - 120}
          height={VIEW_H - 120}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="100"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE PERCEPTRON &middot; IN ONE LINE
        </text>

        {/* The equation, in two readings */}
        <text
          x={VIEW_W / 2}
          y="170"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="16"
          fill="var(--color-ink)"
        >
          ŷ = step(w · x + b)
        </text>

        <text
          x={VIEW_W / 2}
          y="220"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="15"
          fill="var(--color-dim)"
        >
          read in three pieces:
        </text>

        <text
          x={120}
          y="270"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-ink)"
        >
          w · x + b
        </text>
        <text
          x={260}
          y="270"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          weighted sum (a dot product)
        </text>

        <text
          x={120}
          y="306"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          step(·)
        </text>
        <text
          x={260}
          y="306"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          1 if ≥ 0, otherwise 0
        </text>

        <text
          x={120}
          y="342"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-ink)"
        >
          ŷ
        </text>
        <text
          x={260}
          y="342"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the prediction (a class)
        </text>

        {/* Step function thumbnail */}
        <g transform="translate(420, 240)">
          <line x1="0" y1="60" x2="80" y2="60" stroke="var(--color-graph-fade)" strokeWidth="0.6" />
          <line x1="40" y1="0" x2="40" y2="80" stroke="var(--color-graph-fade)" strokeWidth="0.6" />
          <line x1="0" y1="60" x2="40" y2="60" stroke="var(--color-vermilion)" strokeWidth="2" />
          <line x1="40" y1="60" x2="40" y2="14" stroke="var(--color-vermilion)" strokeWidth="2" strokeDasharray="2 2" />
          <line x1="40" y1="14" x2="80" y2="14" stroke="var(--color-vermilion)" strokeWidth="2" />
          <circle cx="40" cy="14" r="3" fill="var(--color-vermilion)" />
          <circle cx="40" cy="60" r="3" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="1.5" />
          <text x="40" y="96" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
            step(z)
          </text>
        </g>

        <line
          x1={VIEW_W / 2 - 40}
          y1="376"
          x2={VIEW_W / 2 + 40}
          y2="376"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />
        <text
          x={VIEW_W / 2}
          y="402"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          a dot product, then a sign
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1b &mdash; The same machine, in one equation
      </figcaption>
    </figure>
  )
}
