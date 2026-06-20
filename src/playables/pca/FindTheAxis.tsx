import { useCallback, useMemo, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { covariance, makeCloud, projectedVariance } from './cloud'
import type { SplitCanvasRenderProps } from '../../components/topic/TopicPageSplit'

/**
 * Act 2 — drag a candidate line through the origin and watch the variance
 * of the data projected onto that line grow. Maximize it and you have PC1.
 *
 * Sync mode: left-drives-right. Left pane has the scatter + a rotatable
 * line; right pane has a vertical variance bar derived from the angle.
 *
 * State shape (shared via TopicPageSplit):
 *   { theta: number }  // angle of the candidate line, in radians
 */

export interface FindTheAxisState {
  theta: number
}

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 60

const SEED = 0xa901
const N = 180

const fmt = (n: number) => n.toFixed(2)

function toSvg(mx: number, my: number) {
  return { x: ORIGIN_X + mx * UNIT, y: ORIGIN_Y - my * UNIT }
}

// One shared cloud + its covariance — same across both panes.
const points = makeCloud(N, SEED)
const cov = covariance(points)

// Maximum possible projected variance (achieved at PC1) — used to scale the
// right pane's bar. PC1 angle is what the user is trying to find.
const PC1_THETA = (() => {
  // Closed-form from the covariance: angle of the dominant eigenvector
  const { a, b, c } = cov
  if (Math.abs(b) < 1e-9) return a >= c ? 0 : Math.PI / 2
  return 0.5 * Math.atan2(2 * b, a - c)
})()
const MAX_VAR = projectedVariance(PC1_THETA, cov)

export function FindTheAxisLeftPane({ state, onChange }: SplitCanvasRenderProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startThetaRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)

  const s = state as FindTheAxisState
  const theta = s.theta

  // Drag rotates the line around the origin. We convert pointer position to
  // an angle relative to the origin (in screen space) and translate to data
  // angle.
  const bind = useDrag(({ first, last, xy: [px, py] }) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const sy = VIEW_H / rect.height
    const localX = (px - rect.left) * sx - ORIGIN_X
    const localY = ORIGIN_Y - (py - rect.top) * sy // flip y
    if (first) {
      startThetaRef.current = theta
      isDraggingRef.current = true
    }
    if (last) {
      isDraggingRef.current = false
    }
    if (Math.hypot(localX, localY) < 0.1) return
    let t = Math.atan2(localY, localX)
    // Restrict to [0, π) — line, not ray.
    if (t < 0) t += Math.PI
    if (t >= Math.PI) t -= Math.PI
    onChange({ theta: t } as FindTheAxisState)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? Math.PI / 36 : Math.PI / 180 // 5° or 1°
        let next = theta + Math.sign(dx) * step
        // Wrap into [0, π)
        while (next < 0) next += Math.PI
        while (next >= Math.PI) next -= Math.PI
        onChange({ theta: next } as FindTheAxisState)
      },
      [theta, onChange],
    ),
  )

  const ux = Math.cos(theta)
  const uy = Math.sin(theta)
  // Endpoints of the candidate line (drawn long across the canvas)
  const lineEnds = {
    a: toSvg(-6 * ux, -6 * uy),
    b: toSvg(6 * ux, 6 * uy),
  }
  // A draggable handle along the line at a fixed radius
  const handle = toSvg(2.6 * ux, 2.6 * uy)

  // Projections (foot of perpendicular) for a subset of points, drawn as
  // tick marks along the line to make "variance along the line" visible.
  const projections = useMemo(() => {
    const sampleEvery = 6
    return points
      .filter((_, i) => i % sampleEvery === 0)
      .map((p) => {
        const t = p.x * ux + p.y * uy
        return { t, sv: toSvg(t * ux, t * uy) }
      })
  }, [ux, uy])

  const variance = projectedVariance(theta, cov)
  const ratio = MAX_VAR > 0 ? variance / MAX_VAR : 0
  const isPC1 = ratio > 0.998

  const narrationText = isPC1
    ? `You found it. The line is at ${fmt((theta * 180) / Math.PI)} degrees and the projected variance is ${fmt(variance)} — the maximum. This is the first principal component.`
    : `Line angle ${fmt((theta * 180) / Math.PI)} degrees. Projected variance ${fmt(variance)}. Maximum so far would be ${fmt(MAX_VAR)} — keep rotating.`
  const narrationPriority: 'normal' | 'high' = isPC1 ? 'high' : 'normal'

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narrationText}
        priority={narrationPriority}
        isInteracting={isDraggingRef.current}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A scatter of ${N} points with a candidate axis through the origin. The axis is at ${fmt((theta * 180) / Math.PI)} degrees. ${isPC1 ? 'It is aligned with the first principal component.' : 'It can be rotated.'}`}
      >
        <ReferenceGrid />
        <Axes />

        {/* Candidate line */}
        <line
          x1={lineEnds.a.x}
          y1={lineEnds.a.y}
          x2={lineEnds.b.x}
          y2={lineEnds.b.y}
          stroke={isPC1 ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
          strokeOpacity={isPC1 ? 0.9 : 0.55}
          strokeWidth={isPC1 ? 2.5 : 1.4}
        />
        {isPC1 && (
          <line
            x1={lineEnds.a.x}
            y1={lineEnds.a.y}
            x2={lineEnds.b.x}
            y2={lineEnds.b.y}
            stroke="var(--color-vermilion)"
            strokeOpacity="0.18"
            strokeWidth="12"
          />
        )}

        {/* Foot-of-perpendicular ticks: each projection as a small dash
            perpendicular to the candidate line, anchored on the line.       */}
        {projections.map((q, i) => {
          const nx = -uy
          const ny = ux
          const tick = 4
          return (
            <line
              key={i}
              x1={q.sv.x - tick * nx}
              y1={q.sv.y + tick * ny}
              x2={q.sv.x + tick * nx}
              y2={q.sv.y - tick * ny}
              stroke={isPC1 ? 'var(--color-vermilion)' : 'var(--color-dim)'}
              strokeOpacity="0.7"
              strokeWidth="1"
            />
          )
        })}

        {/* Scatter — drawn after the line so points sit on top */}
        {points.map((p, i) => {
          const sv = toSvg(p.x, p.y)
          return (
            <circle key={i} cx={sv.x} cy={sv.y} r="2.4" fill="var(--color-ink)" fillOpacity="0.55" />
          )
        })}

        {/* Draggable handle */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="button"
          aria-label={`Rotation handle for the candidate axis. Currently ${fmt((theta * 180) / Math.PI)} degrees. Drag, or use arrow keys to nudge.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={handle.x} cy={handle.y} r="22" fill="transparent" />
          <circle
            cx={handle.x}
            cy={handle.y}
            r="8"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        </g>

        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            CANDIDATE AXIS
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-ink)">
            θ = {fmt((theta * 180) / Math.PI)}°
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
          DRAG · ARROWS NUDGE · MAXIMIZE THE VARIANCE BAR
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2a &mdash; A line through the origin
      </figcaption>
    </figure>
  )
}

