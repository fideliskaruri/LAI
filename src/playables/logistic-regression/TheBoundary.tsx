import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { PlotAxes, ClassScatter } from './Axes'
import {
  POINTS,
  VIEW_W,
  VIEW_H,
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  X_MIN,
  X_MAX,
  Y_MIN,
  Y_MAX,
  dataToSvgX,
  dataToSvgY,
  sigmoid,
  boundaryEndpoints,
  boundaryNormal,
  type BoundaryState,
} from './dataset'

/**
 * Act 3 — where the sigmoid hits 0.5.
 *
 *  Left  : the feature space with the decision boundary as a vermilion line.
 *          The reader can drag two handles on the line: a "rotate" handle at
 *          one end (changes angle) and a "translate" handle at the centre
 *          (changes offset perpendicular to the line). Above and below the
 *          line, a faint pink/blue tint shows the predicted-class regions.
 *  Right : a profile of σ taken along the perpendicular to the boundary —
 *          the boundary maps to z = 0 and the line falls off steeply or
 *          gently depending on the gain. A horizontal slider on this panel
 *          controls the gain (sigmoid steepness).
 *
 * Co-mutating: state is shared (angle, offset, gain). Drag the line on left,
 * change steepness on right.
 */

const fmt2 = (n: number) => n.toFixed(2)

const GAIN_MIN = 0.05
const GAIN_MAX = 2.0

