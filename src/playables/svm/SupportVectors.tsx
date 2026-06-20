import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { PlotAxes, ClassScatter, ClassLegend } from './Axes'
import {
  SEPARABLE_POINTS,
  VIEW_W,
  VIEW_H,
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  X_MIN,
  X_MAX,
  Y_MIN,
  Y_MAX,
  dataToSvgX,
  dataToSvgY,
  marginWidth,
  isSeparator,
  supportVectors,
  lineSlopeIntercept,
  signedDistance,
  classColor,
} from './dataset'
import type { HyperplaneState } from './MaxMargin'

/**
 * Act 4 — support vectors.
 *
 *  Left  : the separable scatter + draggable line + dashed margin band.
 *          Points within the margin tolerance of the boundary are ringed
 *          in vermilion. These are the support vectors.
 *  Right : a count and a sentence — "only N points define this hyperplane.
 *          The other M are irrelevant." Plus the actual coordinates of the
 *          support vectors, listed.
 *
 * Same state shape as MaxMargin so the line can stay where the reader left
 * it. The starting state for this act ought to be the actual SVM solution,
 * which we hand-set in the route file via INITIAL_SV_HYPERPLANE.
 */

import { MAX_MARGIN_LINE } from './dataset'

export const INITIAL_SV_HYPERPLANE: HyperplaneState = {
  yLeft: MAX_MARGIN_LINE.yLeft,
  yRight: MAX_MARGIN_LINE.yRight,
  interacting: false,
}

const fmt2 = (n: number) => n.toFixed(2)

