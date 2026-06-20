import { useCallback, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { VIEW_W, VIEW_H, PREFERENCE_BANK, fmtInt } from './rlhf'

/**
 * Act 3 — preference pairs.
 *
 *  Left  : the current preference pair. Two completions, A and B. The reader
 *          clicks A or B. The chip flashes vermilion, the right pane ticks.
 *  Right : a growing pile of preference labels. As you click, the pile grows
 *          from "127 contractors, 32,901 comparisons" up through the running
 *          total — the same scale OpenAI used for InstructGPT.
 *
 * Left-drives-right. The right pane is a derived view of the click count.
 */

export interface PrefState {
  /** Index of the current pair in PREFERENCE_BANK. */
  idx: number
  /** Total comparisons collected so far. Starts at 32,901 like InstructGPT. */
  comparisons: number
  /** Number of correct-ish picks (matches gold). Used for a small tally. */
  correct: number
  /** Which side the reader chose for the current pair, or null. */
  lastChoice: 'a' | 'b' | null
  /** Whether the choice was "correct" (matches gold). */
  lastWasGold: boolean
  interacting: boolean
}

const STARTING_POOL = 32901

export const INITIAL_PREF: PrefState = {
  idx: 0,
  comparisons: STARTING_POOL,
  correct: 0,
  lastChoice: null,
  lastWasGold: false,
  interacting: false,
}

/* ============================================================== */
/* LEFT PANE — pair + A / B click                                  */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: PrefState
  onChange: (s: PrefState) => void
}) {
  const rowRef = useRef<SVGGElement | null>(null)
  const pair = PREFERENCE_BANK[state.idx % PREFERENCE_BANK.length]

  const choose = useCallback(
    (side: 'a' | 'b') => {
      const wasGold = pair.gold === side
      onChange({
        idx: (state.idx + 1) % PREFERENCE_BANK.length,
        comparisons: state.comparisons + 1,
        correct: state.correct + (wasGold ? 1 : 0),
        lastChoice: side,
        lastWasGold: wasGold,
        interacting: false,
      })
    },
    [pair.gold, state.comparisons, state.correct, state.idx, onChange],
  )

  useKeyNudge(
    rowRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        choose(dx < 0 ? 'a' : 'b')
      },
      [choose],
    ),
  )

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A preference comparison. The prompt is: ${pair.prompt} Two model completions, A and B. Click one to mark it as better. ${state.lastChoice ? `Last pick: ${state.lastChoice.toUpperCase()}.` : ''}`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Preference pair. Prompt: ${pair.prompt}. Two completions A and B.`}
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />

        <text
          x={VIEW_W / 2}
          y="32"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          A IS BETTER THAN B · OR THE OTHER WAY ROUND
        </text>

        {/* Prompt */}
        <text
          x={VIEW_W / 2}
          y="68"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          {pair.prompt}
        </text>

        {/* Two cards side by side */}
        <g
          ref={rowRef}
          tabIndex={0}
          role="radiogroup"
          aria-label="Pick the better completion"
          style={{ outline: 'none' }}
        >
          <Card
            x={40}
            y={94}
            width={(VIEW_W - 100) / 2}
            height={260}
            badge="A"
            text={pair.a}
            highlighted={state.lastChoice === 'a'}
            onClick={() => choose('a')}
          />
          <Card
            x={VIEW_W / 2 + 10}
            y={94}
            width={(VIEW_W - 100) / 2}
            height={260}
            badge="B"
            text={pair.b}
            highlighted={state.lastChoice === 'b'}
            onClick={() => choose('b')}
          />
        </g>

        {/* Hint */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 56}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          {state.lastChoice
            ? `You picked ${state.lastChoice.toUpperCase()}. The next pair is now on screen.`
            : 'Click a card. There is no wrong answer.'}
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 18}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TAP A CARD · ARROWS PICK A OR B
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3a &mdash; The work of the contractor
      </figcaption>
    </figure>
  )
}

interface CardProps {
  x: number
  y: number
  width: number
  height: number
  badge: 'A' | 'B'
  text: string
  highlighted: boolean
  onClick: () => void
}

function Card({ x, y, width, height, badge, text, highlighted, onClick }: CardProps) {
  const lines = wrapMono(text, width - 28, 7.4)
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} role="radio" aria-checked={highlighted}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={highlighted ? '#fff0e7' : 'var(--color-cream)'}
        stroke={highlighted ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
        strokeWidth={highlighted ? 2 : 1}
        rx="3"
      />
      <rect
        x={x + 14}
        y={y + 12}
        width="32"
        height="22"
        fill={highlighted ? 'var(--color-vermilion)' : 'var(--color-cream)'}
        stroke={highlighted ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
        strokeWidth="1.4"
        rx="2"
      />
      <text
        x={x + 30}
        y={y + 28}
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="12"
        fontWeight="600"
        fill={highlighted ? 'var(--color-cream)' : 'var(--color-ink)'}
      >
        {badge}
      </text>
      {lines.map((line, i) => (
        <text
          key={i}
          x={x + 14}
          y={y + 64 + i * 18}
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="13"
          fill="var(--color-ink)"
        >
          {line}
        </text>
      ))}
    </g>
  )
}

function wrapMono(text: string, width: number, charPx: number): string[] {
  const lines: string[] = []
  const words = text.split(' ')
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
  return lines.slice(0, 10)
}

/* ============================================================== */
/* RIGHT PANE — the pile                                           */
/* ============================================================== */

export function RightPane({ state }: { state: PrefState }) {
  const collected = state.comparisons - STARTING_POOL
  const contractors = 127 + Math.floor(collected / 50)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A growing pile of preference comparisons. So far ${fmtInt(state.comparisons)} comparisons from ${fmtInt(contractors)} contractors. Each click on the left adds one to this pile. OpenAI's InstructGPT used a pile of roughly this shape — tens of thousands of paired judgements.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A pile of preference judgements: ${fmtInt(state.comparisons)} comparisons, ${fmtInt(contractors)} contractors.`}
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
          THE PILE GROWS · EACH CLICK ADDS ONE
        </text>

        {/* Big number */}
        <text
          x={VIEW_W / 2}
          y="118"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="60"
          fontWeight="600"
          fill="var(--color-vermilion)"
        >
          {fmtInt(state.comparisons)}
        </text>
        <text
          x={VIEW_W / 2}
          y="142"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          COMPARISONS
        </text>

        {/* Sub stats */}
        <g>
          <text
            x={VIEW_W / 2 - 90}
            y={188}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="20"
            fill="var(--color-ink)"
          >
            {fmtInt(contractors)}
          </text>
          <text
            x={VIEW_W / 2 - 90}
            y={206}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            CONTRACTORS
          </text>
          <text
            x={VIEW_W / 2 + 90}
            y={188}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="20"
            fill="var(--color-ink)"
          >
            {collected}
          </text>
          <text
            x={VIEW_W / 2 + 90}
            y={206}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            YOUR PICKS
          </text>
        </g>

        {/* Tally — small ticks. Stylised, capped. */}
        <g transform={`translate(60, 240)`}>
          {Array.from({ length: 480 }).map((_, i) => {
            const cols = 40
            const r = Math.floor(i / cols)
            const c = i % cols
            const isLit = i < Math.min(state.comparisons / 70, 480)
            return (
              <rect
                key={i}
                x={c * 12}
                y={r * 12}
                width="9"
                height="9"
                fill={isLit ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
                opacity={isLit ? 0.9 : 0.5}
              />
            )
          })}
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
          this is what a label budget looks like
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3b &mdash; Twenty-five-cent jobs, summed
      </figcaption>
    </figure>
  )
}