/* ============================================================== */
/* LEFT PANE — feature space + draggable boundary                  */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: BoundaryState
  onChange: (s: BoundaryState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const rotateRef = useRef<SVGGElement | null>(null)
  const translateRef = useRef<SVGGElement | null>(null)
  const startStateRef = useRef<BoundaryState | null>(null)

  const update = useCallback(
    (next: Partial<BoundaryState>, interacting: boolean) => {
      onChange({ ...state, ...next, interacting })
    },
    [state, onChange],
  )

  const bindTranslate = useDrag(({ first, last, movement: [mx, my] }) => {
    if (first) startStateRef.current = state
    const start = startStateRef.current
    if (!start) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const sy = VIEW_H / rect.height
    const dxData = (mx * sx) / ((PLOT_X1 - PLOT_X0) / (X_MAX - X_MIN))
    const dyData = -(my * sy) / ((PLOT_Y1 - PLOT_Y0) / (Y_MAX - Y_MIN))
    // Project (dxData, dyData) onto the boundary normal.
    const { nx, ny } = boundaryNormal(start)
    const dOff = nx * dxData + ny * dyData
    update({ offset: start.offset + dOff }, !last)
  })

  const bindRotate = useDrag(({ first, last, movement: [mx, my] }) => {
    if (first) startStateRef.current = state
    const start = startStateRef.current
    if (!start) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const sy = VIEW_H / rect.height
    // Find the rotate-handle pixel position at drag start and adjust by movement.
    const ep = boundaryEndpoints(start)
    const x2px = dataToSvgX(ep.x2)
    const y2px = dataToSvgY(ep.y2)
    const ax = dataToSvgX((ep.x1 + ep.x2) / 2)
    const ay = dataToSvgY((ep.y1 + ep.y2) / 2)
    // Translate movement (in svg pixels) added to the start handle position.
    const newX = x2px + mx * sx
    const newY = y2px + my * sy
    // Angle in pixel space — careful: y inverted.
    const dx = newX - ax
    const dy = -(newY - ay)
    const angle = Math.atan2(dy, dx)
    update({ angle }, !last)
  })

  useKeyNudge(
    translateRef,
    useCallback(
      (dx: number, dy: number) => {
        const step = Math.max(Math.abs(dx), Math.abs(dy)) >= 10 ? 1 : 0.2
        const dir = dy !== 0 ? Math.sign(dy) : Math.sign(dx)
        update({ offset: state.offset + dir * step }, false)
      },
      [state.offset, update],
    ),
  )
  useKeyNudge(
    rotateRef,
    useCallback(
      (dx: number, dy: number) => {
        const step = Math.max(Math.abs(dx), Math.abs(dy)) >= 10 ? 0.15 : 0.03
        const dir = dx !== 0 ? Math.sign(dx) : Math.sign(dy)
        update({ angle: state.angle + dir * step }, false)
      },
      [state.angle, update],
    ),
  )

  const ep = boundaryEndpoints(state)
  const x1px = dataToSvgX(ep.x1)
  const y1px = dataToSvgY(ep.y1)
  const x2px = dataToSvgX(ep.x2)
  const y2px = dataToSvgY(ep.y2)
  const midX = (x1px + x2px) / 2
  const midY = (y1px + y2px) / 2

  // Background half-plane tints. We use two large polygons clipped to the plot
  // rectangle: one for the "red side", one for the "blue side", both very
  // light so the data points stay legible.
  const { nx, ny } = boundaryNormal(state)
  // Pick a far point on the red side: anchor + L · normal
  const FAR = 200
  const redCorner = {
    x: (X_MIN + X_MAX) / 2 + (FAR + state.offset) * nx,
    y: (Y_MIN + Y_MAX) / 2 + (FAR + state.offset) * ny,
  }
  void redCorner

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Decision boundary at angle ${fmt2(state.angle)} radians and offset ${fmt2(state.offset)}. Drag the centre handle to slide the boundary or the end handle to rotate it.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Feature space with a draggable linear decision boundary. Angle ${fmt2(state.angle)}, offset ${fmt2(state.offset)}.`}
      >
        {/* Tint the two half-planes very subtly using a polygon clipped to the
            plot rectangle. We compute the four corners of the plot in data
            coords, classify each by sign of z, and draw the convex polygons. */}
        <defs>
          <clipPath id="boundary-plot-clip">
            <rect
              x={PLOT_X0}
              y={PLOT_Y0}
              width={PLOT_X1 - PLOT_X0}
              height={PLOT_Y1 - PLOT_Y0}
            />
          </clipPath>
        </defs>

        <PlotAxes xLabel="Feature 1" yLabel="Feature 2" />

        <g clipPath="url(#boundary-plot-clip)">
          {/* Stretch the line far past the plot to make sure the half-plane
              polygons cover the rectangle. Build by extending the endpoints
              by a big multiple of the normal. */}
          <BoundaryHalfplanes nx={nx} ny={ny} ep={ep} />
        </g>

        <ClassScatter pts={POINTS} />

        {/* Boundary line itself */}
        <line
          x1={x1px}
          y1={y1px}
          x2={x2px}
          y2={y2px}
          stroke="var(--color-vermilion)"
          strokeWidth="2.2"
        />

        {/* Translate handle (centre dot) */}
        <g
          {...bindTranslate()}
          ref={translateRef}
          tabIndex={0}
          role="button"
          aria-label={`Translate boundary. Current offset ${fmt2(state.offset)}. Arrow keys to slide perpendicular to the line.`}
          style={{ cursor: 'move', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={midX} cy={midY} r="22" fill="transparent" />
          <circle
            cx={midX}
            cy={midY}
            r="8"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        </g>

        {/* Rotate handle (right end) */}
        <g
          {...bindRotate()}
          ref={rotateRef}
          tabIndex={0}
          role="button"
          aria-label={`Rotate boundary. Current angle ${fmt2(state.angle)} radians. Arrow keys to rotate.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={x2px} cy={y2px} r="22" fill="transparent" />
          <circle
            cx={x2px}
            cy={y2px}
            r="7"
            fill="var(--color-vermilion)"
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
        </g>

        {/* Readout */}
        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
            DECISION BOUNDARY &middot; σ(z) = ½
          </text>
          <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            angle = {fmt2(state.angle)} rad
          </text>
          <text y="38" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            offset = {fmt2(state.offset)}
          </text>
        </g>

        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          CENTRE DOT &middot; SLIDE &middot; END DOT &middot; ROTATE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2a &mdash; The line where the probability tips
      </figcaption>
    </figure>
  )
}

