import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 1 — cold-open. Both panes are decorative.
 *
 *  Left  : a stylized facsimile of the front matter of the 1995 Cortes &
 *          Vapnik paper "Support-Vector Networks" (Machine Learning 20,
 *          273–297). Bell Labs, Holmdel. The paper that put SVMs on every
 *          textbook page for the next fifteen years.
 *
 *  Right : a tiny lineage card — Vapnik–Chervonenkis 1968, the statistical-
 *          learning-theory result the 1995 paper sits on top of; the 1992
 *          Boser–Guyon–Vapnik COLT paper that introduced the kernel trick;
 *          and the 1995 publication that wrapped it all together.
 *
 * No interaction. The story moves in the prose.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  // Faux body-text lines so the journal page reads as a page, not as a card.
  const bodyLines = Array.from({ length: 11 }, (_, i) => ({
    y: 322 + i * 11,
    len: 360 - ((i * 19) % 90),
    indent: i === 0 ? 24 : 0,
  }))

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A stylized facsimile of the title page of Corinna Cortes and Vladimir Vapnik's 1995 paper Support-Vector Networks, in the journal Machine Learning. Bell Labs affiliation, abstract, opening paragraph."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A stylized facsimile of Cortes and Vapnik 1995, Support-Vector Networks, Machine Learning, volume 20. Bell Labs affiliation. The paper that defined the modern SVM."
      >
        {/* Page */}
        <rect
          x="56"
          y="32"
          width={VIEW_W - 112}
          height={VIEW_H - 64}
          fill="var(--color-paper)"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* Journal header */}
        <text
          x={VIEW_W / 2}
          y="62"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          MACHINE LEARNING  ·  20  ·  273–297  ·  1995
        </text>
        <line
          x1="120"
          y1="78"
          x2={VIEW_W - 120}
          y2="78"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.6"
        />

        {/* Title */}
        <text
          x={VIEW_W / 2}
          y="118"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="22"
          fontWeight="700"
          fill="var(--color-paper-ink)"
        >
          Support-Vector Networks
        </text>

        {/* Authors */}
        <text
          x={VIEW_W / 2}
          y="148"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          CORINNA CORTES &nbsp;&middot;&nbsp; VLADIMIR VAPNIK
        </text>
        <text
          x={VIEW_W / 2}
          y="166"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-dim)"
        >
          AT&amp;T Bell Laboratories, Holmdel, New Jersey
        </text>

        {/* Abstract heading */}
        <text
          x={VIEW_W / 2}
          y="208"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          ABSTRACT
        </text>

        <text
          x={VIEW_W / 2}
          y="234"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          The support-vector network is a new learning machine for
        </text>
        <text
          x={VIEW_W / 2}
          y="252"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          two-group classification problems&hellip;
        </text>

        {/* Sub-rule */}
        <line
          x1="180"
          y1="282"
          x2={VIEW_W - 180}
          y2="282"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.4"
        />

        {/* "Introduction" heading + faux body */}
        <text
          x={VIEW_W / 2}
          y="304"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          1.  INTRODUCTION
        </text>

        {bodyLines.map((l, i) => (
          <line
            key={i}
            x1={VIEW_W / 2 - l.len / 2 + l.indent}
            y1={l.y}
            x2={VIEW_W / 2 + l.len / 2}
            y2={l.y}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.5"
            strokeOpacity="0.55"
          />
        ))}
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0a &mdash; Cortes &amp; Vapnik, <span style={{ fontStyle: 'normal' }}>Support-Vector Networks</span>, 1995
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A small lineage card with three dated nodes: Vapnik and Chervonenkis 1968, the foundational statistical learning theory; Boser, Guyon and Vapnik 1992, the kernel trick; and Cortes and Vapnik 1995, the modern soft-margin SVM."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Lineage card. Three nodes: Vapnik-Chervonenkis 1968 (VC theory); Boser-Guyon-Vapnik 1992 (the kernel trick); Cortes-Vapnik 1995 (soft-margin SVM). Each node connected by a thin vermilion line."
      >
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
          y="96"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          LINEAGE  ·  THREE PAPERS
        </text>

        {/* The vertical spine */}
        <line
          x1={VIEW_W / 2}
          y1="130"
          x2={VIEW_W / 2}
          y2={VIEW_H - 120}
          stroke="var(--color-vermilion)"
          strokeWidth="1.2"
          strokeOpacity="0.7"
        />

        {/* Node 1 — 1968 VC */}
        <Node y={150} year="1968" who="Vapnik · Chervonenkis" what="theorem on uniform convergence" />

        {/* Node 2 — 1992 kernel trick */}
        <Node y={250} year="1992" who="Boser · Guyon · Vapnik" what="the kernel trick (COLT)" />

        {/* Node 3 — 1995 SVM */}
        <Node y={350} year="1995" who="Cortes · Vapnik" what="soft-margin support-vector networks" emphasised />

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 80}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          twenty-seven years from theorem to product
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0b &mdash; The three papers under one chapter
      </figcaption>
    </figure>
  )
}

function Node({
  y,
  year,
  who,
  what,
  emphasised = false,
}: {
  y: number
  year: string
  who: string
  what: string
  emphasised?: boolean
}) {
  return (
    <g>
      <circle
        cx={VIEW_W / 2}
        cy={y}
        r={emphasised ? 8 : 5}
        fill="var(--color-cream)"
        stroke="var(--color-vermilion)"
        strokeWidth="2"
      />
      <text
        x={VIEW_W / 2 - 24}
        y={y + 4}
        textAnchor="end"
        fontFamily="JetBrains Mono, monospace"
        fontSize="13"
        fill={emphasised ? 'var(--color-vermilion)' : 'var(--color-ink)'}
      >
        {year}
      </text>
      <text
        x={VIEW_W / 2 + 24}
        y={y - 2}
        fontFamily="Source Serif 4, Georgia, serif"
        fontSize="13"
        fill="var(--color-ink)"
        fontWeight={emphasised ? 600 : 400}
      >
        {who}
      </text>
      <text
        x={VIEW_W / 2 + 24}
        y={y + 14}
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize="12"
        fill="var(--color-dim)"
      >
        {what}
      </text>
    </g>
  )
}
