import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * The integral, defined. Same scene as Riemann sums but the typography
 * leans into the limit: the integral sign ∫₀³ x² dx = 9 is rendered
 * large at top-right, and the right-hand sum (n=4 baseline) converges
 * to it as the user pushes n higher.
 *
 * One slider: n from 1 to 200 (slightly more headroom than the previous
 * act, so the convergence reads visually). Keyboard: arrows nudge n;
 * Shift+arrow steps by 10.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const PLOT_ORIGIN_X = 110
const PLOT_ORIGIN_Y = 340
const X_UNIT = 110
const Y_UNIT = 30

const X_MIN = 0
const X_MAX = 3
const Y_MAX = 9.5

const N_MIN = 1
const N_MAX = 200
const N_INIT = 12

const SLIDER_X_MIN = 100
const SLIDER_X_MAX = VIEW_W - 100
const SLIDER_Y = VIEW_H - 36

const f = (x: number) => x * x
const TRUE_AREA = 9

const fmt = (n: number, p = 4) => n.toFixed(p)

const nToSliderX = (n: number) => {
  const lo = Math.log(N_MIN)
  const hi = Math.log(N_MAX)
  const t = (Math.log(n) - lo) / (hi - lo)
  return SLIDER_X_MIN + t * (SLIDER_X_MAX - SLIDER_X_MIN)
}
const sliderXToN = (x: number) => {
  const t = (x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)
  const lo = Math.log(N_MIN)
  const hi = Math.log(N_MAX)
  return Math.exp(lo + t * (hi - lo))
}

function toPx(x: number, y: number) {
  return {
    px: PLOT_ORIGIN_X + x * X_UNIT,
    py: PLOT_ORIGIN_Y - y * Y_UNIT,
  }
}

function curvePath() {
  const steps = 140
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / steps
    const y = f(x)
    const { px, py } = toPx(x, y)
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return pts.join(' ')
}

function midpointSum(n: number): number {
  const dx = (X_MAX - X_MIN) / n
  let s = 0
  for (let i = 0; i < n; i++) {
    const x = X_MIN + (i + 0.5) * dx
    s += f(x) * dx
  }
  return s
}

