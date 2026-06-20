import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Act 6: scale by k and shear by s. Two sliders.
 *   - Scale: î -> (k, 0), ĵ -> (0, k). Uniform.
 *   - Shear: î -> (1, 0), ĵ -> (s, 1). î stays put; ĵ tilts to the right.
 *
 * The user can toggle between "scale only", "shear only", and "both" to see
 * each effect in isolation and combined.
 *
 * Phase 5 a11y: each slider's handle is tab-focusable; arrow keys nudge by
 * 0.05 / Shift+arrow by 0.5. CanvasNarrative announces k and s on settle;
 * high-priority fires when k crosses 0 (grid collapses to a point) or when
 * s crosses cardinals.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 220
const UNIT = 44

const SLIDER_Y_K = VIEW_H - 90
const SLIDER_Y_S = VIEW_H - 40
const SLIDER_X_MIN = 100
const SLIDER_X_MAX = VIEW_W - 100

const K_MIN = -1.5
const K_MAX = 2
const S_MIN = -1.5
const S_MAX = 1.5

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

const kToX = (k: number) =>
  SLIDER_X_MIN + ((k - K_MIN) / (K_MAX - K_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const xToK = (x: number) =>
  K_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (K_MAX - K_MIN)
const sToX = (s: number) =>
  SLIDER_X_MIN + ((s - S_MIN) / (S_MAX - S_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const xToS = (x: number) =>
  S_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (S_MAX - S_MIN)

function arrowHead(from: { x: number; y: number }, to: { x: number; y: number }) {
  const ang = Math.atan2(to.y - from.y, to.x - from.x)
  const headLen = 13
  const headWide = 6
  return {
    p1: {
      x: to.x - headLen * Math.cos(ang) + headWide * Math.cos(ang + Math.PI / 2),
      y: to.y - headLen * Math.sin(ang) + headWide * Math.sin(ang + Math.PI / 2),
    },
    p2: {
      x: to.x - headLen * Math.cos(ang) - headWide * Math.cos(ang + Math.PI / 2),
      y: to.y - headLen * Math.sin(ang) - headWide * Math.sin(ang + Math.PI / 2),
    },
  }
}

function toSvg(mx: number, my: number) {
  return { x: ORIGIN_X + mx * UNIT, y: ORIGIN_Y - my * UNIT }
}

export function ScaleAndShear() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const kHandleRef = useRef<SVGGElement | null>(null)
  const sHandleRef = useRef<SVGGElement | null>(null)

  const [k, setK] = useState(1)
  const [s, setS] = useState(0)

  const startKRef = useRef<number | null>(null)
  const startSRef = useRef<number | null>(null)

  const updateK = useCallback((nk: number) => {
    const clamped = Math.max(K_MIN, Math.min(K_MAX, nk))
    const snap = [-1, 0, 1, 2].find((t) => Math.abs(clamped - t) < 0.04)
    setK(snap ?? clamped)
  }, [])
  const updateS = useCallback((ns: number) => {
    const clamped = Math.max(S_MIN, Math.min(S_MAX, ns))
    const snap = [-1, 0, 1].find((t) => Math.abs(clamped - t) < 0.04)
    setS(snap ?? clamped)
  }, [])

  const bindK = useDrag(({ first, movement: [mx] }) => {
    if (first) startKRef.current = k
    const start = startKRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startX = kToX(start)
    const newX = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startX + mx * sx))
    updateK(xToK(newX))
  })
  const bindS = useDrag(({ first, movement: [mx] }) => {
    if (first) startSRef.current = s
    const start = startSRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startX = sToX(start)
    const newX = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startX + mx * sx))
    updateS(xToS(newX))
  })

  useKeyNudge(
    kHandleRef,
    useCallback(
      (dx: number) => {
        const isShift = Math.abs(dx) >= 10
        const step = dx === 0 ? 0 : dx > 0 ? (isShift ? 0.5 : 0.05) : isShift ? -0.5 : -0.05
        updateK(k + step)
      },
      [k, updateK],
    ),
  )
  useKeyNudge(
    sHandleRef,
    useCallback(
      (dx: number) => {
        const isShift = Math.abs(dx) >= 10
        const step = dx === 0 ? 0 : dx > 0 ? (isShift ? 0.5 : 0.05) : isShift ? -0.5 : -0.05
        updateS(s + step)
      },
      [s, updateS],
    ),
  )

  // Combined matrix:  M = scale(k) · shear(s)
  // shear(s):  [[1, s], [0, 1]]
  // scale(k):  [[k, 0], [0, k]]
  // their product = [[k, k*s], [0, k]]
  // i.e. î -> (k, 0); ĵ -> (k*s, k)
  const iv = { x: k, y: 0 }
  const jv = { x: k * s, y: k }

  const det = iv.x * jv.y - iv.y * jv.x
  const collapsed = Math.abs(det) < 0.04

  const O = { x: ORIGIN_X, y: ORIGIN_Y }
  const I = toSvg(iv.x, iv.y)
  const J = toSvg(jv.x, jv.y)
  const IJ = toSvg(iv.x + jv.x, iv.y + jv.y)
  const headI = arrowHead(O, I)
  const headJ = arrowHead(O, J)

  // Transformed grid
  const transformedLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  for (let kk = -5; kk <= 5; kk++) {
    const a = toSvg(kk * iv.x + -4 * jv.x, kk * iv.y + -4 * jv.y)
    const b = toSvg(kk * iv.x + 4 * jv.x, kk * iv.y + 4 * jv.y)
    transformedLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
  }
  for (let kk = -4; kk <= 4; kk++) {
    const a = toSvg(-5 * iv.x + kk * jv.x, -5 * iv.y + kk * jv.y)
    const b = toSvg(5 * iv.x + kk * jv.x, 5 * iv.y + kk * jv.y)
    transformedLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
  }

  const narrationText = collapsed
    ? 'k is zero. Both basis vectors have collapsed to the origin. The whole plane crushed to a point.'
    : `Scale ${fmt(k).trim()}, shear ${fmt(s).trim()}. î sits at ${fmt(iv.x).trim()}, 0. ĵ tilts to ${fmt(jv.x).trim()}, ${fmt(jv.y).trim()}.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} priority={collapsed ? 'high' : 'normal'} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Scale ${fmt(k).trim()}, shear ${fmt(s).trim()}. î at ${fmt(iv.x).trim()}, ${fmt(iv.y).trim()}; ĵ at ${fmt(jv.x).trim()}, ${fmt(jv.y).trim()}.`}
      >
        <ReferenceGrid />

        {transformedLines.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="var(--color-vermilion)"
            strokeOpacity="0.22"
            strokeWidth="0.7"
          />
        ))}

        <polygon
          points={`${O.x},${O.y} ${I.x},${I.y} ${IJ.x},${IJ.y} ${J.x},${J.y}`}
          fill="var(--color-vermilion)"
          fillOpacity="0.10"
          stroke="var(--color-vermilion)"
          strokeOpacity="0.4"
          strokeWidth="1"
        />

        <Axes />

        {/* î and ĵ */}
        {!collapsed && (
          <>
            <line x1={O.x} y1={O.y} x2={I.x} y2={I.y} stroke="var(--color-vermilion)" strokeWidth="3" />
            <polygon
              points={`${I.x},${I.y} ${headI.p1.x},${headI.p1.y} ${headI.p2.x},${headI.p2.y}`}
              fill="var(--color-vermilion)"
            />
            <line x1={O.x} y1={O.y} x2={J.x} y2={J.y} stroke="var(--color-vermilion)" strokeWidth="3" />
            <polygon
              points={`${J.x},${J.y} ${headJ.p1.x},${headJ.p1.y} ${headJ.p2.x},${headJ.p2.y}`}
              fill="var(--color-vermilion)"
            />
          </>
        )}
        {collapsed && (
          <circle cx={ORIGIN_X} cy={ORIGIN_Y} r="6" fill="var(--color-vermilion)" />
        )}

        {/* Matrix readout */}
        <g transform="translate(420, 24)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            SCALE · SHEAR
          </text>
          <g transform="translate(0, 14)">
            <path d="M 4 6 L 0 6 L 0 56 L 4 56" fill="none" stroke="var(--color-ink)" strokeWidth="1.3" />
            <text x="14" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
              {fmt(iv.x).trim()}
            </text>
            <text x="74" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
              {fmt(jv.x).trim()}
            </text>
            <text x="14" y="44" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
              {fmt(iv.y).trim()}
            </text>
            <text x="74" y="44" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
              {fmt(jv.y).trim()}
            </text>
            <path d="M 132 6 L 136 6 L 136 56 L 132 56" fill="none" stroke="var(--color-ink)" strokeWidth="1.3" />
          </g>
          <text y="92" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            det M = {fmt(det).trim()}
          </text>
        </g>

        {/* Slider: k */}
        <Slider
          label={`SCALE  ·  k = ${fmt(k).trim()}`}
          y={SLIDER_Y_K}
          ticks={[-1, 0, 1, 2]}
          handleX={kToX(k)}
          bind={bindK}
          handleRef={kHandleRef}
          ariaLabel={`Scale factor k. Currently ${fmt(k).trim()}. Arrow keys nudge by zero point zero five.`}
          ariaMin={K_MIN}
          ariaMax={K_MAX}
          ariaNow={Number(k.toFixed(2))}
          toX={kToX}
        />

        {/* Slider: s */}
        <Slider
          label={`SHEAR  ·  s = ${fmt(s).trim()}`}
          y={SLIDER_Y_S}
          ticks={[-1, 0, 1]}
          handleX={sToX(s)}
          bind={bindS}
          handleRef={sHandleRef}
          ariaLabel={`Shear factor s. Currently ${fmt(s).trim()}. Arrow keys nudge by zero point zero five.`}
          ariaMin={S_MIN}
          ariaMax={S_MAX}
          ariaNow={Number(s.toFixed(2))}
          toX={sToX}
        />
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5 &mdash; Two basic deformations: stretching uniformly, tilting sideways
      </figcaption>
    </figure>
  )
}

