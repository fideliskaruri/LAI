import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Riemann sums on f(x) = x² over [0, 3]. The user controls n (number of
 * rectangles, 1..100) via a horizontal slider, and chooses left, right,
 * or midpoint via three tab buttons. The sum is computed live and
 * displayed in JetBrains Mono. As n grows, all three sums converge to 9.
 *
 * Keyboard:
 *  - slider handle: arrows nudge n by 1; Shift+arrow by 10
 *  - tab buttons: Tab to focus, Enter/Space to activate, Left/Right
 *    arrows cycle between tabs (WAI-ARIA tabs pattern, simplified)
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const PLOT_ORIGIN_X = 110
const PLOT_ORIGIN_Y = 360
const X_UNIT = 110
const Y_UNIT = 32

const X_MIN = 0
const X_MAX = 3
const Y_MAX = 9.5

const N_MIN = 1
const N_MAX = 100
const N_INIT = 6

const SLIDER_X_MIN = 100
const SLIDER_X_MAX = VIEW_W - 100
const SLIDER_Y = VIEW_H - 40

const f = (x: number) => x * x
const TRUE_AREA = 9 // ∫₀³ x² dx = 9

type Mode = 'left' | 'right' | 'midpoint'

const fmt = (n: number, p = 4) => n.toFixed(p)

const nToSliderX = (n: number) => {
  // log-scale so small n has lots of slider room
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

function sampleX(i: number, n: number, mode: Mode): number {
  const dx = (X_MAX - X_MIN) / n
  const xL = X_MIN + i * dx
  if (mode === 'left') return xL
  if (mode === 'right') return xL + dx
  return xL + dx / 2
}

function computeSum(n: number, mode: Mode): number {
  const dx = (X_MAX - X_MIN) / n
  let s = 0
  for (let i = 0; i < n; i++) {
    s += f(sampleX(i, n, mode)) * dx
  }
  return s
}

export function RiemannSums() {
  void ORIGIN_X
  void ORIGIN_Y
  void UNIT

  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const [nRaw, setNRaw] = useState<number>(N_INIT)
  const [mode, setMode] = useState<Mode>('left')
  const [isInteracting, setIsInteracting] = useState(false)
  const startNRef = useRef<number | null>(null)

  // n is always an integer in display, but stored as float for smooth slider feel
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

  const sum = computeSum(n, mode)
  const error = TRUE_AREA - sum

  // Build rectangles
  const dx = (X_MAX - X_MIN) / n
  const rects: Array<{ x: number; y: number; w: number; h: number; isAbove: boolean }> = []
  for (let i = 0; i < n; i++) {
    const xL = X_MIN + i * dx
    const xR = xL + dx
    const xs = sampleX(i, n, mode)
    const h = f(xs)
    const { px: pxL } = toPx(xL, 0)
    const { px: pxR } = toPx(xR, 0)
    const { py: pyTop } = toPx(0, h)
    const { py: py0 } = toPx(0, 0)
    // For x², all rects stick UP from the axis (positive area). Width >= 0.
    rects.push({
      x: pxL,
      y: pyTop,
      w: pxR - pxL,
      h: py0 - pyTop,
      isAbove: false,
    })
  }

  const sliderX = nToSliderX(nRaw)

  // Tabs — WAI-ARIA simplified pattern
  const tabs: Array<{ id: Mode; label: string }> = [
    { id: 'left', label: 'Left' },
    { id: 'right', label: 'Right' },
    { id: 'midpoint', label: 'Midpoint' },
  ]
  const onTabKey = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = tabs[(idx + 1) % tabs.length].id
      setMode(next)
      ;(document.getElementById(`riemann-tab-${next}`) as HTMLButtonElement | null)?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const next = tabs[(idx - 1 + tabs.length) % tabs.length].id
      setMode(next)
      ;(document.getElementById(`riemann-tab-${next}`) as HTMLButtonElement | null)?.focus()
    }
  }

  const modeWord = mode === 'left' ? 'left endpoints' : mode === 'right' ? 'right endpoints' : 'midpoints'
  const narrationText = `${n} rectangles, sampled at ${modeWord}. The Riemann sum is ${fmt(sum, 4)}. The true area is 9. Gap: ${fmt(Math.abs(error), 4)}.`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narrationText}
        priority="normal"
        isInteracting={isInteracting}
      />
      {/* Tabs sit above the SVG so they're proper HTML buttons. */}
      <div
        role="tablist"
        aria-label="Sampling rule for Riemann rectangles"
        className="flex items-center justify-center gap-2 mb-2"
      >
        {tabs.map((t, idx) => {
          const selected = t.id === mode
          return (
            <button
              key={t.id}
              id={`riemann-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setMode(t.id)}
              onKeyDown={(e) => onTabKey(e, idx)}
              className={`font-sans text-[11px] uppercase tracking-[0.22em] px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                selected
                  ? 'text-vermilion border-b border-vermilion'
                  : 'text-dim hover:text-ink border-b border-transparent'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Riemann sum of f of x equals x squared on the interval from zero to three, using ${n} rectangles sampled at ${modeWord}. Current sum ${fmt(sum, 4)}. True area is 9.`}
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
            fillOpacity={n > 40 ? 0.22 : 0.18}
            stroke="var(--color-vermilion)"
            strokeWidth={n > 40 ? 0.4 : n > 16 ? 0.7 : 1}
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

        {/* The curve itself, drawn on top of the rectangles */}
        <path
          d={curvePath()}
          fill="none"
          stroke="var(--color-vermilion)"
          strokeWidth="2"
          strokeOpacity="0.9"
          strokeLinejoin="round"
        />

        {/* Axis labels */}
        <text x={toPx(X_MAX, 0).px + 22} y={toPx(X_MIN, 0).py + 4} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">
          x
        </text>
        <text x={toPx(0, 0).px + 8} y={toPx(0, Y_MAX).py - 2} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">
          f(x)
        </text>

        {/* Readout: sum + true area + gap */}
        <g transform="translate(36, 30)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            RIEMANN SUM  &middot;  f(x) = x&sup2; on [0, 3]
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
            n = {n} &nbsp;&middot;&nbsp; rule = {mode}
          </text>
          <text y="44" fontFamily="JetBrains Mono, monospace" fontSize="16" fill="var(--color-vermilion)">
            S<tspan dy="2" fontSize="10">n</tspan><tspan dy="-2"> = {fmt(sum, 4)}</tspan>
          </text>
          <text y="64" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            true area = 9 &nbsp;&middot;&nbsp; gap = {fmt(Math.abs(error), 4)}
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
          {[1, 4, 10, 30, 100].map((tv) => (
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
                y={SLIDER_Y + 20}
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
            aria-label={`Number of rectangles n, currently ${n}. Arrow keys to nudge, Shift plus arrow to step by 10. Drag right to add more.`}
            aria-valuemin={N_MIN}
            aria-valuemax={N_MAX}
            aria-valuenow={n}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={sliderX} cy={SLIDER_Y} r="22" fill="transparent" />
            <circle cx={sliderX} cy={SLIDER_Y} r="8" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
          </g>
          <text
            x={SLIDER_X_MIN}
            y={SLIDER_Y - 14}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            DRAG n  &middot;  THE SUM CONVERGES TO 9
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2 &mdash; n rectangles. As n grows, the staircase closes on the curve.
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