export function IntegralDefined() {
  void ORIGIN_X
  void ORIGIN_Y
  void UNIT

  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const [nRaw, setNRaw] = useState<number>(N_INIT)
  const [isInteracting, setIsInteracting] = useState(false)
  const startNRef = useRef<number | null>(null)

  const n = Math.max(N_MIN, Math.min(N_MAX, Math.round(nRaw)))
  const clampN = (v: number) => Math.max(N_MIN, Math.min(N_MAX, v))

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) {
      startNRef.current = nRaw
      setIsInteracting(true)
    }
    if (last) setIsInteracting(false)
    const start = startNRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startPx = nToSliderX(start)
    const newPx = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startPx + mx * sx))
    setNRaw(clampN(sliderXToN(newPx)))
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? Math.sign(dx) * 10 : Math.sign(dx)
        setNRaw((cur) => clampN(Math.round(cur) + step))
      },
      [],
    ),
  )

  const sum = midpointSum(n)
  const gap = Math.abs(TRUE_AREA - sum)
  const isAtLimit = gap < 0.001

  const dx = (X_MAX - X_MIN) / n
  const rects: Array<{ x: number; y: number; w: number; h: number }> = []
  for (let i = 0; i < n; i++) {
    const xL = X_MIN + i * dx
    const xM = xL + dx / 2
    const h = f(xM)
    const { px: pxL } = toPx(xL, 0)
    const { px: pxR } = toPx(xL + dx, 0)
    const { py: pyTop } = toPx(0, h)
    const { py: py0 } = toPx(0, 0)
    rects.push({ x: pxL, y: pyTop, w: pxR - pxL, h: py0 - pyTop })
  }

  const sliderX = nToSliderX(nRaw)

  const narrationText = isAtLimit
    ? `n equals ${n}. The Riemann sum has effectively reached the limit: ${fmt(sum, 4)}. The integral of x squared from zero to three equals nine.`
    : `n equals ${n}. The midpoint Riemann sum is ${fmt(sum, 4)}, with a gap of ${fmt(gap, 4)} from the true integral value of nine. As n grows, the sum approaches the integral.`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narrationText}
        priority={isAtLimit ? 'high' : 'normal'}
        isInteracting={isInteracting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`The integral of f of x equals x squared from zero to three. A midpoint Riemann sum with ${n} rectangles approximates the integral; current value ${fmt(sum, 4)}. The integral itself equals nine.`}
      >
        <Grid />

        {/* Rectangles */}
        {rects.map((r, i) => (
          <rect
            key={`rect-${i}`}
            x={r.x}
            y={r.y}
            width={Math.max(0.4, r.w)}
            height={Math.max(0, r.h)}
            fill="var(--color-vermilion)"
            fillOpacity={n > 80 ? 0.28 : 0.2}
            stroke="var(--color-vermilion)"
            strokeWidth={n > 80 ? 0.25 : n > 30 ? 0.5 : 0.9}
            strokeOpacity="0.85"
          />
        ))}

        {/* Axes */}
        <line
          x1={toPx(X_MIN, 0).px - 10}
          y1={toPx(X_MIN, 0).py}
          x2={toPx(X_MAX, 0).px + 30}
          y2={toPx(X_MIN, 0).py}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />
        <line
          x1={toPx(X_MIN, 0).px}
          y1={toPx(X_MIN, 0).py + 10}
          x2={toPx(X_MIN, 0).px}
          y2={toPx(0, Y_MAX).py - 8}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />

        {[0, 1, 2, 3].map((tx) => {
          const { px, py } = toPx(tx, 0)
          return (
            <g key={`xt-${tx}`}>
              <line x1={px} y1={py - 3} x2={px} y2={py + 3} stroke="var(--color-graph-ink)" strokeWidth="1" />
              <text x={px} y={py + 16} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
                {tx}
              </text>
            </g>
          )
        })}
        {[0, 3, 6, 9].map((ty) => {
          const { px, py } = toPx(0, ty)
          return (
            <g key={`yt-${ty}`}>
              <line x1={px - 3} y1={py} x2={px + 3} y2={py} stroke="var(--color-graph-ink)" strokeWidth="1" />
              <text x={px - 8} y={py + 4} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
                {ty}
              </text>
            </g>
          )
        })}

        {/* The curve itself */}
        <path
          d={curvePath()}
          fill="none"
          stroke="var(--color-vermilion)"
          strokeWidth="2"
          strokeOpacity="0.95"
          strokeLinejoin="round"
        />

        {/* Axis labels */}
        <text x={toPx(X_MAX, 0).px + 22} y={toPx(X_MIN, 0).py + 4} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">
          x
        </text>
        <text x={toPx(0, 0).px + 8} y={toPx(0, Y_MAX).py - 2} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">
          f(x)
        </text>

        {/* The big integral expression, top-right */}
        <g transform={`translate(${VIEW_W - 36}, 50)`}>
          <text textAnchor="end" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            THE LIMIT, NAMED
          </text>
          {/* The integral sign — Leibniz's long-S, drawn extra large */}
          <text
            y="46"
            textAnchor="end"
            fontFamily="Georgia, serif"
            fontStyle="italic"
            fontSize="48"
            fill="var(--color-vermilion)"
          >
            <tspan>&#8747;</tspan>
            <tspan dy="-22" fontSize="14">3</tspan>
            <tspan dy="32" dx="-12" fontSize="14">0</tspan>
            <tspan dy="-10" dx="4" fontSize="22"> x&sup2; dx</tspan>
            <tspan dy="0" fontSize="22"> = 9</tspan>
          </text>
        </g>

        {/* Convergence readout — left */}
        <g transform="translate(36, 30)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            SUM &rarr; INTEGRAL  &middot;  MIDPOINT RULE
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
            n = {n}
          </text>
          <text y="44" fontFamily="JetBrains Mono, monospace" fontSize="16" fill="var(--color-vermilion)">
            S<tspan dy="2" fontSize="10">n</tspan><tspan dy="-2"> = {fmt(sum, 4)}</tspan>
          </text>
          <text y="64" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill={isAtLimit ? 'var(--color-vermilion)' : 'var(--color-dim)'}>
            {isAtLimit ? 'matches the integral to four decimals' : `gap from 9: ${fmt(gap, 4)}`}
          </text>
        </g>

        {/* "as n → ∞" annotation tucked under the integral sign */}
        <g transform={`translate(${VIEW_W - 36}, 138)`}>
          <text
            textAnchor="end"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            as n &rarr; &infin;, &nbsp;S<tspan dy="2" fontSize="9">n</tspan>
            <tspan dy="-2">&nbsp;&rarr;&nbsp;9</tspan>
          </text>
        </g>

        {/* Slider for n */}
        <g>
          <line
            x1={SLIDER_X_MIN}
            y1={SLIDER_Y}
            x2={SLIDER_X_MAX}
            y2={SLIDER_Y}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
          {[1, 4, 12, 40, 200].map((tv) => (
            <g key={`nt-${tv}`}>
              <line
                x1={nToSliderX(tv)}
                y1={SLIDER_Y - 5}
                x2={nToSliderX(tv)}
                y2={SLIDER_Y + 5}
                stroke="var(--color-graph-ink)"
                strokeWidth="0.8"
              />
              <text
                x={nToSliderX(tv)}
                y={SLIDER_Y + 18}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fill="var(--color-dim)"
              >
                {tv}
              </text>
            </g>
          ))}
          <g
            {...bind()}
            ref={handleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Number of rectangles n, currently ${n}. Arrow keys to nudge, Shift plus arrow to step by 10. As n grows, the sum approaches the integral.`}
            aria-valuemin={N_MIN}
            aria-valuemax={N_MAX}
            aria-valuenow={n}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={sliderX} cy={SLIDER_Y} r="22" fill="transparent" />
            <circle cx={sliderX} cy={SLIDER_Y} r="8" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
          </g>
          <text x={SLIDER_X_MIN} y={SLIDER_Y - 12} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            PUSH n  &middot;  WATCH S<tspan dy="2" fontSize="9">n</tspan><tspan dy="-2"> APPROACH 9</tspan>
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3 &mdash; The limit, named. Leibniz&rsquo;s long-S for &ldquo;sum.&rdquo;
      </figcaption>
    </figure>
  )
}

function Grid() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => {
        const { px } = toPx(i, 0)
        const { py: yTop } = toPx(0, Y_MAX)
        const { py: yBot } = toPx(0, 0)
        return <line key={`gv-${i}`} x1={px} y1={yTop} x2={px} y2={yBot} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
      })}
      {Array.from({ length: 5 }, (_, i) => {
        const yv = i * 2
        const { px: xL } = toPx(X_MIN, 0)
        const { px: xR } = toPx(X_MAX, 0)
        const { py } = toPx(0, yv)
        return <line key={`gh-${i}`} x1={xL} y1={py} x2={xR} y2={py} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
      })}
    </>
  )
}
