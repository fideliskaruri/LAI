import { useRef, useCallback } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  TOKENS,
  TOKEN_IDS,
  EMBEDDINGS,
  D_EMBED,
  fmt2,
  vermilionAlpha,
} from './tx'

/**
 * Act 1 — Tokens and embeddings.
 *
 *  Left  : the sentence "the cat sat on the mat" as a row of token chips,
 *          each with its integer id beneath. Tap any chip to select.
 *  Right : the selected token's 8-dim embedding as a bar chart. The bars
 *          are vermilion-tinted by sign and magnitude. Tap any token row
 *          on the right also selects it.
 *
 * Sync : co-mutating — the same `selected` index lives on both sides.
 */

export interface TokState {
  selected: number
}

export const INITIAL_TOK: TokState = { selected: 1 }

interface PaneProps {
  state: TokState
  onChange: (next: TokState) => void
}

export function LeftPane({ state, onChange }: PaneProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const setSelected = useCallback(
    (i: number) => {
      const n = TOKENS.length
      onChange({ selected: ((i % n) + n) % n })
    },
    [onChange],
  )

  useKeyNudge(
    svgRef,
    useCallback(
      (dx: number) => {
        if (dx !== 0) setSelected(state.selected + Math.sign(dx))
      },
      [state.selected, setSelected],
    ),
  )

  // Layout the token row.
  const TOK_Y = 270
  const CHIP_W = 70
  const CHIP_GAP = 12
  const total = TOKENS.length * CHIP_W + (TOKENS.length - 1) * CHIP_GAP
  const X0 = (VIEW_W - total) / 2

  const sel = state.selected
  const tok = TOKENS[sel]
  const tokId = TOKEN_IDS[sel]
  const narration = `Sentence: the cat sat on the mat. Six tokens. Selected token ${tok}, integer id ${tokId}.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="normal" />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Tokenization of a six-token sentence. ${narration}`}
        tabIndex={0}
      >
        {/* Header */}
        <text
          x={VIEW_W / 2}
          y={56}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ONE SENTENCE · SIX TOKENS
        </text>

        {/* Sentence */}
        <text
          x={VIEW_W / 2}
          y={140}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="22"
          fill="var(--color-ink)"
        >
          &ldquo;the cat sat on the mat&rdquo;
        </text>

        {/* Down arrow */}
        <line
          x1={VIEW_W / 2}
          y1={168}
          x2={VIEW_W / 2}
          y2={220}
          stroke="var(--color-vermilion)"
          strokeWidth="1.2"
        />
        <polygon
          points={`${VIEW_W / 2 - 5},${214} ${VIEW_W / 2 + 5},${214} ${VIEW_W / 2},${224}`}
          fill="var(--color-vermilion)"
        />
        <text
          x={VIEW_W / 2 + 16}
          y={196}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          tokenize
        </text>

        {/* Token chips */}
        {TOKENS.map((w, i) => {
          const x = X0 + i * (CHIP_W + CHIP_GAP)
          const active = i === sel
          return (
            <g
              key={i}
              tabIndex={0}
              role="button"
              aria-label={`Token ${w}, id ${TOKEN_IDS[i]}. ${active ? 'Selected.' : 'Click to select.'}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => setSelected(i)}
              onFocus={() => setSelected(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelected(i)
                }
              }}
              style={{ cursor: 'pointer' }}
              className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
            >
              <rect
                x={x}
                y={TOK_Y - 24}
                width={CHIP_W}
                height={44}
                rx={3}
                fill={active ? 'var(--color-vermilion)' : 'var(--color-cream)'}
                stroke="var(--color-vermilion)"
                strokeWidth={active ? 2 : 1.2}
              />
              <text
                x={x + CHIP_W / 2}
                y={TOK_Y - 4}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="15"
                fill={active ? 'var(--color-cream)' : 'var(--color-ink)'}
              >
                {w}
              </text>
              <text
                x={x + CHIP_W / 2}
                y={TOK_Y + 14}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fill={active ? 'var(--color-cream)' : 'var(--color-dim)'}
                fillOpacity={active ? 0.9 : 1}
              >
                {TOKEN_IDS[i]}
              </text>
            </g>
          )
        })}

        {/* Position labels */}
        {TOKENS.map((_, i) => {
          const x = X0 + i * (CHIP_W + CHIP_GAP) + CHIP_W / 2
          return (
            <text
              key={`p-${i}`}
              x={x}
              y={TOK_Y + 44}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill="var(--color-dim)"
            >
              pos {i}
            </text>
          )
        })}

        {/* Footer */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 36}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          integer ids · GPT-4&rsquo;s vocab has roughly one hundred thousand
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 14}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TAP A TOKEN · ARROWS STEP
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1a &mdash; Words become integers
      </figcaption>
    </figure>
  )
}

export function RightPane({ state, onChange }: PaneProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const setSelected = useCallback(
    (i: number) => {
      const n = TOKENS.length
      onChange({ selected: ((i % n) + n) % n })
    },
    [onChange],
  )

  useKeyNudge(
    svgRef,
    useCallback(
      (_dx: number, dy: number) => {
        if (dy !== 0) setSelected(state.selected - Math.sign(dy))
      },
      [state.selected, setSelected],
    ),
  )

  const sel = state.selected
  const emb = EMBEDDINGS[sel]
  const tok = TOKENS[sel]

  const narration = `Eight-dim embedding for token ${tok}. Values from ${emb.map(fmt2).join(', ')}.`

  // Bar chart layout.
  const BAR_W = 36
  const BAR_GAP = 8
  const totalW = D_EMBED * BAR_W + (D_EMBED - 1) * BAR_GAP
  const X0 = (VIEW_W - totalW) / 2
  const AXIS_Y = 290
  const MAX_BAR = 90 // half-height of the chart

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="normal" />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Eight-bar embedding chart for the token ${tok}. ${narration}`}
        tabIndex={0}
      >
        {/* Header */}
        <text
          x={VIEW_W / 2}
          y={56}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TOKEN &rarr; VECTOR
        </text>

        {/* Token chip on top */}
        <rect
          x={VIEW_W / 2 - 90}
          y={88}
          width={180}
          height={50}
          rx={3}
          fill="var(--color-vermilion)"
          stroke="var(--color-vermilion)"
        />
        <text
          x={VIEW_W / 2}
          y={114}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="18"
          fill="var(--color-cream)"
        >
          {tok}
        </text>
        <text
          x={VIEW_W / 2}
          y={130}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-cream)"
          fillOpacity={0.85}
        >
          id {TOKEN_IDS[sel]}
        </text>

        {/* Down arrow */}
        <line
          x1={VIEW_W / 2}
          y1={146}
          x2={VIEW_W / 2}
          y2={180}
          stroke="var(--color-vermilion)"
          strokeWidth="1.2"
        />
        <polygon
          points={`${VIEW_W / 2 - 5},${174} ${VIEW_W / 2 + 5},${174} ${VIEW_W / 2},${184}`}
          fill="var(--color-vermilion)"
        />
        <text
          x={VIEW_W / 2 + 12}
          y={166}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          embed
        </text>

        {/* Zero axis */}
        <line
          x1={X0 - 8}
          y1={AXIS_Y}
          x2={X0 + totalW + 8}
          y2={AXIS_Y}
          stroke="var(--color-graph-ink)"
          strokeOpacity={0.45}
          strokeWidth={0.8}
        />
        <text
          x={X0 - 14}
          y={AXIS_Y + 4}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--color-dim)"
        >
          0
        </text>

        {/* Bars */}
        {emb.map((v, i) => {
          const x = X0 + i * (BAR_W + BAR_GAP)
          const h = MAX_BAR * Math.min(1, Math.abs(v))
          const y = v >= 0 ? AXIS_Y - h : AXIS_Y
          const alpha = vermilionAlpha(v)
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={h}
                fill="var(--color-vermilion)"
                fillOpacity={0.35 + alpha * 0.5}
                stroke="var(--color-vermilion)"
                strokeWidth={0.8}
              />
              <text
                x={x + BAR_W / 2}
                y={AXIS_Y + 22}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="var(--color-dim)"
              >
                {`d${i}`}
              </text>
              <text
                x={x + BAR_W / 2}
                y={v >= 0 ? y - 6 : y + h + 12}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="var(--color-ink)"
              >
                {fmt2(v).trim()}
              </text>
            </g>
          )
        })}

        {/* Dimension caption */}
        <text
          x={VIEW_W / 2}
          y={400}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          d = {D_EMBED} shown · d
          <tspan baselineShift="sub" fontSize="9">model</tspan> = 768 in GPT-2
        </text>

        {/* Tiny token strip — clickable mirror of the left pane */}
        <g transform={`translate(0, 432)`}>
          {TOKENS.map((w, i) => {
            const sx = VIEW_W / 2 - (TOKENS.length * 36) / 2 + i * 36
            const active = i === sel
            return (
              <g
                key={i}
                onClick={() => setSelected(i)}
                onMouseEnter={() => setSelected(i)}
                onFocus={() => setSelected(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected(i)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Token ${w}.`}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={sx}
                  y={0}
                  width={32}
                  height={20}
                  rx={2}
                  fill={active ? 'var(--color-vermilion)' : 'var(--color-cream)'}
                  stroke="var(--color-vermilion)"
                  strokeWidth={active ? 1.6 : 0.8}
                />
                <text
                  x={sx + 16}
                  y={14}
                  textAnchor="middle"
                  fontFamily="Source Serif 4, Georgia, serif"
                  fontStyle="italic"
                  fontSize="10"
                  fill={active ? 'var(--color-cream)' : 'var(--color-ink)'}
                >
                  {w}
                </text>
              </g>
            )
          })}
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 8}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ONE VECTOR PER TOKEN
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1b &mdash; The embedding for &ldquo;{tok}&rdquo;
      </figcaption>
    </figure>
  )
}
