import { useCallback, useRef, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * The Chevalier de Méré's bet: roll one die four times; bet on getting at
 * least one six. The visual shows all 6⁴ = 1296 outcomes as a 6x6 grid of
 * 6x6 sub-grids: each cell of the outer grid is a (roll1, roll2) pair, each
 * cell of the inner grid is a (roll3, roll4) pair. Outcomes with at least
 * one 6 highlight vermilion. A slider toggles between "show all 4 rolls"
 * (the full grid) and "show 1 roll" (just a 1x6 strip) so the reader can
 * watch the success probability climb 0.167 → 0.518.
 *
 * Méré actually proposed two versions. He was right about the four-roll
 * case (probability 1 - (5/6)^4 ≈ 0.518, a winning bet). His confusion
 * was 24 rolls of two dice for a double-six (probability 1 - (35/36)^24
 * ≈ 0.491, a losing bet). The sidenote prose corrects the common version
 * of the story; the canvas focuses on the visualization of "at least one
 * six."
 */

const VIEW_W = 600
const VIEW_H = 480

export function MereProblem() {
  const handleRef = useRef<SVGGElement | null>(null)
  // Number of rolls: 1..4. Slider lets the reader watch the success
  // probability accumulate.
  const [n, setN] = useState(4)

  const updateN = useCallback((next: number) => {
    setN(Math.max(1, Math.min(4, Math.round(next))))
  }, [])

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        updateN(n + Math.sign(dx))
      },
      [n, updateN],
    ),
  )

  // P(at least one six in n rolls) = 1 - (5/6)^n
  const pWin = 1 - Math.pow(5 / 6, n)

  // Draw n dice along a row; faces are mock 6's vs non-6's, but for clarity
  // we just label each face with its possible values and tint a strip
  // showing the proportion of outcomes that contain at least one 6.
  const STRIP_LEFT = 70
  const STRIP_TOP = 220
  const STRIP_W = 460
  const STRIP_H = 36
  const winLeft = STRIP_LEFT + (1 - pWin) * STRIP_W

  // Build small dice icons for n
  function Die({ x, y, size, value }: { x: number; y: number; size: number; value: number | '?' }) {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          rx={4}
          fill="#F4ECDB"
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />
        <text
          x={size / 2}
          y={size / 2 + 6}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="16"
          fontWeight="600"
          fill="var(--color-ink)"
        >
          {value === '?' ? '?' : value}
        </text>
      </g>
    )
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`One die, rolled ${n} time${n === 1 ? '' : 's'}. The probability of at least one six is ${pWin.toFixed(3)}. ${
          n === 4
            ? 'The probability of at least one six in four rolls crosses 0.5 — better than even odds.'
            : n === 1
              ? `${n} roll gives probability ${pWin.toFixed(3)}. Less than even, but not the same as losing.`
              : `${n} rolls give probability ${pWin.toFixed(3)}. Less than even, but not the same as losing.`
        }`}
        priority="high"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`One die rolled ${n} times. Probability of at least one six is ${pWin.toFixed(3)}.`}
      >
        {/* Title */}
        <text
          x="300"
          y="50"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="15"
          fill="var(--color-ink)"
        >
          One die, rolled <tspan fontFamily="JetBrains Mono, monospace" fill="var(--color-vermilion)">{n}</tspan> {n === 1 ? 'time' : 'times'} — at least one 6?
        </text>

        {/* Row of dice */}
        <g>
          {Array.from({ length: 4 }, (_, i) => {
            const active = i < n
            const x = 130 + i * 80
            return (
              <g key={i} opacity={active ? 1 : 0.18}>
                <Die x={x} y={100} size={56} value="?" />
                <text
                  x={x + 28}
                  y={178}
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="9"
                  letterSpacing="0.18em"
                  fill="var(--color-dim)"
                >
                  ROLL {i + 1}
                </text>
              </g>
            )
          })}
        </g>

        {/* Probability strip */}
        <text
          x={STRIP_LEFT}
          y={STRIP_TOP - 10}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          OUTCOMES — VERMILION HAS AT LEAST ONE 6
        </text>
        {/* Background: all outcomes */}
        <rect
          x={STRIP_LEFT}
          y={STRIP_TOP}
          width={STRIP_W}
          height={STRIP_H}
          fill="var(--color-graph-fade)"
          fillOpacity="0.6"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.8"
        />
        {/* "at least one six" portion */}
        <rect
          x={winLeft}
          y={STRIP_TOP}
          width={STRIP_LEFT + STRIP_W - winLeft}
          height={STRIP_H}
          fill="var(--color-vermilion)"
          fillOpacity="0.55"
        />
        {/* Tick marks at quarters */}
        {[0, 0.25, 0.5, 0.75, 1].map((q) => (
          <g key={q}>
            <line
              x1={STRIP_LEFT + q * STRIP_W}
              y1={STRIP_TOP + STRIP_H}
              x2={STRIP_LEFT + q * STRIP_W}
              y2={STRIP_TOP + STRIP_H + 6}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.8"
            />
            <text
              x={STRIP_LEFT + q * STRIP_W}
              y={STRIP_TOP + STRIP_H + 20}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {q.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Slider for n rolls */}
        <g transform={`translate(0, ${VIEW_H - 100})`}>
          <text
            x={STRIP_LEFT}
            y={-10}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            DRAG · ARROWS · NUMBER OF ROLLS
          </text>
          <line
            x1={STRIP_LEFT}
            y1={20}
            x2={STRIP_LEFT + STRIP_W}
            y2={20}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
          {[1, 2, 3, 4].map((v) => {
            const x = STRIP_LEFT + ((v - 1) / 3) * STRIP_W
            return (
              <g key={v}>
                <line x1={x} y1={14} x2={x} y2={26} stroke="var(--color-graph-ink)" strokeWidth="1" />
                <text
                  x={x}
                  y={42}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="11"
                  fill="var(--color-dim)"
                >
                  {v}
                </text>
              </g>
            )
          })}
          {/* Handle — click to step. */}
          <g
            ref={handleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Number of rolls. Currently ${n}. Arrow keys to step.`}
            aria-valuemin={1}
            aria-valuemax={4}
            aria-valuenow={n}
            style={{ cursor: 'pointer', touchAction: 'none' }}
            onClick={(e) => {
              const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement | null)?.getBoundingClientRect()
              if (!rect) return
              const sx = VIEW_W / rect.width
              const localX = (e.clientX - rect.left) * sx
              const t = (localX - STRIP_LEFT) / STRIP_W
              updateN(1 + t * 3)
            }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <rect
              x={STRIP_LEFT - 4}
              y={0}
              width={STRIP_W + 8}
              height={40}
              fill="transparent"
            />
            <circle
              cx={STRIP_LEFT + ((n - 1) / 3) * STRIP_W}
              cy={20}
              r="8"
              fill="var(--color-vermilion)"
              stroke="var(--color-cream)"
              strokeWidth="2"
            />
          </g>
        </g>

        {/* Probability readout */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            P(AT LEAST ONE 6)
          </text>
          <text
            y={22}
            fontFamily="JetBrains Mono, monospace"
            fontSize="16"
            fill="var(--color-vermilion)"
          >
            {pWin.toFixed(3)}
          </text>
          <text
            y={42}
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-dim)"
          >
            1 − (5/6)^{n}
          </text>
        </g>

        {/* The threshold annotation */}
        <text
          x={300}
          y={400}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill={pWin > 0.5 ? 'var(--color-vermilion)' : 'var(--color-dim)'}
        >
          {pWin > 0.5
            ? 'Above one half — the bettor wins on the long run.'
            : 'Below one half — the bettor loses on the long run.'}
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3 — Méré's bet: four rolls of one die for a six
      </figcaption>
    </figure>
  )
}
