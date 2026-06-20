import { useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'

/**
 * Scalar multiplication: one fixed vector v, a slider k from -2 to +2.
 * Display k·v as an arrow. At k=0 the arrow vanishes; at k=-1 it flips.
 *
 * The prose hole: "what does negative-one-times-an-arrow mean physically?"
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const V_X = 2
const V_Y = 1

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

// Slider geometry
const SLIDER_Y = VIEW_H - 60
const SLIDER_X_MIN = 100
const SLIDER_X_MAX = VIEW_W - 100
const K_MIN = -2
const K_MAX = 2

const kToSliderX = (k: number) => SLIDER_X_MIN + ((k - K_MIN) / (K_MAX - K_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const sliderXToK = (x: number) => K_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (K_MAX - K_MIN)

function arrowHead(from: { x: number; y: number }, to: { x: number; y: number }) {
  const ang = Math.atan2(to.y - from.y, to.x - from.x)
  const headLen = 14
  const headWide = 6
  return {
    p1: { x: to.x - headLen * Math.cos(ang) + headWide * Math.cos(ang + Math.PI / 2), y: to.y - headLen * Math.sin(ang) + headWide * Math.sin(ang + Math.PI / 2) },
    p2: { x: to.x - headLen * Math.cos(ang) - headWide * Math.cos(ang + Math.PI / 2), y: to.y - headLen * Math.sin(ang) - headWide * Math.sin(ang + Math.PI / 2) },
  }
}

export function ScalarMul() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [k, setK] = useState(1.5)
  const startKRef = useRef<number | null>(null)

  const bind = useDrag(({ first, movement: [mx] }) => {
    if (first) startKRef.current = k
    const start = startKRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const dxSvg = mx * sx
    const startX = kToSliderX(start)
    const newX = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startX + dxSvg))
    let newK = sliderXToK(newX)
    // Snap to integers if within 0.05
    const snap = Math.round(newK)
    if (Math.abs(newK - snap) < 0.05) newK = snap
    setK(newK)
  })

  // Original v (faint reference) and scaled k·v (vermilion)
  const O = { x: ORIGIN_X, y: ORIGIN_Y }
  const V = { x: ORIGIN_X + V_X * UNIT, y: ORIGIN_Y - V_Y * UNIT }
  const KV = { x: ORIGIN_X + k * V_X * UNIT, y: ORIGIN_Y - k * V_Y * UNIT }

  const headV = arrowHead(O, V)
  const headKV = arrowHead(O, KV)

  const sliderHandleX = kToSliderX(k)
  const isZero = Math.abs(k) < 0.025
  const isFlipped = k < 0

  return (
    <figure className="w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Vector v scaled by k equals ${fmt(k).trim()}. ${isZero ? 'k v vanishes at zero.' : isFlipped ? 'k v points in the opposite direction of v.' : 'k v points in the same direction as v.'}`}
      >
        <Grid />
        <Axes />

        {/* Original v in dim grey */}
        <line x1={O.x} y1={O.y} x2={V.x} y2={V.y} stroke="var(--color-graph-fade)" strokeWidth="2" />
        <polygon points={`${V.x},${V.y} ${headV.p1.x},${headV.p1.y} ${headV.p2.x},${headV.p2.y}`} fill="var(--color-graph-fade)" />
        <text x={V.x + 12} y={V.y - 6} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-fade)">v</text>

        {/* Scaled k·v in vermilion */}
        {!isZero && (
          <>
            <line x1={O.x} y1={O.y} x2={KV.x} y2={KV.y} stroke="var(--color-vermilion)" strokeWidth="2.5" />
            <polygon points={`${KV.x},${KV.y} ${headKV.p1.x},${headKV.p1.y} ${headKV.p2.x},${headKV.p2.y}`} fill="var(--color-vermilion)" />
            <text x={KV.x + 10} y={KV.y + 18} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="16" fill="var(--color-vermilion)">
              kv
            </text>
          </>
        )}

        {/* Zero state: a vermilion dot at origin */}
        {isZero && (
          <>
            <circle cx={O.x} cy={O.y} r="6" fill="var(--color-vermilion)" />
            <text x={O.x + 12} y={O.y - 10} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-vermilion)">
              0
            </text>
          </>
        )}

        {/* Readouts */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            SCALAR  ·  VECTOR
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="16" fill="var(--color-ink)">
            k = {fmt(k).trim()}
          </text>
          <text y="44" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
            kv = ({fmt(k * V_X).trim()}, {fmt(k * V_Y).trim()})
          </text>
        </g>

        {/* Slider */}
        <g transform={`translate(0, 0)`}>
          {/* Track */}
          <line x1={SLIDER_X_MIN} y1={SLIDER_Y} x2={SLIDER_X_MAX} y2={SLIDER_Y} stroke="var(--color-graph-ink)" strokeWidth="1.2" />
          {/* Ticks at -2, -1, 0, 1, 2 */}
          {[-2, -1, 0, 1, 2].map((v) => (
            <g key={v}>
              <line x1={kToSliderX(v)} y1={SLIDER_Y - 6} x2={kToSliderX(v)} y2={SLIDER_Y + 6} stroke="var(--color-graph-ink)" strokeWidth="1" />
              <text x={kToSliderX(v)} y={SLIDER_Y + 22} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
                {v}
              </text>
            </g>
          ))}
          {/* Handle */}
          <g {...bind()} style={{ cursor: 'grab', touchAction: 'none' }}>
            <circle cx={sliderHandleX} cy={SLIDER_Y} r="22" fill="transparent" />
            <circle cx={sliderHandleX} cy={SLIDER_Y} r="8" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
          </g>
          {/* Slider label */}
          <text x={SLIDER_X_MIN} y={SLIDER_Y - 18} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            DRAG  ·  k
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6 — Scaling a vector: what does &minus;1 times an arrow mean?
      </figcaption>
    </figure>
  )
}

function Grid() {
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => {
        const x = ORIGIN_X + (i - 6) * UNIT
        return (
          <line key={`v-${i}`} x1={x} y1="20" x2={x} y2={VIEW_H - 100} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const y = ORIGIN_Y + (i - 4) * UNIT
        return (
          <line key={`h-${i}`} x1="20" y1={y} x2={VIEW_W - 20} y2={y} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
    </>
  )
}

function Axes() {
  return (
    <>
      <line x1="20" y1={ORIGIN_Y} x2={VIEW_W - 20} y2={ORIGIN_Y} stroke="var(--color-graph-ink)" strokeWidth="1" />
      <line x1={ORIGIN_X} y1="20" x2={ORIGIN_X} y2={VIEW_H - 100} stroke="var(--color-graph-ink)" strokeWidth="1" />
    </>
  )
}
