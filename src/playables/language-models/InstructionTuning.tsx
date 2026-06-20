import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H, PHOTOSYNTHESIS_COMPLETION } from './lm'

/**
 * Act 6 — instruction tuning. independent.
 *
 *  Left  : two stacked "model" boxes labelled "Base model" and
 *          "Instruction-tuned." The same prompt — "Explain photosynthesis
 *          to a 10-year-old." — is sent into both.
 *  Right : their completions side by side. The base model rambles, completing
 *          pattern-style as if the prompt were the first line of a larger
 *          document. The instruction-tuned model answers the question.
 *
 * Static.
 */

export function LeftPane() {
  const prompt = PHOTOSYNTHESIS_COMPLETION.prompt

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The same prompt is fed to two different models. A base model and an instruction-tuned model. The prompt: explain photosynthesis to a 10-year-old. The two models will respond very differently."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="The same prompt is sent into two boxes: base model and instruction-tuned model."
      >
        <text
          x={VIEW_W / 2}
          y="36"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ONE PROMPT · TWO MODELS
        </text>

        {/* Prompt card */}
        <rect
          x="48"
          y="74"
          width={VIEW_W - 96}
          height="76"
          fill="var(--color-paper)"
          stroke="var(--color-vermilion)"
          strokeWidth="1.2"
          rx="4"
        />
        <text
          x="68"
          y="96"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-vermilion)"
        >
          PROMPT
        </text>
        <text
          x="68"
          y="128"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="15"
          fill="var(--color-paper-ink)"
        >
          “{prompt}”
        </text>

        {/* Two model boxes side by side */}
        <g transform="translate(0, 184)">
          {/* Base model */}
          <rect
            x="48"
            y="0"
            width="232"
            height="220"
            fill="none"
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
            rx="4"
          />
          <text
            x="164"
            y="30"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="11"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            BASE MODEL
          </text>
          <text
            x="164"
            y="60"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-ink)"
          >
            “predicts the next token”
          </text>
          <text
            x="164"
            y="92"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontSize="13"
            fill="var(--color-dim)"
          >
            sees a prompt as the
          </text>
          <text
            x="164"
            y="110"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontSize="13"
            fill="var(--color-dim)"
          >
            opening of a longer document
          </text>
          <text
            x="164"
            y="158"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            COMPLETES · PATTERN-MATCH
          </text>

          {/* Tuned model */}
          <rect
            x={VIEW_W - 280}
            y="0"
            width="232"
            height="220"
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="1.6"
            rx="4"
          />
          <text
            x={VIEW_W - 280 + 116}
            y="30"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="11"
            letterSpacing="0.22em"
            fill="var(--color-vermilion)"
          >
            INSTRUCTION-TUNED
          </text>
          <text
            x={VIEW_W - 280 + 116}
            y="60"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-ink)"
          >
            “does what you asked”
          </text>
          <text
            x={VIEW_W - 280 + 116}
            y="92"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontSize="13"
            fill="var(--color-dim)"
          >
            fine-tuned on
          </text>
          <text
            x={VIEW_W - 280 + 116}
            y="110"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontSize="13"
            fill="var(--color-dim)"
          >
            instruction-following examples
          </text>
          <text
            x={VIEW_W - 280 + 116}
            y="158"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-vermilion)"
          >
            ANSWERS · ON TOPIC
          </text>
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 22}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          same weights · different training objective
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6a &mdash; The same prompt, sent into two different models
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  const baseLines = PHOTOSYNTHESIS_COMPLETION.base
  const tunedLines = PHOTOSYNTHESIS_COMPLETION.tuned

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="Two completions side by side. The base model produces a list of related questions, as if the prompt were a chapter heading. The instruction-tuned model writes a short, child-friendly explanation of photosynthesis."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Two completions side by side: rambling base model output vs an instruction-tuned answer."
      >
        <text
          x={VIEW_W / 2}
          y="36"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TWO COMPLETIONS · ONE PROMPT
        </text>

        {/* Base column */}
        <text
          x="48"
          y="76"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          BASE MODEL
        </text>
        <line
          x1="48"
          y1="84"
          x2={VIEW_W / 2 - 18}
          y2="84"
          stroke="var(--color-graph-fade)"
          strokeWidth="0.8"
        />
        {baseLines.map((line, i) => (
          <text
            key={`b-${i}`}
            x="48"
            y={104 + i * 22}
            fontFamily="Source Serif 4, Georgia, serif"
            fontSize="12"
            fill="var(--color-ink)"
            fillOpacity={i === 0 ? 1 : 0.7 - i * 0.07}
          >
            {line.length > 38 ? line.slice(0, 36) + '…' : line}
          </text>
        ))}

        {/* Tuned column */}
        <text
          x={VIEW_W / 2 + 18}
          y="76"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-vermilion)"
        >
          INSTRUCTION-TUNED
        </text>
        <line
          x1={VIEW_W / 2 + 18}
          y1="84"
          x2={VIEW_W - 48}
          y2="84"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />
        {tunedLines.map((line, i) => (
          <text
            key={`t-${i}`}
            x={VIEW_W / 2 + 18}
            y={104 + i * 22}
            fontFamily="Source Serif 4, Georgia, serif"
            fontSize="12"
            fill="var(--color-ink)"
          >
            {line.length > 36 ? line.slice(0, 34) + '…' : line}
          </text>
        ))}

        {/* Verdict line */}
        <line
          x1="60"
          y1={VIEW_H - 80}
          x2={VIEW_W - 60}
          y2={VIEW_H - 80}
          stroke="var(--color-vermilion)"
          strokeWidth="0.6"
        />
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 56}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the base model is capable
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 36}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          the tuned model is useful
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6b &mdash; The chapter’s pivot from capable to useful
      </figcaption>
    </figure>
  )
}
