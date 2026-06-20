import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Cold-open for Integrals. A static, hand-feel sketch of Archimedes's
 * parabolic segment with inscribed and circumscribed rectangles — the
 * method of exhaustion, ~250 BCE.
 *
 * The teaching is the squeeze: the true area sits *between* the two
 * staircases, and Archimedes's leap was to let the staircases close
 * around it. Two thousand years before Riemann wrote his dissertation,
 * Archimedes had already done it for one curve.
 *
 * No interaction. The visual is the question.
 */

const VIEW_W = 600
const VIEW_H = 480

const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

// Reference the canonical constants so they participate in module exports
// even when the geometry below uses panel-specific scales.
void UNIT
void ORIGIN_X
void ORIGIN_Y

// Parabolic segment lives over x in [-2, 2], with f(x) = 4 - x²
// peaking at (0, 4). The "chord" closing the segment is the x-axis.
const X_MIN = -2
const X_MAX = 2
const f = (x: number) => 4 - x * x

// Use a smaller vertical unit so the segment fits the panel cleanly
const X_UNIT = 60
const Y_UNIT = 36

const N_RECTS = 8

function toPx(x: number, y: number) {
  return {
    px: ORIGIN_X + x * X_UNIT,
    py: ORIGIN_Y - y * Y_UNIT,
  }
}

function curvePath() {
  const steps = 120
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / steps
    const y = f(x)
    const { px, py } = toPx(x, y)
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return pts.join(' ')
}

