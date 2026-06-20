import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Product rule, the geometric proof.
 *
 *   u(t) = 1 + t,   v(t) = 1 + 0.5·t
 *   A(t) = u(t) · v(t)
 *   A'(t) = u'(t)·v(t) + u(t)·v'(t)
 *
 * The canvas shows a rectangle with sides u and v at time t. As t grows
 * (the slider), the rectangle grows. We outline the original rectangle
 * at time 0 and then highlight, with two thin vermilion strips, the new
 * area that was added: one strip along the top (u · dv) and one along
 * the side (v · du). The corner-of-a-corner strip (du · dv) is shaded
 * lightly and labelled "second-order, vanishes in the limit."
 *
 * The whole picture is the product rule. Drag t; watch the strips grow.
 * Keyboard: arrows nudge t by 0.05, Shift by 0.5.
 */

const VIEW_W = 600
const VIEW_H = 480

const T_MIN = 0
const T_MAX = 1.6
const T_INIT = 0.6

const SLIDER_X_MIN = 80
const SLIDER_X_MAX = VIEW_W - 80
const SLIDER_Y = VIEW_H - 50

const RECT_ORIGIN_X = 100
const RECT_ORIGIN_Y = VIEW_H - 130

const UNIT = 90 // pixels per unit length

const u = (t: number) => 1 + t
const v = (t: number) => 1 + 0.5 * t
const up = (_: number) => 1
const vp = (_: number) => 0.5

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

