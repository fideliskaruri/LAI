import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 7 — Closing. Forward to transformers.
 *
 *  Left  : a small architectural sketch — a stack of self-attention layers
 *          with a tower of arrows going up. Each layer is a self-attention
 *          block; stack them, train on enormous text, and the thing reads.
 *  Right : a thread card — Vaswani et al., *Attention Is All You Need*,
 *          NeurIPS 2017 — and the punchline title: "stack many layers of
 *          this, train at scale, get GPT".
 *
 * Static. No interaction.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  // A column of self-attention blocks, getting more abstract upward.
  const N_LAYERS = 6
  const COL_X = VIEW_W / 2
  const BOT_Y = 380
  const TOP_Y = 90
  const STEP = (BOT_Y - TOP_Y) / (N_LAYERS - 1)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A small architectural sketch: a tower of self-attention layers, one on top of the other. Each layer takes the previous layer's vectors and lets them attend to each other again. Stack enough of these on enough text and you get a language model."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A stylised stack of six self-attention layers, with upward arrows between them."
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
          STACK SELF-ATTENTION &middot; STACK MORE
        </text>

        {/* Tokens at the bottom (input) */}
        <text
          x={COL_X}
          y={BOT_Y + 38}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          tokens in
        </text>

        {/* The stack */}
        {Array.from({ length: N_LAYERS }).map((_, i) => {
          const y = BOT_Y - i * STEP
          const opacity = 0.5 + 0.5 * (i / (N_LAYERS - 1))
          return (
            <g key={i}>
              <rect
                x={COL_X - 130}
                y={y - 18}
                width={260}
                height={28}
                rx={4}
                fill="var(--color-vermilion)"
                fillOpacity={opacity * 0.18}
                stroke="var(--color-vermilion)"
                strokeWidth="1.4"
              />
              <text
                x={COL_X}
                y={y + 0}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="12"
                fill="var(--color-vermilion)"
              >
                self-attention layer {i + 1}
              </text>
              {/* Upward arrow */}
              {i < N_LAYERS - 1 && (
                <g>
                  <line
                    x1={COL_X}
                    y1={y - 18}
                    x2={COL_X}
                    y2={y - STEP + 10}
                    stroke="var(--color-vermilion)"
                    strokeWidth="1"
                  />
                  <polygon
                    points={`${COL_X},${y - STEP + 10} ${COL_X - 5},${y - STEP + 18} ${COL_X + 5},${y - STEP + 18}`}
                    fill="var(--color-vermilion)"
                  />
                </g>
              )}
            </g>
          )
        })}

        {/* "predictions out" label */}
        <text
          x={COL_X}
          y={TOP_Y - 22}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          predictions out
        </text>

        {/* Side dots — "and 90 more like it" */}
        <text
          x={COL_X + 170}
          y={TOP_Y + 40}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          (and 90 more)
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6a &mdash; A transformer is this column, deeper
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="Thread card forward to the Transformers chapter. The 2017 paper Attention Is All You Need by Vaswani and colleagues at Google Brain: the entire architecture is stacks of self-attention. Train it on a trillion tokens and you get GPT."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Thread card forward to the Transformers chapter."
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
          WHERE THIS GOES NEXT
        </text>

        <text
          x={VIEW_W / 2}
          y="160"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-ink)"
        >
          A self-attention block is small.
        </text>
        <text
          x={VIEW_W / 2}
          y="184"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-ink)"
        >
          A transformer is many of them.
        </text>

        <text
          x={VIEW_W / 2}
          y="240"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="17"
          fontWeight="600"
          fill="var(--color-vermilion)"
        >
          Attention Is All You Need
        </text>
        <text
          x={VIEW_W / 2}
          y="262"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          Vaswani, Shazeer, Parmar &amp; al. &middot; NeurIPS 2017
        </text>

        <text
          x={VIEW_W / 2}
          y="306"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          Train this stack on the internet
        </text>
        <text
          x={VIEW_W / 2}
          y="326"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          and you get a language model.
        </text>

        <line
          x1={VIEW_W / 2 - 40}
          y1="358"
          x2={VIEW_W / 2 + 40}
          y2="358"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="386"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          NEXT &middot; TRANSFORMERS
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 80}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the architecture underneath every modern LM
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6b &mdash; The chapter ends; the transformer begins
      </figcaption>
    </figure>
  )
}
