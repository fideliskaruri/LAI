import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Power rule, tabular slider edition.
 *
 *   f(x) = xⁿ     →     f'(x) = n · xⁿ⁻¹
 *
 * The user drags n along the integer values 0..4. The current row of the
 * table highlights, and a small dual-curve panel plots f and f' side by
 * side so the reader can see why the derivative is one degree lower.
 *
 * Snap-to-integer behaviour with a small dead zone, since n only really
 * makes sense at integer steps for this teaching beat. (Power rule holds
 * for any real n, but the act is about the *pattern*, not the proof.)
 *
 * Keyboard: arrows nudge n by 0.1, Shift+arrow by 1, with snap. The
 * teaching is the pattern — readout uses JetBrains Mono.
 */

const VIEW_W = 600
const VIEW_H = 480

const N_MIN = 0
const N_MAX = 4
const SLIDER_X_MIN = 80
const SLIDER_X_MAX = VIEW_W - 80
const SLIDER_Y = 100

const TABLE_X = 60
const TABLE_Y = 170
const TABLE_ROW_H = 36
const TABLE_W = 230

// Mini-curve panel: shows f(x) = xⁿ and f'(x) = n·xⁿ⁻¹ for the current
// integer n, side by side.
const CURVE_PANEL_X = 320
const CURVE_PANEL_Y = 160
const CURVE_PANEL_W = 230
const CURVE_PANEL_H = 220
const CURVE_ORIGIN_Y = CURVE_PANEL_Y + CURVE_PANEL_H - 40

