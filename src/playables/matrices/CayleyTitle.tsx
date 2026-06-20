import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Cold-open: a stylized title page of Arthur Cayley's 1858 paper
 * "A Memoir on the Theory of Matrices" — the moment matrices became
 * an object of study in their own right, not shorthand for systems of
 * equations.
 *
 * No interaction. Static, decorative.
 */
export function CayleyTitle() {
  // Abstract body lines stand in for prose on the title page.
  const lines = Array.from({ length: 9 }, (_, i) => ({
    y: 312 + i * 13,
    len: 360 - ((i * 17) % 80),
  }))

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A stylized mockup of the title page of Arthur Cayley's 1858 paper, A Memoir on the Theory of Matrices, the founding paper of matrix algebra."
        priority="normal"
      />
      <svg
        viewBox="0 0 600 480"
        className="w-full h-auto"
        role="img"
        aria-label="A stylized mockup of the title page of Arthur Cayley's 1858 paper A Memoir on the Theory of Matrices — the founding paper that established matrices as an algebraic object."
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

        {/* Top rule */}
        <line x1="120" y1="80" x2="480" y2="80" stroke="var(--color-graph-ink)" strokeWidth="0.6" />

        {/* Journal masthead */}
        <text
          x="300"
          y="116"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="13"
          letterSpacing="0.16em"
          fill="var(--color-dim)"
        >
          PHILOSOPHICAL TRANSACTIONS
        </text>
        <text
          x="300"
          y="134"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-dim)"
        >
          of the Royal Society of London — Vol. CXLVIII
        </text>
        <line x1="200" y1="150" x2="400" y2="150" stroke="var(--color-graph-ink)" strokeWidth="0.4" />

        {/* Article title */}
        <text
          x="300"
          y="200"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="20"
          fontWeight="700"
          fill="var(--color-paper-ink)"
        >
          A MEMOIR
        </text>
        <text
          x="300"
          y="224"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          on the
        </text>
        <text
          x="300"
          y="252"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="22"
          fontWeight="700"
          fill="var(--color-vermilion)"
        >
          THEORY OF MATRICES
        </text>

        {/* Author */}
        <text
          x="300"
          y="284"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          By Arthur Cayley, Esq., F.R.S.
        </text>

        {/* Abstract-as-lines */}
        {lines.map((l, i) => (
          <line
            key={i}
            x1={300 - l.len / 2}
            y1={l.y}
            x2={300 + l.len / 2}
            y2={l.y}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.5"
            strokeOpacity="0.65"
          />
        ))}

        {/* Imprint */}
        <line x1="220" y1="442" x2="380" y2="442" stroke="var(--color-graph-ink)" strokeWidth="0.4" />
        <text
          x="300"
          y="438"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="10"
          fill="var(--color-dim)"
        >
          Read 1858 · Printed Phil. Trans. Royal Soc. vol. 148, 1858
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0 &mdash; Philosophical Transactions, Vol. CXLVIII, 1858
      </figcaption>
    </figure>
  )
}
