import { useCallback, useEffect, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import {
  VIEW_W,
  VIEW_H,
  PRETRAIN_CORPUS,
  PRETRAIN_LOG_T_MIN,
  PRETRAIN_LOG_T_MAX,
  lossAtTokens,
  fmt2,
} from './lm'

/**
 * Act 2 — pretraining. left-drives-right.
 *
 *  Left  : a slab of corpus text. A vermilion underline marks the LM's
 *          "current prediction" cursor, advancing one word per tick when
 *          playing. The play/pause button on the left advances the cursor.
 *  Right : the cross-entropy loss curve, log-tokens on x, bits-per-token on
 *          y. A vermilion dot slides along the curve as the cursor advances.
 */

export interface PretrainState {
  /** Index of the current cursor position into the joined corpus tokens. */
  cursor: number
  /** Whether the cursor is advancing automatically. */
  playing: boolean
}

export const INITIAL_PRETRAIN: PretrainState = { cursor: 0, playing: false }

// Flatten corpus into a single token sequence so cursor math is easy.
const TOKENS: string[] = []
const LINE_OF_TOKEN: number[] = []
PRETRAIN_CORPUS.forEach((line, i) => {
  const ts = line.split(/(\s+)/).filter(Boolean)
  ts.forEach((t) => {
    TOKENS.push(t)
    LINE_OF_TOKEN.push(i)
  })
})

const TOTAL_TOKENS = TOKENS.length

// Map cursor index to a synthetic "training-tokens-seen" log scale.
function cursorToTokens(cursor: number): number {
  const frac = TOTAL_TOKENS === 0 ? 0 : cursor / TOTAL_TOKENS
  const logT = PRETRAIN_LOG_T_MIN + frac * (PRETRAIN_LOG_T_MAX - PRETRAIN_LOG_T_MIN)
  return Math.pow(10, logT)
}

/* ============================================================== */
/* LEFT PANE — scrolling corpus with cursor                         */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: PretrainState
  onChange: (s: PretrainState) => void
}) {
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  const advance = useCallback(() => {
    onChange({
      cursor: Math.min(TOTAL_TOKENS - 1, state.cursor + 1),
      playing: state.cursor + 1 < TOTAL_TOKENS - 1 ? state.playing : false,
    })
  }, [state.cursor, state.playing, onChange])

  // Autoplay loop — advance one token every 200ms while playing.
  useEffect(() => {
    if (!state.playing) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      return
    }
    const TICK_MS = 160
    const loop = (t: number) => {
      if (lastTickRef.current === 0) lastTickRef.current = t
      if (t - lastTickRef.current >= TICK_MS) {
        lastTickRef.current = t
        advance()
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastTickRef.current = 0
    }
  }, [state.playing, advance])

  const togglePlay = () => {
    if (state.cursor >= TOTAL_TOKENS - 1) {
      onChange({ cursor: 0, playing: true })
    } else {
      onChange({ ...state, playing: !state.playing })
    }
  }
  const reset = () => onChange({ cursor: 0, playing: false })

  const currentLine = LINE_OF_TOKEN[state.cursor] ?? 0
  // Show a sliding window of ~7 lines around the cursor.
  const WINDOW = 7
  const start = Math.max(0, Math.min(PRETRAIN_CORPUS.length - WINDOW, currentLine - 2))
  const visible = PRETRAIN_CORPUS.slice(start, start + WINDOW)

  // Compute the token offset within the visible window for the underline.
  const cursorWord = TOKENS[state.cursor] ?? ''
  const tokensInLine = (lineIdx: number) =>
    PRETRAIN_CORPUS[lineIdx].split(/(\s+)/).filter(Boolean)

  // Within currentLine, find the index of the cursor token.
  let tokenIdxInLine = 0
  {
    let k = state.cursor
    while (k > 0 && LINE_OF_TOKEN[k - 1] === currentLine) {
      k--
      tokenIdxInLine++
    }
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A scrolling slab of pre-training text. The cursor sits on the word "${cursorWord.trim() || '·'}". It advances one word at a time, and at every step the language model is asked to predict the next word.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A scrolling corpus slab with a vermilion underline marking the language model's current prediction position."
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
          CORPUS · PREDICT NEXT WORD · BILLIONS OF TIMES
        </text>

        {/* Corpus slab */}
        <rect
          x="36"
          y="56"
          width={VIEW_W - 72}
          height={VIEW_H - 160}
          fill="var(--color-paper)"
          stroke="var(--color-graph-fade)"
          strokeWidth="0.8"
        />

        {visible.map((line, vi) => {
          const lineIdx = start + vi
          const tokens = tokensInLine(lineIdx)
          const y = 86 + vi * 36
          const isCurrent = lineIdx === currentLine
          const isMono = /[{}()<>;=]|return |def |function |SELECT|console|@misc/.test(line)

          return (
            <g key={vi}>
              {/* Underline under the cursor word */}
              {isCurrent && (
                <CursorUnderline
                  tokens={tokens}
                  tokenIdx={tokenIdxInLine}
                  y={y}
                  mono={isMono}
                />
              )}
              <text
                x="56"
                y={y}
                fontFamily={
                  isMono
                    ? 'JetBrains Mono, monospace'
                    : 'Source Serif 4, Georgia, serif'
                }
                fontSize={isMono ? 11 : 14}
                fill={isCurrent ? 'var(--color-paper-ink)' : 'var(--color-dim)'}
                fillOpacity={isCurrent ? 1 : 0.7}
              >
                {line.length > 64 ? line.slice(0, 62) + '…' : line}
              </text>
            </g>
          )
        })}

        {/* Play / reset controls (visual; clickable via overlay rects) */}
        <g transform={`translate(${VIEW_W / 2 - 90}, ${VIEW_H - 60})`}>
          <rect
            x="0"
            y="-22"
            width="92"
            height="36"
            rx="3"
            fill="var(--color-vermilion)"
            style={{ cursor: 'pointer' }}
            onClick={togglePlay}
          />
          <text
            x="46"
            y="2"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="12"
            fontWeight="500"
            fill="var(--color-cream)"
            style={{ pointerEvents: 'none' }}
          >
            {state.playing ? '❚❚ pause' : '▶ play'}
          </text>

          <rect
            x="108"
            y="-22"
            width="72"
            height="36"
            rx="3"
            fill="none"
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
            style={{ cursor: 'pointer' }}
            onClick={reset}
          />
          <text
            x="144"
            y="2"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="12"
            fill="var(--color-ink)"
            style={{ pointerEvents: 'none' }}
          >
            ↺ reset
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2a &mdash; The cursor advances; the model predicts
      </figcaption>
    </figure>
  )
}