const tToSliderX = (t: number) =>
  SLIDER_X_MIN + ((t - T_MIN) / (T_MAX - T_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const sliderXToT = (x: number) =>
  T_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (T_MAX - T_MIN)

export function ProductRule() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const [t, setT] = useState(T_INIT)
  const [isInteracting, setIsInteracting] = useState(false)
  const startTRef = useRef<number | null>(null)

  const clampT = (val: number) => Math.max(T_MIN, Math.min(T_MAX, val))

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) {
      startTRef.current = t
      setIsInteracting(true)
    }
    if (last) setIsInteracting(false)
    const start = startTRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startPx = tToSliderX(start)
    const newPx = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startPx + mx * sx))
    setT(clampT(sliderXToT(newPx)))
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? Math.sign(dx) * 0.5 : Math.sign(dx) * 0.05
        setT((cur) => clampT(cur + step))
      },
      [],
    ),
  )

  // Sizes
  const u0 = u(0)
  const v0 = v(0)
  const uT = u(t)
  const vT = v(t)
  const du = uT - u0
  const dv = vT - v0

  // Rectangle pixel coords (origin in upper-left of current rectangle)
  const innerW = u0 * UNIT
  const innerH = v0 * UNIT
  const outerW = uT * UNIT
  const outerH = vT * UNIT

  // Rectangle top-left
  const RX = RECT_ORIGIN_X
  const RY = RECT_ORIGIN_Y - outerH

  // Inner rectangle (at t=0) sits in the bottom-left of the outer.
  const innerX = RX
  const innerY = RECT_ORIGIN_Y - innerH

  // Strip A: the top strip — uT wide, dv tall, hugging the top of the rectangle.
  const stripTopX = RX
  const stripTopY = RY
  const stripTopH = dv * UNIT

  // Strip B: the right strip — du wide, vT tall, hugging the right of the rectangle.
  const stripRightX = innerX + innerW
  const stripRightY = RY
  const stripRightW = du * UNIT

  // Corner cap: where the two strips overlap (du·dv). We render it with a
  // distinct fill so the second-order term is visually called out.
  const cornerX = innerX + innerW
  const cornerY = RY
  const cornerW = du * UNIT
  const cornerH = dv * UNIT

  const newArea = uT * vT - u0 * v0
  const linearTerm = u0 * dv + v0 * du // the product-rule term
  const crossTerm = du * dv

  const slope = up(t) * vT + uT * vp(t) // A'(t)

  const narrationText = `At t equals ${fmt(t).trim()}, the rectangle has sides u equals ${fmt(uT).trim()} and v equals ${fmt(vT).trim()}. The new area added since t equals zero is split into a top strip of area u times d v, a side strip of area v times d u, and a small corner that vanishes in the limit. The instantaneous rate of change of the area is ${fmt(slope).trim()}.`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narrationText}
        priority="normal"
        isInteracting={isInteracting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A rectangle with sides u of t and v of t. As t grows, the rectangle expands; the new area decomposes into a top strip u times d v, a side strip v times d u, and a small corner strip d u times d v. Rate of change of area at t equals ${fmt(t).trim()} is ${fmt(slope).trim()}.`}
      >
        {/* Header */}
        <text x={36} y={36} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          PRODUCT RULE  ·  GEOMETRIC PROOF
        </text>
        <text x={36} y={54} fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-ink)">
          d(uv)/dt = u · dv/dt + v · du/dt
        </text>

        {/* Outer rectangle outline */}
        <rect
          x={RX}
          y={RY}
          width={outerW}
          height={outerH}
          fill="var(--color-paper)"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
        />

        {/* Inner (t=0) rectangle, ink-shaded */}
        <rect
          x={innerX}
          y={innerY}
          width={innerW}
          height={innerH}
          fill="var(--color-paper-deep)"
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Top strip: u · dv */}
        {stripTopH > 0.5 && (
          <rect
            x={stripTopX}
            y={stripTopY}
            width={innerW}
            height={stripTopH}
            fill="var(--color-vermilion)"
            fillOpacity="0.35"
            stroke="var(--color-vermilion)"
            strokeWidth="1"
          />
        )}

        {/* Side strip: v · du */}
        {stripRightW > 0.5 && (
          <rect
            x={stripRightX}
            y={stripRightY + stripTopH}
            width={stripRightW}
            height={innerH}
            fill="var(--color-vermilion)"
            fillOpacity="0.35"
            stroke="var(--color-vermilion)"
            strokeWidth="1"
          />
        )}

        {/* Corner cap: du · dv — second-order, shaded differently */}
        {cornerW > 0.5 && cornerH > 0.5 && (
          <>
            <rect
              x={cornerX}
              y={cornerY}
              width={cornerW}
              height={cornerH}
              fill="var(--color-graph-ink)"
              fillOpacity="0.16"
              stroke="var(--color-graph-ink)"
              strokeWidth="0.6"
              strokeDasharray="2 3"
            />
          </>
        )}

        {/* Side labels — u along the top, v along the left */}
        <line
          x1={RX}
          y1={RECT_ORIGIN_Y + 14}
          x2={RX + outerW}
          y2={RECT_ORIGIN_Y + 14}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.8"
        />
        <line x1={RX} y1={RECT_ORIGIN_Y + 10} x2={RX} y2={RECT_ORIGIN_Y + 18} stroke="var(--color-graph-ink)" strokeWidth="0.8" />
        <line x1={RX + outerW} y1={RECT_ORIGIN_Y + 10} x2={RX + outerW} y2={RECT_ORIGIN_Y + 18} stroke="var(--color-graph-ink)" strokeWidth="0.8" />
        <text
          x={RX + outerW / 2}
          y={RECT_ORIGIN_Y + 32}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-ink)"
        >
          u(t) = {fmt(uT).trim()}
        </text>

        <line
          x1={RX - 14}
          y1={RY}
          x2={RX - 14}
          y2={RY + outerH}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.8"
        />
        <line x1={RX - 18} y1={RY} x2={RX - 10} y2={RY} stroke="var(--color-graph-ink)" strokeWidth="0.8" />
        <line x1={RX - 18} y1={RY + outerH} x2={RX - 10} y2={RY + outerH} stroke="var(--color-graph-ink)" strokeWidth="0.8" />
        <text
          x={RX - 18}
          y={RY + outerH / 2 + 4}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-ink)"
        >
          v(t) = {fmt(vT).trim()}
        </text>

        {/* Strip annotations */}
        {stripTopH > 12 && (
          <text
            x={stripTopX + innerW + 6}
            y={stripTopY + stripTopH / 2 + 4}
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-vermilion)"
          >
            ← u · dv = {fmt(u0 * dv).trim()}
          </text>
        )}
        {stripRightW > 16 && (
          <text
            x={stripRightX + stripRightW / 2}
            y={stripRightY + stripTopH + innerH + 30}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-vermilion)"
          >
            v · du = {fmt(v0 * du).trim()}
          </text>
        )}
        {cornerW > 12 && cornerH > 12 && (
          <text
            x={cornerX + cornerW + 6}
            y={cornerY + cornerH + 12}
            fontFamily="JetBrains Mono, monospace"
            fontSize="9"
            fill="var(--color-dim)"
          >
            du·dv (vanishes)
          </text>
        )}

        {/* Readout panel — top right */}
        <g transform={`translate(${VIEW_W - 36}, 36)`}>
          <text textAnchor="end" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            AREA  ·  A(t) = u(t)·v(t)
          </text>
          <text y="22" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
            A(t) = {fmt(uT * vT).trim()}
          </text>
          <text y="42" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            A(0) = {fmt(u0 * v0).trim()}
          </text>
          <text y="60" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
            ΔA = {fmt(newArea).trim()}
          </text>
          <text y="80" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            linear = {fmt(linearTerm).trim()}
          </text>
          <text y="96" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            cross = {fmt(crossTerm).trim()}
          </text>
          <text y="120" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
            A′(t) = {fmt(slope).trim()}
          </text>
        </g>

        {/* Slider */}
        <line
          x1={SLIDER_X_MIN}
          y1={SLIDER_Y}
          x2={SLIDER_X_MAX}
          y2={SLIDER_Y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        {[0, 0.5, 1, 1.5].map((vTick) => (
          <g key={vTick}>
            <line
              x1={tToSliderX(vTick)}
              y1={SLIDER_Y - 5}
              x2={tToSliderX(vTick)}
              y2={SLIDER_Y + 5}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.8"
            />
            <text
              x={tToSliderX(vTick)}
              y={SLIDER_Y + 18}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              t = {vTick}
            </text>
          </g>
        ))}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Time t. Current value ${fmt(t).trim()}. Arrow keys to nudge, Shift plus arrow to step by half a unit.`}
          aria-valuemin={T_MIN}
          aria-valuemax={T_MAX}
          aria-valuenow={Number(t.toFixed(2))}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={tToSliderX(t)} cy={SLIDER_Y} r="22" fill="transparent" />
          <circle
            cx={tToSliderX(t)}
            cy={SLIDER_Y}
            r="8"
            fill="var(--color-vermilion)"
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
        </g>
        <text
          x={SLIDER_X_MIN}
          y={SLIDER_Y - 12}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          DRAG t  ·  WATCH THE STRIPS GROW
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6 &mdash; The product rule, as area added on two sides.
      </figcaption>
    </figure>
  )
}
