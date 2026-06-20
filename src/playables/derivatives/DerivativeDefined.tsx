import { useCallback, useEffect, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * The derivative defined as a limit. f(x) = x², x is anchored at x = 1.
 * A horizontal slider controls h, the gap between the anchored point and
 * its sibling (x+h, f(x+h)). As h shrinks, the ratio
 *
 *   [f(x+h) - f(x)] / h
 *
 * approaches f'(x) = 2x. The readout is in JetBrains Mono; the limit
 * expression is rendered as LaTeX-like text inside the SVG so it stays
 * visually consistent with the canvas and avoids a runtime KaTeX
 * dependency for this specific frame (the prose block carries the KaTeX
 * version too).
 *
 * Keyboard: the slider handle is tab-focusable; arrows nudge h by 0.05
 * (small) and Shift+arrow by 0.5 (large), clamped to [0.001, 2].
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 340
const UNIT_X = 60
const UNIT_Y = 28

const X_MIN = -2
const X_MAX = 3.4

const X_ANCHOR = 1
const H_MIN = 0.001
const H_MAX = 2
const H_INIT = 1.4

const f = (x: number) => x * x
const fPrime = (x: number) => 2 * x

const fmt = (n: number, p = 2) => (n >= 0 ? ' ' : '') + n.toFixed(p)
const fmtH = (h: number) => h.toFixed(h < 0.01 ? 4 : h < 0.1 ? 3 : 2)

const SLIDER_Y = VIEW_H - 50
const SLIDER_X_MIN = 90
const SLIDER_X_MAX = VIEW_W - 90

const hToSliderX = (h: number) => {
  // log-scale gives the small h values a useable amount of room
  const lo = Math.log(H_MIN)
  const hi = Math.log(H_MAX)
  const t = (Math.log(h) - lo) / (hi - lo)
  return SLIDER_X_MIN + t * (SLIDER_X_MAX - SLIDER_X_MIN)
}
const sliderXToH = (x: number) => {
  const t = (x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)
  const lo = Math.log(H_MIN)
  const hi = Math.log(H_MAX)
  return Math.exp(lo + t * (hi - lo))
}

function curvePath() {
  const steps = 240
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / steps
    const y = f(x)
    const px = ORIGIN_X + x * UNIT_X
    const py = ORIGIN_Y - y * UNIT_Y
    if (py < 40 || py > VIEW_H - 90) continue
    pts.push(`${pts.length === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return pts.join(' ')
}

export function DerivativeDefined() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const [h, setH] = useState(H_INIT)
  const [isInteracting, setIsInteracting] = useState(false)
  const startHRef = useRef<number | null>(null)

  const clampH = (v: number) => Math.max(H_MIN, Math.min(H_MAX, v))

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) {
      startHRef.current = h
      setIsInteracting(true)
    }
    if (last) setIsInteracting(false)
    const start = startHRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startX = hToSliderX(start)
    const newX = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startX + mx * sx))
    setH(clampH(sliderXToH(newX)))
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        // Nudge in slider-space units so the log scale stays usable.
        const px = hToSliderX(h)
        const sliderW = SLIDER_X_MAX - SLIDER_X_MIN
        const stepPx =
          Math.abs(dx) >= 10
            ? Math.sign(dx) * (sliderW * 0.1)
            : Math.sign(dx) * (sliderW * 0.02)
        const newPx = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, px + stepPx))
        setH(clampH(sliderXToH(newPx)))
      },
      [h],
    ),
  )

  // Compute the difference quotient.
  const xA = X_ANCHOR
  const yA = f(xA)
  const xB = xA + h
  const yB = f(xB)
  const quotient = (yB - yA) / h
  const truth = fPrime(xA)
  const error = quotient - truth

  const A = { x: ORIGIN_X + xA * UNIT_X, y: ORIGIN_Y - yA * UNIT_Y }
  const B = { x: ORIGIN_X + xB * UNIT_X, y: ORIGIN_Y - yB * UNIT_Y }

  // Secant extended a touch past both endpoints so it reads as a line.
  const dx = B.x - A.x
  const dy = B.y - A.y
  const extend = 36
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const lineL = { x: A.x - ux * extend, y: A.y - uy * extend }
  const lineR = { x: B.x + ux * extend, y: B.y + uy * extend }

  // h marker on the x-axis: a horizontal bracket from xA to xA+h.
  const hBracketY = ORIGIN_Y + 22

  // Narration
  let narrationText: string
  let priority: 'normal' | 'high' = 'normal'
  if (h <= 0.01) {
    narrationText = `h is now essentially zero, around ${fmtH(h)}. The difference quotient equals ${fmt(quotient).trim()}, indistinguishable from the limit f prime at one, which is two. This is the derivative.`
    priority = 'high'
  } else if (h < 0.1) {
    narrationText = `h equals ${fmtH(h)}. The ratio f of one plus h minus f of one over h equals ${fmt(quotient).trim()}, very close to the limit value of two.`
  } else {
    narrationText = `h equals ${fmtH(h)}. The ratio f of one plus h minus f of one over h equals ${fmt(quotient).trim()}. As h shrinks, this approaches f prime of one equals two.`
  }

  // For the priority hold: only fire 'high' on transitioning into the
  // tiny-h regime, not every frame.
  const wasTinyRef = useRef<boolean>(h <= 0.01)
  useEffect(() => {
    const tiny = h <= 0.01
    wasTinyRef.current = tiny
  }, [h])

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narrationText}
        priority={priority}
        isInteracting={isInteracting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`f of x equals x squared with anchored point at x equals one. A second point sits at x equals one plus h, where h is ${fmtH(h)}. The difference quotient equals ${fmt(quotient).trim()}; the limit as h goes to zero is two.`}
      >
        <Grid />
        <Axes />

        {/* The parabola */}
        <path
          d={curvePath()}
          fill="none"
          stroke="var(--color-vermilion)"
          strokeWidth="2"
          strokeOpacity="0.55"
          strokeLinejoin="round"
        />

        {/* The true tangent at x = 1 (ghostly, for reference) */}
        {(() => {
          const t = truth
          const tL = ORIGIN_X + X_MIN * UNIT_X
          const tR = ORIGIN_X + X_MAX * UNIT_X
          const yL = ORIGIN_Y - (yA + t * (X_MIN - xA)) * UNIT_Y
          const yR = ORIGIN_Y - (yA + t * (X_MAX - xA)) * UNIT_Y
          return (
            <line
              x1={tL}
              y1={yL}
              x2={tR}
              y2={yR}
              stroke="var(--color-vermilion)"
              strokeWidth="1.4"
              strokeOpacity="0.32"
              strokeDasharray="2 4"
            />
          )
        })()}

        {/* The secant (the one our quotient slope describes) */}
        <line
          x1={lineL.x}
          y1={lineL.y}
          x2={lineR.x}
          y2={lineR.y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
          strokeOpacity="0.6"
        />
        <line
          x1={A.x}
          y1={A.y}
          x2={B.x}
          y2={B.y}
          stroke="var(--color-vermilion)"
          strokeWidth="2.4"
        />

        {/* h-bracket on x-axis */}
        <line x1={A.x} y1={hBracketY - 4} x2={A.x} y2={hBracketY + 4} stroke="var(--color-dim)" strokeWidth="1" />
        <line x1={B.x} y1={hBracketY - 4} x2={B.x} y2={hBracketY + 4} stroke="var(--color-dim)" strokeWidth="1" />
        <line x1={A.x} y1={hBracketY} x2={B.x} y2={hBracketY} stroke="var(--color-dim)" strokeWidth="1" />
        <text
          x={(A.x + B.x) / 2}
          y={hBracketY + 16}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-dim)"
        >
          h = {fmtH(h)}
        </text>

        {/* Anchored point A at (1, 1) */}
        <circle cx={A.x} cy={A.y} r="6" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
        <text
          x={A.x - 22}
          y={A.y - 10}
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-ink)"
        >
          (1, 1)
        </text>

        {/* Sibling point B at (1 + h, (1 + h)²) */}
        <circle cx={B.x} cy={B.y} r="5" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="2" />
        <text
          x={B.x + 8}
          y={B.y - 6}
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-ink)"
        >
          (1+h, (1+h)²)
        </text>

        {/* Readout box — top-left */}
        <g transform="translate(36, 30)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            DIFFERENCE QUOTIENT  ·  f(x)=x², x=1
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
            [f(1+h) − f(1)] / h
          </text>
          <text y="42" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
            = [(1+h)² − 1] / h
          </text>
          <text y="62" fontFamily="JetBrains Mono, monospace" fontSize="16" fill="var(--color-vermilion)">
            = {fmt(quotient).trim()}
          </text>
          <text y="80" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            limit = 2 &nbsp;·&nbsp; gap = {fmt(Math.abs(error)).trim()}
          </text>
        </g>

        {/* Limit expression — top-right (large, as a hint of what falls out) */}
        <g transform={`translate(${VIEW_W - 36}, 30)`}>
          <text
            textAnchor="end"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            AS h → 0
          </text>
          <text
            y="22"
            textAnchor="end"
            fontFamily="Georgia, serif"
            fontStyle="italic"
            fontSize="13"
            fill="var(--color-dim)"
          >
            lim<tspan dy="2" fontSize="9"> h→0</tspan>
            <tspan dy="-2"> [f(x+h)−f(x)] / h</tspan>
          </text>
          <text
            y="44"
            textAnchor="end"
            fontFamily="Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-vermilion)"
          >
            = f′(x)
          </text>
        </g>

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
          {[0.001, 0.01, 0.1, 1, 2].map((v) => (
            <g key={v}>
              <line
                x1={hToSliderX(v)}
                y1={SLIDER_Y - 5}
                x2={hToSliderX(v)}
                y2={SLIDER_Y + 5}
                stroke="var(--color-graph-ink)"
                strokeWidth="0.8"
              />
              <text
                x={hToSliderX(v)}
                y={SLIDER_Y + 20}
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
            aria-label={`h, the gap between the two points on the curve. Current value ${fmtH(h)}. Arrow keys to nudge, Shift plus arrow to step larger. Pull toward zero.`}
            aria-valuemin={H_MIN}
            aria-valuemax={H_MAX}
            aria-valuenow={Number(h.toFixed(4))}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={hToSliderX(h)} cy={SLIDER_Y} r="22" fill="transparent" />
            <circle
              cx={hToSliderX(h)}
              cy={SLIDER_Y}
              r="8"
              fill="var(--color-vermilion)"
              stroke="var(--color-cream)"
              strokeWidth="2"
            />
          </g>
          <text
            x={SLIDER_X_MIN}
            y={SLIDER_Y - 14}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            DRAG h  ·  THE RATIO APPROACHES f′(1) = 2
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3 &mdash; The limit, written down. As h shrinks, the ratio approaches the slope.
      </figcaption>
    </figure>
  )
}

function Grid() {
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const gx = ORIGIN_X + (i - 5) * UNIT_X
        return (
          <line
            key={`v-${i}`}
            x1={gx}
            y1="40"
            x2={gx}
            y2={VIEW_H - 90}
            stroke="var(--color-graph-fade)"
            strokeWidth="0.5"
          />
        )
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const gy = ORIGIN_Y - i * UNIT_Y
        if (gy < 40 || gy > VIEW_H - 90) return null
        return (
          <line
            key={`h-${i}`}
            x1="20"
            y1={gy}
            x2={VIEW_W - 20}
            y2={gy}
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
      <line x1="20" y1={ORIGIN_Y} x2={VIEW_W - 20} y2={ORIGIN_Y} stroke="var(--color-graph-ink)" strokeWidth="1" />
      <line x1={ORIGIN_X} y1="40" x2={ORIGIN_X} y2={VIEW_H - 90} stroke="var(--color-graph-ink)" strokeWidth="1" />
      <text x={VIEW_W - 30} y={ORIGIN_Y - 8} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">x</text>
      <text x={ORIGIN_X + 8} y="50" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">f(x)</text>
    </>
  )
}