/** Faint half-plane tints. The "red" side is on the positive-normal side. */
function BoundaryHalfplanes({
  nx,
  ny,
  ep,
}: {
  nx: number
  ny: number
  ep: { x1: number; y1: number; x2: number; y2: number }
}) {
  // Build two big polygons that each cover one half-plane. Take the line
  // segment, extend it far in both directions, then offset perpendicular
  // by a large amount.
  const BIG = 200
  const ax = dataToSvgX(ep.x1 - BIG * (ep.x2 - ep.x1))
  const ay = dataToSvgY(ep.y1 - BIG * (ep.y2 - ep.y1))
  const bx = dataToSvgX(ep.x2 + BIG * (ep.x2 - ep.x1))
  const by = dataToSvgY(ep.y2 + BIG * (ep.y2 - ep.y1))
  // Offset both ends by ±N · BIG along the normal.
  const dxN = nx * BIG
  const dyN = ny * BIG
  // Red side (positive normal)
  const redPoly = [
    [ax, ay],
    [bx, by],
    [dataToSvgX(ep.x2 + BIG * (ep.x2 - ep.x1) + dxN), dataToSvgY(ep.y2 + BIG * (ep.y2 - ep.y1) + dyN)],
    [dataToSvgX(ep.x1 - BIG * (ep.x2 - ep.x1) + dxN), dataToSvgY(ep.y1 - BIG * (ep.y2 - ep.y1) + dyN)],
  ]
  const bluePoly = [
    [ax, ay],
    [bx, by],
    [dataToSvgX(ep.x2 + BIG * (ep.x2 - ep.x1) - dxN), dataToSvgY(ep.y2 + BIG * (ep.y2 - ep.y1) - dyN)],
    [dataToSvgX(ep.x1 - BIG * (ep.x2 - ep.x1) - dxN), dataToSvgY(ep.y1 - BIG * (ep.y2 - ep.y1) - dyN)],
  ]
  const ptStr = (poly: number[][]) => poly.map((p) => `${p[0]},${p[1]}`).join(' ')
  return (
    <g>
      <polygon points={ptStr(redPoly)} fill="var(--color-vermilion)" fillOpacity="0.06" />
      <polygon points={ptStr(bluePoly)} fill="var(--color-graph-ink)" fillOpacity="0.04" />
    </g>
  )
}

/* ============================================================== */
/* RIGHT PANE — σ profile along the perpendicular + gain slider    */
/* ============================================================== */

const GAIN_TRACK_X0 = PLOT_X0 + 30
const GAIN_TRACK_X1 = PLOT_X1 - 30
const GAIN_TRACK_Y = PLOT_Y1 - 60

function gainToPx(g: number) {
  return GAIN_TRACK_X0 + ((g - GAIN_MIN) / (GAIN_MAX - GAIN_MIN)) * (GAIN_TRACK_X1 - GAIN_TRACK_X0)
}
function pxToGain(px: number) {
  return GAIN_MIN + ((px - GAIN_TRACK_X0) / (GAIN_TRACK_X1 - GAIN_TRACK_X0)) * (GAIN_MAX - GAIN_MIN)
}

