import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Act 5 — the characteristic polynomial.
 *
 * We pose: det(M − λI) = 0. The user drags a slider for λ from −1 to 4.
 * Two panels update in lock-step:
 *
 *   - Left: the parallelogram of (M − λI) applied to the unit square.
 *     Its area is |det(M − λI)|. At λ = 1 and λ = 3 the parallelogram
 *     collapses to a line — those are the roots and they ARE the eigenvalues.
 *
 *   - Right: a small inline plot of det(M − λI) vs λ — a parabola that
 *     dips through zero at exactly those two roots.
 *
 * Same matrix M = [[2, 1], [1, 2]] for continuity.
 *
 * Phase 5 a11y: slider handle tab-focusable; arrow keys nudge λ by 0.05,
 * Shift+arrow by 0.5. CanvasNarrative announces value and fires high-priority
 * when det crosses zero (a root is reached).
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 180
const ORIGIN_Y = 200
const UNIT = 50

const M00 = 2
const M01 = 1
const M10 = 1
const M11 = 2

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

// Slider for λ
const LAMBDA_MIN = -1
const LAMBDA_MAX = 4
const SLIDER_Y = VIEW_H - 60
const SLIDER_X_MIN = 100
const SLIDER_X_MAX = VIEW_W - 100

const lambdaToX = (l: number) =>
  SLIDER_X_MIN + ((l - LAMBDA_MIN) / (LAMBDA_MAX - LAMBDA_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const xToLambda = (x: number) =>
  LAMBDA_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (LAMBDA_MAX - LAMBDA_MIN)

// Inline det-vs-λ chart
const CHART_X = 360
const CHART_Y = 96
const CHART_W = 200
const CHART_H = 160
const CHART_LAMBDA_MIN = -1
const CHART_LAMBDA_MAX = 4
const CHART_DET_MIN = -4
const CHART_DET_MAX = 6

function arrowHead(from: { x: number; y: number }, to: { x: number; y: number }) {
  const ang = Math.atan2(to.y - from.y, to.x - from.x)
  const headLen = 11
  const headWide = 5
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

function detOf(lambda: number) {
  // det(M − λI) for M = [[2,1],[1,2]] : (2−λ)² − 1 = λ² − 4λ + 3
  return (M00 - lambda) * (M11 - lambda) - M01 * M10
}

export function CharacteristicPoly() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const [lambda, setLambda] = useState(2)
  const startLambdaRef = useRef<number | null>(null)

  const updateLambda = useCallback((nl: number) => {
    const clamped = Math.max(LAMBDA_MIN, Math.min(LAMBDA_MAX, nl))
    // Soft snap to the two roots so the reader can land on them by hand
    const snap = [1, 3].find((t) => Math.abs(clamped - t) < 0.04)
    setLambda(snap ?? clamped)
  }, [])

  const bind = useDrag(({ first, movement: [mx] }) => {
    if (first) startLambdaRef.current = lambda
    const start = startLambdaRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startX = lambdaToX(start)
    const newX = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startX + mx * sx))
    updateLambda(xToLambda(newX))
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        const isShift = Math.abs(dx) >= 10
        const step = dx === 0 ? 0 : dx > 0 ? (isShift ? 0.5 : 0.05) : isShift ? -0.5 : -0.05
        updateLambda(lambda + step)
      },
      [lambda, updateLambda],
    ),
  )

  // (M − λI) basis images
  const iv = { x: M00 - lambda, y: M10 }
  const jv = { x: M01, y: M11 - lambda }
  const det = iv.x * jv.y - iv.y * jv.x
  const collapsed = Math.abs(det) < 0.05
  const atRoot = Math.abs(lambda - 1) < 0.03 || Math.abs(lambda - 3) < 0.03

  const O = { x: ORIGIN_X, y: ORIGIN_Y }
  const I = toSvg(iv.x, iv.y)
  const J = toSvg(jv.x, jv.y)
  const IJ = toSvg(iv.x + jv.x, iv.y + jv.y)
  const headI = arrowHead(O, I)
  const headJ = arrowHead(O, J)

  // Plot points for the chart — parabola det(M−λI) = (2−λ)² − 1
  const chartLambdaToX = (l: number) =>
    CHART_X + ((l - CHART_LAMBDA_MIN) / (CHART_LAMBDA_MAX - CHART_LAMBDA_MIN)) * CHART_W
  const chartDetToY = (d: number) =>
    CHART_Y + CHART_H - ((d - CHART_DET_MIN) / (CHART_DET_MAX - CHART_DET_MIN)) * CHART_H

  const chartPath = (() => {
    const N = 80
    let d = ''
    for (let i = 0; i <= N; i++) {
      const l = CHART_LAMBDA_MIN + (i / N) * (CHART_LAMBDA_MAX - CHART_LAMBDA_MIN)
      const dv = detOf(l)
      // clamp to chart bounds
      const y = chartDetToY(Math.max(CHART_DET_MIN, Math.min(CHART_DET_MAX, dv)))
      d += `${i === 0 ? 'M' : 'L'} ${chartLambdaToX(l).toFixed(2)} ${y.toFixed(2)} `
    }
    return d
  })()

  const sliderHandleX = lambdaToX(lambda)

  const narrationText = atRoot
    ? `λ equals ${lambda.toFixed(0)} — a root of the characteristic polynomial. The parallelogram collapsed to a line and the determinant is zero. ${lambda < 2 ? 'λ₂' : 'λ₁'} = ${lambda.toFixed(0)} is an eigenvalue.`
    : `λ is ${fmt(lambda).trim()}. det(M − λI) is ${fmt(det).trim()}. Slide toward 1 or 3.`
  const narrationPriority: 'normal' | 'high' = atRoot ? 'high' : 'normal'

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} priority={narrationPriority} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Slider for lambda set to ${fmt(lambda).trim()}. Determinant of M minus lambda I is ${fmt(det).trim()}. ${atRoot ? 'Lambda is a root — an eigenvalue.' : ''}`}
      >
        <SmallGrid />
        <SmallAxes />

        {/* (M − λI) parallelogram */}
        <polygon
          points={`${O.x},${O.y} ${I.x},${I.y} ${IJ.x},${IJ.y} ${J.x},${J.y}`}
          fill={collapsed ? 'var(--color-vermilion)' : 'var(--color-vermilion)'}
          fillOpacity={collapsed ? 0 : 0.16}
          stroke="var(--color-vermilion)"
          strokeWidth={collapsed ? 2.4 : 1.4}
        />

        {/* image-of-î and image-of-ĵ */}
        <line x1={O.x} y1={O.y} x2={I.x} y2={I.y} stroke="var(--color-vermilion)" strokeWidth="2.2" />
        <polygon
          points={`${I.x},${I.y} ${headI.p1.x},${headI.p1.y} ${headI.p2.x},${headI.p2.y}`}
          fill="var(--color-vermilion)"
        />
        <line x1={O.x} y1={O.y} x2={J.x} y2={J.y} stroke="var(--color-vermilion)" strokeWidth="2.2" />
        <polygon
          points={`${J.x},${J.y} ${headJ.p1.x},${headJ.p1.y} ${headJ.p2.x},${headJ.p2.y}`}
          fill="var(--color-vermilion)"
        />

        {/* Left-pane readout */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            M − λI
          </text>
          <g transform="translate(0, 14)">
            <path d="M 4 6 L 0 6 L 0 56 L 4 56" fill="none" stroke="var(--color-ink)" strokeWidth="1.4" />
            <text x="14" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
              {fmt(M00 - lambda).trim()}
            </text>
            <text x="74" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
              {M01}
            </text>
            <text x="14" y="44" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
              {M10}
            </text>
            <text x="74" y="44" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
              {fmt(M11 - lambda).trim()}
            </text>
            <path d="M 116 6 L 120 6 L 120 56 L 116 56" fill="none" stroke="var(--color-ink)" strokeWidth="1.4" />
          </g>
          <text y="84" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
            det = {fmt(det).trim()}
          </text>
        </g>

        {/* Inline chart of det(M − λI) vs λ */}
        <g>
          <text
            x={CHART_X}
            y={CHART_Y - 10}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            det(M − λI)  vs  λ
          </text>
          {/* Frame */}
          <rect
            x={CHART_X}
            y={CHART_Y}
            width={CHART_W}
            height={CHART_H}
            fill="none"
            stroke="var(--color-graph-fade)"
            strokeWidth="1"
          />
          {/* Zero line */}
          <line
            x1={CHART_X}
            y1={chartDetToY(0)}
            x2={CHART_X + CHART_W}
            y2={chartDetToY(0)}
            stroke="var(--color-graph-ink)"
            strokeOpacity="0.5"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          {/* Roots — vertical hairlines */}
          {[1, 3].map((r) => (
            <line
              key={r}
              x1={chartLambdaToX(r)}
              y1={CHART_Y}
              x2={chartLambdaToX(r)}
              y2={CHART_Y + CHART_H}
              stroke="var(--color-vermilion)"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
          ))}
          {/* Curve */}
          <path d={chartPath} fill="none" stroke="var(--color-vermilion)" strokeWidth="1.8" />
          {/* Current λ marker */}
          <circle
            cx={chartLambdaToX(lambda)}
            cy={chartDetToY(Math.max(CHART_DET_MIN, Math.min(CHART_DET_MAX, det)))}
            r="4"
            fill="var(--color-vermilion)"
          />
          {/* λ axis tick labels */}
          {[-1, 0, 1, 2, 3, 4].map((t) => (
            <text
              key={t}
              x={chartLambdaToX(t)}
              y={CHART_Y + CHART_H + 14}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {t}
            </text>
          ))}
          <text
            x={CHART_X + CHART_W}
            y={CHART_Y + CHART_H + 30}
            textAnchor="end"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-dim)"
          >
            roots at λ = 1, 3
          </text>
        </g>

        {/* Characteristic-polynomial line */}
        <text
          x="32"
          y={VIEW_H - 110}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          det(M − λI) = λ² − 4λ + 3
        </text>
        <text
          x="32"
          y={VIEW_H - 92}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          = (λ − 1)(λ − 3)
        </text>

        {/* Slider */}
        <g>
          <line
            x1={SLIDER_X_MIN}
            y1={SLIDER_Y}
            x2={SLIDER_X_MAX}
            y2={SLIDER_Y}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
          {[-1, 0, 1, 2, 3, 4].map((t) => (
            <g key={t}>
              <line
                x1={lambdaToX(t)}
                y1={SLIDER_Y - 6}
                x2={lambdaToX(t)}
                y2={SLIDER_Y + 6}
                stroke={t === 1 || t === 3 ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
                strokeWidth={t === 1 || t === 3 ? 1.4 : 1}
              />
              <text
                x={lambdaToX(t)}
                y={SLIDER_Y + 22}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill={t === 1 || t === 3 ? 'var(--color-vermilion)' : 'var(--color-dim)'}
              >
                {t}
              </text>
            </g>
          ))}
          <g
            {...bind()}
            ref={handleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Lambda. Currently ${fmt(lambda).trim()}. Arrow keys nudge by 0.05; Shift plus arrow by 0.5.`}
            aria-valuemin={LAMBDA_MIN}
            aria-valuemax={LAMBDA_MAX}
            aria-valuenow={Number(lambda.toFixed(2))}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={sliderHandleX} cy={SLIDER_Y} r="22" fill="transparent" />
            <circle
              cx={sliderHandleX}
              cy={SLIDER_Y}
              r="8"
              fill="var(--color-vermilion)"
              stroke="var(--color-cream)"
              strokeWidth="2"
            />
          </g>
          <text
            x={SLIDER_X_MIN}
            y={SLIDER_Y - 18}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            DRAG λ  ·  SLIDE THROUGH THE TWO ROOTS
          </text>
        </g>

        {/* Root badge */}
        {atRoot && (
          <g transform={`translate(${VIEW_W - 220}, 280)`}>
            <rect width="200" height="30" fill="var(--color-vermilion)" fillOpacity="0.15" />
            <text
              x="12"
              y="20"
              fontFamily="Inter, sans-serif"
              fontSize="11"
              letterSpacing="0.18em"
              fill="var(--color-vermilion)"
            >
              ROOT: λ = {lambda.toFixed(0)}
            </text>
          </g>
        )}
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4 &mdash; The roots of det(M − λI) are the eigenvalues
      </figcaption>
    </figure>
  )
}

function SmallGrid() {
  const GRID_TOP = 60
  const GRID_BOTTOM = VIEW_H - 130
  return (
    <>
      {Array.from({ length: 11 }, (_, i) => {
        const x = ORIGIN_X + (i - 5) * UNIT
        if (x < 30 || x > 330) return null
        return (
          <line
            key={`v-${i}`}
            x1={x}
            y1={GRID_TOP}
            x2={x}
            y2={GRID_BOTTOM}
            stroke="var(--color-graph-fade)"
            strokeWidth="0.5"
          />
        )
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const y = ORIGIN_Y + (i - 4) * UNIT
        if (y < GRID_TOP || y > GRID_BOTTOM) return null
        return (
          <line
            key={`h-${i}`}
            x1="30"
            y1={y}
            x2="330"
            y2={y}
            stroke="var(--color-graph-fade)"
            strokeWidth="0.5"
          />
        )
      })}
    </>
  )
}

function SmallAxes() {
  return (
    <>
      <line
        x1="30"
        y1={ORIGIN_Y}
        x2="330"
        y2={ORIGIN_Y}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
      <line
        x1={ORIGIN_X}
        y1="60"
        x2={ORIGIN_X}
        y2={VIEW_H - 130}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
    </>
  )
}
