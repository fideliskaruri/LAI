import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 1 — cold-open. Rumelhart, Hinton, Williams — Nature, 9 October 1986.
 *
 *  Left  : a facsimile of the Nature paper's title card. Volume, date, the
 *          three authors with their three institutions (UC San Diego,
 *          Carnegie Mellon, MIT). The paper that ended the AI winter.
 *  Right : a sidebar — the lineage of the idea. Werbos 1974 PhD thesis;
 *          Linnainmaa 1970 master's thesis; Kelley 1960 for optimal
 *          control. Rumelhart-Hinton-Williams made it famous and practical.
 *
 * Static. No interaction.
 */

const VIEW_W = 600
const VIEW_H = 480
const PADX = 60

export function LeftPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A facsimile of the title card of Rumelhart, Hinton, and Williams's 1986 paper in Nature, Learning Representations by Back-propagating Errors. Three authors at three institutions: David Rumelhart at the University of California San Diego, Geoffrey Hinton at Carnegie Mellon, and Ronald Williams at the Massachusetts Institute of Technology. The paper that ended the AI winter."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A facsimile of the title page of the 1986 Nature paper by Rumelhart, Hinton, and Williams, Learning Representations by Back-propagating Errors."
      >
        {/* Page — slightly off-white journal stock */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="#f6f1e7"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* Masthead — Nature in italic serif */}
        <text
          x={VIEW_W / 2}
          y="84"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="22"
          fontWeight="600"
          fill="var(--color-ink)"
        >
          Nature
        </text>
        <line
          x1={PADX + 20}
          y1="98"
          x2={VIEW_W - PADX - 20}
          y2="98"
          stroke="var(--color-ink)"
          strokeWidth="0.6"
        />
        <text
          x={PADX + 20}
          y="116"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          VOL. 323 · 9 OCTOBER 1986
        </text>
        <text
          x={VIEW_W - PADX - 20}
          y="116"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          PP. 533–536
        </text>

        {/* Eyebrow */}
        <text
          x={PADX + 20}
          y="152"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          LETTERS TO NATURE
        </text>

        {/* Title — two lines */}
        <text
          x={PADX + 20}
          y="194"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="24"
          fontWeight="600"
          fill="var(--color-ink)"
        >
          Learning representations
        </text>
        <text
          x={PADX + 20}
          y="224"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="24"
          fontWeight="600"
          fill="var(--color-ink)"
        >
          by back-propagating errors
        </text>

        {/* Author line */}
        <text
          x={PADX + 20}
          y="262"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          David E. Rumelhart*, Geoffrey E. Hinton†
        </text>
        <text
          x={PADX + 20}
          y="282"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          &amp; Ronald J. Williams*
        </text>

        {/* Affiliations */}
        <text
          x={PADX + 20}
          y="312"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-dim)"
        >
          * Institute for Cognitive Science, UC San Diego
        </text>
        <text
          x={PADX + 20}
          y="326"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-dim)"
        >
          † Department of Computer Science, Carnegie Mellon
        </text>
        <text
          x={PADX + 20}
          y="340"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-dim)"
        >
          (R. J. W. previously at the MIT AI Laboratory)
        </text>

        {/* Pull-quote */}
        <line
          x1={PADX + 20}
          y1="372"
          x2={PADX + 60}
          y2="372"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />
        <text
          x={PADX + 20}
          y="394"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          “The procedure repeatedly adjusts the weights
        </text>
        <text
          x={PADX + 20}
          y="412"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          so as to minimise the difference between the
        </text>
        <text
          x={PADX + 20}
          y="430"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          actual output and the desired output.”
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0a &mdash; The paper that ended the winter
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A sidebar tracing the lineage of backpropagation. The math was known earlier. Henry Kelley wrote a version for optimal control in 1960. Seppo Linnainmaa, in a 1970 master's thesis in Finnish, described reverse-mode automatic differentiation, the earliest form. Paul Werbos, in his 1974 Harvard PhD thesis, applied it to neural networks specifically. Rumelhart, Hinton, and Williams made the idea famous and practical."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A sidebar tracing the precursors of backpropagation: Kelley 1960, Linnainmaa 1970, Werbos 1974, and the Rumelhart-Hinton-Williams 1986 paper that made it famous."
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
          THE IDEA HAD A LONG PEDIGREE
        </text>

        {/* Year lineage rows */}
        <g transform="translate(110, 150)">
          <YearRow y={0} year="1960" who="Henry J. Kelley" what="optimal control · gradient procedure" />
          <YearRow y={50} year="1970" who="Seppo Linnainmaa" what="reverse-mode auto-diff · master's thesis · Finnish" />
          <YearRow y={100} year="1974" who="Paul J. Werbos" what="Harvard PhD · for neural networks specifically" />
          <YearRow y={150} year="1986" who="Rumelhart, Hinton, Williams" what="Nature 323 · three pages · famous" accent />
        </g>

        <line
          x1={VIEW_W / 2 - 60}
          y1={356}
          x2={VIEW_W / 2 + 60}
          y2={356}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y={386}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          The math was already there.
        </text>
        <text
          x={VIEW_W / 2}
          y={406}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          What the 1986 paper added was &mdash; everyone read it.
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0b &mdash; A discovery rediscovered three times
      </figcaption>
    </figure>
  )
}

function YearRow({
  y,
  year,
  who,
  what,
  accent,
}: {
  y: number
  year: string
  who: string
  what: string
  accent?: boolean
}) {
  const stroke = accent ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
  const color = accent ? 'var(--color-vermilion)' : 'var(--color-ink)'
  return (
    <g transform={`translate(0, ${y})`}>
      <circle
        cx="0"
        cy="0"
        r={accent ? 9 : 7}
        fill="var(--color-cream)"
        stroke={stroke}
        strokeWidth={accent ? 2 : 1.2}
      />
      <text
        x="20"
        y="4"
        fontFamily="JetBrains Mono, monospace"
        fontSize="12"
        fill={color}
      >
        {year}
      </text>
      <text
        x="78"
        y="4"
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize="14"
        fill={color}
      >
        {who}
      </text>
      <text
        x="20"
        y="22"
        fontFamily="JetBrains Mono, monospace"
        fontSize="10"
        fill="var(--color-dim)"
      >
        {what}
      </text>
    </g>
  )
}