export function RightPane({
  state,
  onChange,
}: {
  state: BoundaryState
  onChange: (s: BoundaryState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const gainHandleRef = useRef<SVGGElement | null>(null)
  const startGainRef = useRef<number | null>(null)

  const update = useCallback(
    (gain: number, interacting: boolean) => {
      const clamped = Math.max(GAIN_MIN, Math.min(GAIN_MAX, gain))
      onChange({ ...state, gain: clamped, interacting })
    },
    [state, onChange],
  )

  const bindGain = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startGainRef.current = state.gain
    const start = startGainRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startPx = gainToPx(start)
    const newPx = startPx + mx * sx
    update(pxToGain(newPx), !last)
  })

  useKeyNudge(
    gainHandleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? 0.2 : 0.02
        update(state.gain + Math.sign(dx) * step, false)
      },
      [state.gain, update],
    ),
  )

  // The profile plot lives above the gain slider. We plot σ(gain · d) for
  // perpendicular distance d ∈ [−20, 20].
  const D_MIN = -20
  const D_MAX = 20
  const PROF_X0 = PLOT_X0
  const PROF_X1 = PLOT_X1
  const PROF_Y0 = PLOT_Y0 + 40
  const PROF_Y1 = PLOT_Y1 - 100

  function dToPx(d: number) {
    return PROF_X0 + ((d - D_MIN) / (D_MAX - D_MIN)) * (PROF_X1 - PROF_X0)
  }
  function sToPx(s: number) {
    const TOP = PROF_Y0 + 12
    const BOT = PROF_Y1 - 12
    return BOT - s * (BOT - TOP)
  }

  // Build the path
  const N = 200
  const pts: string[] = []
  for (let i = 0; i <= N; i++) {
    const d = D_MIN + ((D_MAX - D_MIN) * i) / N
    const s = sigmoid(state.gain * d)
    const px = dToPx(d)
    const py = sToPx(s)
    pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`)
  }
  const path = pts.join(' ')

  const sharpness =
    state.gain < 0.15 ? 'very gentle' : state.gain < 0.5 ? 'gentle' : state.gain < 1.1 ? 'sharp' : 'very sharp'

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Sigmoid profile across the boundary. Gain ${fmt2(state.gain)} — a ${sharpness} transition. Higher gain means the curve switches from zero to one more quickly across the line.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Sigmoid profile across the boundary. Gain ${fmt2(state.gain)} — a ${sharpness} transition.`}
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
          y="68"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          σ ACROSS THE BOUNDARY
        </text>

        {/* Horizontal guide lines for 0, ½, 1 */}
        {[
          { y: sToPx(0), label: '0' },
          { y: sToPx(0.5), label: '½' },
          { y: sToPx(1), label: '1' },
        ].map((g) => (
          <g key={g.label}>
            <line
              x1={PROF_X0}
              y1={g.y}
              x2={PROF_X1}
              y2={g.y}
              stroke="var(--color-graph-fade)"
              strokeWidth="0.6"
              strokeDasharray={g.label === '½' ? '3 3' : undefined}
            />
            <text
              x={PROF_X0 - 8}
              y={g.y + 3}
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {g.label}
            </text>
          </g>
        ))}

        {/* Vertical mark at d = 0 (boundary) */}
        <line
          x1={dToPx(0)}
          y1={PROF_Y0}
          x2={dToPx(0)}
          y2={PROF_Y1}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
          strokeDasharray="3 3"
          strokeOpacity="0.7"
        />

        {/* Profile path */}
        <path d={path} fill="none" stroke="var(--color-graph-ink)" strokeWidth="1.8" />

        {/* Ticks on the d-axis */}
        {[-20, -10, 0, 10, 20].map((d) => (
          <g key={d}>
            <line
              x1={dToPx(d)}
              y1={sToPx(0)}
              x2={dToPx(d)}
              y2={sToPx(0) + 4}
              stroke="var(--color-graph-ink)"
              strokeWidth="1"
            />
            <text
              x={dToPx(d)}
              y={sToPx(0) + 18}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {d}
            </text>
          </g>
        ))}
        <text
          x={(PROF_X0 + PROF_X1) / 2}
          y={sToPx(0) + 34}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DISTANCE FROM BOUNDARY
        </text>

        {/* Gain slider */}
        <g>
          <text
            x={GAIN_TRACK_X0}
            y={GAIN_TRACK_Y - 18}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            SHARPNESS &middot; GAIN = {fmt2(state.gain)}
          </text>
          <line
            x1={GAIN_TRACK_X0}
            y1={GAIN_TRACK_Y}
            x2={GAIN_TRACK_X1}
            y2={GAIN_TRACK_Y}
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
          />
          {/* Endpoint labels */}
          <text
            x={GAIN_TRACK_X0}
            y={GAIN_TRACK_Y + 18}
            textAnchor="start"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-dim)"
          >
            gentle
          </text>
          <text
            x={GAIN_TRACK_X1}
            y={GAIN_TRACK_Y + 18}
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-dim)"
          >
            sharp
          </text>

          <g
            {...bindGain()}
            ref={gainHandleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Sigmoid gain. Current ${fmt2(state.gain)}. Arrow keys to nudge, Shift plus arrow for larger step.`}
            aria-valuemin={GAIN_MIN}
            aria-valuemax={GAIN_MAX}
            aria-valuenow={Number(state.gain.toFixed(2))}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={gainToPx(state.gain)} cy={GAIN_TRACK_Y} r="22" fill="transparent" />
            <circle
              cx={gainToPx(state.gain)}
              cy={GAIN_TRACK_Y}
              r="8"
              fill="var(--color-vermilion)"
              stroke="var(--color-cream)"
              strokeWidth="2"
            />
          </g>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2b &mdash; The probability across the line, sharp or gentle
      </figcaption>
    </figure>
  )
}
