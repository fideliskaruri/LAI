import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Read-only mockup of the title page of Leibniz's 1684 paper in Acta
 * Eruditorum: "Nova methodus pro maximis et minimis...". The first place
 * the calculus appeared in print, with the dy/dx notation we still use
 * three hundred and forty years later.
 *
 * Static, no interaction. The image is the beat.
 */

const VIEW_W = 600
const VIEW_H = 480

const PAGE_W = 360
const PAGE_H = 420
const PAGE_X = (VIEW_W - PAGE_W) / 2
const PAGE_Y = (VIEW_H - PAGE_H) / 2

export function LeibnizPaper() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A reproduction of the title page of Gottfried Wilhelm Leibniz's 1684 paper Nova Methodus pro Maximis et Minimis, published in the journal Acta Eruditorum. This is the first appearance of the calculus in print, and the first use of the dy by dx notation we still use today."
        priority="high"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Mockup of the 1684 title page of Leibniz's Nova Methodus paper from Acta Eruditorum, showing the title, the Latin subtitle on maxima and minima, the journal name, and the dy dx notation in a small inset."
      >
        {/* Backdrop — soft paper grey behind the page so the paper itself
            reads as set on a desk */}
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />
        <rect
          x={PAGE_X - 16}
          y={PAGE_Y + 12}
          width={PAGE_W + 24}
          height={PAGE_H}
          fill="var(--color-paper-shadow)"
          fillOpacity="0.4"
        />

        {/* The page itself — aged ivory */}
        <rect
          x={PAGE_X}
          y={PAGE_Y}
          width={PAGE_W}
          height={PAGE_H}
          fill="var(--color-paper)"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />

        {/* Top journal banner */}
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 38}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.34em"
          fill="var(--color-dim)"
        >
          ACTA ERUDITORUM
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
          Lipsiae &middot; Octobris MDCLXXXIV
        </text>

        {/* Decorative rule */}
        <line
          x1={PAGE_X + 40}
          y1={PAGE_Y + 74}
          x2={PAGE_X + PAGE_W - 40}
          y2={PAGE_Y + 74}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.7"
        />
        <line
          x1={PAGE_X + 60}
          y1={PAGE_Y + 80}
          x2={PAGE_X + PAGE_W - 60}
          y2={PAGE_Y + 80}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.4"
        />

        {/* Title — large serif, in two lines */}
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 120}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="22"
          fontWeight="bold"
          fill="var(--color-paper-ink)"
        >
          NOVA METHODUS
        </text>
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 144}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="13"
          fontStyle="italic"
          fill="var(--color-paper-ink)"
        >
          pro maximis et minimis
        </text>

        {/* Subtitle — small italic, two centered lines */}
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 180}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="11"
          fontStyle="italic"
          fill="var(--color-paper-ink)"
        >
          itemque tangentibus, quae nec fractas
        </text>
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 196}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="11"
          fontStyle="italic"
          fill="var(--color-paper-ink)"
        >
          nec irrationales quantitates moratur
        </text>

        {/* Mid rule */}
        <line
          x1={PAGE_X + 80}
          y1={PAGE_Y + 218}
          x2={PAGE_X + PAGE_W - 80}
          y2={PAGE_Y + 218}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.4"
        />

        {/* Byline */}
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 242}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          autore G. G. L.
        </text>
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 260}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="10"
          fontStyle="italic"
          fill="var(--color-dim)"
        >
          (Gottfried Wilhelm Leibniz)
        </text>

        {/* Featured equation — small framed inset showing the notation
            the paper introduced. Vermilion accent. */}
        <rect
          x={PAGE_X + 80}
          y={PAGE_Y + 286}
          width={PAGE_W - 160}
          height={84}
          fill="var(--color-paper-deep)"
          stroke="var(--color-vermilion)"
          strokeWidth="0.8"
          strokeOpacity="0.55"
        />
        <text
          x={PAGE_X + PAGE_W / 2}
          y={PAGE_Y + 308}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="8"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          NOVA NOTATIO
        </text>
        {/* The dy/dx — set as a small fraction */}
        <text
          x={PAGE_X + PAGE_W / 2 - 26}
          y={PAGE_Y + 340}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="22"
          fill="var(--color-paper-ink)"
        >
          dy
        </text>
        <line
          x1={PAGE_X + PAGE_W / 2 - 42}
          y1={PAGE_Y + 348}
          x2={PAGE_X + PAGE_W / 2 - 10}
          y2={PAGE_Y + 348}
          stroke="var(--color-paper-ink)"
          strokeWidth="1.2"
        />
        <text
          x={PAGE_X + PAGE_W / 2 - 26}
          y={PAGE_Y + 366}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="22"
          fill="var(--color-paper-ink)"
        >
          dx
        </text>
        {/* small equals + verbal gloss */}
        <text
          x={PAGE_X + PAGE_W / 2 + 4}
          y={PAGE_Y + 352}
          fontFamily="Georgia, serif"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          = rate of change
        </text>

        {/* Bottom rule and stamp */}
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
          PAG. 467 &mdash; 473
        </text>

        {/* Outer caption (outside the page) */}
        <text
          x={PAGE_X}
          y={VIEW_H - 20}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          1684  ·  THE CALCULUS GOES TO PRESS  ·  WITH THE NOTATION WE STILL USE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1 &mdash; Leibniz's 1684 paper. Newton already had the math; Leibniz had the notation.
      </figcaption>
    </figure>
  )
}
