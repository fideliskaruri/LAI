import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Cold-open for Optimization: a mockup of the title page of Cauchy's
 * 1847 *Méthode générale pour la résolution des systèmes d'équations
 * simultanées*, the paper that names gradient descent for the first time.
 *
 * Static. No interaction. The visual is the question: a one-and-a-half-page
 * note in the Comptes Rendus of the Académie des Sciences, 18 October 1847,
 * proposes walking against the gradient until you can't go down any further.
 * Cauchy was solving celestial-mechanics problems, not training neural
 * networks; the field grew up around him almost two centuries later.
 */

const VIEW_W = 600
const VIEW_H = 480

const PAGE_W = 360
const PAGE_H = 420
const PAGE_X = (VIEW_W - PAGE_W) / 2
const PAGE_Y = (VIEW_H - PAGE_H) / 2

export function CauchyMemoir() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A reproduction of the title page of Augustin-Louis Cauchy's 1847 note, Méthode générale pour la résolution des systèmes d'équations simultanées, published in the Comptes Rendus of the French Academy of Sciences. This is the paper that first writes down gradient descent — walk against the gradient until you can no longer go downhill. Cauchy was working on a celestial mechanics problem, not optimization theory."
        priority="high"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Mockup of the 1847 title page of Cauchy's Méthode générale, published in the Comptes Rendus of the French Academy of Sciences. Eighteenth of October, 1847. The paper that names gradient descent for the first time."
      >
        {/* Backdrop */}
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />
        <rect
          x={PAGE_X - 16}
          y={PAGE_Y + 12}
          width={PAGE_W + 24}
          height={PAGE_H}
          fill="var(--color-paper-shadow)"
          fillOpacity="0.4"
        />

        {/* Page */}
        <rect
          x={PAGE_X}
          y={PAGE_Y}
          width={PAGE_W}
          height={PAGE_H}
          fill="var(--color-paper)"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />

        {/* Journal banner */}
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 38}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.34em"
          fill="var(--color-dim)"
        >
          COMPTES RENDUS
        </text>
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 56}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-dim)"
        >
          Académie des Sciences &middot; Paris
        </text>
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 70}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="10"
          fill="var(--color-dim)"
        >
          Séance du 18 Octobre 1847
        </text>

        {/* Rule */}
        <line
          x1={PAGE_X + 40}
          y1={PAGE_Y + 86}
          x2={PAGE_X + PAGE_W - 40}
          y2={PAGE_Y + 86}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.7"
        />
        <line
          x1={PAGE_X + 60}
          y1={PAGE_Y + 92}
          x2={PAGE_X + PAGE_W - 60}
          y2={PAGE_Y + 92}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.4"
        />

        {/* Title — three lines, smallish to fit */}
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 126}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="17"
          fontWeight="bold"
          fill="var(--color-paper-ink)"
        >
          MÉTHODE GÉNÉRALE
        </text>
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 148}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          pour la résolution
        </text>
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 166}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          des systèmes d'équations simultanées
        </text>

        {/* Sub-rule */}
        <line
          x1={PAGE_X + 80}
          y1={PAGE_Y + 188}
          x2={PAGE_X + PAGE_W - 80}
          y2={PAGE_Y + 188}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.4"
        />

        {/* Byline */}
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 210}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          par M. AUGUSTIN CAUCHY
        </text>
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 226}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="10"
          fill="var(--color-dim)"
        >
          Membre de l'Institut
        </text>

        {/* The marginal note — what the paper actually proposes */}
        <rect
          x={PAGE_X + 56}
          y={PAGE_Y + 252}
          width={PAGE_W - 112}
          height={102}
          fill="var(--color-paper-deep)"
          stroke="var(--color-vermilion)"
          strokeWidth="0.8"
          strokeOpacity="0.55"
        />
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 272}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="8"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          LA MÉTHODE
        </text>
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 294}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          marcher à rebours du gradient
        </text>
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 314}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="11"
          fill="var(--color-paper-ink)"
        >
          walk against the gradient
        </text>
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 336}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="10"
          fill="var(--color-dim)"
        >
          until one cannot go down any further
        </text>

        {/* The gradient symbol — a tiny vermilion nabla */}
        <text
          x={PAGE_X + PAGE_W / 2 - 64}
          y={PAGE_Y + 296}
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="20"
          fill="var(--color-vermilion)"
        >
          −∇
        </text>

        {/* Bottom rule + page-range stamp */}
        <line
          x1={PAGE_X + 40}
          y1={PAGE_Y + 388}
          x2={PAGE_X + PAGE_W - 40}
          y2={PAGE_Y + 388}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.4"
        />
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 406}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="8"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          T. XXV  ·  PP. 536 — 538
        </text>

        {/* Outer caption */}
        <text
          x={PAGE_X}
          y={VIEW_H - 20}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          1847  ·  THE FIRST GRADIENT DESCENT  ·  FOR A CELESTIAL-MECHANICS PROBLEM
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0 &mdash; Cauchy, 1847. Two and a half pages. The whole idea.
      </figcaption>
    </figure>
  )
}