const ROWS: Array<{ n: number; f: string; fp: string }> = [
  { n: 0, f: '1', fp: '0' },
  { n: 1, f: 'x', fp: '1' },
  { n: 2, f: 'x²', fp: '2x' },
  { n: 3, f: 'x³', fp: '3x²' },
  { n: 4, f: 'x⁴', fp: '4x³' },
]

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)
const nToSliderX = (n: number) =>
  SLIDER_X_MIN + ((n - N_MIN) / (N_MAX - N_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const sliderXToN = (x: number) =>
  N_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (N_MAX - N_MIN)

const SNAP_DEADZONE = 0.18

function snapN(raw: number): number {
  const clamped = Math.max(N_MIN, Math.min(N_MAX, raw))
  const nearest = Math.round(clamped)
  return Math.abs(clamped - nearest) < SNAP_DEADZONE ? nearest : clamped
}

export function Rules() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const [n, setN] = useState(2)
  const [isInteracting, setIsInteracting] = useState(false)
  const startNRef = useRef<number | null>(null)

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) {
      startNRef.current = n
      setIsInteracting(true)
    }
    if (last) setIsInteracting(false)
    const start = startNRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startX = nToSliderX(start)
    const newX = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startX + mx * sx))
    setN(snapN(sliderXToN(newX)))
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? Math.sign(dx) : Math.sign(dx) * 0.1
        setN((cur) => snapN(cur + step))
      },
      [],
    ),
  )

  // The integer "row" we're closest to (snapped).
  const nInt = Math.round(n)
  const activeRow = ROWS.find((r) => r.n === nInt) ?? ROWS[2]

  const sliderX = nToSliderX(n)
  const isAtInteger = Math.abs(n - nInt) < 0.01

  // Build mini curve paths for the current integer n.
  // Domain x in [-1.5, 1.5] for f and f'. Auto-scale y to fit the panel.
  const curveDomain = { xMin: -1.5, xMax: 1.5, samples: 80 }
  const fMath = (x: number, k: number) => Math.pow(x, k)
  const fpMath = (x: number, k: number) => (k === 0 ? 0 : k * Math.pow(x, k - 1))

  function buildCurve(fn: (x: number) => number): { d: string; minY: number; maxY: number } {
    const pts: Array<[number, number]> = []
    for (let i = 0; i <= curveDomain.samples; i++) {
      const t = i / curveDomain.samples
      const x = curveDomain.xMin + t * (curveDomain.xMax - curveDomain.xMin)
      const y = fn(x)
      pts.push([x, y])
    }
    let minY = Infinity
    let maxY = -Infinity
    for (const [, y] of pts) {
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
    if (!isFinite(minY) || minY === maxY) {
      minY = -1
      maxY = 1
    }
    return { pts, minY, maxY } as unknown as { d: string; minY: number; maxY: number }
  }

  // We need both curves on the *same* y-scale so the relative magnitudes read.
  function makeBothCurves(k: number) {
    const samples = 80
    const fSamples: Array<[number, number]> = []
    const fpSamples: Array<[number, number]> = []
    let yMin = Infinity
    let yMax = -Infinity
    for (let i = 0; i <= samples; i++) {
      const t = i / samples
      const x = curveDomain.xMin + t * (curveDomain.xMax - curveDomain.xMin)
      const y = fMath(x, k)
      const yp = fpMath(x, k)
      fSamples.push([x, y])
      fpSamples.push([x, yp])
      if (y < yMin) yMin = y
      if (y > yMax) yMax = y
      if (yp < yMin) yMin = yp
      if (yp > yMax) yMax = yp
    }
    if (yMin === yMax) {
      yMin -= 0.5
      yMax += 0.5
    }
    // Pad symmetrically so zero sits visually mid-panel when possible.
    const range = Math.max(Math.abs(yMin), Math.abs(yMax)) * 1.1
    const yLo = -range
    const yHi = range

    const xUnit = (CURVE_PANEL_W - 40) / (curveDomain.xMax - curveDomain.xMin)
    const yHeight = CURVE_PANEL_H - 60
    const toPx = (x: number, y: number) => {
      const px = CURVE_PANEL_X + 20 + (x - curveDomain.xMin) * xUnit
      const py = CURVE_PANEL_Y + 20 + ((yHi - y) / (yHi - yLo)) * yHeight
      return { px, py }
    }
    const pathFrom = (pts: Array<[number, number]>) => {
      return pts
        .map(([x, y], i) => {
          const { px, py } = toPx(x, y)
          return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`
        })
        .join(' ')
    }
    return {
      fPath: pathFrom(fSamples),
      fpPath: pathFrom(fpSamples),
      xAxisY: toPx(0, 0).py,
      yAxisX: toPx(0, 0).px,
    }
  }

  // Silence unused helper (used in earlier sketch; keep available).
  void buildCurve

  const curves = makeBothCurves(nInt)

  const narrationText = isAtInteger
    ? `n equals ${nInt}. The power rule says the derivative of x to the ${nInt} is ${nInt} times x to the ${Math.max(0, nInt - 1)}. ${
        nInt === 0
          ? 'The derivative of a constant is zero.'
          : nInt === 1
            ? 'The derivative of x itself is one.'
            : 'Multiply by the old exponent, then drop the exponent by one.'
      }`
    : `n is between ${Math.floor(n)} and ${Math.ceil(n)}. Snap to an integer to see the rule.`

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
        aria-label={`Power rule table. Current row: f of x equals ${activeRow.f}; f prime of x equals ${activeRow.fp}. Drag the n slider, currently at ${fmt(n).trim()}.`}
      >
        {/* Header */}
        <text x={60} y={50} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          POWER RULE
        </text>
        <text x={60} y={70} fontFamily="Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-ink)">
          f(x) = xⁿ &nbsp;&rarr;&nbsp; f′(x) = n &middot; xⁿ⁻¹
        </text>

        {/* Slider */}
        <line
          x1={SLIDER_X_MIN}
          y1={SLIDER_Y}
          x2={SLIDER_X_MAX}
          y2={SLIDER_Y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        {[0, 1, 2, 3, 4].map((v) => (
          <g key={v}>
            <line
              x1={nToSliderX(v)}
              y1={SLIDER_Y - 6}
              x2={nToSliderX(v)}
              y2={SLIDER_Y + 6}
              stroke={v === nInt && isAtInteger ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
              strokeWidth={v === nInt && isAtInteger ? 1.6 : 1}
            />
            <text
              x={nToSliderX(v)}
              y={SLIDER_Y + 22}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="12"
              fill={v === nInt && isAtInteger ? 'var(--color-vermilion)' : 'var(--color-dim)'}
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
          aria-label={`Exponent n, currently ${fmt(n).trim()}. Arrow keys to nudge.`}
          aria-valuemin={N_MIN}
          aria-valuemax={N_MAX}
          aria-valuenow={Number(n.toFixed(2))}
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
        <text x={SLIDER_X_MIN} y={SLIDER_Y - 14} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
          DRAG n  &middot;  SNAPS TO INTEGERS
        </text>

        {/* Table */}
        <g>
          {/* Headers */}
          <text x={TABLE_X + 24} y={TABLE_Y - 8} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            n
          </text>
          <text x={TABLE_X + 70} y={TABLE_Y - 8} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            f(x)
          </text>
          <text x={TABLE_X + 150} y={TABLE_Y - 8} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            f′(x)
          </text>

          {ROWS.map((row, i) => {
            const y = TABLE_Y + i * TABLE_ROW_H
            const active = row.n === nInt && isAtInteger
            return (
              <g key={row.n}>
                <rect
                  x={TABLE_X}
                  y={y}
                  width={TABLE_W}
                  height={TABLE_ROW_H - 4}
                  fill={active ? 'var(--color-vermilion)' : 'transparent'}
                  fillOpacity={active ? 0.1 : 0}
                />
                <line
                  x1={TABLE_X}
                  y1={y + TABLE_ROW_H - 4}
                  x2={TABLE_X + TABLE_W}
                  y2={y + TABLE_ROW_H - 4}
                  stroke="var(--color-graph-fade)"
                  strokeWidth="0.6"
                />
                <text
                  x={TABLE_X + 24}
                  y={y + 22}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="14"
                  fill={active ? 'var(--color-vermilion)' : 'var(--color-ink)'}
                >
                  {row.n}
                </text>
                <text
                  x={TABLE_X + 70}
                  y={y + 22}
                  fontFamily="Georgia, serif"
                  fontStyle="italic"
                  fontSize="14"
                  fill={active ? 'var(--color-vermilion)' : 'var(--color-ink)'}
                >
                  {row.f}
                </text>
                <text
                  x={TABLE_X + 150}
                  y={y + 22}
                  fontFamily="Georgia, serif"
                  fontStyle="italic"
                  fontSize="14"
                  fill={active ? 'var(--color-vermilion)' : 'var(--color-ink)'}
                >
                  {row.fp}
                </text>
              </g>
            )
          })}
        </g>

        {/* Mini curve panel — f vs f' */}
        <g>
          <rect
            x={CURVE_PANEL_X}
            y={CURVE_PANEL_Y}
            width={CURVE_PANEL_W}
            height={CURVE_PANEL_H}
            fill="var(--color-paper)"
            stroke="var(--color-graph-fade)"
            strokeWidth="1"
          />
          <text
            x={CURVE_PANEL_X + 12}
            y={CURVE_PANEL_Y + 18}
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            n = {nInt}
          </text>
          {/* Axes inside panel */}
          <line
            x1={CURVE_PANEL_X + 20}
            y1={curves.xAxisY}
            x2={CURVE_PANEL_X + CURVE_PANEL_W - 20}
            y2={curves.xAxisY}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.8"
            strokeOpacity="0.6"
          />
          <line
            x1={curves.yAxisX}
            y1={CURVE_PANEL_Y + 20}
            x2={curves.yAxisX}
            y2={CURVE_PANEL_Y + CURVE_PANEL_H - 40}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.8"
            strokeOpacity="0.6"
          />
          {/* f(x) ghost */}
          <path
            d={curves.fPath}
            fill="none"
            stroke="var(--color-graph-ink)"
            strokeWidth="1.4"
            strokeOpacity="0.55"
          />
          {/* f'(x) vermilion */}
          <path
            d={curves.fpPath}
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
          {/* Legend */}
          <g transform={`translate(${CURVE_PANEL_X + 12}, ${CURVE_ORIGIN_Y + 22})`}>
            <line x1="0" y1="6" x2="14" y2="6" stroke="var(--color-graph-ink)" strokeWidth="1.4" strokeOpacity="0.55" />
            <text x="20" y="10" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">f(x)</text>
            <line x1="64" y1="6" x2="78" y2="6" stroke="var(--color-vermilion)" strokeWidth="2" />
            <text x="84" y="10" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-vermilion)">f′(x)</text>
          </g>
        </g>

        {/* Footer readout */}
        <g transform={`translate(60, ${VIEW_H - 30})`}>
          <text fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
            f(x) = {activeRow.f} &nbsp;&nbsp; f′(x) = {activeRow.fp}
          </text>
        </g>
        <text
          x={VIEW_W - 60}
          y={VIEW_H - 30}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          MULTIPLY BY n  ·  DROP THE EXPONENT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4 &mdash; The power rule, one row at a time.
      </figcaption>
    </figure>
  )
}
