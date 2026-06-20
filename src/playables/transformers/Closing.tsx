import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H } from './tx'

/**
 * Act 7 — Closing. Static.
 *
 *  Left  : a lineage tree. 2017 Transformer at the root; branches to BERT,
 *          GPT, T5, GPT-3, Switch, Chinchilla, PaLM, Claude, GPT-4, Llama,
 *          Gemini.
 *  Right : a thread card forward to Language Models — "every modern LM is
 *          a transformer; the next chapter is what we do with that."
 */

interface Node {
  id: string
  label: string
  year: string
  org: string
  x: number
  y: number
  parent: string | null
}

const ROOT_X = VIEW_W / 2
const ROOT_Y = 70

// Two-column descendant layout.
const COL_L = 110
const COL_R = VIEW_W - 110

const NODES: Node[] = [
  { id: 'root', label: 'Attention Is All You Need', year: '2017', org: 'Google', x: ROOT_X, y: ROOT_Y, parent: null },

  { id: 'bert',       label: 'BERT',        year: '2018', org: 'Google',     x: COL_L, y: 138, parent: 'root' },
  { id: 'gpt',        label: 'GPT',         year: '2018', org: 'OpenAI',     x: COL_R, y: 138, parent: 'root' },
  { id: 't5',         label: 'T5',          year: '2019', org: 'Google',     x: COL_L, y: 186, parent: 'root' },
  { id: 'gpt3',       label: 'GPT-3',       year: '2020', org: 'OpenAI',     x: COL_R, y: 186, parent: 'gpt' },
  { id: 'switch',     label: 'Switch',      year: '2021', org: 'Google',     x: COL_L, y: 234, parent: 't5' },
  { id: 'chinchilla', label: 'Chinchilla',  year: '2022', org: 'DeepMind',   x: COL_L, y: 282, parent: 'root' },
  { id: 'palm',       label: 'PaLM',        year: '2022', org: 'Google',     x: COL_R, y: 234, parent: 'gpt3' },
  { id: 'claude',     label: 'Claude',      year: '2022', org: 'Anthropic',  x: COL_R, y: 282, parent: 'root' },
  { id: 'gpt4',       label: 'GPT-4',       year: '2023', org: 'OpenAI',     x: COL_R, y: 330, parent: 'gpt3' },
  { id: 'llama',      label: 'Llama',       year: '2023', org: 'Meta',       x: COL_L, y: 330, parent: 'root' },
  { id: 'gemini',     label: 'Gemini',      year: '2023', org: 'Google',     x: COL_R, y: 378, parent: 'root' },
]

const BY_ID: Record<string, Node> = Object.fromEntries(NODES.map((n) => [n.id, n]))

export function LeftPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A lineage tree from the 2017 Transformer paper to BERT, GPT, T5, GPT-3, Switch, Chinchilla, PaLM, Claude, GPT-4, Llama, and Gemini. Every line of descent shares the same transformer ancestor."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A descent tree from the 2017 Transformer paper to BERT, GPT, T5, GPT-3, Chinchilla, PaLM, Claude, GPT-4, Llama, and Gemini."
      >
        {/* Header */}
        <text
          x={VIEW_W / 2}
          y={28}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ONE PAPER · EVERY MODERN LM
        </text>

        {/* Lines from each descendant to its parent */}
        {NODES.filter((n) => n.parent).map((n) => {
          const p = BY_ID[n.parent as string]
          const isFromRoot = p.id === 'root'
          return (
            <line
              key={`l-${n.id}`}
              x1={p.x}
              y1={p.y + (isFromRoot ? 12 : 6)}
              x2={n.x}
              y2={n.y - 6}
              stroke="var(--color-vermilion)"
              strokeOpacity={0.45}
              strokeWidth={1}
            />
          )
        })}

        {/* Root node */}
        <g>
          <rect
            x={ROOT_X - 130}
            y={ROOT_Y - 18}
            width={260}
            height={40}
            rx={4}
            fill="var(--color-vermilion)"
            stroke="var(--color-vermilion)"
            strokeWidth={1.4}
          />
          <text
            x={ROOT_X}
            y={ROOT_Y - 1}
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
            x={ROOT_X}
            y={ROOT_Y + 16}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-cream)"
            fillOpacity={0.85}
          >
            2017 · Google
          </text>
        </g>

        {/* Descendant nodes */}
        {NODES.filter((n) => n.id !== 'root').map((n) => {
          const isLeft = n.x < VIEW_W / 2
          return (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={5}
                fill="var(--color-vermilion)"
                stroke="var(--color-cream)"
                strokeWidth={1.4}
              />
              <text
                x={n.x + (isLeft ? -10 : 10)}
                y={n.y - 2}
                textAnchor={isLeft ? 'end' : 'start'}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="14"
                fill="var(--color-ink)"
              >
                {n.label}
              </text>
              <text
                x={n.x + (isLeft ? -10 : 10)}
                y={n.y + 14}
                textAnchor={isLeft ? 'end' : 'start'}
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="var(--color-dim)"
              >
                {n.year} · {n.org}
              </text>
            </g>
          )
        })}

        {/* Bottom note */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 36}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          every modern language model is a transformer
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 16}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          ONE IDEA, EIGHT YEARS, EVERY MODEL
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7a &mdash; The 2017 paper&rsquo;s descendants
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="Thread card forward to the next chapter on language models. Every modern language model is a transformer. The next chapter is about what we do with that architecture."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A thread card forward to the next chapter on language models."
      >
        {/* Page stock */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="var(--color-paper)"
          stroke="var(--color-graph-fade)"
          strokeWidth={1}
        />

        {/* Eyebrow */}
        <text
          x={VIEW_W / 2}
          y={92}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          NEXT &middot; LANGUAGE MODELS
        </text>

        <line
          x1={VIEW_W / 2 - 40}
          y1={108}
          x2={VIEW_W / 2 + 40}
          y2={108}
          stroke="var(--color-vermilion)"
          strokeWidth={1}
        />

        {/* Title */}
        <text
          x={VIEW_W / 2}
          y={172}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="26"
          fontWeight="600"
          fill="var(--color-paper-ink)"
        >
          So now what?
        </text>

        {/* Body */}
        {[
          'We have the architecture.',
          'It can attend, project, normalise,',
          'and stack to ninety-six layers.',
          '',
          'The next chapter asks the',
          'question this one set up:',
          '',
          'what do you do with a transformer',
          'once you have one?',
        ].map((line, i) => (
          <text
            key={i}
            x={VIEW_W / 2}
            y={216 + i * 26}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="15"
            fill="var(--color-paper-ink)"
            fillOpacity={line.trim() === '' ? 0 : 1}
          >
            {line}
          </text>
        ))}

        {/* Footer */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 70}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          chapter 23 &middot; language models
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 50}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          PRETRAIN · SCALE · EMERGE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7b &mdash; What the next chapter answers
      </figcaption>
    </figure>
  )
}
