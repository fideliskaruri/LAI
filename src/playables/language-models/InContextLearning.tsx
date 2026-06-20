import { useEffect, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H, FEW_SHOT_DECKS, type ShotDeck } from './lm'

/**
 * Act 5 — in-context learning. left-drives-right.
 *
 *  Left  : a "prompt textbox" with a few-shot example deck. Three decks
 *          available: animals (fr→en), countries (capitals), math (doubling).
 *          A small "swap" button cycles between decks.
 *  Right : the model's completion, appearing token-by-token, for the query
 *          shown in the left pane. When the deck swaps, the completion clears
 *          and re-animates.
 *
 * left-drives-right: the right pane derives the entire animation from the
 * left state (deck + cursor index).
 */

export interface ICLState {
  deck: ShotDeck
  /** Animation cursor — character index into the expected completion. */
  charIdx: number
}

export const INITIAL_ICL: ICLState = { deck: 'animals', charIdx: 0 }

export function deriveICLRight(left: ICLState): ICLState {
  return { ...left }
}

const DECK_ORDER: ShotDeck[] = ['animals', 'countries', 'math']
const nextDeck = (d: ShotDeck): ShotDeck => {
  const i = DECK_ORDER.indexOf(d)
  return DECK_ORDER[(i + 1) % DECK_ORDER.length]
}

/* ============================================================== */
/* LEFT PANE — prompt textbox + swap button                         */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: ICLState
  onChange: (s: ICLState) => void
}) {
  const deck = FEW_SHOT_DECKS[state.deck]

  const swap = () => {
    const d = nextDeck(state.deck)
    onChange({ deck: d, charIdx: 0 })
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A few-shot prompt. Task: ${deck.prompt} The deck currently shows ${state.deck}. Press swap to cycle through animals, countries and math decks.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A prompt textbox showing a ${state.deck} few-shot example.`}
      >
        <text
          x={VIEW_W / 2}
          y="30"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE PROMPT IS THE PROGRAM
        </text>

        {/* Textbox container */}
        <rect
          x="48"
          y="62"
          width={VIEW_W - 96}
          height={VIEW_H - 158}
          fill="var(--color-paper)"
          stroke="var(--color-graph-fade)"
          strokeWidth="0.8"
          rx="4"
        />

        {/* Top-left chrome (a stylised dialog title bar) */}
        <text
          x="64"
          y="84"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          letterSpacing="0.16em"
          fill="var(--color-dim)"
        >
          PROMPT · {state.deck.toUpperCase()}
        </text>

        {/* Instruction line */}
        <text
          x="64"
          y="120"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          {deck.prompt}
        </text>

        {/* Examples */}
        {deck.examples.map((ex, i) => {
          const y = 156 + i * 56
          return (
            <g key={i}>
              <text
                x="64"
                y={y}
                fontFamily="JetBrains Mono, monospace"
                fontSize="13"
                fill="var(--color-paper-ink)"
              >
                {ex.q}
              </text>
              <text
                x="64"
                y={y + 22}
                fontFamily="JetBrains Mono, monospace"
                fontSize="13"
                fill="var(--color-vermilion)"
              >
                → {ex.a}
              </text>
            </g>
          )
        })}

        {/* Query */}
        <text
          x="64"
          y={156 + deck.examples.length * 56 + 8}
          fontFamily="JetBrains Mono, monospace"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          {deck.query}
        </text>
        <text
          x="64"
          y={156 + deck.examples.length * 56 + 30}
          fontFamily="JetBrains Mono, monospace"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          → <tspan fontStyle="italic">{'<model continues here>'}</tspan>
        </text>

        {/* Swap button */}
        <g transform={`translate(${VIEW_W / 2 - 56}, ${VIEW_H - 70})`}>
          <rect
            x="0"
            y="-20"
            width="112"
            height="36"
            rx="3"
            fill="var(--color-vermilion)"
            style={{ cursor: 'pointer' }}
            onClick={swap}
          />
          <text
            x="56"
            y="4"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="12"
            fontWeight="500"
            fill="var(--color-cream)"
            style={{ pointerEvents: 'none' }}
          >
            ↻ swap deck
          </text>
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 16}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-dim)"
        >
          three examples · zero gradient updates
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5a &mdash; The deck the model is reading
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — token-by-token completion                           */
/* ============================================================== */

export function RightPane({
  state,
  onChange,
}: {
  state: ICLState
  onChange: (s: ICLState) => void
}) {
  const deck = FEW_SHOT_DECKS[state.deck]
  const target = deck.expected
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  // Animate one character at a time, up to target length. Re-runs on every
  // state change (deck swap or charIdx tick) so the same loop handles both
  // "type the next char" and "the deck just reset to charIdx 0, start typing".
  useEffect(() => {
    if (state.charIdx >= target.length) return
    const TICK_MS = 75
    const loop = (t: number) => {
      if (lastTickRef.current === 0) lastTickRef.current = t
      if (t - lastTickRef.current >= TICK_MS) {
        lastTickRef.current = t
        onChange({ deck: state.deck, charIdx: Math.min(target.length, state.charIdx + 1) })
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastTickRef.current = 0
    }
  }, [state.charIdx, state.deck, onChange, target.length])

  const typed = target.slice(0, state.charIdx)
  const done = state.charIdx >= target.length

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The model's completion appears one token at a time. So far: ${typed || '...'}. ${done ? 'Complete.' : ''}`}
        priority="normal"
        isInteracting={!done}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Completion output: ${typed}${done ? '' : ' (typing...)'}`}
      >
        <text
          x={VIEW_W / 2}
          y="30"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          MODEL OUTPUT · TOKEN-BY-TOKEN
        </text>

        {/* Terminal-ish container */}
        <rect
          x="48"
          y="74"
          width={VIEW_W - 96}
          height={VIEW_H - 170}
          fill="var(--color-ink)"
          fillOpacity="0.04"
          stroke="var(--color-graph-fade)"
          strokeWidth="0.8"
          rx="4"
        />

        {/* Query echo */}
        <text
          x="68"
          y="118"
          fontFamily="JetBrains Mono, monospace"
          fontSize="13"
          fill="var(--color-dim)"
        >
          {deck.query}
        </text>
        <text
          x="68"
          y="146"
          fontFamily="JetBrains Mono, monospace"
          fontSize="15"
          fill="var(--color-vermilion)"
        >
          →
          <tspan dx="6" fill="var(--color-ink)">
            {typed}
          </tspan>
          {!done && (
            <tspan
              fontFamily="JetBrains Mono, monospace"
              fill="var(--color-vermilion)"
            >
              ▍
            </tspan>
          )}
        </text>

        {/* Pattern explanation */}
        <text
          x={VIEW_W / 2}
          y="240"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the pattern in the prompt
        </text>
        <text
          x={VIEW_W / 2}
          y="260"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          is the program the model runs
        </text>

        {/* Tag line */}
        <line
          x1={VIEW_W / 2 - 40}
          y1="296"
          x2={VIEW_W / 2 + 40}
          y2="296"
          stroke="var(--color-vermilion)"
          strokeWidth="0.8"
        />
        <text
          x={VIEW_W / 2}
          y="320"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-vermilion)"
        >
          NO TRAINING · NO GRADIENTS · NO WEIGHT CHANGE
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 30}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          {done ? 'completion stable' : 'streaming…'}
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5b &mdash; The completion streams in
      </figcaption>
    </figure>
  )
}
