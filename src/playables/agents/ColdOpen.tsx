import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H } from './agents'

/**
 * Act 0 — cold open.
 *
 *  Left  : a stylised arXiv title card for "ReAct: Synergizing Reasoning
 *          and Acting in Language Models" — Yao, Zhao, Yu, Du, Shafran,
 *          Narasimhan, Cao. arXiv:2210.03629, October 6 2022.
 *  Right : a vertical lineage of agentic-AI milestones from the 2017
 *          Transformer through to general-purpose computer-using agents
 *          in 2025+.
 *
 * Static.
 */

interface LineageStop {
  year: string
  label: string
  blurb: string
  accent?: boolean
}

const LINEAGE: LineageStop[] = [
  { year: '2017', label: 'Transformer', blurb: 'Vaswani et al.' },
  {
    year: '2022',
    label: 'ReAct',
    blurb: 'Yao et al. · the loop',
    accent: true,
  },
  { year: '2023', label: 'Toolformer', blurb: 'Schick et al. · Feb' },
  { year: '2023', label: 'Reflexion', blurb: 'Shinn et al. · Mar' },
  { year: '2023', label: 'AutoGPT', blurb: 'Significant Gravitas · Apr' },
  { year: '2024', label: 'Computer Use', blurb: 'Anthropic · Oct' },
  { year: '2025+', label: 'general agents', blurb: 'a field, mid-stride' },
]

export function LeftPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A facsimile of the arXiv title page for ReAct: Synergizing Reasoning and Acting in Language Models, by Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, and Yuan Cao. Posted to arXiv as 2210.03629 on October 6, 2022. This is the paper that crystallised the thought, action, observation loop that every agent today still runs."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A facsimile of the arXiv title page for the 2022 ReAct paper."
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />

        {/* Paper stock */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="#f6f1e7"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* arXiv masthead */}
        <text
          x="80"
          y="84"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          arXiv:2210.03629 [cs.CL]
        </text>
        <text
          x={VIEW_W - 80}
          y="84"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          6 OCT 2022
        </text>
        <line
          x1="80"
          y1="98"
          x2={VIEW_W - 80}
          y2="98"
          stroke="var(--color-ink)"
          strokeWidth="0.6"
        />

        {/* Eyebrow */}
        <text
          x="80"
          y="136"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          PREPRINT
        </text>

        {/* Title */}
        <text
          x="80"
          y="174"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="22"
          fontWeight="600"
          fill="var(--color-ink)"
        >
          ReAct: Synergizing
        </text>
        <text
          x="80"
          y="202"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="22"
          fontWeight="600"
          fill="var(--color-ink)"
        >
          Reasoning and Acting in
        </text>
        <text
          x="80"
          y="230"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="22"
          fontWeight="600"
          fill="var(--color-ink)"
        >
          Language Models
        </text>

        {/* Authors */}
        <text
          x="80"
          y="272"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          S. Yao, J. Zhao, D. Yu, N. Du, I. Shafran,
        </text>
        <text
          x="80"
          y="290"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          K. Narasimhan, Y. Cao
        </text>
        <text
          x="80"
          y="312"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-dim)"
        >
          Princeton · Google Research, Brain Team
        </text>

        {/* Pull-quote */}
        <line
          x1="80"
          y1="350"
          x2="120"
          y2="350"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />
        <text
          x="80"
          y="372"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          “Reasoning traces and task-specific
        </text>
        <text
          x="80"
          y="388"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          actions, interleaved.”
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 60}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the paper that named the loop
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0a &mdash; The paper everyone cites
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  const top = 80
  const gap = (VIEW_H - 80 - 60) / (LINEAGE.length - 1)
  const xMid = 110

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A vertical lineage of agentic-AI milestones. The 2017 Transformer. The 2022 ReAct loop. Toolformer in February 2023 — models that teach themselves to use tools. Reflexion in March 2023 — verbal reinforcement. AutoGPT, an open-source agent that the public first tried in April 2023. Anthropic's Computer Use capability in October 2024. And in the year you are reading this, general-purpose agents that use computers the way you do."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A vertical lineage of agentic-AI milestones from 2017 to today."
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />

        <text
          x={VIEW_W / 2}
          y="40"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          NINE YEARS · ONE LINEAGE
        </text>

        {/* Spine */}
        <line
          x1={xMid}
          y1={top}
          x2={xMid}
          y2={top + (LINEAGE.length - 1) * gap}
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {LINEAGE.map((s, i) => {
          const y = top + i * gap
          return (
            <g key={i}>
              <circle
                cx={xMid}
                cy={y}
                r={s.accent ? 9 : 5.5}
                fill={s.accent ? 'var(--color-vermilion)' : 'var(--color-cream)'}
                stroke={
                  s.accent ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
                }
                strokeWidth={s.accent ? 1.6 : 1.2}
              />
              <text
                x={xMid - 22}
                y={y + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-dim)"
              >
                {s.year}
              </text>
              <text
                x={xMid + 24}
                y={y - 2}
                fontFamily="Source Serif 4, Georgia, serif"
                fontSize="16"
                fontWeight="600"
                fill={s.accent ? 'var(--color-vermilion)' : 'var(--color-ink)'}
              >
                {s.label}
              </text>
              <text
                x={xMid + 24}
                y={y + 16}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="12"
                fill="var(--color-dim)"
              >
                {s.blurb}
              </text>
            </g>
          )
        })}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 36}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          a transformer learned to act
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0b &mdash; A short trajectory, very steep
      </figcaption>
    </figure>
  )
}
