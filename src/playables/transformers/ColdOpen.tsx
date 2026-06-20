import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 1 — cold-open.  Static. The June 2017 NeurIPS paper *Attention Is
 * All You Need* by eight researchers at Google. The paper that replaced
 * recurrence with attention and became the foundation of every modern
 * language model.
 *
 *  Left  : a stylised NeurIPS title page for the paper. Title; the eight
 *          authors; affiliation; submission date.
 *  Right : the punchline that grew out of it — the architectures that
 *          all descend from this single paper. GPT, BERT, T5, Claude,
 *          Gemini, all transformers.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  const bodyLines = Array.from({ length: 8 }, (_, i) => ({
    y: 354 + i * 12,
    len: 340 - ((i * 27) % 92),
  }))
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A stylised title page for Vaswani and colleagues' 2017 NeurIPS paper, Attention Is All You Need. Eight authors from Google Brain and Google Research. The paper that introduced the transformer."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Stylised title page for Vaswani and colleagues' 2017 paper Attention Is All You Need, presented at NeurIPS in December 2017."
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

        {/* Stamp */}
        <text
          x="86"
          y="68"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          letterSpacing="0.16em"
          fill="var(--color-vermilion)"
        >
          arXiv:1706.03762 [cs.CL]
        </text>
        <text
          x="514"
          y="68"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-dim)"
        >
          12 Jun 2017
        </text>

        {/* Top rule */}
        <line
          x1="86"
          y1="84"
          x2="514"
          y2="84"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.6"
        />

        {/* Title */}
        <text
          x="300"
          y="156"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="26"
          fontWeight="700"
          fill="var(--color-paper-ink)"
        >
          Attention Is
        </text>
        <text
          x="300"
          y="196"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="26"
          fontWeight="700"
          fill="var(--color-vermilion)"
        >
          All You Need
        </text>

        {/* Sub-rule */}
        <line
          x1="200"
          y1="226"
          x2="400"
          y2="226"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.4"
        />

        {/* Authors */}
        <text
          x="300"
          y="254"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          Vaswani &middot; Shazeer &middot; Parmar &middot; Uszkoreit
        </text>
        <text
          x="300"
          y="272"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          Jones &middot; Gomez &middot; Kaiser &middot; Polosukhin
        </text>
        <text
          x="300"
          y="296"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-dim)"
        >
          Google Brain &middot; Google Research &middot; U. of Toronto
        </text>

        {/* Abstract label */}
        <text
          x="86"
          y="338"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ABSTRACT
        </text>

        {/* Abstract-as-lines */}
        {bodyLines.map((l, i) => (
          <line
            key={i}
            x1={300 - l.len / 2}
            y1={l.y}
            x2={300 + l.len / 2}
            y2={l.y}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.5"
            strokeOpacity="0.55"
          />
        ))}

        {/* Footer eyebrow */}
        <text
          x="300"
          y={VIEW_H - 32}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          NEURIPS 2017 &middot; THE TRANSFORMER
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0a &mdash; Vaswani et al., NeurIPS, December 2017
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  // A small "family tree" sketch: the 2017 paper at the top, descendants below.
  const descendants = [
    { y: 168, name: 'GPT', year: '2018' },
    { y: 198, name: 'BERT', year: '2018' },
    { y: 228, name: 'GPT-2', year: '2019' },
    { y: 258, name: 'T5', year: '2019' },
    { y: 288, name: 'GPT-3', year: '2020' },
    { y: 318, name: 'PaLM', year: '2022' },
    { y: 348, name: 'GPT-4', year: '2023' },
    { y: 378, name: 'Claude, Gemini', year: '2024' },
  ]
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A descent tree from the 2017 transformer paper down to every modern language model. GPT, BERT, T5, GPT-3, GPT-4, Claude, Gemini — all transformers, all heirs of this single 2017 paper."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A descent tree from the 2017 transformer paper to GPT, BERT, T5, GPT-3, GPT-4, Claude, Gemini, and the rest of the modern language model family."
      >
        {/* Header */}
        <text
          x={VIEW_W / 2}
          y={56}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE LINEAGE
        </text>

        {/* Root node */}
        <rect
          x={VIEW_W / 2 - 110}
          y="92"
          width="220"
          height="44"
          rx="4"
          fill="var(--color-vermilion)"
          stroke="var(--color-vermilion)"
          strokeWidth="1.5"
        />
        <text
          x={VIEW_W / 2}
          y="111"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fontWeight="600"
          fill="var(--color-cream)"
        >
          Attention Is All You Need
        </text>
        <text
          x={VIEW_W / 2}
          y="128"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-cream)"
          fillOpacity="0.9"
        >
          2017
        </text>

        {/* Trunk down */}
        <line
          x1={VIEW_W / 2}
          y1="136"
          x2={VIEW_W / 2}
          y2="382"
          stroke="var(--color-vermilion)"
          strokeWidth="1.2"
          strokeOpacity="0.5"
        />

        {/* Descendants */}
        {descendants.map((d) => (
          <g key={d.name}>
            {/* tick */}
            <line
              x1={VIEW_W / 2}
              y1={d.y}
              x2={VIEW_W / 2 + 30}
              y2={d.y}
              stroke="var(--color-vermilion)"
              strokeOpacity="0.55"
              strokeWidth="1"
            />
            <text
              x={VIEW_W / 2 + 38}
              y={d.y + 4}
              fontFamily="Source Serif 4, Georgia, serif"
              fontStyle="italic"
              fontSize="13"
              fill="var(--color-ink)"
            >
              {d.name}
            </text>
            <text
              x={VIEW_W / 2 - 38}
              y={d.y + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {d.year}
            </text>
          </g>
        ))}

        {/* Footer eyebrow */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 28}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          EVERY MODERN LM IS A TRANSFORMER
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0b &mdash; What grew out of the 2017 paper
      </figcaption>
    </figure>
  )
}
