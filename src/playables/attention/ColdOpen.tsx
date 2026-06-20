import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 1 — cold-open.  Static. The 2014 arXiv paper by Dzmitry Bahdanau,
 * Kyungyun Cho, and Yoshua Bengio: *Neural Machine Translation by Jointly
 * Learning to Align and Translate.*  Born to fix a flaw in seq2seq
 * translation; the idea turned out to be much bigger than translation.
 *
 *  Left  : a stylized arXiv banner with the paper's title, authors, and
 *          submission date — 1 September 2014 — the day attention entered
 *          the literature.
 *
 *  Right : a tiny picture of the problem the paper was solving — a long
 *          source sentence being squeezed through a single fixed-size
 *          vector (the "bottleneck") into a target sentence.  An arrow
 *          gestures at the bulge in the middle: the moment information
 *          gets lost.  Attention is the move that lets the decoder reach
 *          back past the bottleneck.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  // Stylized abstract-as-lines, like the Legendre title-page cold-open.
  const bodyLines = Array.from({ length: 8 }, (_, i) => ({
    y: 332 + i * 12,
    len: 340 - ((i * 27) % 92),
  }))
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A stylized arXiv banner for Bahdanau, Cho, and Bengio's 2014 paper, Neural Machine Translation by Jointly Learning to Align and Translate — the paper that invented attention."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Stylized arXiv title page for Bahdanau, Cho, and Bengio's 2014 paper Neural Machine Translation by Jointly Learning to Align and Translate, posted on 1 September 2014."
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

        {/* arXiv stamp */}
        <text
          x="86"
          y="68"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          letterSpacing="0.16em"
          fill="var(--color-vermilion)"
        >
          arXiv:1409.0473 [cs.CL]
        </text>
        <text
          x="514"
          y="68"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-dim)"
        >
          1 Sep 2014
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
          y="146"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="22"
          fontWeight="700"
          fill="var(--color-paper-ink)"
        >
          Neural Machine Translation
        </text>
        <text
          x="300"
          y="172"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-paper-ink)"
        >
          by Jointly Learning to
        </text>
        <text
          x="300"
          y="206"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="22"
          fontWeight="700"
          fill="var(--color-vermilion)"
        >
          Align and Translate
        </text>

        {/* Sub-rule */}
        <line
          x1="200"
          y1="234"
          x2="400"
          y2="234"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.4"
        />

        {/* Authors */}
        <text
          x="300"
          y="262"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          Dzmitry Bahdanau &middot; Kyunghyun Cho &middot; Yoshua Bengio
        </text>
        <text
          x="300"
          y="282"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-dim)"
        >
          Jacobs University Bremen &middot; Université de Montréal
        </text>

        {/* Abstract label */}
        <text
          x="86"
          y="316"
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
          y={VIEW_H - 56}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          THE PAPER THAT INVENTED ATTENTION
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0a &mdash; Bahdanau, Cho, Bengio &mdash; arXiv, 1 September 2014
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  // The seq2seq bottleneck picture: a wide source band → a thin neck →
  // a wide target band. The arrow gestures at the neck.
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A sketch of the seq2seq bottleneck attention was invented to fix: a long source sentence squeezed through a single fixed-size vector into a target sentence. Attention is the move that lets the decoder reach back past the bottleneck."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Sketch of the seq2seq bottleneck: a wide band of source tokens narrows to a single fixed-size vector and then widens again into target tokens."
      >
        {/* Header */}
        <text
          x={VIEW_W / 2}
          y="60"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE BOTTLENECK ATTENTION FIXED
        </text>

        {/* Source side — six little tokens on the left */}
        {Array.from({ length: 6 }).map((_, i) => {
          const cy = 140 + i * 30
          return (
            <g key={`src-${i}`}>
              <rect
                x="80"
                y={cy - 10}
                width="80"
                height="20"
                fill="none"
                stroke="var(--color-graph-ink)"
                strokeWidth="1"
              />
              <line
                x1="160"
                y1={cy}
                x2="280"
                y2={VIEW_H / 2}
                stroke="var(--color-graph-ink)"
                strokeOpacity="0.4"
                strokeWidth="1"
              />
            </g>
          )
        })}
        <text
          x="120"
          y="125"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          SOURCE
        </text>

        {/* Bottleneck — single fixed vector */}
        <circle
          cx="300"
          cy={VIEW_H / 2}
          r="22"
          fill="var(--color-cream)"
          stroke="var(--color-vermilion)"
          strokeWidth="2.4"
        />
        <text
          x="300"
          y={VIEW_H / 2 + 4}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          h
        </text>
        <text
          x="300"
          y={VIEW_H / 2 + 50}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          one fixed vector
        </text>
        <text
          x="300"
          y={VIEW_H / 2 + 68}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          carries the whole sentence
        </text>

        {/* Target side */}
        {Array.from({ length: 6 }).map((_, i) => {
          const cy = 140 + i * 30
          return (
            <g key={`tgt-${i}`}>
              <line
                x1="320"
                y1={VIEW_H / 2}
                x2="440"
                y2={cy}
                stroke="var(--color-graph-ink)"
                strokeOpacity="0.4"
                strokeWidth="1"
              />
              <rect
                x="440"
                y={cy - 10}
                width="80"
                height="20"
                fill="none"
                stroke="var(--color-graph-ink)"
                strokeWidth="1"
              />
            </g>
          )
        })}
        <text
          x="480"
          y="125"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TARGET
        </text>

        {/* Pointer arrow at the neck */}
        <line
          x1="380"
          y1={VIEW_H - 90}
          x2="316"
          y2={VIEW_H / 2 + 24}
          stroke="var(--color-vermilion)"
          strokeWidth="1.5"
        />
        <polygon
          points={`316,${VIEW_H / 2 + 24} 322,${VIEW_H / 2 + 36} 312,${VIEW_H / 2 + 34}`}
          fill="var(--color-vermilion)"
        />
        <text
          x="384"
          y={VIEW_H - 78}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          information bottleneck
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0b &mdash; What seq2seq looked like before attention
      </figcaption>
    </figure>
  )
}
