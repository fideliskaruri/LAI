import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  ILLUSTRATIVE_PARAMS,
  forward,
  fmt2,
} from './mlp'

/**
 * Act 3 — computing the prediction. Drag two input sliders (x1, x2) and
 * watch the pre-activations and activations propagate through the network.
 *
 *  Left  : the same 2 → 3 → 1 diagram from Act 2, but with live numbers on
 *          every neuron — pre-activation z above, activation h below — and
 *          two draggable input sliders at the left of the canvas. Watch the
 *          numbers cascade as you drag.
 *  Right : the right-hand pane shows the equations again, this time
 *          instantiated with the live numbers. Each line spells out the
 *          arithmetic for one neuron of the forward pass.
 *
 * Co-mutating state — both panes share the same (x1, x2).
 */

const P = ILLUSTRATIVE_PARAMS

export interface ForwardState {
  x1: number
  x2: number
  interacting: boolean
}

export const INITIAL_FORWARD: ForwardState = {
  x1: 0.6,
  x2: -0.4,
  interacting: false,
}

const X_MIN = -2
const X_MAX = 2
const SLIDER_X = 80
const SLIDER_Y_TOP = 200
const SLIDER_Y_BOT = 320
const SLIDER_H = 90
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

const xToSliderY = (v: number, yMid: number) =>
  yMid - (v / X_MAX) * (SLIDER_H / 2)
const sliderYToX = (y: number, yMid: number) =>
  -((y - yMid) / (SLIDER_H / 2)) * X_MAX

// Network coordinates — same as HiddenLayers, shifted to leave room for sliders.
const IN_X = 180
const HID_X = 340
const OUT_X = 500
const IN_Y = [SLIDER_Y_TOP, SLIDER_Y_BOT]
const HID_Y = [150, 250, 350]
const OUT_Y = 250

