import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Act 3 — interactive search for an eigenvector of M = [[2, 1], [1, 2]].
 *
 * The user drags a vermilion arrow v around. The grey arrow Mv shows where
 * it goes. When v and Mv are parallel (|v × Mv| below threshold), a halo
 * lights up the eigen-direction and the readout shows λ = |Mv| / |v|.
 *
 * Phase 5 a11y: arrow tip is tab-focusable; arrow keys nudge by 0.1, Shift+
 * arrow by 1. CanvasNarrative announces parallelism (high priority) the
 * moment the cross product crosses below threshold.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

// Teaching matrix — symmetric, real eigenvalues 1 and 3.
const M00 = 2
const M01 = 1
const M10 = 1
const M11 = 2

const fmt = (n: number) => n.toFixed(2)

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

// Parallelism via normalized cross product: |v × Mv| / (|v|·|Mv|) ≈ sin(angle).
// Threshold 0.04 ≈ 2.3° — generous enough to land on by hand.
const PARALLEL_THRESHOLD = 0.04

export function FindFixedLine() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const [v, setV] = useState({ x: 1.4, y: 0.3 })
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
    // Clamp so the arrow stays inside the viewBox
    const cx = Math.max(-4.5, Math.min(4.5, nx))
    const cy = Math.max(-3, Math.min(3, ny))
    setV({ x: cx, y: cy })
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
  const lenMv = Math.hypot(mv.x, mv.y)
  // |v × Mv| = |v.x * mv.y − v.y * mv.x|
  const cross = Math.abs(v.x * mv.y - v.y * mv.x)
  const sinAngle = lenV * lenMv > 1e-6 ? cross / (lenV * lenMv) : 1
  const parallel = sinAngle < PARALLEL_THRESHOLD && lenV > 0.15
  // Same direction (positive λ) or opposite (negative λ)?
  const dot = v.x * mv.x + v.y * mv.y
  const signedLambda = parallel ? (dot >= 0 ? lenMv / lenV : -lenMv / lenV) : null

  const O = { x: ORIGIN_X, y: ORIGIN_Y }
  const V = toSvg(v.x, v.y)
  const MV = toSvg(mv.x, mv.y)
  const headV = arrowHead(O, V)
  const headMv = arrowHead(O, MV)

  // Eigen-line through the origin in v's direction (drawn only when parallel)
  const eigenLineEnds = (() => {
    const len = Math.max(lenV, 0.001)
    const ux = v.x / len
    const uy = v.y / len
    return {
      a: toSvg(-6 * ux, -6 * uy),
      b: toSvg(6 * ux, 6 * uy),
    }
  })()

  const narrationText = parallel
    ? `Found one. Mv lies on the same line as v. λ is ${fmt(signedLambda ?? 0)}. You're on an eigenvector.`
    : `v is at ${fmt(v.x)}, ${fmt(v.y)}. Mv is at ${fmt(mv.x)}, ${fmt(mv.y)}. They sit on different rays — keep dragging.`
  const narrationPriority: 'normal' | 'high' = parallel ? 'high' : 'normal'

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} priority={narrationPriority} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Eigenvector search. v is at ${fmt(v.x)}, ${fmt(v.y)}; Mv is at ${fmt(mv.x)}, ${fmt(mv.y)}. ${parallel ? `They are parallel — λ equals ${fmt(signedLambda ?? 0)}.` : 'They are not parallel yet.'}`}
      >
        <ReferenceGrid />
        <Axes />

        {/* Eigen-line halo — only when v lies on an eigen-direction */}
        {parallel && (
          <>
            <line
              x1={eigenLineEnds.a.x}
              y1={eigenLineEnds.a.y}
              x2={eigenLineEnds.b.x}
              y2={eigenLineEnds.b.y}
              stroke="var(--color-vermilion)"
              strokeOpacity="0.35"
              strokeWidth="5"
            />
            <line
              x1={eigenLineEnds.a.x}
              y1={eigenLineEnds.a.y}
              x2={eigenLineEnds.b.x}
              y2={eigenLineEnds.b.y}
              stroke="var(--color-vermilion)"
              strokeOpacity="0.15"
              strokeWidth="14"
            />
          </>
        )}

        {/* Mv — grey ghost showing where v lands */}
        <line
          x1={O.x}
          y1={O.y}
          x2={MV.x}
          y2={MV.y}
          stroke="var(--color-graph-ink)"
          strokeOpacity="0.5"
          strokeWidth="2"
        />
        <polygon
          points={`${MV.x},${MV.y} ${headMv.p1.x},${headMv.p1.y} ${headMv.p2.x},${headMv.p2.y}`}
          fill="var(--color-graph-ink)"
          fillOpacity="0.5"
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

        {/* v — vermilion */}
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
          aria-label={`Vector v. Currently ${fmt(v.x)}, ${fmt(v.y)}. Drag or use arrow keys.`}
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

        {/* Matrix readout + status */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            M
          </text>
          <g transform="translate(0, 14)">
            <path
              d="M 4 6 L 0 6 L 0 56 L 4 56"
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="1.4"
            />
            <text x="14" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">2</text>
            <text x="60" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">1</text>
            <text x="14" y="46" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">1</text>
            <text x="60" y="46" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">2</text>
            <path
              d="M 96 6 L 100 6 L 100 56 L 96 56"
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="1.4"
            />
          </g>
          <text y="92" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
            v = ({fmt(v.x)}, {fmt(v.y)})
          </text>
          <text y="110" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
            Mv = ({fmt(mv.x)}, {fmt(mv.y)})
          </text>
        </g>

        {/* Eigen badge */}
        {parallel ? (
          <g transform={`translate(${VIEW_W - 240}, 36)`}>
            <rect width="220" height="48" fill="var(--color-vermilion)" fillOpacity="0.15" />
            <text
              x="14"
              y="20"
              fontFamily="Inter, sans-serif"
              fontSize="10"
              letterSpacing="0.18em"
              fill="var(--color-vermilion)"
            >
              EIGENVECTOR FOUND
            </text>
            <text
              x="14"
              y="40"
              fontFamily="JetBrains Mono, monospace"
              fontSize="14"
              fill="var(--color-vermilion)"
            >
              λ = {fmt(signedLambda ?? 0)}
            </text>
          </g>
        ) : (
          <g transform={`translate(${VIEW_W - 240}, 36)`}>
            <rect width="220" height="48" fill="var(--color-graph-fade)" fillOpacity="0.6" />
            <text
              x="14"
              y="20"
              fontFamily="Inter, sans-serif"
              fontSize="10"
              letterSpacing="0.18em"
              fill="var(--color-dim)"
            >
              ALIGNMENT
            </text>
            <text
              x="14"
              y="40"
              fontFamily="JetBrains Mono, monospace"
              fontSize="12"
              fill="var(--color-dim)"
            >
              sin∠(v, Mv) = {fmt(sinAngle)}
            </text>
          </g>
        )}

        {/* Hint */}
        <text
          x="32"
          y={VIEW_H - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG v  ·  MAKE Mv LINE UP WITH IT  ·  λ = STRETCH FACTOR
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2 &mdash; Find a direction the matrix doesn&rsquo;t bend
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
