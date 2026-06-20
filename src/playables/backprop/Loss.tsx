import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  ILLUSTRATIVE_PARAMS,
  forward,
  mse,
  fmt2,
} from './mlp'

/**
 * Act 4 — how wrong is it? One example. The hidden parameters and the input
 * are fixed at the illustrative values used in Act 3. The reader drags a
 * SINGLE target slider (from 0 to 1) and watches:
 *
 *  - the value of y (fixed by the forward pass),
 *  - the value of the target t (their slider),
 *  - the loss L = ½(y − t)² lit up as a vertical bar, and
 *  - the gradient ∂L/∂y = (y − t) — a single, signed number.
 *
 * The right pane is a 1-D plot of L as a function of t with y held fixed,
 * a parabola minimised at t = y. A vertical line marks the slider's current
 * t. As the reader drags, the dot rides the parabola; the height drops to
 * zero exactly when t = y.
 *
 * Co-mutating state — both panes share the same target.
 */

const P = ILLUSTRATIVE_PARAMS
const X = [0.6, -0.4] as [number, number] // fixed input from Act 3 default
const F = forward(P, X)

export interface LossState {
  target: number
  interacting: boolean
}

export const INITIAL_LOSS: LossState = {
  target: 0.2,
  interacting: false,
}

const T_MIN = 0
const T_MAX = 1
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// Slider geometry on the LEFT pane.
const SLIDER_X_MIN = 120
const SLIDER_X_MAX = VIEW_W - 120
const SLIDER_Y = 340
const tToSliderX = (t: number) =>
  SLIDER_X_MIN + ((t - T_MIN) / (T_MAX - T_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const sliderXToT = (x: number) =>
  T_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (T_MAX - T_MIN)

/* ============================================================== */
/* LEFT PANE — slider, readouts, gradient                          */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: LossState
  onChange: (s: LossState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<number | null>(null)

  const update = useCallback(
    (t: number, interacting: boolean) =>
      onChange({ target: clamp(t, T_MIN, T_MAX), interacting }),
    [onChange],
  )

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startRef.current = state.target
    const start = startRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startX = tToSliderX(start)
    const newX = startX + mx * sx
    update(sliderXToT(newX), !last)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        const step = Math.abs(dx) >= 10 ? 0.1 : 0.02
        update(state.target + Math.sign(dx) * step, false)
      },
      [state.target, update],
    ),
  )

  const L = mse(F.y, state.target)
  const dy = F.y - state.target

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The network's prediction is y equals ${fmt2(F.y).trim()}. The target is t equals ${fmt2(state.target).trim()}. The loss is one-half times y minus t squared, which equals ${fmt2(L).trim()}. The gradient of the loss with respect to the output is y minus t, which equals ${fmt2(dy).trim()}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Loss for one example. Prediction ${fmt2(F.y).trim()}, target ${fmt2(state.target).trim()}, loss ${fmt2(L).trim()}, gradient with respect to y is ${fmt2(dy).trim()}.`}
      >
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />
        <text
          x={VIEW_W / 2}
          y="78"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ONE EXAMPLE · DRAG THE TARGET · WATCH THE LOSS
        </text>

        {/* Prediction tile (y) */}
        <Tile x={120} y={130} label="y (prediction)" value={fmt2(F.y).trim()} accent />
        {/* Target tile */}
        <Tile x={VIEW_W - 120} y={130} label="t (target)" value={fmt2(state.target).trim()} />

        {/* Loss bar — a vertical column that grows with L. Max L is 0.5 since
            both y and t are bounded in [0,1]. */}
        <g transform={`translate(${VIEW_W / 2}, 130)`}>
          <text
            x="0"
            y="-12"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            LOSS L = ½(y − t)²
          </text>
          {/* Track */}
          <rect x="-20" y="0" width="40" height="100" fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" />
          {/* Fill */}
          <rect
            x="-20"
            y={100 - Math.min(1, L / 0.5) * 100}
            width="40"
            height={Math.min(1, L / 0.5) * 100}
            fill="var(--color-vermilion)"
            opacity="0.85"
          />
          <text
            x="0"
            y="120"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-vermilion)"
          >
            {L.toFixed(3)}
          </text>
        </g>

        {/* Gradient readout in the middle of the canvas */}
        <text
          x={VIEW_W / 2}
          y={280}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          GRADIENT WITH RESPECT TO OUTPUT
        </text>
        <text
          x={VIEW_W / 2}
          y={306}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="16"
          fill="var(--color-vermilion)"
        >
          ∂L/∂y = y − t = {fmt2(dy).trim()}
        </text>

        {/* Slider */}
        <line x1={SLIDER_X_MIN} y1={SLIDER_Y} x2={SLIDER_X_MAX} y2={SLIDER_Y} stroke="var(--color-graph-ink)" strokeWidth="1.2" />
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={tToSliderX(v)} y1={SLIDER_Y - 6} x2={tToSliderX(v)} y2={SLIDER_Y + 6} stroke="var(--color-graph-ink)" strokeWidth="1" />
            <text x={tToSliderX(v)} y={SLIDER_Y + 22} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
              {v.toFixed(2)}
            </text>
          </g>
        ))}
        {/* Mark the prediction y on the slider track */}
        <g>
          <line x1={tToSliderX(F.y)} y1={SLIDER_Y - 14} x2={tToSliderX(F.y)} y2={SLIDER_Y + 14} stroke="var(--color-graph-fade)" strokeWidth="1.4" strokeDasharray="2 2" />
          <text x={tToSliderX(F.y)} y={SLIDER_Y - 18} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="var(--color-dim)">
            y
          </text>
        </g>
        {/* Handle */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Target t. Current value ${fmt2(state.target).trim()}. Arrow keys nudge.`}
          aria-valuemin={T_MIN}
          aria-valuemax={T_MAX}
          aria-valuenow={Number(state.target.toFixed(2))}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={tToSliderX(state.target)} cy={SLIDER_Y} r="22" fill="transparent" />
          <circle cx={tToSliderX(state.target)} cy={SLIDER_Y} r="8" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
        </g>
        <text
          x={SLIDER_X_MIN}
          y={SLIDER_Y - 28}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG t · ARROWS NUDGE
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 56}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          when t equals y, the loss is zero
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3a &mdash; The loss is the gap, squared
      </figcaption>
    </figure>
  )
}

function Tile({
  x,
  y,
  label,
  value,
  accent,
}: {
  x: number
  y: number
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <g>
      <text
        x={x}
        y={y - 10}
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="9"
        letterSpacing="0.22em"
        fill="var(--color-dim)"
      >
        {label.toUpperCase()}
      </text>
      <rect
        x={x - 40}
        y={y}
        width="80"
        height="40"
        fill="var(--color-cream)"
        stroke={accent ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
        strokeWidth={accent ? 1.6 : 1.2}
      />
      <text
        x={x}
        y={y + 26}
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="14"
        fill={accent ? 'var(--color-vermilion)' : 'var(--color-ink)'}
      >
        {value}
      </text>
    </g>
  )
}

/* ============================================================== */
/* RIGHT PANE — L(t) parabola                                       */
/* ============================================================== */

export function RightPane({ state }: { state: LossState; onChange: (s: LossState) => void }) {
  // Plot rect
  const PX0 = 100
  const PX1 = VIEW_W - 100
  const PY0 = 130
  const PY1 = 380
  const PW = PX1 - PX0
  const PH = PY1 - PY0
  const tToX = (t: number) => PX0 + (t - T_MIN) / (T_MAX - T_MIN) * PW
  // y-axis from 0 to 0.5 (max L given y, t ∈ [0,1])
  const L_MAX = 0.5
  const lToY = (l: number) => PY1 - (l / L_MAX) * PH

  // Sample the parabola in t ∈ [0,1] at fixed y.
  const ys = F.y
  const samples = Array.from({ length: 41 }, (_, i) => {
    const t = i / 40
    return { t, L: mse(ys, t) }
  })
  const path = samples
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${tToX(s.t).toFixed(2)} ${lToY(s.L).toFixed(2)}`)
    .join(' ')

  const L_now = mse(ys, state.target)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The loss as a function of the target t, with the prediction held fixed at ${fmt2(F.y).trim()}. The curve is a parabola minimised exactly where t equals y, which is where the network would be perfectly right for this example.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A parabola showing the loss as the target varies, with the prediction fixed. Current loss ${fmt2(L_now).trim()}.`}
      >
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />
        <text
          x={VIEW_W / 2}
          y="78"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          LOSS AS A FUNCTION OF THE TARGET
        </text>

        {/* Axes */}
        <line x1={PX0} y1={PY1} x2={PX1} y2={PY1} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <line x1={PX0} y1={PY0} x2={PX0} y2={PY1} stroke="var(--color-graph-ink)" strokeWidth="1" />
        {/* Axis labels */}
        <text x={PX1} y={PY1 + 18} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
          t
        </text>
        <text x={PX0 - 6} y={PY0 + 4} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
          L
        </text>
        {/* x ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={tToX(v)} y1={PY1} x2={tToX(v)} y2={PY1 + 4} stroke="var(--color-graph-ink)" strokeWidth="1" />
            <text x={tToX(v)} y={PY1 + 18} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="var(--color-dim)">
              {v.toFixed(2)}
            </text>
          </g>
        ))}

        {/* The parabola */}
        <path d={path} stroke="var(--color-vermilion)" strokeWidth="2" fill="none" />

        {/* Min line at t = y */}
        <line x1={tToX(F.y)} y1={PY0} x2={tToX(F.y)} y2={PY1} stroke="var(--color-graph-fade)" strokeWidth="1" strokeDasharray="2 2" />
        <text x={tToX(F.y)} y={PY0 - 6} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="var(--color-dim)">
          t = y
        </text>

        {/* Marker at current (target, L_now) */}
        <line x1={tToX(state.target)} y1={PY1} x2={tToX(state.target)} y2={lToY(L_now)} stroke="var(--color-vermilion)" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx={tToX(state.target)} cy={lToY(L_now)} r="6" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 70}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the slope is y minus t &mdash; easy to compute
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3b &mdash; A parabola in one variable
      </figcaption>
    </figure>
  )
}
