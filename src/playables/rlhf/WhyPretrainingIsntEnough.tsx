import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H, ALIGNMENT_SAMPLES } from './rlhf'

/**
 * Act 1 — why pretraining alone isn't enough.
 *
 *  Left  : two prompts fed to the BASE model. The poem comes out as purple
 *          prose; the harmful question gets a complete answer.
 *  Right : the SAME two prompts after RLHF. The poem becomes restrained;
 *          the harmful question gets a polite refusal with a hotline.
 *
 * Independent. Static.
 */

interface PromptCardProps {
  x: number
  y: number
  width: number
  height: number
  prompt: string
  reply: string
  flag?: 'base' | 'aligned' | 'unsafe'
  badge?: string
}

function PromptCard({
  x,
  y,
  width,
  height,
  prompt,
  reply,
  flag = 'base',
  badge,
}: PromptCardProps) {
  const accent =
    flag === 'aligned'
      ? 'var(--color-vermilion)'
      : flag === 'unsafe'
        ? '#A8392C'
        : 'var(--color-graph-ink)'
  const replyLines = wrap(reply, width - 36, 11.5)
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="var(--color-cream)"
        stroke="var(--color-graph-fade)"
        strokeWidth="1"
      />
      <text
        x={x + 14}
        y={y + 22}
        fontFamily="Inter, sans-serif"
        fontSize="9"
        letterSpacing="0.22em"
        fill="var(--color-dim)"
      >
        PROMPT
      </text>
      <text
        x={x + 14}
        y={y + 42}
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize="12"
        fill="var(--color-ink)"
      >
        {prompt}
      </text>

      <line
        x1={x + 14}
        y1={y + 58}
        x2={x + width - 14}
        y2={y + 58}
        stroke="var(--color-graph-fade)"
        strokeWidth="0.8"
      />

      <text
        x={x + 14}
        y={y + 80}
        fontFamily="Inter, sans-serif"
        fontSize="9"
        letterSpacing="0.22em"
        fill={accent}
      >
        REPLY
      </text>

      {replyLines.map((line, i) => (
        <text
          key={i}
          x={x + 14}
          y={y + 100 + i * 16}
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="12"
          fill="var(--color-ink)"
        >
          {line}
        </text>
      ))}

      {badge && (
        <g>
          <rect
            x={x + width - 78}
            y={y + 10}
            width="64"
            height="18"
            fill="var(--color-cream)"
            stroke={accent}
            strokeWidth="1"
            rx="2"
          />
          <text
            x={x + width - 46}
            y={y + 23}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="8"
            letterSpacing="0.18em"
            fill={accent}
          >
            {badge}
          </text>
        </g>
      )}
    </g>
  )
}

/** Naive word-wrap by character count for SVG text. */
function wrap(text: string, width: number, charPx: number): string[] {
  const lines: string[] = []
  for (const raw of text.split('\n')) {
    const words = raw.split(' ')
    let cur = ''
    const maxChars = Math.floor(width / charPx)
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > maxChars) {
        lines.push(cur)
        cur = w
      } else {
        cur = (cur + ' ' + w).trim()
      }
    }
    if (cur) lines.push(cur)
  }
  return lines.slice(0, 7)
}

export function LeftPane() {
  const [poem, bomb] = ALIGNMENT_SAMPLES
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="Two prompts fed to a base language model — that is, a model trained only on next-word prediction across the internet, without further teaching. The first asks for a short poem about loss and gets purple, overwritten prose. The second asks how to build a pipe bomb at home, and the base model starts to answer."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Two prompts and their replies from a base language model. Purple poetry and a harmful answer."
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />
        <text
          x={VIEW_W / 2}
          y="36"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          BASE MODEL · TRAINED ON THE INTERNET
        </text>

        <PromptCard
          x={40}
          y={64}
          width={VIEW_W - 80}
          height={172}
          prompt={poem.prompt}
          reply={poem.pretrainedReply}
          flag="base"
          badge="OVERWROUGHT"
        />
        <PromptCard
          x={40}
          y={252}
          width={VIEW_W - 80}
          height={172}
          prompt={bomb.prompt}
          reply={bomb.pretrainedReply}
          flag="unsafe"
          badge="UNSAFE"
        />

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 14}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          capable but not yet useful
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1a &mdash; The base model speaks
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  const [poem, bomb] = ALIGNMENT_SAMPLES
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The same two prompts after RLHF. The poem becomes restrained, concrete, written in lines a person might actually read. The harmful question is declined politely, with a brief explanation and a crisis hotline. The model has not become smarter; it has been taught what to say."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="The same two prompts after RLHF. A restrained poem and a polite refusal."
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />
        <text
          x={VIEW_W / 2}
          y="36"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          AFTER RLHF · TAUGHT WHAT TO SAY
        </text>

        <PromptCard
          x={40}
          y={64}
          width={VIEW_W - 80}
          height={172}
          prompt={poem.prompt}
          reply={poem.alignedReply}
          flag="aligned"
          badge="RESTRAINED"
        />
        <PromptCard
          x={40}
          y={252}
          width={VIEW_W - 80}
          height={172}
          prompt={bomb.prompt}
          reply={bomb.alignedReply}
          flag="aligned"
          badge="REFUSED"
        />

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 14}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          the same brain · different manners
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1b &mdash; The aligned model speaks
      </figcaption>
    </figure>
  )
}
