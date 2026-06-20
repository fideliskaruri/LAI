import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H } from './rlhf'

/**
 * Act 0 — cold open.
 *
 *  Left  : a stylised arXiv title card for Christiano, Leike, Brown, Martic,
 *          Legg, Amodei — Deep Reinforcement Learning from Human Preferences,
 *          arXiv:1706.03741, June 2017. The original RLHF paper.
 *  Right : a short lineage — Christiano backflip 2017 → OpenAI summarisation
 *          2020 → InstructGPT 2022 → ChatGPT Nov 2022 → Claude 2023.
 *
 * Static.
 */

export function LeftPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A facsimile of the arXiv title card for Deep Reinforcement Learning from Human Preferences. Authors Paul Christiano, Jan Leike, Tom Brown, Miljan Martic, Shane Legg, and Dario Amodei. Posted to arXiv as 1706.03741 on June 12, 2017. The paper trained a simulated robot to do a backflip from 900 human comparisons of short trajectory clips."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="The arXiv title card for Christiano et al. 2017 — the original RLHF paper."
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />

        {/* Paper card */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="var(--color-paper)"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* arXiv masthead */}
        <text
          x="80"
          y="84"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          letterSpacing="0.18em"
          fill="var(--color-vermilion)"
        >
          arXiv:1706.03741 [stat.ML]
        </text>
        <text
          x={VIEW_W - 80}
          y="84"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          12 JUN 2017
        </text>
        <line
          x1="80"
          y1="96"
          x2={VIEW_W - 80}
          y2="96"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.6"
        />

        {/* Eyebrow */}
        <text
          x="80"
          y="128"
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
          y="172"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="22"
          fontWeight="600"
          fill="var(--color-paper-ink)"
        >
          Deep Reinforcement Learning
        </text>
        <text
          x="80"
          y="200"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="22"
          fontWeight="600"
          fill="var(--color-paper-ink)"
        >
          from Human Preferences
        </text>

        {/* Authors */}
        <text
          x="80"
          y="244"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          Paul F. Christiano, Jan Leike, Tom B. Brown,
        </text>
        <text
          x="80"
          y="262"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          Miljan Martic, Shane Legg, Dario Amodei
        </text>

        <text
          x="80"
          y="290"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-dim)"
        >
          OpenAI &amp; Google DeepMind
        </text>

        {/* Pull-quote */}
        <line
          x1="80"
          y1="324"
          x2="120"
          y2="324"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />
        <text
          x="80"
          y="350"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          “…a simulated robot learns to backflip
        </text>
        <text
          x="80"
          y="366"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          from less than an hour of human time.”
        </text>

        <text
          x="80"
          y="402"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          900 COMPARISONS · NIPS 2017
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0a &mdash; The paper that taught a robot to backflip
      </figcaption>
    </figure>
  )
}

interface Stop {
  y: number
  label: string
  date: string
  note: string
  accent?: boolean
}

export function RightPane() {
  const stops: Stop[] = [
    { y: 100, label: 'Backflip', date: 'Jun 2017', note: 'Christiano et al. · 900 comparisons', accent: true },
    { y: 160, label: 'Fine-tuning GPT-2', date: '2019', note: 'OpenAI · learning to summarise' },
    { y: 220, label: 'Summarising books', date: 'Sep 2020', note: 'Stiennon et al. · NeurIPS' },
    { y: 280, label: 'InstructGPT', date: 'Mar 2022', note: 'Ouyang et al. · 1.3 B beats 175 B' },
    { y: 340, label: 'ChatGPT', date: 'Nov 30, 2022', note: 'Public release · 100 M users in 60 days', accent: true },
    { y: 400, label: 'Claude', date: 'Apr 2023', note: 'Anthropic · Constitutional AI' },
  ]
  const lineX = 130

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A timeline of RLHF. From Christiano's backflip in June 2017, through OpenAI's summarisation work in 2020, to InstructGPT in March 2022, to ChatGPT in November 2022, to Anthropic's Claude in April 2023. Six years from a robot doing flips to a chatbot writing your email."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A timeline of RLHF milestones from 2017 to 2023."
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="76"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          SIX YEARS · FROM A FLIP TO A CHATBOT
        </text>

        {/* Spine */}
        <line
          x1={lineX}
          y1="92"
          x2={lineX}
          y2="430"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />

        {stops.map((s, i) => (
          <g key={i}>
            <circle
              cx={lineX}
              cy={s.y}
              r="6"
              fill={s.accent ? 'var(--color-vermilion)' : 'var(--color-cream)'}
              stroke={s.accent ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
              strokeWidth="1.6"
            />
            <text
              x={lineX + 20}
              y={s.y - 6}
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              letterSpacing="0.18em"
              fill="var(--color-dim)"
            >
              {s.date.toUpperCase()}
            </text>
            <text
              x={lineX + 20}
              y={s.y + 10}
              fontFamily="Source Serif 4, Georgia, serif"
              fontSize="14"
              fontWeight="600"
              fill={s.accent ? 'var(--color-vermilion)' : 'var(--color-ink)'}
            >
              {s.label}
            </text>
            <text
              x={lineX + 20}
              y={s.y + 26}
              fontFamily="Source Serif 4, Georgia, serif"
              fontStyle="italic"
              fontSize="11"
              fill="var(--color-dim)"
            >
              {s.note}
            </text>
          </g>
        ))}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 18}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          one technique · two industries · a new common chore
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0b &mdash; The lineage of teaching from preference
      </figcaption>
    </figure>
  )
}
