import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Act 5: a pure rotation by angle θ. A slider drives θ; î and ĵ rotate
 * together; the matrix shows [[cos θ, -sin θ], [sin θ, cos θ]].
 *
 * The whole transformed grid swings as a rigid body.
 *
 * Phase 5 a11y: slider handle is tab-focusable; arrow keys nudge θ by
 * 1 degree, Shift+arrow by 10 degrees. CanvasNarrative announces the
 * angle on settle; high-priority fires at 0°, 90°, 180°, 270°.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 280
const ORIGIN_Y = 220
const UNIT = 44

const SLIDER_Y = VIEW_H - 60
const SLIDER_X_MIN = 100
const SLIDER_X_MAX = VIEW_W - 100
const THETA_MIN = -Math.PI
const THETA_MAX = Math.PI

const fmt = (n: number) => n.toFixed(2)
const fmtDeg = (rad: number) => `${((rad * 180) / Math.PI).toFixed(0)}°`

const thetaToX = (t: number) =>
  SLIDER_X_MIN + ((t - THETA_MIN) / (THETA_MAX - THETA_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const xToTheta = (x: number) =>
  THETA_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (THETA_MAX - THETA_MIN)

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

function narrate(theta: number): { text: string; priority: 'normal' | 'high' } {
  // detect quarter-turn cardinals
  const deg = (theta * 180) / Math.PI
  const tol = 1.2
  if (Math.abs(deg) < tol) {
    return { text: 'Identity rotation. î and ĵ sit at their original positions.', priority: 'high' }
  }
  if (Math.abs(deg - 90) < tol) {
    return { text: 'Ninety-degree rotation. î now points where ĵ used to.', priority: 'high' }
  }
  if (Math.abs(deg + 90) < tol) {
    return { text: 'Minus ninety degrees. î drops down where minus ĵ used to be.', priority: 'high' }
  }
  if (Math.abs(Math.abs(deg) - 180) < tol) {
    return { text: 'A hundred-and-eighty-degree rotation. Both basis vectors point opposite.', priority: 'high' }
  }
  return {
    text: `Rotation by ${fmtDeg(theta)}. cos θ = ${fmt(Math.cos(theta))}, sin θ = ${fmt(Math.sin(theta))}.`,
    priority: 'normal',
  }
}

export function PureRotation() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const [theta, setTheta] = useState(Math.PI / 6)
  const startThetaRef = useRef<number | null>(null)

  const updateTheta = useCallback((t: number) => {
    const clamped = Math.max(THETA_MIN, Math.min(THETA_MAX, t))
    // snap to cardinals when close (~3°)
    const snapTargets = [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI]
    const snap = snapTargets.find((s) => Math.abs(clamped - s) < 0.05)
    setTheta(snap ?? clamped)
  }, [])

  const bind = useDrag(({ first, movement: [mx] }) => {
    if (first) startThetaRef.current = theta
    const start = startThetaRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startX = thetaToX(start)
    const newX = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startX + mx * sx))
    updateTheta(xToTheta(newX))
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        // 1° per nudge, 10° on Shift
        const isShift = Math.abs(dx) >= 10
        const stepDeg = dx === 0 ? 0 : dx > 0 ? (isShift ? 10 : 1) : isShift ? -10 : -1
        updateTheta(theta + (stepDeg * Math.PI) / 180)
      },
      [theta, updateTheta],
    ),
  )

  const c = Math.cos(theta)
  const s = Math.sin(theta)
  // rotation: î -> (cos θ, sin θ), ĵ -> (-sin θ, cos θ)
  const iv = { x: c, y: s }
  const jv = { x: -s, y: c }

  const O = { x: ORIGIN_X, y: ORIGIN_Y }
  const I = toSvg(iv.x, iv.y)
  const J = toSvg(jv.x, jv.y)
  const IJ = toSvg(iv.x + jv.x, iv.y + jv.y)

  const headI = arrowHead(O, I)
  const headJ = arrowHead(O, J)

  // Transformed grid lines
  const transformedLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  for (let k = -5; k <= 5; k++) {
    const a = toSvg(k * iv.x + -4 * jv.x, k * iv.y + -4 * jv.y)
    const b = toSvg(k * iv.x + 4 * jv.x, k * iv.y + 4 * jv.y)
    transformedLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
  }
  for (let k = -4; k <= 4; k++) {
    const a = toSvg(-5 * iv.x + k * jv.x, -5 * iv.y + k * jv.y)
    const b = toSvg(5 * iv.x + k * jv.x, 5 * iv.y + k * jv.y)
    transformedLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
  }

  const sliderHandleX = thetaToX(theta)
  const narration = narrate(theta)

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration.text} priority={narration.priority} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Pure rotation by ${fmtDeg(theta)}. Matrix is cosine ${fmt(c)} minus sine ${fmt(s)} sine ${fmt(s)} cosine ${fmt(c)}.`}
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

        <Axes originX={ORIGIN_X} originY={ORIGIN_Y} />

        {/* The arc tracing θ */}
        <path
          d={`M ${ORIGIN_X + UNIT * 0.55} ${ORIGIN_Y} A ${UNIT * 0.55} ${UNIT * 0.55} 0 ${
            Math.abs(theta) > Math.PI / 2 ? 1 : 0
          } ${theta > 0 ? 0 : 1} ${ORIGIN_X + UNIT * 0.55 * c} ${ORIGIN_Y - UNIT * 0.55 * s}`}
          fill="none"
          stroke="var(--color-vermilion)"
          strokeWidth="1.2"
          opacity="0.7"
        />
        <text
          x={ORIGIN_X + UNIT * 0.75 * Math.cos(theta / 2)}
          y={ORIGIN_Y - UNIT * 0.75 * Math.sin(theta / 2) + 4}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          θ
        </text>

        {/* î (vermilion) */}
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

        {/* Matrix readout */}
        <g transform="translate(420, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            R(θ)
          </text>
          <g transform="translate(0, 14)">
            <path d="M 4 6 L 0 6 L 0 56 L 4 56" fill="none" stroke="var(--color-ink)" strokeWidth="1.3" />
            <text x="14" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
              {fmt(c)}
            </text>
            <text x="78" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
              {fmt(-s)}
            </text>
            <text x="14" y="44" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
              {fmt(s)}
            </text>
            <text x="78" y="44" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
              {fmt(c)}
            </text>
            <path d="M 140 6 L 144 6 L 144 56 L 140 56" fill="none" stroke="var(--color-ink)" strokeWidth="1.3" />
          </g>
          <text y="92" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
            θ = {fmtDeg(theta)}
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
          {[-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI].map((t) => (
            <g key={t}>
              <line
                x1={thetaToX(t)}
                y1={SLIDER_Y - 6}
                x2={thetaToX(t)}
                y2={SLIDER_Y + 6}
                stroke="var(--color-graph-ink)"
                strokeWidth="1"
              />
              <text
                x={thetaToX(t)}
                y={SLIDER_Y + 22}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-dim)"
              >
                {`${((t * 180) / Math.PI).toFixed(0)}°`}
              </text>
            </g>
          ))}
          <g
            {...bind()}
            ref={handleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Rotation angle θ. Currently ${fmtDeg(theta)}. Arrow keys nudge by one degree, Shift plus arrow by ten.`}
            aria-valuemin={Math.round((THETA_MIN * 180) / Math.PI)}
            aria-valuemax={Math.round((THETA_MAX * 180) / Math.PI)}
            aria-valuenow={Math.round((theta * 180) / Math.PI)}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={sliderHandleX} cy={SLIDER_Y} r="22" fill="transparent" />
            <circle
              cx={sliderHandleX}
              cy={SLIDER_Y}
              r="8"
              fill="var(--color-vermilion)"
              stroke="var(--color-cream)"
              strokeWidth="2"
            />
          </g>
          <text
            x={SLIDER_X_MIN}
            y={SLIDER_Y - 18}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            DRAG  ·  θ
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4 &mdash; A rotation: every direction swings together
      </figcaption>
    </figure>
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
            y2={VIEW_H - 100}
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

function Axes({ originX, originY }: { originX: number; originY: number }) {
  return (
    <>
      <line x1="20" y1={originY} x2={VIEW_W - 20} y2={originY} stroke="var(--color-graph-ink)" strokeWidth="1" />
      <line x1={originX} y1="20" x2={originX} y2={VIEW_H - 100} stroke="var(--color-graph-ink)" strokeWidth="1" />
    </>
  )
}
