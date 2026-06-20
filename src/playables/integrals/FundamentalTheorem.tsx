import { useCallback, useEffect, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Fundamental theorem of calculus, two-panel.
 *
 *   Left:  f(x) = x²  on [0, 3], with the area-up-to-x shaded vermilion.
 *   Right: F(x) = x³/3, with a point at (x, F(x)).
 *
 * Drag a single x-handle along the x-axis (lower strip). Both panels
 * update. The area-up-to-x on the left equals F(x) − F(0) on the right,
 * to numerical precision. That equality IS the FTC:
 *
 *   ∫₀ˣ f(t) dt = F(x) − F(0)
 *
 * Keyboard: arrow keys nudge x by 0.05; Shift+arrow by 0.5.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

// Two panels stacked vertically — left/right would crowd. Top is f, bottom is F.
const PANEL_PAD = 40
const TOP_PANEL = { x: PANEL_PAD, y: 80, w: VIEW_W - 2 * PANEL_PAD, h: 160 }
const BOT_PANEL = { x: PANEL_PAD, y: 260, w: VIEW_W - 2 * PANEL_PAD, h: 160 }

const X_MIN = 0
const X_MAX = 3

const F_Y_MAX = 9.5
const G_Y_MAX = 9.5 // F(3) = 9

const X_INIT = 1.6

const f = (x: number) => x * x
const F = (x: number) => (x * x * x) / 3 // antiderivative

const X_LEFT_PAD = 40
const xRangePx = (panel: typeof TOP_PANEL) => panel.w - X_LEFT_PAD - 20
const fToPx = (x: number, y: number, panel: typeof TOP_PANEL, yMax: number) => {
  const xUnit = xRangePx(panel) / (X_MAX - X_MIN)
  const yUnit = (panel.h - 30) / yMax
  return {
    px: panel.x + X_LEFT_PAD + (x - X_MIN) * xUnit,
    py: panel.y + panel.h - 14 - y * yUnit,
  }
}

const fmt = (n: number, p = 4) => n.toFixed(p)

function fCurvePath() {
  const steps = 140
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / steps
    const y = f(x)
    const { px, py } = fToPx(x, y, TOP_PANEL, F_Y_MAX)
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return pts.join(' ')
}

function FCurvePath() {
  const steps = 140
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / steps
    const y = F(x)
    const { px, py } = fToPx(x, y, BOT_PANEL, G_Y_MAX)
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return pts.join(' ')
}

function areaUpToXPath(x: number): string {
  const steps = 100
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const xt = X_MIN + (i / steps) * (x - X_MIN)
    const y = f(xt)
    const { px, py } = fToPx(xt, y, TOP_PANEL, F_Y_MAX)
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  const { px: pxR, py: py0 } = fToPx(x, 0, TOP_PANEL, F_Y_MAX)
  const { px: pxL } = fToPx(X_MIN, 0, TOP_PANEL, F_Y_MAX)
  pts.push(`L${pxR.toFixed(1)},${py0.toFixed(1)}`)
  pts.push(`L${pxL.toFixed(1)},${py0.toFixed(1)}`)
  pts.push('Z')
  return pts.join(' ')
}

export function FundamentalTheorem() {
  void ORIGIN_X
  void ORIGIN_Y
  void UNIT

  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const [x, setX] = useState(X_INIT)
  const [isInteracting, setIsInteracting] = useState(false)
  const startXRef = useRef<number | null>(null)

  const clampX = (v: number) => Math.max(X_MIN, Math.min(X_MAX, v))

  const handlePanel = { x: PANEL_PAD, y: VIEW_H - 50, w: VIEW_W - 2 * PANEL_PAD, h: 30 }
  const handleXUnit = (handlePanel.w - X_LEFT_PAD - 20) / (X_MAX - X_MIN)
  const xToPx = (xv: number) => handlePanel.x + X_LEFT_PAD + (xv - X_MIN) * handleXUnit
  const pxToX = (px: number) => X_MIN + (px - handlePanel.x - X_LEFT_PAD) / handleXUnit

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
    const startPx = xToPx(start)
    const newPx = startPx + mx * sx
    setX(clampX(pxToX(newPx)))
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? Math.sign(dx) * 0.5 : Math.sign(dx) * 0.05
        setX((cur) => clampX(cur + step))
      },
      [],
    ),
  )

  // Numerical area via midpoint rule with high n — used as the "live"
  // running area on the left. For x² the closed form is x³/3 exactly,
  // so this also lets us assert the equality is real, not just labelled.
  const numericalArea = (() => {
    const n = 400
    const dx = (x - X_MIN) / n
    let s = 0
    for (let i = 0; i < n; i++) s += f(X_MIN + (i + 0.5) * dx) * dx
    return s
  })()
  const analytic = F(x) - F(X_MIN)
  const matchOk = Math.abs(numericalArea - analytic) < 0.01

  const fxPos = fToPx(x, f(x), TOP_PANEL, F_Y_MAX)
  const FxPos = fToPx(x, F(x), BOT_PANEL, G_Y_MAX)
  const handlePos = xToPx(x)

  // Narration: high priority when x hits the boundaries (cleanest beats)
  const [hi, setHi] = useState<'normal' | 'high'>('normal')
  const lastBeatRef = useRef<string>('mid')
  useEffect(() => {
    let beat = 'mid'
    if (x < 0.05) beat = 'zero'
    else if (x > 2.95) beat = 'three'
    if (beat !== lastBeatRef.current && beat !== 'mid') {
      setHi('high')
    } else {
      setHi('normal')
    }
    lastBeatRef.current = beat
  }, [x])

  const narrationText = (() => {
    if (x < 0.05) {
      return 'x is at zero. The shaded area is zero. The antiderivative reads F of zero equals zero. Both sides agree.'
    }
    if (x > 2.95) {
      return `x is at three. The shaded area equals ${fmt(numericalArea, 3)}. F of three minus F of zero equals nine. The fundamental theorem says they must agree, and they do.`
    }
    return `x equals ${fmt(x, 2)}. Left panel: the shaded area under f up to x is ${fmt(numericalArea, 3)}. Right panel: F of x minus F of zero equals ${fmt(analytic, 3)}. The two are equal — that equality is the fundamental theorem of calculus.`
  })()

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narrationText}
        priority={hi}
        isInteracting={isInteracting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Two stacked panels. Top: f of x equals x squared on the interval zero to three, with the area-up-to-x shaded. Bottom: F of x equals x cubed over three, with a moving point. Drag the x-handle below; both panels track. Currently x equals ${fmt(x, 2)}; area ${fmt(numericalArea, 3)}; F of x minus F of zero ${fmt(analytic, 3)}.`}
      >
        {/* Header */}
        <text x={36} y={40} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          FUNDAMENTAL THEOREM  &middot;  AREA &equals; ANTIDERIVATIVE
        </text>
        <text x={36} y={60} fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-ink)">
          &#8747;<tspan dy="-2" fontSize="9">x</tspan><tspan dy="6" dx="-6" fontSize="9">0</tspan><tspan dy="-4" fontSize="13"> f(t) dt = F(x) &minus; F(0)</tspan>
        </text>

        {/* TOP PANEL: f(x) = x² with area-up-to-x */}
        <PanelChrome panel={TOP_PANEL} titleA="f(x) = x²" titleB="area = integral so far" />
        <path
          d={areaUpToXPath(x)}
          fill="var(--color-vermilion)"
          fillOpacity="0.2"
          stroke="none"
        />
        <path d={fCurvePath()} fill="none" stroke="var(--color-vermilion)" strokeWidth="2" strokeLinejoin="round" />
        {/* vertical line at x on top panel */}
        <line
          x1={fxPos.px}
          y1={fToPx(0, 0, TOP_PANEL, F_Y_MAX).py}
          x2={fxPos.px}
          y2={fxPos.py}
          stroke="var(--color-vermilion)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          strokeOpacity="0.65"
        />
        <circle cx={fxPos.px} cy={fxPos.py} r="5" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="1.5" />
        <text
          x={TOP_PANEL.x + TOP_PANEL.w - 8}
          y={TOP_PANEL.y + 18}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          area = {fmt(numericalArea, 3)}
        </text>

        {/* BOTTOM PANEL: F(x) = x³/3 */}
        <PanelChrome panel={BOT_PANEL} titleA="F(x) = x³ / 3" titleB="antiderivative — net rise" />
        <path d={FCurvePath()} fill="none" stroke="var(--color-vermilion)" strokeWidth="2" strokeLinejoin="round" />
        {/* horizontal dashed line from F(0) to F(x) on the curve, showing the rise */}
        {(() => {
          const f0 = fToPx(X_MIN, F(X_MIN), BOT_PANEL, G_Y_MAX)
          return (
            <>
              <line x1={f0.px} y1={f0.py} x2={FxPos.px} y2={f0.py} stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="3 3" />
              <line x1={FxPos.px} y1={f0.py} x2={FxPos.px} y2={FxPos.py} stroke="var(--color-vermilion)" strokeWidth="2" />
              <polygon
                points={`${FxPos.px - 4},${FxPos.py + 6} ${FxPos.px + 4},${FxPos.py + 6} ${FxPos.px},${FxPos.py}`}
                fill="var(--color-vermilion)"
              />
            </>
          )
        })()}
        <circle cx={FxPos.px} cy={FxPos.py} r="5" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="1.5" />
        <text
          x={BOT_PANEL.x + BOT_PANEL.w - 8}
          y={BOT_PANEL.y + 18}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          F(x) &minus; F(0) = {fmt(analytic, 3)}
        </text>

        {/* The reconciliation badge between panels */}
        <g transform={`translate(${VIEW_W / 2}, 250)`}>
          <rect
            x="-66"
            y="-10"
            width="132"
            height="18"
            rx="2"
            fill={matchOk ? 'var(--color-vermilion)' : 'var(--color-cream)'}
            fillOpacity={matchOk ? 0.12 : 0.5}
            stroke="var(--color-vermilion)"
            strokeWidth="1"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill="var(--color-vermilion)"
          >
            {matchOk ? 'they agree' : 'reconcile…'}
          </text>
        </g>

        {/* HANDLE strip — drag x */}
        <PanelChrome panel={handlePanel} titleA="" titleB="" />
        <line
          x1={xToPx(X_MIN)}
          y1={handlePanel.y + handlePanel.h / 2}
          x2={xToPx(X_MAX)}
          y2={handlePanel.y + handlePanel.h / 2}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        {[0, 1, 2, 3].map((tv) => (
          <g key={`xh-${tv}`}>
            <line
              x1={xToPx(tv)}
              y1={handlePanel.y + handlePanel.h / 2 - 4}
              x2={xToPx(tv)}
              y2={handlePanel.y + handlePanel.h / 2 + 4}
              stroke="var(--color-graph-ink)"
              strokeWidth="1"
            />
            <text
              x={xToPx(tv)}
              y={handlePanel.y + handlePanel.h - 2}
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
          aria-label={`x, the upper limit of integration. Currently ${fmt(x, 2)}. Arrow keys to nudge, Shift plus arrow to step by 0.5.`}
          aria-valuemin={X_MIN}
          aria-valuemax={X_MAX}
          aria-valuenow={Number(x.toFixed(2))}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={handlePos} cy={handlePanel.y + handlePanel.h / 2} r="22" fill="transparent" />
          <circle
            cx={handlePos}
            cy={handlePanel.y + handlePanel.h / 2}
            r="8"
            fill="var(--color-vermilion)"
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
        </g>
        <text
          x={handlePanel.x + 6}
          y={handlePanel.y + 14}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          DRAG x  &middot;  BOTH PANELS TRACK
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4 &mdash; The two halves of the calculus reconcile.
      </figcaption>
    </figure>
  )
}

interface Panel {
  x: number
  y: number
  w: number
  h: number
}
function PanelChrome({ panel, titleA, titleB }: { panel: Panel; titleA: string; titleB: string }) {
  return (
    <g>
      <rect
        x={panel.x}
        y={panel.y}
        width={panel.w}
        height={panel.h}
        fill="var(--color-paper)"
        stroke="var(--color-graph-fade)"
        strokeWidth="1"
      />
      {titleA && (
        <text
          x={panel.x + 6}
          y={panel.y + 14}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          {titleA}
        </text>
      )}
      {titleB && (
        <text
          x={panel.x + 6}
          y={panel.y + 28}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-dim)"
        >
          {titleB}
        </text>
      )}
    </g>
  )
}
