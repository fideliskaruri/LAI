import { useCallback, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { VIEW_W, VIEW_H } from './rlhf'

/**
 * Act 2 — supervised fine-tuning (SFT).
 *
 *  Left  : a small dataset card you step through. Each row is a single
 *          contractor-written (prompt, demonstration) pair from the kind
 *          of dataset OpenAI assembled for InstructGPT in 2021–22.
 *  Right : the same held-out test prompt, with a "before / after"
 *          toggle. Before SFT: the base model wanders off. After:
 *          it stays on task.
 *
 * Left-drives-right: the current dataset index (and "after" only) toggles
 * the right pane.
 */

interface DemoPair {
  prompt: string
  reply: string
}

const SFT_DEMOS: DemoPair[] = [
  {
    prompt: 'Q: What is a polite way to decline a meeting?',
    reply:
      'A: Thanks for the invite — I have a conflict at that time. Happy to read notes after, or to chat async.',
  },
  {
    prompt: 'Q: Summarise this paragraph for a 12-year-old.',
    reply:
      'A: It says that plants take in sunlight and use it to make food, while letting out the air we breathe.',
  },
  {
    prompt: 'Q: Write a Python function that returns the n-th Fibonacci number.',
    reply:
      'A: def fib(n):\n    a, b = 0, 1\n    for _ in range(n): a, b = b, a + b\n    return a',
  },
  {
    prompt: 'Q: Help me write a kind condolence note.',
    reply:
      'A: Dear ___, I was so sorry to hear about your loss. Please don’t feel any pressure to reply — I just wanted you to know I’m thinking of you.',
  },
  {
    prompt: 'Q: Explain a stack overflow in two sentences.',
    reply:
      'A: A stack overflow happens when a program’s call-stack runs past the memory the system gave it. The most common cause is unintended infinite recursion.',
  },
  {
    prompt: 'Q: Suggest three names for a plant-based deli.',
    reply:
      'A: 1) The Quiet Carrot   2) Field & Loaf   3) The Daily Plot',
  },
]

const TEST_PROMPT = 'Help me write a one-line bio for a science writer.'
const BASE_REPLY =
  'A bio is a literary form. A one-line bio compresses a person into a single sentence, often used on dust-jackets, byline spaces, social media profiles, and elsewhere. To produce one, follow the form —'
const SFT_REPLY =
  'Maya Lin writes about chemistry for people who hated chemistry class — newsletters, a podcast, and one book under a deadline.'

export interface SftState {
  /** Index into SFT_DEMOS. */
  idx: number
  /** Toggle on the right pane. */
  showAfter: boolean
  interacting: boolean
}

export const INITIAL_SFT: SftState = { idx: 0, showAfter: true, interacting: false }

const clampIdx = (i: number) => Math.max(0, Math.min(SFT_DEMOS.length - 1, i))

/* ============================================================== */
/* LEFT PANE — dataset card                                        */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: SftState
  onChange: (s: SftState) => void
}) {
  const navRef = useRef<SVGGElement | null>(null)

  const goto = useCallback(
    (next: number) => onChange({ ...state, idx: clampIdx(next), interacting: false }),
    [onChange, state],
  )

  useKeyNudge(
    navRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        goto(state.idx + Math.sign(dx))
      },
      [state.idx, goto],
    ),
  )

  const demo = SFT_DEMOS[state.idx]
  const replyLines = demo.reply.split('\n')

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A dataset card. You are looking at example ${state.idx + 1} of ${SFT_DEMOS.length}: ${demo.prompt} The contractor's demonstration is what the model will be trained to imitate.`}
        priority="high"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Supervised fine-tuning dataset card. Example ${state.idx + 1} of ${SFT_DEMOS.length}.`}
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
          DATASET · WRITTEN BY HUMANS · STEP THROUGH
        </text>

        {/* Card */}
        <rect
          x="40"
          y="60"
          width={VIEW_W - 80}
          height={310}
          fill="#f6f1e7"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x="60"
          y="92"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          EXAMPLE {String(state.idx + 1).padStart(2, '0')} / {SFT_DEMOS.length}
        </text>
        <text
          x={VIEW_W - 60}
          y="92"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-vermilion)"
        >
          CONTRACTOR-WRITTEN
        </text>

        {/* Prompt */}
        <text
          x="60"
          y="128"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          PROMPT
        </text>
        <foreignObject x="60" y="138" width={VIEW_W - 120} height="58">
          <div
            style={{
              fontFamily: 'Source Serif 4, Georgia, serif',
              fontStyle: 'italic',
              fontSize: '14px',
              lineHeight: 1.45,
              color: 'var(--color-ink)',
            }}
          >
            {demo.prompt}
          </div>
        </foreignObject>

        <line
          x1="60"
          y1="208"
          x2={VIEW_W - 60}
          y2="208"
          stroke="var(--color-graph-fade)"
          strokeWidth="0.8"
        />

        {/* Demonstration */}
        <text
          x="60"
          y="230"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          DEMONSTRATION
        </text>
        <foreignObject x="60" y="240" width={VIEW_W - 120} height="120">
          <div
            style={{
              fontFamily: replyLines.length > 1 ? 'JetBrains Mono, monospace' : 'Source Serif 4, Georgia, serif',
              fontSize: replyLines.length > 1 ? '12px' : '14px',
              lineHeight: 1.5,
              color: 'var(--color-ink)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {demo.reply}
          </div>
        </foreignObject>

        {/* Nav strip */}
        <g
          ref={navRef}
          tabIndex={0}
          role="slider"
          aria-label={`Dataset example ${state.idx + 1} of ${SFT_DEMOS.length}. Arrow keys step.`}
          aria-valuemin={1}
          aria-valuemax={SFT_DEMOS.length}
          aria-valuenow={state.idx + 1}
          style={{ outline: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_.sft-dot]:stroke-vermilion-deep"
        >
          <line
            x1="100"
            y1={410}
            x2={VIEW_W - 100}
            y2={410}
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
          />
          {SFT_DEMOS.map((_, i) => {
            const x = 100 + (i * (VIEW_W - 200)) / (SFT_DEMOS.length - 1)
            const active = i === state.idx
            return (
              <g key={i} onClick={() => goto(i)} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={410} r="14" fill="transparent" />
                <circle
                  className="sft-dot"
                  cx={x}
                  cy={410}
                  r={active ? 7 : 4}
                  fill={active ? 'var(--color-vermilion)' : 'var(--color-cream)'}
                  stroke="var(--color-vermilion)"
                  strokeWidth="1.6"
                />
              </g>
            )
          })}
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 18}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TAP A DOT · ARROWS STEP · {SFT_DEMOS.length} EXAMPLES
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2a &mdash; The first teaching — by example
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — before / after toggle                              */
/* ============================================================== */

export function RightPane({
  state,
  onChange,
}: {
  state: SftState
  onChange: (s: SftState) => void
}) {
  const toggleRef = useRef<SVGGElement | null>(null)
  const setAfter = useCallback(
    (after: boolean) => onChange({ ...state, showAfter: after, interacting: false }),
    [state, onChange],
  )
  useKeyNudge(
    toggleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        setAfter(!state.showAfter)
      },
      [state.showAfter, setAfter],
    ),
  )

  const reply = state.showAfter ? SFT_REPLY : BASE_REPLY
  const lines = wrap(reply, VIEW_W - 140, 7)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A held-out test prompt the model never saw during training. ${state.showAfter ? 'After SFT, the model stays on task and produces a tight one-line bio.' : 'Before SFT, the base model launches into a meta-explanation instead of doing what was asked.'}`}
        priority="high"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Held-out test prompt. ${state.showAfter ? 'After SFT.' : 'Before SFT.'}`}
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
          ONE TEST PROMPT · TOGGLE BEFORE / AFTER
        </text>

        {/* Toggle */}
        <g
          ref={toggleRef}
          tabIndex={0}
          role="switch"
          aria-checked={state.showAfter}
          aria-label="Before or after SFT"
          style={{ outline: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_.tog-frame]:stroke-vermilion-deep"
        >
          <rect
            className="tog-frame"
            x={VIEW_W / 2 - 130}
            y="62"
            width="260"
            height="36"
            fill="var(--color-cream)"
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
            rx="18"
          />
          <rect
            x={state.showAfter ? VIEW_W / 2 : VIEW_W / 2 - 130}
            y="62"
            width="130"
            height="36"
            fill="var(--color-vermilion)"
            rx="18"
          />
          <g onClick={() => setAfter(false)} style={{ cursor: 'pointer' }}>
            <rect x={VIEW_W / 2 - 130} y="62" width="130" height="36" fill="transparent" />
            <text
              x={VIEW_W / 2 - 65}
              y="86"
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontSize="11"
              letterSpacing="0.22em"
              fill={state.showAfter ? 'var(--color-dim)' : 'var(--color-cream)'}
            >
              BEFORE
            </text>
          </g>
          <g onClick={() => setAfter(true)} style={{ cursor: 'pointer' }}>
            <rect x={VIEW_W / 2} y="62" width="130" height="36" fill="transparent" />
            <text
              x={VIEW_W / 2 + 65}
              y="86"
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontSize="11"
              letterSpacing="0.22em"
              fill={state.showAfter ? 'var(--color-cream)' : 'var(--color-dim)'}
            >
              AFTER
            </text>
          </g>
        </g>

        {/* Test card */}
        <rect
          x="40"
          y="128"
          width={VIEW_W - 80}
          height={280}
          fill="#f6f1e7"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x="60"
          y="160"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TEST PROMPT · HELD OUT
        </text>
        <text
          x="60"
          y="184"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          {TEST_PROMPT}
        </text>

        <line
          x1="60"
          y1="208"
          x2={VIEW_W - 60}
          y2="208"
          stroke="var(--color-graph-fade)"
          strokeWidth="0.8"
        />

        <text
          x="60"
          y="232"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill={state.showAfter ? 'var(--color-vermilion)' : 'var(--color-dim)'}
        >
          {state.showAfter ? 'REPLY · AFTER SFT' : 'REPLY · BEFORE SFT'}
        </text>

        {lines.map((line, i) => (
          <text
            key={i}
            x="60"
            y={258 + i * 18}
            fontFamily="Source Serif 4, Georgia, serif"
            fontSize="13"
            fill="var(--color-ink)"
          >
            {line}
          </text>
        ))}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 20}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          {state.showAfter
            ? 'on task — what was asked, and only that'
            : 'meta-explanation — not the bio'}
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2b &mdash; The same prompt, two models
      </figcaption>
    </figure>
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