/* ============================================================== */
/* LEFT PANE — interactive sliders + flowing numbers               */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: ForwardState
  onChange: (s: ForwardState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handle1Ref = useRef<SVGGElement | null>(null)
  const handle2Ref = useRef<SVGGElement | null>(null)
  const startRef = useRef<{ x1: number; x2: number } | null>(null)

  const update = useCallback(
    (x1: number, x2: number, interacting: boolean) => {
      onChange({
        x1: clamp(x1, X_MIN, X_MAX),
        x2: clamp(x2, X_MIN, X_MAX),
        interacting,
      })
    },
    [onChange],
  )

  const bind1 = useDrag(({ first, last, movement: [, my] }) => {
    if (first) startRef.current = { x1: state.x1, x2: state.x2 }
    const start = startRef.current
    if (!start) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sy = VIEW_H / rect.height
    const startY = xToSliderY(start.x1, SLIDER_Y_TOP)
    const newY = startY + my * sy
    update(sliderYToX(newY, SLIDER_Y_TOP), state.x2, !last)
  })
  const bind2 = useDrag(({ first, last, movement: [, my] }) => {
    if (first) startRef.current = { x1: state.x1, x2: state.x2 }
    const start = startRef.current
    if (!start) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sy = VIEW_H / rect.height
    const startY = xToSliderY(start.x2, SLIDER_Y_BOT)
    const newY = startY + my * sy
    update(state.x1, sliderYToX(newY, SLIDER_Y_BOT), !last)
  })

  useKeyNudge(
    handle1Ref,
    useCallback(
      (_dx: number, dy: number) => {
        const step = Math.abs(dy) >= 10 ? 0.2 : 0.05
        update(state.x1 + Math.sign(dy) * step, state.x2, false)
      },
      [state.x1, state.x2, update],
    ),
  )
  useKeyNudge(
    handle2Ref,
    useCallback(
      (_dx: number, dy: number) => {
        const step = Math.abs(dy) >= 10 ? 0.2 : 0.05
        update(state.x1, state.x2 + Math.sign(dy) * step, false)
      },
      [state.x1, state.x2, update],
    ),
  )

  const f = forward(P, [state.x1, state.x2])

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Forward pass with x1 equals ${fmt2(state.x1).trim()} and x2 equals ${fmt2(state.x2).trim()}. The three hidden activations are ${fmt2(f.h[0]).trim()}, ${fmt2(f.h[1]).trim()}, and ${fmt2(f.h[2]).trim()}. The output is ${fmt2(f.y).trim()}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Live forward pass through a 2-to-3-to-1 MLP. Inputs ${fmt2(state.x1).trim()} and ${fmt2(state.x2).trim()} produce hidden activations ${fmt2(f.h[0]).trim()}, ${fmt2(f.h[1]).trim()}, ${fmt2(f.h[2]).trim()} and output ${fmt2(f.y).trim()}.`}
      >
        {/* Frame */}
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
          FORWARD PASS · DRAG INPUTS · WATCH VALUES CASCADE
        </text>

        {/* Two slider tracks at the left, each driving x1 or x2 */}
        <SliderTrack
          x={SLIDER_X}
          yMid={SLIDER_Y_TOP}
          label="x₁"
          value={state.x1}
        />
        <SliderTrack
          x={SLIDER_X}
          yMid={SLIDER_Y_BOT}
          label="x₂"
          value={state.x2}
        />

        {/* Slider handles (focusable, draggable) */}
        <g
          {...bind1()}
          ref={handle1Ref}
          tabIndex={0}
          role="slider"
          aria-label={`Input x1, value ${fmt2(state.x1).trim()}. Up arrow to increase, down arrow to decrease.`}
          aria-valuemin={X_MIN}
          aria-valuemax={X_MAX}
          aria-valuenow={Number(state.x1.toFixed(2))}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={SLIDER_X} cy={xToSliderY(state.x1, SLIDER_Y_TOP)} r="22" fill="transparent" />
          <circle cx={SLIDER_X} cy={xToSliderY(state.x1, SLIDER_Y_TOP)} r="8" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
        </g>
        <g
          {...bind2()}
          ref={handle2Ref}
          tabIndex={0}
          role="slider"
          aria-label={`Input x2, value ${fmt2(state.x2).trim()}. Up arrow to increase, down arrow to decrease.`}
          aria-valuemin={X_MIN}
          aria-valuemax={X_MAX}
          aria-valuenow={Number(state.x2.toFixed(2))}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={SLIDER_X} cy={xToSliderY(state.x2, SLIDER_Y_BOT)} r="22" fill="transparent" />
          <circle cx={SLIDER_X} cy={xToSliderY(state.x2, SLIDER_Y_BOT)} r="8" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
        </g>

        {/* Edges input → hidden */}
        {IN_Y.map((y1, i) =>
          HID_Y.map((y2, j) => (
            <line
              key={`ih-${i}-${j}`}
              x1={IN_X + 16}
              y1={y1}
              x2={HID_X - 18}
              y2={y2}
              stroke="var(--color-graph-ink)"
              strokeWidth="1.1"
              strokeOpacity="0.6"
            />
          )),
        )}
        {/* Edges hidden → output */}
        {HID_Y.map((y, i) => (
          <line
            key={`ho-${i}`}
            x1={HID_X + 20}
            y1={y}
            x2={OUT_X - 22}
            y2={OUT_Y}
            stroke="var(--color-vermilion)"
            strokeWidth="1.4"
            strokeOpacity="0.7"
          />
        ))}

        {/* Input value labels */}
        <ValueNode x={IN_X} y={SLIDER_Y_TOP} top={fmt2(state.x1).trim()} bottom="x₁" />
        <ValueNode x={IN_X} y={SLIDER_Y_BOT} top={fmt2(state.x2).trim()} bottom="x₂" />

        {/* Hidden neurons — show z above, h below */}
        {HID_Y.map((y, i) => (
          <NeuronNode
            key={`hid-${i}`}
            x={HID_X}
            y={y}
            label={`h${i + 1}`}
            zVal={fmt2(f.zh[i]).trim()}
            actVal={fmt2(f.h[i]).trim()}
          />
        ))}

        {/* Output neuron */}
        <NeuronNode
          x={OUT_X}
          y={OUT_Y}
          label="y"
          zVal={fmt2(f.zo).trim()}
          actVal={fmt2(f.y).trim()}
          output
        />

        {/* Output arrow */}
        <line
          x1={OUT_X + 24}
          y1={OUT_Y}
          x2={OUT_X + 56}
          y2={OUT_Y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
        />
        <polygon
          points={`${OUT_X + 62},${OUT_Y} ${OUT_X + 54},${OUT_Y - 5} ${OUT_X + 54},${OUT_Y + 5}`}
          fill="var(--color-graph-ink)"
        />

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 56}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG · ARROWS NUDGE · VALUES PROPAGATE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2a &mdash; The forward pass, live
      </figcaption>
    </figure>
  )
}

function SliderTrack({
  x,
  yMid,
  label,
  value,
}: {
  x: number
  yMid: number
  label: string
  value: number
}) {
  return (
    <g>
      <line
        x1={x}
        y1={yMid - SLIDER_H / 2}
        x2={x}
        y2={yMid + SLIDER_H / 2}
        stroke="var(--color-graph-ink)"
        strokeWidth="1.2"
      />
      {[-2, -1, 0, 1, 2].map((v) => (
        <line
          key={v}
          x1={x - 5}
          y1={xToSliderY(v, yMid)}
          x2={x + 5}
          y2={xToSliderY(v, yMid)}
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />
      ))}
      <text
        x={x - 22}
        y={yMid + 4}
        textAnchor="end"
        fontFamily="JetBrains Mono, monospace"
        fontSize="11"
        fill="var(--color-dim)"
      >
        {label}
      </text>
      <text
        x={x}
        y={yMid + SLIDER_H / 2 + 18}
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="10"
        fill="var(--color-vermilion)"
      >
        {value.toFixed(2)}
      </text>
    </g>
  )
}

function ValueNode({
  x,
  y,
  top,
  bottom,
}: {
  x: number
  y: number
  top: string
  bottom: string
}) {
  return (
    <g>
      <circle cx={x} cy={y} r="16" fill="var(--color-cream)" stroke="var(--color-graph-ink)" strokeWidth="1.4" />
      <text x={x} y={y + 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-ink)">
        {top}
      </text>
      <text x={x} y={y + 32} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
        {bottom}
      </text>
    </g>
  )
}

function NeuronNode({
  x,
  y,
  label,
  zVal,
  actVal,
  output,
}: {
  x: number
  y: number
  label: string
  zVal: string
  actVal: string
  output?: boolean
}) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={output ? 22 : 19}
        fill="var(--color-cream)"
        stroke="var(--color-vermilion)"
        strokeWidth={output ? 2 : 1.6}
      />
      <text x={x} y={y + 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
        {label}
      </text>
      <text x={x} y={y - 30} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="var(--color-dim)">
        z={zVal}
      </text>
      <text x={x} y={y + 38} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-ink)">
        ={actVal}
      </text>
    </g>
  )
}

/* ============================================================== */
/* RIGHT PANE — live equations                                     */
/* ============================================================== */

export function RightPane({ state }: { state: ForwardState; onChange: (s: ForwardState) => void }) {
  const f = forward(P, [state.x1, state.x2])

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Equations of the forward pass with live numbers. Each hidden pre-activation is a dot product of weights and inputs plus a bias; each hidden activation is sigmoid of the pre-activation. The output is the sigmoid of a weighted sum of the hidden activations.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Live forward-pass equations: hidden activations ${fmt2(f.h[0]).trim()}, ${fmt2(f.h[1]).trim()}, ${fmt2(f.h[2]).trim()}, output ${fmt2(f.y).trim()}.`}
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
          FORWARD PASS · h = σ(Wx + b) · y = σ(Vh + c)
        </text>

        {/* Hidden equations: three rows */}
        <text
          x={70}
          y={120}
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          HIDDEN LAYER
        </text>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(70, ${140 + i * 50})`}>
            <text fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-ink)">
              z{sub(i + 1)} = {fmt2(ILLUSTRATIVE_PARAMS.W[i][0])}·x₁ + {fmt2(ILLUSTRATIVE_PARAMS.W[i][1])}·x₂ + {fmt2(ILLUSTRATIVE_PARAMS.b[i])}
            </text>
            <text y="16" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
              = {fmt2(f.zh[i])}      h{sub(i + 1)} = σ(z{sub(i + 1)}) = {fmt2(f.h[i])}
            </text>
          </g>
        ))}

        {/* Output equation */}
        <text
          x={70}
          y={310}
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          OUTPUT LAYER
        </text>
        <text x={70} y={332} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-ink)">
          z = {fmt2(ILLUSTRATIVE_PARAMS.V[0])}·h₁ + {fmt2(ILLUSTRATIVE_PARAMS.V[1])}·h₂ + {fmt2(ILLUSTRATIVE_PARAMS.V[2])}·h₃ + {fmt2(ILLUSTRATIVE_PARAMS.c)}
        </text>
        <text x={70} y={350} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
          = {fmt2(f.zo)}      y = σ(z) = {fmt2(f.y)}
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 70}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          two dot products and two squashes &mdash; that&rsquo;s the prediction
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2b &mdash; The same calculation, written out
      </figcaption>
    </figure>
  )
}

const SUBSCRIPTS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']
function sub(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUBSCRIPTS[Number(d)])
    .join('')
}