/**
 * Render an underline directly beneath the token at `tokenIdx` in `tokens`.
 * We render the prefix invisibly to measure its width using SVG textLength.
 */
function CursorUnderline({
  tokens,
  tokenIdx,
  y,
  mono,
}: {
  tokens: string[]
  tokenIdx: number
  y: number
  mono: boolean
}) {
  const prefix = tokens.slice(0, tokenIdx).join('')
  const word = tokens[tokenIdx] ?? ''
  // Approximate character widths in the chosen font.
  const charW = mono ? 6.6 : 7.2
  const xStart = 56 + prefix.length * charW
  const wWidth = Math.max(8, word.length * charW)
  return (
    <line
      x1={xStart}
      y1={y + 4}
      x2={xStart + wWidth}
      y2={y + 4}
      stroke="var(--color-vermilion)"
      strokeWidth="2"
    />
  )
}

/* ============================================================== */
/* RIGHT PANE — loss curve                                          */
/* ============================================================== */

const CHART_LEFT = 76
const CHART_RIGHT = VIEW_W - 50
const CHART_TOP = 80
const CHART_BOTTOM = VIEW_H - 90

const LOSS_MIN = 1.6
const LOSS_MAX = 8.0

const logTtoX = (logT: number) =>
  CHART_LEFT +
  ((logT - PRETRAIN_LOG_T_MIN) / (PRETRAIN_LOG_T_MAX - PRETRAIN_LOG_T_MIN)) *
    (CHART_RIGHT - CHART_LEFT)
const lossToY = (l: number) =>
  CHART_BOTTOM - ((l - LOSS_MIN) / (LOSS_MAX - LOSS_MIN)) * (CHART_BOTTOM - CHART_TOP)

