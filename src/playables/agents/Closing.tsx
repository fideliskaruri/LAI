import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H, TRAJECTORY } from './agents'

/**
 * Act 7 — closing.
 *
 *  Left  : a diagonal trajectory diagram from bottom-left (Stevin's chain,
 *          1586) to top-right (2026). Tick marks at the chapters of this
 *          book; vermilion accent dots at the load-bearing moments. The
 *          right endpoint is anchored to today's frontier.
 *  Right : a "what's next for the reader" card. No forward thread to a
 *          next chapter — this is the last one. Instead, four
 *          invitations: build something, read MML, read Sutton & Barto,
 *          watch the safety community.
 *
 * Static.
 */

const PAD_L = 60
const PAD_R = 60
const PAD_T = 110
const PAD_B = 110
const W = VIEW_W - PAD_L - PAD_R
const H = VIEW_H - PAD_T - PAD_B

const stopX = (t: number) => PAD_L + t * W
// Diagonal: as t goes 0 → 1, y goes BOTTOM → TOP.
const stopY = (t: number) => PAD_T + H - t * H

export function LeftPane() {
  // The diagonal axis ends.
  const x0 = stopX(0)
  const y0 = stopY(0)
  const x1 = stopX(1)
  const y1 = stopY(1)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A diagonal trajectory diagram. The bottom-left endpoint is 1586, the year Simon Stevin sketched a chain on a frictionless wedge — the first moment in this book where someone thought a vector was a sensible object. The top-right endpoint is today: 2026. Twelve tick marks between them mark the chapters the reader has just walked through, from Newton in 1666 to ReAct in 2022 to general-purpose agents now."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A diagonal trajectory from 1586 in the bottom-left to 2026 in the top-right, with tick marks at the chapters of this book."
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
          440 YEARS · ONE BOOK · YOU
        </text>

        {/* Diagonal axis */}
        <line
          x1={x0}
          y1={y0}
          x2={x1}
          y2={y1}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
        />

        {/* Tick stops */}
        {TRAJECTORY.map((stop, i) => {
          const x = stopX(stop.t)
          const y = stopY(stop.t)
          const isStart = i === 0
          const isEnd = i === TRAJECTORY.length - 1
          const accent = isStart || isEnd || stop.ch === 26
          // Tick rendered perpendicular to the diagonal.
          const dx = (x1 - x0) / Math.hypot(x1 - x0, y1 - y0)
          const dy = (y1 - y0) / Math.hypot(x1 - x0, y1 - y0)
          // Perp: (-dy, dx)
          const tickLen = 7
          const tx1 = x + dy * tickLen
          const ty1 = y - dx * tickLen
          const tx2 = x - dy * tickLen
          const ty2 = y + dx * tickLen
          // Label offset
          const labelOff = 20
          const lx = x - dy * labelOff
          const ly = y + dx * labelOff
          return (
            <g key={i}>
              <line
                x1={tx1}
                y1={ty1}
                x2={tx2}
                y2={ty2}
                stroke={
                  accent ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
                }
                strokeWidth={accent ? 1.6 : 1}
              />
              <circle
                cx={x}
                cy={y}
                r={accent ? 4 : 2.5}
                fill={accent ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
              />
              {(isStart || isEnd || stop.ch === 19 || stop.ch === 22 || stop.ch === 26) && (
                <>
                  <text
                    x={lx}
                    y={ly}
                    textAnchor={isEnd ? 'end' : 'start'}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    fill="var(--color-dim)"
                  >
                    {stop.year}
                  </text>
                  <text
                    x={lx}
                    y={ly + 14}
                    textAnchor={isEnd ? 'end' : 'start'}
                    fontFamily="Source Serif 4, Georgia, serif"
                    fontStyle="italic"
                    fontSize="11"
                    fill={
                      accent ? 'var(--color-vermilion)' : 'var(--color-ink)'
                    }
                  >
                    {stop.label}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {/* Endpoint labels */}
        <text
          x={x0 - 8}
          y={y0 + 28}
          textAnchor="end"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          a chain on a wedge
        </text>
        <text
          x={x1 + 8}
          y={y1 - 12}
          textAnchor="start"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          you, reading this
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 40}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          a steep curve, walked one chapter at a time
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7a &mdash; The arc of the whole book
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  const invitations = [
    {
      tag: 'BUILD',
      body: 'Pick a small thing. Wire a ReAct loop to a tool. Watch it fail; reflect; try again.',
    },
    {
      tag: 'READ · MML',
      body: 'Open Mathematics for Machine Learning. It should feel readable now.',
    },
    {
      tag: 'READ · SUTTON & BARTO',
      body: 'Reinforcement Learning: An Introduction. The decision-making half of the field.',
    },
    {
      tag: 'WATCH',
      body: 'Subscribe to the safety teams. Anthropic, OpenAI, DeepMind — and the broader community.',
    },
  ]

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A closing card. No next chapter — this is the last one. Instead, four invitations to the reader: build something small, read Mathematics for Machine Learning, read Sutton and Barto, and watch the safety community. The field is open and the trajectory is steep."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A closing card with four invitations for the reader."
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />

        <text
          x={VIEW_W / 2}
          y="44"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          WHAT&rsquo;S NEXT · FOR YOU
        </text>

        <text
          x={VIEW_W / 2}
          y="84"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-ink)"
        >
          A book ends. The field doesn&rsquo;t.
        </text>

        {invitations.map((inv, i) => {
          const y = 130 + i * 76
          return (
            <g key={i}>
              <rect
                x="40"
                y={y}
                width={VIEW_W - 80}
                height="60"
                rx="3"
                fill="var(--color-cream)"
                stroke="var(--color-vermilion)"
                strokeWidth="1.2"
              />
              <text
                x="56"
                y={y + 22}
                fontFamily="Inter, sans-serif"
                fontSize="9"
                letterSpacing="0.22em"
                fill="var(--color-vermilion)"
              >
                {inv.tag}
              </text>
              <text
                x="56"
                y={y + 46}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="13"
                fill="var(--color-ink)"
              >
                {clip(inv.body, 58)}
              </text>
            </g>
          )
        })}

        <line
          x1={VIEW_W / 2 - 40}
          y1={VIEW_H - 56}
          x2={VIEW_W / 2 + 40}
          y2={VIEW_H - 56}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 30}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          thank you for walking the whole arc with me.
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7b &mdash; A door, not a wall
      </figcaption>
    </figure>
  )
}

function clip(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1) + '…'
}
