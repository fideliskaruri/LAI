import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 1 — cold-open. July 1958, Cornell Aeronautical Laboratory.
 *
 *  Left  : a faux New York Times clipping. The famous July 8, 1958
 *          headline — "New Navy Device Learns By Doing" — alongside its
 *          better-known popular paraphrase, "Electronic 'Brain' Teaches
 *          Itself." A short kicker about Rosenblatt's Mark I demo.
 *  Right : a title card. Cornell, 1958. The first machine that could learn.
 *
 * Static. No interaction.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A facsimile of the July 1958 New York Times article announcing Frank Rosenblatt's perceptron at the Cornell Aeronautical Laboratory. The headline reads, Electronic Brain Teaches Itself. The kicker reports that the United States Navy has unveiled a machine that learns by doing."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A facsimile of the July 1958 New York Times article announcing Rosenblatt's perceptron at the Cornell Aeronautical Laboratory."
      >
        {/* Newsprint frame — a slightly off-white page */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="#f6f1e7"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* Masthead */}
        <text
          x={VIEW_W / 2}
          y="78"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="18"
          fill="var(--color-ink)"
        >
          The New York Times
        </text>
        <line
          x1={PADX + 20}
          y1="92"
          x2={VIEW_W - PADX - 20}
          y2="92"
          stroke="var(--color-ink)"
          strokeWidth="0.6"
        />
        <text
          x={PADX + 20}
          y="108"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          TUESDAY · JULY 8 · 1958
        </text>
        <text
          x={VIEW_W - PADX - 20}
          y="108"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          PAGE 25
        </text>

        {/* Eyebrow */}
        <text
          x={PADX + 20}
          y="142"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          UNITED STATES NAVY · CORNELL AERONAUTICAL LAB
        </text>

        {/* Headline */}
        <text
          x={PADX + 20}
          y="184"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="28"
          fontWeight="600"
          fill="var(--color-ink)"
        >
          New Navy Device
        </text>
        <text
          x={PADX + 20}
          y="214"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="28"
          fontWeight="600"
          fill="var(--color-ink)"
        >
          Learns By Doing
        </text>

        {/* Subhead */}
        <text
          x={PADX + 20}
          y="246"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          Psychologist Shows Embryo
        </text>
        <text
          x={PADX + 20}
          y="264"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          Of Computer Designed to
        </text>
        <text
          x={PADX + 20}
          y="282"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          Read and Grow Wiser
        </text>

        {/* Body — short paragraph in newsprint serif */}
        <text
          x={PADX + 20}
          y="318"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="11"
          fill="var(--color-ink)"
        >
          <tspan x={PADX + 20} dy="0">
            WASHINGTON, July 7 — The Navy revealed the
          </tspan>
          <tspan x={PADX + 20} dy="14">
            embryo of an electronic computer today that it
          </tspan>
          <tspan x={PADX + 20} dy="14">
            expects will be able to walk, talk, see, write,
          </tspan>
          <tspan x={PADX + 20} dy="14">
            reproduce itself and be conscious of its existence.
          </tspan>
        </text>

        {/* Popular paraphrase pull-quote */}
        <line
          x1={PADX + 20}
          y1="388"
          x2={PADX + 60}
          y2="388"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />
        <text
          x={PADX + 20}
          y="408"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          “Electronic ‘Brain’ Teaches Itself.”
        </text>
        <text
          x={PADX + 20}
          y="424"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          — THE NEW YORKER, DEC. 6, 1958
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0a &mdash; The day the machines started learning
      </figcaption>
    </figure>
  )
}

const PADX = 40

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A title card framing the chapter. Frank Rosenblatt, a psychologist at the Cornell Aeronautical Laboratory, built the Mark I Perceptron in 1958. The size of a refrigerator, wired with motors and twenty by twenty photocells, it was the first machine that could learn — and the first model of artificial intelligence to make the front page."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A title card for the perceptron chapter, naming Rosenblatt, Cornell, and the 1958 demonstration."
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
          y="106"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          CORNELL AERONAUTICAL LAB &middot; 1958
        </text>

        <text
          x={VIEW_W / 2}
          y="160"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="18"
          fill="var(--color-ink)"
        >
          The first machine that could learn
        </text>
        <text
          x={VIEW_W / 2}
          y="186"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="18"
          fill="var(--color-ink)"
        >
          had the size of a refrigerator
        </text>
        <text
          x={VIEW_W / 2}
          y="212"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="18"
          fill="var(--color-ink)"
        >
          and the personality of a 1950s engineer.
        </text>

        <text
          x={VIEW_W / 2}
          y="270"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-dim)"
        >
          Frank Rosenblatt &mdash; psychologist, Cornell &mdash;
        </text>
        <text
          x={VIEW_W / 2}
          y="294"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-dim)"
        >
          showed a room of reporters a machine
        </text>
        <text
          x={VIEW_W / 2}
          y="318"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-dim)"
        >
          that taught itself to tell triangle from square.
        </text>

        <line
          x1={VIEW_W / 2 - 40}
          y1="356"
          x2={VIEW_W / 2 + 40}
          y2="356"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="388"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          THE PERCEPTRON &middot; CHAPTER 13
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0b &mdash; The chapter starts at Cornell
      </figcaption>
    </figure>
  )
}
