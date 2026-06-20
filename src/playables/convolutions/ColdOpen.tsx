import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 1 — cold open. LeCun · AT&T Bell Labs · 1989.
 *
 *  Left  : a sketched envelope with a handwritten ZIP code in the
 *          window. The image asks the question this chapter answers —
 *          how does a network read pixels?
 *  Right : a Bell Labs paper-title card. *Backpropagation Applied to
 *          Handwritten Zip Code Recognition.* LeCun, Boser, Denker,
 *          Henderson, Howard, Hubbard, Jackel. Holmdel, New Jersey. 1989.
 *
 * Static.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  const zip = ['9', '0', '2', '1', '0']
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A sketched envelope with a handwritten five-digit ZIP code in a small window. This is the kind of image Yann LeCun's neural network read by the millions for the United States Postal Service through the early 1990s. By 1995 the system was processing roughly one of every ten letters delivered in the United States."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A sketch of an envelope with a five-digit handwritten ZIP code, the input modality of the LeCun 1989 system."
      >
        {/* Page background */}
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />

        {/* Envelope body */}
        <rect
          x="60"
          y="120"
          width={VIEW_W - 120}
          height="280"
          fill="var(--color-paper)"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        {/* Envelope flap fold */}
        <line
          x1="60"
          y1="120"
          x2={VIEW_W / 2}
          y2="232"
          stroke="var(--color-graph-fade)"
          strokeWidth="0.8"
        />
        <line
          x1={VIEW_W - 60}
          y1="120"
          x2={VIEW_W / 2}
          y2="232"
          stroke="var(--color-graph-fade)"
          strokeWidth="0.8"
        />

        {/* Stamp */}
        <rect
          x={VIEW_W - 130}
          y="140"
          width="50"
          height="58"
          fill="var(--color-cream)"
          stroke="var(--color-vermilion)"
          strokeWidth="1.2"
        />
        <text
          x={VIEW_W - 105}
          y="170"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          USA
        </text>
        <text
          x={VIEW_W - 105}
          y="186"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-vermilion)"
        >
          25¢
        </text>

        {/* Address block */}
        <text
          x="100"
          y="240"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          Mr. F. K. Cooper
        </text>
        <text
          x="100"
          y="262"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          1432 Sycamore Lane
        </text>
        <text
          x="100"
          y="284"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          Beverly Hills, CA
        </text>

        {/* ZIP window — the part the network reads */}
        <rect
          x="290"
          y="310"
          width="220"
          height="58"
          fill="var(--color-cream)"
          stroke="var(--color-vermilion)"
          strokeWidth="1.4"
          strokeDasharray="3 3"
        />
        <text
          x="290"
          y="304"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          THE NETWORK READS THIS WINDOW
        </text>

        {/* Handwritten ZIP digits */}
        {zip.map((d, i) => (
          <text
            key={i}
            x={310 + i * 40}
            y="354"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontWeight="600"
            fontSize="34"
            fill="var(--color-ink)"
            transform={`rotate(${(i % 2 === 0 ? -3 : 4)} ${310 + i * 40} 350)`}
          >
            {d}
          </text>
        ))}

        {/* Caption */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 60}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          one of ten letters in the U.S. mail, by 1995
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0a &mdash; The first practical computer-vision system
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A facsimile of the cover page of LeCun, Boser, Denker, Henderson, Howard, Hubbard, and Jackel — Backpropagation Applied to Handwritten Zip Code Recognition. Published in Neural Computation, volume 1, number 4, in winter 1989. The work was done at AT&T Bell Laboratories in Holmdel, New Jersey. It was the first deep neural network deployed in industry at scale."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A facsimile of the 1989 LeCun et al. paper title page from Bell Labs."
      >
        {/* Paper stock */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="var(--color-paper)"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* Masthead */}
        <text
          x={VIEW_W / 2}
          y="86"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="20"
          fontWeight="600"
          fill="var(--color-paper-ink)"
        >
          Neural Computation
        </text>
        <line
          x1="80"
          y1="100"
          x2={VIEW_W - 80}
          y2="100"
          stroke="var(--color-paper-ink)"
          strokeWidth="0.6"
        />
        <text
          x="80"
          y="118"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          VOL. 1 · NO. 4 · WINTER 1989
        </text>
        <text
          x={VIEW_W - 80}
          y="118"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          PP. 541–551
        </text>

        {/* Eyebrow */}
        <text
          x="80"
          y="158"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ORIGINAL ARTICLE
        </text>

        {/* Title */}
        <text
          x="80"
          y="200"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="22"
          fontWeight="600"
          fill="var(--color-paper-ink)"
        >
          Backpropagation Applied
        </text>
        <text
          x="80"
          y="228"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="22"
          fontWeight="600"
          fill="var(--color-paper-ink)"
        >
          to Handwritten Zip Code
        </text>
        <text
          x="80"
          y="256"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="22"
          fontWeight="600"
          fill="var(--color-paper-ink)"
        >
          Recognition
        </text>

        {/* Author block */}
        <text
          x="80"
          y="298"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          Y. LeCun, B. Boser, J. S. Denker,
        </text>
        <text
          x="80"
          y="316"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          D. Henderson, R. E. Howard,
        </text>
        <text
          x="80"
          y="334"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          W. Hubbard, and L. D. Jackel
        </text>

        <text
          x="80"
          y="362"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-dim)"
        >
          AT&amp;T Bell Laboratories, Holmdel, NJ 07733
        </text>

        {/* Pull-quote */}
        <line
          x1="80"
          y1="394"
          x2="120"
          y2="394"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />
        <text
          x="80"
          y="416"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          “The network has been deployed in a
        </text>
        <text
          x="80"
          y="432"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          large-scale postal application.”
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0b &mdash; The paper that launched practical computer vision
      </figcaption>
    </figure>
  )
}
