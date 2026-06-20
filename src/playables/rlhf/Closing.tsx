import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H } from './rlhf'

/**
 * Act 7 — closing.
 *
 *  Left  : three alignment philosophies side by side.
 *          (a) HHH — Bai et al. 2022, Anthropic. arXiv:2204.05862.
 *          (b) Constitutional AI — Bai et al. 2022. arXiv:2212.08073.
 *          (c) DPO — Rafailov et al. 2023. arXiv:2305.18290.
 *  Right : a thread card forward to Diffusion.
 *
 * Static.
 */

interface Philosophy {
  y: number
  title: string
  date: string
  authors: string
  arxiv: string
  hook: string
  body: string
}

const PHILOSOPHIES: Philosophy[] = [
  {
    y: 92,
    title: 'Helpful, Harmless, Honest',
    date: 'Apr 2022',
    authors: 'Bai et al. · Anthropic',
    arxiv: 'arXiv:2204.05862',
    hook: 'three dimensions, scored separately',
    body: 'A model is taught to optimise three things at once — helpfulness, harmlessness, and honesty — and the labellers pay attention to each.',
  },
  {
    y: 220,
    title: 'Constitutional AI',
    date: 'Dec 2022',
    authors: 'Bai et al. · Anthropic',
    arxiv: 'arXiv:2212.08073',
    hook: 'a written constitution does the judging',
    body: 'The model itself critiques its own outputs against a short written constitution. Far fewer contractors. The values become readable text instead of a label budget.',
  },
  {
    y: 348,
    title: 'Direct Preference Optimisation',
    date: 'May 2023',
    authors: 'Rafailov et al. · Stanford',
    arxiv: 'arXiv:2305.18290',
    hook: 'skip the reward model entirely',
    body: 'Treat the preference pairs as the loss directly. No separate scorer. The policy itself is the reward function under the hood, and a single supervised-style loss does the work.',
  },
]

export function LeftPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="Three philosophies that came after the original RLHF pipeline. Helpful, Harmless, Honest from Anthropic in April 2022 splits the goal into three scored dimensions. Constitutional AI from Anthropic in December 2022 lets the model judge itself against a short written constitution, cutting contractor hours by an order of magnitude. Direct Preference Optimisation from Stanford in May 2023 skips the reward model entirely and trains directly on the preference pairs."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Three alignment philosophies — HHH, Constitutional AI, and DPO — with their dates and authors."
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />

        <text
          x={VIEW_W / 2}
          y="44"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THREE WAYS TO TEACH MANNERS
        </text>

        {PHILOSOPHIES.map((p, i) => (
          <g key={i}>
            {/* Side rule */}
            <line
              x1="60"
              y1={p.y}
              x2="60"
              y2={p.y + 96}
              stroke="var(--color-vermilion)"
              strokeWidth="2"
            />
            <text
              x="80"
              y={p.y + 12}
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              letterSpacing="0.18em"
              fill="var(--color-vermilion)"
            >
              {p.date.toUpperCase()} · {p.arxiv}
            </text>
            <text
              x="80"
              y={p.y + 36}
              fontFamily="Source Serif 4, Georgia, serif"
              fontSize="16"
              fontWeight="600"
              fill="var(--color-ink)"
            >
              {p.title}
            </text>
            <text
              x="80"
              y={p.y + 52}
              fontFamily="Source Serif 4, Georgia, serif"
              fontStyle="italic"
              fontSize="11"
              fill="var(--color-vermilion)"
            >
              {p.hook}
            </text>
            <foreignObject x="80" y={p.y + 60} width={VIEW_W - 120} height="50">
              <div
                style={{
                  fontFamily: 'Source Serif 4, Georgia, serif',
                  fontSize: '12px',
                  lineHeight: 1.45,
                  color: 'var(--color-dim)',
                }}
              >
                {p.body}
              </div>
            </foreignObject>
            <text
              x={VIEW_W - 60}
              y={p.y + 12}
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill="var(--color-dim)"
            >
              {p.authors}
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
          one chapter changes what the model says
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7a &mdash; The three children of RLHF
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The chapter ends. The next chapter is Diffusion. RLHF changed what a language model would say. Diffusion changes what kind of thing it generates — moving from text to images and audio by learning to undo noise."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A thread card forward to the diffusion chapter."
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />
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
          WHAT WE GOT · WHAT COMES NEXT
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
          Compare. Score. Step.
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
          Keep the leash on.
        </text>

        <text
          x={VIEW_W / 2}
          y="232"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-vermilion)"
        >
          The model learns what to say.
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
          RLHF changes what comes out.
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
          Diffusion changes what kind of thing
        </text>
        <text
          x={VIEW_W / 2}
          y="322"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          comes out at all.
        </text>

        <line
          x1={VIEW_W / 2 - 40}
          y1={356}
          x2={VIEW_W / 2 + 40}
          y2={356}
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
          NEXT · DIFFUSION
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
          a different generator, a different teaching
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7b &mdash; The chapter ends; the modality changes
      </figcaption>
    </figure>
  )
}