export function FindTheAxisRightPane({ state }: SplitCanvasRenderProps) {
  const s = state as FindTheAxisState
  const theta = s.theta
  const variance = projectedVariance(theta, cov)
  const ratio = MAX_VAR > 0 ? variance / MAX_VAR : 0
  const isPC1 = ratio > 0.998

  // Bar geometry
  const BAR_X = 240
  const BAR_W = 80
  const BAR_TOP = 60
  const BAR_BOTTOM = 400
  const fullHeight = BAR_BOTTOM - BAR_TOP
  const filledHeight = fullHeight * Math.max(0, Math.min(1, ratio))
  const filledTop = BAR_BOTTOM - filledHeight

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Projected variance is ${fmt(variance)}. The maximum possible value is ${fmt(MAX_VAR)}. ${isPC1 ? 'You have found the principal component.' : 'Rotate the line on the left to grow this bar.'}`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A vertical bar showing the variance of the data projected onto the candidate axis. Current value ${fmt(variance)}; maximum ${fmt(MAX_VAR)}.`}
      >
        {/* Title */}
        <text
          x="60"
          y="60"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          PROJECTED VARIANCE
        </text>

        {/* Bar frame */}
        <rect
          x={BAR_X}
          y={BAR_TOP}
          width={BAR_W}
          height={fullHeight}
          fill="none"
          stroke="var(--color-graph-ink)"
          strokeOpacity="0.5"
          strokeWidth="1"
        />

        {/* Tick marks at 0, 0.25, 0.5, 0.75, 1 of MAX_VAR */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = BAR_BOTTOM - fullHeight * f
          return (
            <g key={f}>
              <line x1={BAR_X - 8} y1={y} x2={BAR_X} y2={y} stroke="var(--color-graph-ink)" strokeOpacity="0.5" strokeWidth="1" />
              <text
                x={BAR_X - 12}
                y={y + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-dim)"
              >
                {(MAX_VAR * f).toFixed(2)}
              </text>
            </g>
          )
        })}
        {/* Max label */}
        <text
          x={BAR_X + BAR_W + 14}
          y={BAR_TOP + 4}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          MAX = {fmt(MAX_VAR)}
        </text>

        {/* Filled portion */}
        <rect
          x={BAR_X}
          y={filledTop}
          width={BAR_W}
          height={filledHeight}
          fill={isPC1 ? 'var(--color-vermilion)' : 'var(--color-ink)'}
          fillOpacity={isPC1 ? 0.85 : 0.55}
        />

        {/* Halo when maxed */}
        {isPC1 && (
          <rect
            x={BAR_X - 6}
            y={filledTop - 6}
            width={BAR_W + 12}
            height={filledHeight + 12}
            fill="var(--color-vermilion)"
            fillOpacity="0.12"
          />
        )}

        {/* Readout */}
        <g transform="translate(60, 420)">
          <text fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-ink)">
            Var( u<tspan baselineShift="super" fontSize="9">⊤</tspan>x ) = {fmt(variance)}
          </text>
        </g>

        {/* Status */}
        {isPC1 && (
          <g transform="translate(360, 60)">
            <rect width="200" height="32" fill="var(--color-vermilion)" fillOpacity="0.15" />
            <text
              x="12"
              y="20"
              fontFamily="Inter, sans-serif"
              fontSize="10"
              letterSpacing="0.18em"
              fill="var(--color-vermilion)"
            >
              PC1 FOUND
            </text>
          </g>
        )}
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2b &mdash; How spread out the projections are
      </figcaption>
    </figure>
  )
}

function ReferenceGrid() {
  return (
    <>
      {Array.from({ length: 11 }, (_, i) => {
        const x = ORIGIN_X + (i - 5) * UNIT
        return (
          <line key={`v-${i}`} x1={x} y1="20" x2={x} y2={VIEW_H - 20} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const y = ORIGIN_Y + (i - 4) * UNIT
        return (
          <line key={`h-${i}`} x1="20" y1={y} x2={VIEW_W - 20} y2={y} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
    </>
  )
}

function Axes() {
  return (
    <>
      <line x1="20" y1={ORIGIN_Y} x2={VIEW_W - 20} y2={ORIGIN_Y} stroke="var(--color-graph-ink)" strokeWidth="1" />
      <line x1={ORIGIN_X} y1="20" x2={ORIGIN_X} y2={VIEW_H - 20} stroke="var(--color-graph-ink)" strokeWidth="1" />
    </>
  )
}