interface SliderProps {
  label: string
  y: number
  ticks: number[]
  handleX: number
  bind: ReturnType<typeof useDrag>
  handleRef: React.RefObject<SVGGElement | null>
  ariaLabel: string
  ariaMin: number
  ariaMax: number
  ariaNow: number
  toX: (v: number) => number
}

function Slider({ label, y, ticks, handleX, bind, handleRef, ariaLabel, ariaMin, ariaMax, ariaNow, toX }: SliderProps) {
  return (
    <g>
      <text
        x={SLIDER_X_MIN}
        y={y - 14}
        fontFamily="Inter, sans-serif"
        fontSize="10"
        letterSpacing="0.18em"
        fill="var(--color-dim)"
      >
        {label}
      </text>
      <line x1={SLIDER_X_MIN} y1={y} x2={SLIDER_X_MAX} y2={y} stroke="var(--color-graph-ink)" strokeWidth="1.2" />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={toX(t)} y1={y - 5} x2={toX(t)} y2={y + 5} stroke="var(--color-graph-ink)" strokeWidth="1" />
          <text
            x={toX(t)}
            y={y + 18}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-dim)"
          >
            {t}
          </text>
        </g>
      ))}
      <g
        {...bind()}
        ref={handleRef}
        tabIndex={0}
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={ariaMin}
        aria-valuemax={ariaMax}
        aria-valuenow={ariaNow}
        style={{ cursor: 'grab', touchAction: 'none' }}
        className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
      >
        <circle cx={handleX} cy={y} r="20" fill="transparent" />
        <circle cx={handleX} cy={y} r="7" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
      </g>
    </g>
  )
}

function ReferenceGrid() {
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => {
        const x = ORIGIN_X + (i - 6) * UNIT
        return (
          <line
            key={`v-${i}`}
            x1={x}
            y1="20"
            x2={x}
            y2={VIEW_H - 130}
            stroke="var(--color-graph-fade)"
            strokeWidth="0.5"
          />
        )
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const y = ORIGIN_Y + (i - 4) * UNIT
        return (
          <line
            key={`h-${i}`}
            x1="20"
            y1={y}
            x2={VIEW_W - 20}
            y2={y}
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
      <line x1={ORIGIN_X} y1="20" x2={ORIGIN_X} y2={VIEW_H - 130} stroke="var(--color-graph-ink)" strokeWidth="1" />
    </>
  )
}