export function ArchimedesSegment() {
  // Build the inscribed (low-rectangle) and circumscribed (high-rectangle)
  // staircases. The parabola peaks in the middle, so the "inscribed" rect
  // for each subinterval uses the smaller endpoint, and the "circumscribed"
  // uses the larger.
  const dx = (X_MAX - X_MIN) / N_RECTS
  const inscribed: Array<{ x: number; y: number; w: number; h: number }> = []
  const circumscribed: Array<{ x: number; y: number; w: number; h: number }> = []
  for (let i = 0; i < N_RECTS; i++) {
    const xL = X_MIN + i * dx
    const xR = xL + dx
    const yL = f(xL)
    const yR = f(xR)
    const yLo = Math.min(yL, yR)
    const yHi = Math.max(yL, yR)
    const { px: pxL } = toPx(xL, 0)
    const { px: pxR } = toPx(xR, 0)
    const { py: pyLo } = toPx(0, yLo)
    const { py: pyHi } = toPx(0, yHi)
    const { py: py0 } = toPx(0, 0)
    inscribed.push({
      x: pxL,
      y: pyLo,
      w: pxR - pxL,
      h: py0 - pyLo,
    })
    circumscribed.push({
      x: pxL,
      y: pyHi,
      w: pxR - pxL,
      h: py0 - pyHi,
    })
  }

  // Archimedes's actual answer for the area of a parabolic segment:
  // (4/3) × area of the inscribed triangle. For our segment with base 4
  // and height 4, the inscribed triangle has area 8, so the segment area
  // is 32/3 ≈ 10.667. We'll display that as the "true" value the squeeze
  // is heading toward.

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A still sketch of a parabolic segment, drawn after Archimedes around 250 BCE. The curve is bracketed above by tall rectangles and below by short rectangles. The true area sits between them. The Greek inscription beneath reads: tetragōnismos — the squaring of the parabola."
        priority="high"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A static drawing of a parabolic segment, after Archimedes. Eight thin rectangles inscribed below the curve form a lower staircase; eight taller rectangles circumscribed above the curve form an upper staircase. The true area is trapped between the two. Inscription: tetragōnismos, the squaring of the parabola, circa 250 BCE."
      >
        {/* Faint paper panel */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="var(--color-paper)"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* Eyebrow */}
        <text
          x="62"
          y="74"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          SYRACUSE  ·  SICILY  ·  c. 250 BCE
        </text>
        <text
          x="62"
          y="94"
          fontFamily="Georgia, serif"
          fontSize="13"
          fontStyle="italic"
          fill="var(--color-paper-ink)"
        >
          Archimedes squares a parabolic segment by exhaustion.
        </text>

        {/* Circumscribed (upper) staircase — taller rectangles, light ink */}
        {circumscribed.map((r, i) => (
          <rect
            key={`hi-${i}`}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill="var(--color-graph-ink)"
            fillOpacity="0.06"
            stroke="var(--color-graph-ink)"
            strokeWidth="0.8"
            strokeOpacity="0.55"
          />
        ))}

        {/* Inscribed (lower) staircase — vermilion, the "we know" floor */}
        {inscribed.map((r, i) => (
          <rect
            key={`lo-${i}`}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill="var(--color-vermilion)"
            fillOpacity="0.16"
            stroke="var(--color-vermilion)"
            strokeWidth="1"
            strokeOpacity="0.7"
          />
        ))}

        {/* Baseline (the chord closing the segment) */}
        <line
          x1={toPx(X_MIN, 0).px}
          y1={toPx(0, 0).py}
          x2={toPx(X_MAX, 0).px}
          y2={toPx(0, 0).py}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
        />

        {/* The parabola itself, drawn last so it sits on top of the staircases */}
        <path
          d={curvePath()}
          fill="none"
          stroke="var(--color-paper-ink)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Endpoints */}
        <circle cx={toPx(X_MIN, 0).px} cy={toPx(0, 0).py} r="3" fill="var(--color-paper-ink)" />
        <circle cx={toPx(X_MAX, 0).px} cy={toPx(0, 0).py} r="3" fill="var(--color-paper-ink)" />
        <circle cx={toPx(0, 4).px} cy={toPx(0, 4).py} r="3" fill="var(--color-paper-ink)" />

        {/* Squeeze annotation — small bracket on the right */}
        <g transform={`translate(${VIEW_W - 160}, 130)`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            THE SQUEEZE
          </text>
          <line x1="0" y1="14" x2="80" y2="14" stroke="var(--color-graph-ink)" strokeWidth="0.8" />
          <text
            y="32"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill="var(--color-graph-ink)"
          >
            inscribed &le;
          </text>
          <text
            y="48"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill="var(--color-vermilion)"
          >
            true area
          </text>
          <text
            y="64"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill="var(--color-graph-ink)"
          >
            &le; circumscribed
          </text>
          <text
            y="86"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-dim)"
          >
            let n &rarr; &infin;
          </text>
        </g>

        {/* Archimedes's answer, in a corner — 4/3 of the inscribed triangle */}
        <g transform={`translate(62, ${VIEW_H - 130})`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            HIS ANSWER
          </text>
          <text
            y="22"
            fontFamily="Georgia, serif"
            fontStyle="italic"
            fontSize="13"
            fill="var(--color-paper-ink)"
          >
            area = &nbsp;
            <tspan fontFamily="JetBrains Mono, monospace">4/3</tspan>
            &nbsp;&times;&nbsp; inscribed triangle
          </text>
          <text
            y="42"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-dim)"
          >
            exact &mdash; no calculus required.
          </text>
        </g>

        {/* Greek inscription — tetragōnismos, lower margin */}
        <text
          x={ORIGIN_X}
          y={VIEW_H - 72}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="20"
          fill="var(--color-paper-ink)"
        >
          tetrag&#333;nismos
        </text>
        <text
          x={ORIGIN_X}
          y={VIEW_H - 52}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          letterSpacing="0.32em"
          fill="var(--color-dim)"
        >
          THE SQUARING OF THE PARABOLA
        </text>

        {/* Footer caption */}
        <text
          x="62"
          y={VIEW_H - 28}
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TWO THOUSAND YEARS BEFORE RIEMANN
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0 &mdash; The parabolic segment, bracketed above and below.
      </figcaption>
    </figure>
  )
}
