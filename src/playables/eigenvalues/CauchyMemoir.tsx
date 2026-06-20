import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Cold-open: a stylized title page of Augustin-Louis Cauchy's 1829 memoir
 * "Sur l'équation à l'aide de laquelle on détermine les inégalités séculaires
 * des mouvements des planètes" — the paper in which Cauchy proved that every
 * real symmetric matrix has real eigenvalues. Motivated by an astronomical
 * problem (planetary perturbations) rather than an abstract one.
 *
 * No interaction. Static, decorative — mirrors the Cayley title page in the
 * preceding chapter so the reader registers "another founding paper."
 */
export function CauchyMemoir() {
  const lines = Array.from({ length: 11 }, (_, i) => ({
    y: 320 + i * 12,
    len: 340 - ((i * 19) % 90),
  }))

  // The characteristic equation symbol — a small bookmark element in the
  // bottom corner — det(M − λI) = 0 set in italic Georgia. Not a teaching
  // beat yet; just a hint of what's coming.
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A stylized mockup of the title page of Augustin-Louis Cauchy's 1829 memoir on the secular inequalities of the planets — the paper in which eigenvalues first appear in something close to their modern form."
        priority="normal"
      />
      <svg
        viewBox="0 0 600 480"
        className="w-full h-auto"
        role="img"
        aria-label="A stylized mockup of the title page of Augustin-Louis Cauchy's 1829 memoir, Sur l'équation à l'aide de laquelle on détermine les inégalités séculaires des mouvements des planètes."
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
        <line
          x1="120"
          y1="80"
          x2="480"
          y2="80"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.6"
        />

        {/* Journal masthead */}
        <text
          x="300"
          y="116"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="12"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          EXERCICES DE MATHÉMATIQUES
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
          Tome IV — Paris, Chez Bachelier — MDCCCXXIX
        </text>
        <line
          x1="200"
          y1="150"
          x2="400"
          y2="150"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.4"
        />

        {/* Article title — French title, broken across three lines so the
            long sentence reads well in the 480-px frame */}
        <text
          x="300"
          y="196"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="16"
          fontWeight="700"
          fill="var(--color-paper-ink)"
        >
          SUR L&apos;ÉQUATION À L&apos;AIDE DE LAQUELLE
        </text>
        <text
          x="300"
          y="218"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="16"
          fontWeight="700"
          fill="var(--color-paper-ink)"
        >
          ON DÉTERMINE LES
        </text>
        <text
          x="300"
          y="248"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="20"
          fontWeight="700"
          fill="var(--color-vermilion)"
        >
          INÉGALITÉS SÉCULAIRES
        </text>
        <text
          x="300"
          y="272"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          des mouvements des planètes
        </text>

        {/* Author */}
        <text
          x="300"
          y="300"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          Par M. Augustin-Louis Cauchy
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
            strokeOpacity="0.6"
          />
        ))}

        {/* Equation hint, bottom center — the characteristic equation in
            italic Georgia. This is the thread the rest of the chapter pulls. */}
        <text
          x="300"
          y="436"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-vermilion)"
        >
          det( S − sI ) = 0
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0 &mdash; Cauchy, <span style={{ fontStyle: 'normal' }}>Exercices de Mathématiques</span>, Tome IV, 1829
      </figcaption>
    </figure>
  )
}
