import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Chain rule: two stacked function "machines."
 *
 *   Top:    g(x) = 2x         slope of g is 2 everywhere
 *   Bottom: f(u) = u²         slope of f at u is 2u
 *
 * The composite is h(x) = f(g(x)) = (2x)² = 4x², slope 8x.
 *
 * The teaching: the composite's slope = top slope × bottom slope, with
 * the bottom slope evaluated at the top's output. Drag the input x; both
 * outputs update; vermilion arrows propagate the slope down. The product
 * 2 · (2 · 2x) = 8x is shown live in the readout.
 *
 * Keyboard: arrows nudge x by 0.1, Shift+arrow by 1.
 */

const VIEW_W = 600
const VIEW_H = 480

const X_MIN = -2
const X_MAX = 2

const g = (x: number) => 2 * x
const f = (u: number) => u * u
const gp = (_: number) => 2
const fp = (u: number) => 2 * u

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

const SLIDER_X_MIN = 100
const SLIDER_X_MAX = VIEW_W - 100
const SLIDER_Y = 90

const xToSliderX = (x: number) =>
  SLIDER_X_MIN + ((x - X_MIN) / (X_MAX - X_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const sliderXToX = (px: number) =>
  X_MIN + ((px - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (X_MAX - X_MIN)

const MACHINE_W = 180
const MACHINE_H = 88
const MACHINE_CX = VIEW_W / 2
const G_MACHINE_Y = 150
const F_MACHINE_Y = 280

export function ChainRule() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const [x, setX] = useState(0.8)
  const [isInteracting, setIsInteracting] = useState(false)
  const startXRef = useRef<number | null>(null)

  const clampX = (v: number) => Math.max(X_MIN, Math.min(X_MAX, v))

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) {
      startXRef.current = x
      setIsInteracting(true)
    }
    if (last) setIsInteracting(false)
    const start = startXRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startPx = xToSliderX(start)
    const newPx = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startPx + mx * sx))
    setX(clampX(sliderXToX(newPx)))
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? Math.sign(dx) : Math.sign(dx) * 0.1
        setX((cur) => clampX(cur + step))
      },
      [],
    ),
  )

  const u = g(x)
  const y = f(u)
  const slopeG = gp(x)
  const slopeF = fp(u)
  const composite = slopeG * slopeF
  const truthComposite = 8 * x // d/dx (2x)² = 8x

  const sliderX = xToSliderX(x)

  // Machine geometry
  const gBox = {
    x: MACHINE_CX - MACHINE_W / 2,
    y: G_MACHINE_Y,
    cx: MACHINE_CX,
    inX: MACHINE_CX,
    inY: G_MACHINE_Y,
    outX: MACHINE_CX,
    outY: G_MACHINE_Y + MACHINE_H,
  }
  const fBox = {
    x: MACHINE_CX - MACHINE_W / 2,
    y: F_MACHINE_Y,
    cx: MACHINE_CX,
    inX: MACHINE_CX,
    inY: F_MACHINE_Y,
    outX: MACHINE_CX,
    outY: F_MACHINE_Y + MACHINE_H,
  }

  const narrationText = `Input x equals ${fmt(x).trim()}. The top machine, g of x equals 2 x, outputs ${fmt(u).trim()}. The bottom machine, f of u equals u squared, outputs ${fmt(y).trim()}. The top machine's slope is 2; the bottom machine's slope at u equals ${fmt(u).trim()} is ${fmt(slopeF).trim()}. The composite slope is their product: ${fmt(composite).trim()}.`

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
        aria-label={`Two stacked function machines. Top: g of x equals 2 x with output ${fmt(u).trim()}. Bottom: f of u equals u squared with output ${fmt(y).trim()}. Composite slope ${fmt(composite).trim()}.`}
      >
        {/* Header */}
        <text x={36} y={40} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          CHAIN RULE  ·  SLOPES MULTIPLY
        </text>
        <text x={36} y={58} fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-ink)">
          h(x) = f(g(x))  &nbsp;&rArr;&nbsp; h′(x) = f′(g(x)) &middot; g′(x)
        </text>

        {/* Input slider */}
        <line
          x1={SLIDER_X_MIN}
          y1={SLIDER_Y}
          x2={SLIDER_X_MAX}
          y2={SLIDER_Y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        {[-2, -1, 0, 1, 2].map((v) => (
          <g key={v}>
            <line
              x1={xToSliderX(v)}
              y1={SLIDER_Y - 5}
              x2={xToSliderX(v)}
              y2={SLIDER_Y + 5}
              stroke="var(--color-graph-ink)"
              strokeWidth="1"
            />
            <text
              x={xToSliderX(v)}
              y={SLIDER_Y + 18}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {v}
            </text>
          </g>
        ))}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Input x. Current value ${fmt(x).trim()}. Arrow keys to nudge.`}
          aria-valuemin={X_MIN}
          aria-valuemax={X_MAX}
          aria-valuenow={Number(x.toFixed(2))}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={sliderX} cy={SLIDER_Y} r="22" fill="transparent" />
          <circle
            cx={sliderX}
            cy={SLIDER_Y}
            r="8"
            fill="var(--color-vermilion)"
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
        </g>
        <text x={SLIDER_X_MIN} y={SLIDER_Y - 12} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
          INPUT  ·  x
        </text>
        <text
          x={sliderX}
          y={SLIDER_Y - 14}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          x = {fmt(x).trim()}
        </text>

        {/* Wire from slider down into the top machine */}
        <line x1={sliderX} y1={SLIDER_Y + 12} x2={sliderX} y2={gBox.inY - 6} stroke="var(--color-vermilion)" strokeWidth="1.6" strokeOpacity="0.5" />
        <line x1={sliderX} y1={gBox.inY - 6} x2={gBox.inX} y2={gBox.inY - 6} stroke="var(--color-vermilion)" strokeWidth="1.6" strokeOpacity="0.5" />
        <line x1={gBox.inX} y1={gBox.inY - 6} x2={gBox.inX} y2={gBox.inY} stroke="var(--color-vermilion)" strokeWidth="2.2" />
        {/* Arrowhead onto top machine */}
        <polygon
          points={`${gBox.inX},${gBox.inY + 2} ${gBox.inX - 5},${gBox.inY - 6} ${gBox.inX + 5},${gBox.inY - 6}`}
          fill="var(--color-vermilion)"
        />

        {/* Top machine: g(x) = 2x */}
        <Machine
          box={gBox}
          name="g"
          formula="g(x) = 2x"
          slopeLabel={`g′(x) = ${fmt(slopeG).trim()}`}
          inLabel={`x = ${fmt(x).trim()}`}
          outLabel={`u = g(x) = ${fmt(u).trim()}`}
        />

        {/* Wire from top output to bottom input — and the slope-propagation
            annotation hangs off this wire. */}
        <line
          x1={gBox.outX}
          y1={gBox.outY}
          x2={fBox.inX}
          y2={fBox.inY}
          stroke="var(--color-vermilion)"
          strokeWidth="2.2"
        />
        <polygon
          points={`${fBox.inX},${fBox.inY + 2} ${fBox.inX - 5},${fBox.inY - 6} ${fBox.inX + 5},${fBox.inY - 6}`}
          fill="var(--color-vermilion)"
        />

        {/* Slope multiplier badge on the wire between machines */}
        <g transform={`translate(${gBox.outX + 28}, ${(gBox.outY + fBox.inY) / 2 - 12})`}>
          <rect width="120" height="24" rx="2" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="1" />
          <text x="60" y="16" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
            g′·f′ propagates
          </text>
        </g>

        {/* Bottom machine: f(u) = u² */}
        <Machine
          box={fBox}
          name="f"
          formula="f(u) = u²"
          slopeLabel={`f′(u) = ${fmt(slopeF).trim()}`}
          inLabel={`u = ${fmt(u).trim()}`}
          outLabel={`y = f(u) = ${fmt(y).trim()}`}
        />

        {/* Final composite slope readout */}
        <g transform={`translate(${VIEW_W / 2}, ${VIEW_H - 70})`}>
          <text textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
            COMPOSITE SLOPE  ·  h′(x) = f′(g(x)) · g′(x)
          </text>
          <text
            y="24"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="16"
            fill="var(--color-vermilion)"
          >
            {fmt(slopeF).trim()} × {fmt(slopeG).trim()} = {fmt(composite).trim()}
          </text>
          <text
            y="44"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-dim)"
          >
            check: d/dx (2x)² = 8x = {fmt(truthComposite).trim()}
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5 &mdash; Two machines, stacked. Slopes propagate, multiplying as they go.
      </figcaption>
    </figure>
  )
}

interface MachineBox {
  x: number
  y: number
  cx: number
  inX: number
  inY: number
  outX: number
  outY: number
}

interface MachineProps {
  box: MachineBox
  name: string
  formula: string
  slopeLabel: string
  inLabel: string
  outLabel: string
}

function Machine({ box, name, formula, slopeLabel, inLabel, outLabel }: MachineProps) {
  return (
    <g>
      <rect
        x={box.x}
        y={box.y}
        width={MACHINE_W}
        height={MACHINE_H}
        fill="var(--color-paper)"
        stroke="var(--color-graph-ink)"
        strokeWidth="1.4"
        rx="4"
      />
      {/* "Gear" decoration to make it feel like a machine */}
      <circle cx={box.x + 24} cy={box.y + MACHINE_H / 2} r="9" fill="none" stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.5" />
      <circle cx={box.x + 24} cy={box.y + MACHINE_H / 2} r="3" fill="var(--color-graph-ink)" fillOpacity="0.5" />
      <circle cx={box.x + MACHINE_W - 24} cy={box.y + MACHINE_H / 2} r="9" fill="none" stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.5" />
      <circle cx={box.x + MACHINE_W - 24} cy={box.y + MACHINE_H / 2} r="3" fill="var(--color-graph-ink)" fillOpacity="0.5" />

      <text
        x={box.cx}
        y={box.y + 26}
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="10"
        letterSpacing="0.22em"
        fill="var(--color-dim)"
      >
        MACHINE {name.toUpperCase()}
      </text>
      <text
        x={box.cx}
        y={box.y + 48}
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontStyle="italic"
        fontSize="14"
        fill="var(--color-paper-ink)"
      >
        {formula}
      </text>
      <text
        x={box.cx}
        y={box.y + 68}
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="11"
        fill="var(--color-vermilion)"
      >
        {slopeLabel}
      </text>

      {/* Side labels: input on the left, output on the right */}
      <text
        x={box.x - 12}
        y={box.y + 14}
        textAnchor="end"
        fontFamily="JetBrains Mono, monospace"
        fontSize="11"
        fill="var(--color-dim)"
      >
        in
      </text>
      <text
        x={box.x - 12}
        y={box.y + 28}
        textAnchor="end"
        fontFamily="JetBrains Mono, monospace"
        fontSize="11"
        fill="var(--color-ink)"
      >
        {inLabel}
      </text>
      <text
        x={box.x + MACHINE_W + 12}
        y={box.y + MACHINE_H - 14}
        fontFamily="JetBrains Mono, monospace"
        fontSize="11"
        fill="var(--color-dim)"
      >
        out
      </text>
      <text
        x={box.x + MACHINE_W + 12}
        y={box.y + MACHINE_H + 2}
        fontFamily="JetBrains Mono, monospace"
        fontSize="11"
        fill="var(--color-ink)"
      >
        {outLabel}
      </text>
    </g>
  )
}
