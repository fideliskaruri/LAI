import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Act 4 — Two eigenvectors.
 *
 * Same matrix M = [[2, 1], [1, 2]]. This time both eigen-lines are drawn
 * faintly so the reader can see there are two of them. Drag v toward each
 * in turn. The active eigen-line lights up; the corresponding λ shows.
 *
 * Phase 5 a11y: handle tab-focusable; arrow keys nudge 0.1 / Shift+arrow 1.
 * CanvasNarrative names which eigen-line is currently engaged.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const M00 = 2
const M01 = 1
const M10 = 1
const M11 = 2

const fmt = (n: number) => n.toFixed(2)

// Eigenvectors of M (normalized) and their eigenvalues
// (1, 1)/√2 → λ = 3 ; (1, −1)/√2 → λ = 1
const EIGEN = [
  { name: 'λ₁ = 3', value: 3, x: 1 / Math.SQRT2, y: 1 / Math.SQRT2 },
  { name: 'λ₂ = 1', value: 1, x: 1 / Math.SQRT2, y: -1 / Math.SQRT2 },
]

const PARALLEL_THRESHOLD = 0.06

function arrowHead(from: { x: number; y: number }, to: { x: number; y: number }) {
  const ang = Math.atan2(to.y - from.y, to.x - from.x)
  const headLen = 13
  const headWide = 6
  return {
    p1: {
      x: to.x - headLen * Math.cos(ang) + headWide * Math.cos(ang + Math.PI / 2),
      y: to.y - headLen * Math.sin(ang) + headWide * Math.sin(ang + Math.PI / 2),
    },
    p2: {
      x: to.x - headLen * Math.cos(ang) - headWide * Math.cos(ang + Math.PI / 2),
      y: to.y - headLen * Math.sin(ang) - headWide * Math.sin(ang + Math.PI / 2),
    },
  }
}

function toSvg(mx: number, my: number) {
  return { x: ORIGIN_X + mx * UNIT, y: ORIGIN_Y - my * UNIT }
}

function applyM(x: number, y: number) {
  return { x: M00 * x + M01 * y, y: M10 * x + M11 * y }
}