const CURVE_PATH = (() => {
  const pts: string[] = []
  const N = 60
  for (let i = 0; i <= N; i++) {
    const logT = PRETRAIN_LOG_T_MIN + (i / N) * (PRETRAIN_LOG_T_MAX - PRETRAIN_LOG_T_MIN)
    const tokens = Math.pow(10, logT)
    const l = lossAtTokens(tokens)
    pts.push(`${i === 0 ? 'M' : 'L'}${logTtoX(logT).toFixed(2)},${lossToY(l).toFixed(2)}`)
  }
  return pts.join(' ')
})()

export function RightPane({ state }: { state: PretrainState }) {
  const tokens = cursorToTokens(state.cursor)
  const logT = Math.log10(tokens)
  const loss = lossAtTokens(tokens)

  const dotX = logTtoX(logT)
  const dotY = lossToY(loss)

  const tokenLabel =
    tokens < 1e9
      ? `${(tokens / 1e6).toFixed(0)}M tokens`
      : tokens < 1e12
        ? `${(tokens / 1e9).toFixed(1)}B tokens`
        : `${(tokens / 1e12).toFixed(1)}T tokens`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The pre-training loss curve. After ${tokenLabel}, cross-entropy is around ${fmt2(loss).trim()} bits per token.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A loss curve, log training tokens on the x-axis, bits per token on the y-axis. Current position: ${tokenLabel}, ${fmt2(loss).trim()} bits.`}
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
          CROSS-ENTROPY LOSS · BITS PER TOKEN
        </text>

        {/* Axes */}
        <line
          x1={CHART_LEFT}
          y1={CHART_TOP}
          x2={CHART_LEFT}
          y2={CHART_BOTTOM}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />
        <line
          x1={CHART_LEFT}
          y1={CHART_BOTTOM}
          x2={CHART_RIGHT}
          y2={CHART_BOTTOM}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />

        {/* x-tick labels (log scale) */}
        {[6, 8, 10, 12].map((lt) => (
          <g key={lt}>
            <line
              x1={logTtoX(lt)}
              y1={CHART_BOTTOM}
              x2={logTtoX(lt)}
              y2={CHART_BOTTOM + 5}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.8"
            />
            <text
              x={logTtoX(lt)}
              y={CHART_BOTTOM + 20}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              10^{lt}
            </text>
          </g>
        ))}
        <text
          x={(CHART_LEFT + CHART_RIGHT) / 2}
          y={CHART_BOTTOM + 38}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          tokens seen (log)
        </text>

        {/* y-tick labels */}
        {[2, 4, 6, 8].map((l) => (
          <g key={l}>
            <line
              x1={CHART_LEFT - 5}
              y1={lossToY(l)}
              x2={CHART_LEFT}
              y2={lossToY(l)}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.8"
            />
            <text
              x={CHART_LEFT - 10}
              y={lossToY(l) + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {l.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Curve */}
        <path
          d={CURVE_PATH}
          fill="none"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.6"
        />

        {/* Asymptote */}
        <line
          x1={CHART_LEFT}
          y1={lossToY(1.85)}
          x2={CHART_RIGHT}
          y2={lossToY(1.85)}
          stroke="var(--color-vermilion)"
          strokeWidth="0.8"
          strokeDasharray="3 3"
          opacity="0.55"
        />
        <text
          x={CHART_RIGHT - 4}
          y={lossToY(1.85) - 6}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-vermilion)"
        >
          irreducible loss
        </text>

        {/* Travelling dot */}
        <circle
          cx={dotX}
          cy={dotY}
          r="6"
          fill="var(--color-vermilion)"
          stroke="var(--color-cream)"
          strokeWidth="2"
        />
        <text
          x={dotX + 12}
          y={dotY - 4}
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-vermilion)"
        >
          {fmt2(loss).trim()} bits
        </text>
        <text
          x={dotX + 12}
          y={dotY + 12}
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-dim)"
        >
          {tokenLabel}
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
          one trick, billions of times
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2b &mdash; The loss falls, slowly and predictably
      </figcaption>
    </figure>
  )
}