export function LeftPane({
  state,
  onChange,
}: {
  state: HyperplaneState
  onChange: (next: HyperplaneState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const leftHandleRef = useRef<SVGGElement | null>(null)
  const rightHandleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<HyperplaneState | null>(null)

  const setEndpoints = useCallback(
    (yL: number, yR: number, down: boolean) => {
      onChange({
        yLeft: Math.max(Y_MIN - 6, Math.min(Y_MAX + 6, yL)),
        yRight: Math.max(Y_MIN - 6, Math.min(Y_MAX + 6, yR)),
        interacting: down,
      })
    },
    [onChange],
  )

  const scale = () => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { sy: 1 }
    return { sy: VIEW_H / rect.height }
  }

  const bindLeft = useDrag(({ down, first, movement: [, my] }) => {
    if (first) startRef.current = state
    const s = startRef.current
    if (!s) return
    const { sy } = scale()
    const newYL = s.yLeft - (my * sy) / ((PLOT_Y1 - PLOT_Y0) / (Y_MAX - Y_MIN))
    setEndpoints(newYL, s.yRight, down)
  })
  const bindRight = useDrag(({ down, first, movement: [, my] }) => {
    if (first) startRef.current = state
    const s = startRef.current
    if (!s) return
    const { sy } = scale()
    const newYR = s.yRight - (my * sy) / ((PLOT_Y1 - PLOT_Y0) / (Y_MAX - Y_MIN))
    setEndpoints(s.yLeft, newYR, down)
  })

  useKeyNudge(
    leftHandleRef,
    useCallback(
      (_dx: number, dy: number) => {
        if (dy === 0) return
        const step = Math.abs(dy) >= 10 ? 5 : 0.5
        setEndpoints(state.yLeft + Math.sign(dy) * step, state.yRight, false)
      },
      [state, setEndpoints],
    ),
  )
  useKeyNudge(
    rightHandleRef,
    useCallback(
      (_dx: number, dy: number) => {
        if (dy === 0) return
        const step = Math.abs(dy) >= 10 ? 5 : 0.5
        setEndpoints(state.yLeft, state.yRight + Math.sign(dy) * step, false)
      },
      [state, setEndpoints],
    ),
  )

  const yLpx = clampPx(dataToSvgY(state.yLeft))
  const yRpx = clampPx(dataToSvgY(state.yRight))
  const m = marginWidth(state, SEPARABLE_POINTS)
  const ok = isSeparator(state, SEPARABLE_POINTS)
  const svs = supportVectors(state, SEPARABLE_POINTS)
  const svIndices = new Set<number>()
  for (let i = 0; i < SEPARABLE_POINTS.length; i++) {
    const p = SEPARABLE_POINTS[i]
    if (svs.some((s) => s.x === p.x && s.y === p.y && s.label === p.label)) {
      svIndices.add(i)
    }
  }

  const narration = ok
    ? `Separating line with margin ${fmt2(m)}. ${svs.length} points sit on the margin boundary and are highlighted as support vectors.`
    : `The line is not currently a separator. There are no support vectors until you fix it.`

  // Dashed band
  const { slope } = lineSlopeIntercept(state)
  const dy = m * Math.sqrt(1 + slope * slope)
  const yLpxA = clampPx(dataToSvgY(state.yLeft + dy))
  const yRpxA = clampPx(dataToSvgY(state.yRight + dy))
  const yLpxB = clampPx(dataToSvgY(state.yLeft - dy))
  const yRpxB = clampPx(dataToSvgY(state.yRight - dy))

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Two-class scatter with support vectors highlighted. ${svs.length} support vectors.`}
      >
        <PlotAxes />

        {/* Faded non-SV scatter */}
        <ClassScatter pts={SEPARABLE_POINTS} fade={0.35} highlight={svIndices} />

        {/* Margin band */}
        <polygon
          points={`${dataToSvgX(X_MIN)},${yLpxA} ${dataToSvgX(X_MAX)},${yRpxA} ${dataToSvgX(X_MAX)},${yRpxB} ${dataToSvgX(X_MIN)},${yLpxB}`}
          fill="var(--color-vermilion)"
          fillOpacity="0.08"
        />
        <line
          x1={dataToSvgX(X_MIN)}
          y1={yLpxA}
          x2={dataToSvgX(X_MAX)}
          y2={yRpxA}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
          strokeOpacity="0.55"
          strokeDasharray="4 4"
        />
        <line
          x1={dataToSvgX(X_MIN)}
          y1={yLpxB}
          x2={dataToSvgX(X_MAX)}
          y2={yRpxB}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
          strokeOpacity="0.55"
          strokeDasharray="4 4"
        />

        {/* The hyperplane */}
        <line
          x1={dataToSvgX(X_MIN)}
          y1={yLpx}
          x2={dataToSvgX(X_MAX)}
          y2={yRpx}
          stroke={ok ? 'var(--color-vermilion)' : '#b94a3c'}
          strokeWidth="2.4"
        />

        {/* Support vectors — drawn on top, ringed */}
        {svs.map((p, i) => {
          const cx = dataToSvgX(p.x)
          const cy = dataToSvgY(p.y)
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="11" fill="none" stroke="var(--color-vermilion)" strokeWidth="2" />
              {p.label === 1 ? (
                <circle cx={cx} cy={cy} r="5" fill={classColor(1)} />
              ) : (
                <g>
                  <line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy + 5} stroke={classColor(-1)} strokeWidth="2" />
                  <line x1={cx - 5} y1={cy + 5} x2={cx + 5} y2={cy - 5} stroke={classColor(-1)} strokeWidth="2" />
                </g>
              )}
            </g>
          )
        })}

        {/* Endpoint handles */}
        <g
          {...bindLeft()}
          ref={leftHandleRef}
          tabIndex={0}
          role="button"
          aria-label={`Left endpoint of the hyperplane at y equals ${fmt2(state.yLeft)}. Drag or use arrow keys.`}
          style={{ cursor: 'ns-resize', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={dataToSvgX(X_MIN)} cy={yLpx} r="22" fill="transparent" />
          <circle
            cx={dataToSvgX(X_MIN)}
            cy={yLpx}
            r="7"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        </g>
        <g
          {...bindRight()}
          ref={rightHandleRef}
          tabIndex={0}
          role="button"
          aria-label={`Right endpoint of the hyperplane at y equals ${fmt2(state.yRight)}. Drag or use arrow keys.`}
          style={{ cursor: 'ns-resize', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={dataToSvgX(X_MAX)} cy={yRpx} r="22" fill="transparent" />
          <circle
            cx={dataToSvgX(X_MAX)}
            cy={yRpx}
            r="7"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        </g>

        <ClassLegend x={PLOT_X0 + 8} y={PLOT_Y0 + 8} />

        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          RINGED &middot; THE ONLY POINTS THAT MATTER
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3a &mdash; The points that touch the margin
      </figcaption>
    </figure>
  )
}

function clampPx(y: number) {
  return Math.max(PLOT_Y0 - 12, Math.min(PLOT_Y1 + 12, y))
}

export function RightPane({ state }: { state: HyperplaneState }) {
  const ok = isSeparator(state, SEPARABLE_POINTS)
  const svs = ok ? supportVectors(state, SEPARABLE_POINTS) : []
  const total = SEPARABLE_POINTS.length
  const numSV = svs.length
  const numRest = total - numSV

  const narration = ok
    ? `${numSV} support vectors out of ${total} total points. The other ${numRest} sit comfortably inside their class and can be removed from the dataset without changing the hyperplane at all.`
    : `Line is not a separator. No support vectors.`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Support vector count panel. ${narration}`}
      >
        <text
          x={VIEW_W / 2}
          y="56"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          WHO DEFINES THE LINE?
        </text>

        {/* Big numbers */}
        <g transform={`translate(${VIEW_W / 2 - 100}, 140)`}>
          <text
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="64"
            fill="var(--color-vermilion)"
          >
            {numSV}
          </text>
          <text
            y="28"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            SUPPORT VECTORS
          </text>
        </g>

        <text
          x={VIEW_W / 2}
          y={150}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="20"
          fill="var(--color-dim)"
        >
          vs
        </text>

        <g transform={`translate(${VIEW_W / 2 + 100}, 140)`}>
          <text
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="64"
            fill="var(--color-ink)"
            fillOpacity="0.55"
          >
            {numRest}
          </text>
          <text
            y="28"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            IRRELEVANT
          </text>
        </g>

        {/* Sentence */}
        <text
          x={VIEW_W / 2}
          y={250}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          {ok && numSV > 0 ? (
            <>
              Only {numSV} points define this hyperplane.
            </>
          ) : (
            'Drag the line into the gap to see the support vectors.'
          )}
        </text>
        {ok && numSV > 0 && (
          <text
            x={VIEW_W / 2}
            y={272}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-dim)"
          >
            The other {numRest} are irrelevant.
          </text>
        )}

        {/* The actual SV coordinates */}
        {ok && numSV > 0 && (
          <g transform={`translate(${VIEW_W / 2 - 130}, ${308})`}>
            <text
              fontFamily="Inter, sans-serif"
              fontSize="10"
              letterSpacing="0.22em"
              fill="var(--color-dim)"
            >
              SUPPORT-VECTOR COORDINATES
            </text>
            {svs.slice(0, 6).map((s, i) => (
              <text
                key={i}
                y={20 + i * 16}
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-ink)"
              >
                ({s.x.toFixed(0)}, {s.y.toFixed(0)})  ·  y = {s.label === 1 ? '+1' : '−1'}  ·  d = {Math.abs(signedDistance(s, state)).toFixed(2)}
              </text>
            ))}
          </g>
        )}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 50}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          delete every other point — same hyperplane
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3b &mdash; The handful of points that the algorithm sees
      </figcaption>
    </figure>
  )
}