export function TwoEigenvectors() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const [v, setV] = useState({ x: 1.6, y: -0.4 })
  const startVRef = useRef<typeof v | null>(null)

  const scale = () => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { sx: 1, sy: 1 }
    return { sx: VIEW_W / rect.width, sy: VIEW_H / rect.height }
  }

  const bind = useDrag(({ first, movement: [mx, my] }) => {
    if (first) startVRef.current = { ...v }
    const start = startVRef.current
    if (!start) return
    const { sx, sy } = scale()
    const nx = start.x + (mx * sx) / UNIT
    const ny = start.y - (my * sy) / UNIT
    setV({
      x: Math.max(-4.5, Math.min(4.5, nx)),
      y: Math.max(-3, Math.min(3, ny)),
    })
  })

  const nudgeAmount = (d: number) => {
    if (d === 0) return 0
    return Math.abs(d) >= 10 ? Math.sign(d) * 1 : Math.sign(d) * 0.1
  }
  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number, dy: number) => {
        setV((cur) => {
          const nx = cur.x + nudgeAmount(dx)
          const ny = cur.y + nudgeAmount(dy)
          return {
            x: Math.max(-4.5, Math.min(4.5, nx)),
            y: Math.max(-3, Math.min(3, ny)),
          }
        })
      },
      [],
    ),
  )

  const mv = applyM(v.x, v.y)
  const lenV = Math.hypot(v.x, v.y)

  // For each eigenline, compute how aligned v is. Take the smaller cross
  // product as the active line (the one the user is closer to).
  const aligns = EIGEN.map((e) => {
    const cross = Math.abs(v.x * e.y - v.y * e.x)
    const sinAngle = lenV > 1e-6 ? cross / lenV : 1
    return sinAngle
  })
  const activeIdx = aligns[0] <= aligns[1] ? 0 : 1
  const activeAlign = aligns[activeIdx]
  const onActive = activeAlign < PARALLEL_THRESHOLD && lenV > 0.15

  const O = { x: ORIGIN_X, y: ORIGIN_Y }
  const V = toSvg(v.x, v.y)
  const MV = toSvg(mv.x, mv.y)
  const headV = arrowHead(O, V)
  const headMv = arrowHead(O, MV)

  const narrationText = onActive
    ? `On eigen-line ${activeIdx === 0 ? 'one' : 'two'}. λ equals ${EIGEN[activeIdx].value}. Mv is exactly ${EIGEN[activeIdx].value} times v.`
    : `Between the two eigen-lines. Closer to ${EIGEN[activeIdx].name}.`
  const narrationPriority: 'normal' | 'high' = onActive ? 'high' : 'normal'

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} priority={narrationPriority} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Two eigen-lines drawn through the origin. v is at ${fmt(v.x)}, ${fmt(v.y)}. ${onActive ? `It is currently on the eigen-line with eigenvalue ${EIGEN[activeIdx].value}.` : 'It is currently between the two eigen-lines.'}`}
      >
        <ReferenceGrid />
        <Axes />

        {/* Both eigen-lines, faint by default; the active one lights up */}
        {EIGEN.map((e, i) => {
          const a = toSvg(-6 * e.x, -6 * e.y)
          const b = toSvg(6 * e.x, 6 * e.y)
          const active = i === activeIdx && onActive
          return (
            <g key={i}>
              {active && (
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="var(--color-vermilion)"
                  strokeOpacity="0.18"
                  strokeWidth="14"
                />
              )}
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--color-vermilion)"
                strokeOpacity={active ? 0.7 : 0.28}
                strokeWidth={active ? 2.2 : 1.4}
                strokeDasharray={active ? undefined : '6 4'}
              />
              {/* Eigen-line label, sat at the end of the line */}
              <text
                x={b.x + (e.x > 0 ? 6 : -6)}
                y={b.y + (e.y > 0 ? -6 : 14)}
                textAnchor={e.x > 0 ? 'start' : 'end'}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="13"
                fill="var(--color-vermilion)"
                opacity={active ? 1 : 0.55}
              >
                {e.name}
              </text>
            </g>
          )
        })}

        {/* Mv — ghost */}
        <line
          x1={O.x}
          y1={O.y}
          x2={MV.x}
          y2={MV.y}
          stroke="var(--color-graph-ink)"
          strokeOpacity="0.45"
          strokeWidth="1.8"
        />
        <polygon
          points={`${MV.x},${MV.y} ${headMv.p1.x},${headMv.p1.y} ${headMv.p2.x},${headMv.p2.y}`}
          fill="var(--color-graph-ink)"
          fillOpacity="0.45"
        />
        <text
          x={MV.x + 10}
          y={MV.y + (mv.y >= 0 ? -10 : 18)}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-graph-ink)"
          opacity="0.6"
        >
          Mv
        </text>

        {/* v */}
        <line
          x1={O.x}
          y1={O.y}
          x2={V.x}
          y2={V.y}
          stroke="var(--color-vermilion)"
          strokeWidth="3"
        />
        <polygon
          points={`${V.x},${V.y} ${headV.p1.x},${headV.p1.y} ${headV.p2.x},${headV.p2.y}`}
          fill="var(--color-vermilion)"
        />
        <text
          x={V.x + 10}
          y={V.y + (v.y >= 0 ? -10 : 18)}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-vermilion)"
        >
          v
        </text>

        {/* Tip handle */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="button"
          aria-label={`Vector v. Currently ${fmt(v.x)}, ${fmt(v.y)}. Drag toward either eigen-line.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={V.x} cy={V.y} r="22" fill="transparent" />
          <circle
            cx={V.x}
            cy={V.y}
            r="7"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        </g>

        {/* Eigenvalue readouts — both shown side-by-side */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            EIGENVALUES OF M
          </text>
          <text
            y="22"
            fontFamily="JetBrains Mono, monospace"
            fontSize="14"
            fill={onActive && activeIdx === 0 ? 'var(--color-vermilion)' : 'var(--color-ink)'}
          >
            λ₁ = 3   ·   v₁ ∝ (1,  1)
          </text>
          <text
            y="44"
            fontFamily="JetBrains Mono, monospace"
            fontSize="14"
            fill={onActive && activeIdx === 1 ? 'var(--color-vermilion)' : 'var(--color-ink)'}
          >
            λ₂ = 1   ·   v₂ ∝ (1, −1)
          </text>
        </g>

        {/* Live status — vermilion when on an eigen-line */}
        <g transform={`translate(${VIEW_W - 240}, 36)`}>
          <rect
            width="220"
            height="48"
            fill={onActive ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
            fillOpacity={onActive ? 0.15 : 0.6}
          />
          <text
            x="14"
            y="20"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill={onActive ? 'var(--color-vermilion)' : 'var(--color-dim)'}
          >
            {onActive ? 'EIGEN-LINE ENGAGED' : 'OFF THE EIGEN-LINES'}
          </text>
          <text
            x="14"
            y="40"
            fontFamily="JetBrains Mono, monospace"
            fontSize="14"
            fill={onActive ? 'var(--color-vermilion)' : 'var(--color-dim)'}
          >
            {onActive ? `λ = ${EIGEN[activeIdx].value}` : `closer to ${EIGEN[activeIdx].name}`}
          </text>
        </g>

        <text
          x="32"
          y={VIEW_H - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TWO EIGEN-LINES  ·  TRY DRAGGING ONTO EACH IN TURN
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3 &mdash; A 2&times;2 matrix typically has two eigen-directions
      </figcaption>
    </figure>
  )
}

function ReferenceGrid() {
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => {
        const x = ORIGIN_X + (i - 6) * UNIT
        return (
          <line
            key={`v-${i}`}
            x1={x}
            y1="20"
            x2={x}
            y2={VIEW_H - 20}
            stroke="var(--color-graph-fade)"
            strokeWidth="0.5"
          />
        )
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const y = ORIGIN_Y + (i - 4) * UNIT
        return (
          <line
            key={`h-${i}`}
            x1="20"
            y1={y}
            x2={VIEW_W - 20}
            y2={y}
            stroke="var(--color-graph-fade)"
            strokeWidth="0.5"
          />
        )
      })}
    </>
  )
}

function Axes() {
  return (
    <>
      <line
        x1="20"
        y1={ORIGIN_Y}
        x2={VIEW_W - 20}
        y2={ORIGIN_Y}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
      <line
        x1={ORIGIN_X}
        y1="20"
        x2={ORIGIN_X}
        y2={VIEW_H - 20}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
    </>
  )
}
