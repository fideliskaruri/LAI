import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H, MODEL_CONSTELLATION } from './lm'

/**
 * Act 7 — closing. independent.
 *
 *  Left  : a constellation of 2020s language models arranged on a year (x) ×
 *          log-parameters (y) plane. GPT-3, Codex, Chinchilla, PaLM,
 *          ChatGPT, GPT-4, Claude, Llama 2, Gemini, Claude 3, Llama 3, GPT-4o.
 *  Right : a thread card forward to RLHF — raw pretraining made the models
 *          capable; alignment made them useful; the next chapter is the
 *          alignment loop.
 *
 * Static.
 */

const PAD_L = 60
const PAD_R = 36
const PAD_T = 76
const PAD_B = 96

const YEAR_MIN = 2020
const YEAR_MAX = 2024

const LOG_P_MIN = 9.8 // ~6B
const LOG_P_MAX = 12.4 // ~2.5T

const yearToX = (y: number) =>
  PAD_L + ((y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (VIEW_W - PAD_L - PAD_R)
const logPtoY = (lp: number) =>
  VIEW_H -
  PAD_B -
  ((lp - LOG_P_MIN) / (LOG_P_MAX - LOG_P_MIN)) * (VIEW_H - PAD_T - PAD_B)

export function LeftPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A constellation map of the 2020s language-model landscape. Twelve models arranged by year, on the x-axis, and parameter count, on the y-axis. The chart starts with GPT-3 in 2020 and ends with GPT-4o in 2024."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A 2020-2024 constellation of language models plotted by year and parameter count."
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
          THE 2020s CONSTELLATION
        </text>

        {/* Axes */}
        <line
          x1={PAD_L}
          y1={PAD_T}
          x2={PAD_L}
          y2={VIEW_H - PAD_B}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.8"
        />
        <line
          x1={PAD_L}
          y1={VIEW_H - PAD_B}
          x2={VIEW_W - PAD_R}
          y2={VIEW_H - PAD_B}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.8"
        />

        {/* Year ticks */}
        {[2020, 2021, 2022, 2023, 2024].map((y) => (
          <g key={y}>
            <line
              x1={yearToX(y)}
              y1={VIEW_H - PAD_B}
              x2={yearToX(y)}
              y2={VIEW_H - PAD_B + 5}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.7"
            />
            <text
              x={yearToX(y)}
              y={VIEW_H - PAD_B + 20}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {y}
            </text>
          </g>
        ))}

        {/* Y ticks at 10B, 100B, 1T */}
        {[10, 11, 12].map((lp) => (
          <g key={lp}>
            <line
              x1={PAD_L - 5}
              y1={logPtoY(lp)}
              x2={PAD_L}
              y2={logPtoY(lp)}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.7"
            />
            <text
              x={PAD_L - 10}
              y={logPtoY(lp) + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill="var(--color-dim)"
            >
              {lp === 10 ? '10B' : lp === 11 ? '100B' : '1T'}
            </text>
          </g>
        ))}

        {/* Soft horizontal gridlines */}
        {[10, 11, 12].map((lp) => (
          <line
            key={`g-${lp}`}
            x1={PAD_L}
            y1={logPtoY(lp)}
            x2={VIEW_W - PAD_R}
            y2={logPtoY(lp)}
            stroke="var(--color-graph-fade)"
            strokeWidth="0.4"
            strokeDasharray="2 4"
          />
        ))}

        {/* Constellation dots */}
        {MODEL_CONSTELLATION.map((m) => {
          const x = yearToX(m.year)
          const lp = Math.log10(m.params)
          const y = logPtoY(lp)
          const isAccent = m.id === 'chatgpt' || m.id === 'gpt4'
          return (
            <g key={m.id}>
              <circle
                cx={x}
                cy={y}
                r={isAccent ? 5 : 3.5}
                fill={isAccent ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
              />
              <text
                x={x + 8}
                y={y + 4}
                fontFamily="Source Serif 4, Georgia, serif"
                fontSize="11"
                fontWeight={isAccent ? 600 : 400}
                fill={isAccent ? 'var(--color-vermilion)' : 'var(--color-ink)'}
              >
                {m.label}
              </text>
            </g>
          )
        })}

        {/* Highlighted moment: ChatGPT public release */}
        <text
          x={yearToX(2022.92)}
          y={logPtoY(Math.log10(175e9)) + 24}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          Nov 30 · public release
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 38}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          a busy four years
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7a &mdash; Twelve models, four years
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The chapter closes with a thread forward to RLHF. Raw next-token prediction made the models capable. Reinforcement learning from human feedback made them useful. The next chapter is the alignment loop."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A thread card forward to RLHF: capable to useful."
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
          y="100"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          FROM MODEL TO FOUNDATION
        </text>

        <text
          x={VIEW_W / 2}
          y="158"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-ink)"
        >
          Predict next token. Repeat.
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
          Scale. Wait for the curves to wake up.
        </text>

        <text
          x={VIEW_W / 2}
          y="234"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-vermilion)"
        >
          Capable is not yet useful.
        </text>

        <text
          x={VIEW_W / 2}
          y="284"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          The base model knows everything
        </text>
        <text
          x={VIEW_W / 2}
          y="304"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          and listens to no one.
        </text>
        <text
          x={VIEW_W / 2}
          y="324"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          Alignment is the turn that follows.
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
          y="390"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          NEXT · RLHF
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
          how the turn from capable to useful happened
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7b &mdash; The chapter ends; alignment begins
      </figcaption>
    </figure>
  )
}
