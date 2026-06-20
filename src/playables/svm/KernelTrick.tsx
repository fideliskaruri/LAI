import { useCallback, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { PlotAxes, ClassScatter, ClassLegend } from './Axes'
import {
  RING_POINTS,
  VIEW_W,
  VIEW_H,
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  dataToSvgX,
  dataToSvgY,
  classColor,
} from './dataset'

/**
 * Act 6 — the kernel trick.
 *
 *  Left  : the 2D ring scatter. The inner blob is class +1; the surrounding
 *          ring is class −1. No straight line separates them. We draw a
 *          tentative diagonal line and shade the two regions to emphasize
 *          the failure.
 *
 *  Right : the same data lifted into 3D by either a polynomial kernel
 *          (z = x² + y²) or an RBF kernel (z = exp(−γ‖x − μ‖²)). Either lift
 *          puts the inner blob on a different z-level than the outer ring,
 *          so a horizontal plane separates them. A toggle picks the kernel.
 *
 * Co-mutating: the toggle on the right writes shared state ({kernel}). Left
 * doesn't need to react beyond a small note that says "the same data".
 */

export type Kernel = 'poly' | 'rbf'

export interface KernelState {
  kernel: Kernel
}

export const INITIAL_KERNEL: KernelState = { kernel: 'poly' }

/* ============================================================ */
/* LEFT — 2D ring, no separator exists                           */
/* ============================================================ */

export function LeftPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The same two classes, but now the +1 class sits in a tight blob in the middle while the −1 class forms a ring around it. No straight line can separate them. Two faded candidate lines are drawn to emphasize the failure."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A two-class scatter where the +1 class is an inner blob, the −1 class is a surrounding ring. No straight line separates them."
      >
        <PlotAxes ticksX={[0, 10, 20, 30, 40]} ticksY={[0, 10, 20, 30, 40]} />

        {/* Two doomed candidate lines — to make the failure visible */}
        {[
          { y0: 8, y1: 32 },
          { y0: 22, y1: 18 },
        ].map((l, i) => (
          <line
            key={i}
            x1={dataToSvgX(0)}
            y1={dataToSvgY(l.y0)}
            x2={dataToSvgX(40)}
            y2={dataToSvgY(l.y1)}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
            strokeOpacity="0.35"
            strokeDasharray="3 3"
          />
        ))}

        <ClassScatter pts={RING_POINTS} />

        <ClassLegend x={PLOT_X0 + 8} y={PLOT_Y0 + 8} />

        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          NO LINE SEPARATES THESE
        </text>

        {/* Header reminder */}
        <text
          x={PLOT_X0 + (PLOT_X1 - PLOT_X0) / 2}
          y={PLOT_Y0 - 12}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          a ring around a blob — flat
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5a &mdash; The case a line cannot solve
      </figcaption>
    </figure>
  )
}

/* ============================================================ */
/* RIGHT — 3D lift with kernel toggle                            */
/* ============================================================ */

export function RightPane({
  state,
  onChange,
}: {
  state: KernelState
  onChange: (s: KernelState) => void
}) {
  const polyButtonRef = useRef<SVGGElement | null>(null)
  const rbfButtonRef = useRef<SVGGElement | null>(null)

  const setKernel = useCallback(
    (k: Kernel) => onChange({ kernel: k }),
    [onChange],
  )

  useKeyNudge(
    polyButtonRef,
    useCallback(
      (dx: number) => {
        if (dx > 0) setKernel('rbf')
        else if (dx < 0) setKernel('poly')
      },
      [setKernel],
    ),
  )
  useKeyNudge(
    rbfButtonRef,
    useCallback(
      (dx: number) => {
        if (dx > 0) setKernel('rbf')
        else if (dx < 0) setKernel('poly')
      },
      [setKernel],
    ),
  )

  // 3D-ish projection. Centre on the data centroid (20, 20). Lift each point
  // to z = z(x,y) per the chosen kernel. Then project (x, y, z) to the page
  // with a fixed isometric-ish camera.
  const CX = 20
  const CY = 20
  function lift(x: number, y: number): number {
    if (state.kernel === 'poly') {
      // φ₃(x, y) = (x − CX)² + (y − CY)². Scaled to ~ [0, 1].
      return ((x - CX) ** 2 + (y - CY) ** 2) / 196
    }
    // RBF: high near centre, zero away. Same direction (inner is high).
    const r2 = (x - CX) ** 2 + (y - CY) ** 2
    return Math.exp(-r2 / 64)
  }

  // Camera: a single fixed angle. Projection:
  //   sx = cx + scale·(x − CX)·cosA + scale·(y − CY)·sinA
  //   sy = cy − scale·(x − CX)·sinB + scale·(y − CY)·cosB − liftScale·z
  // tuned by eye.
  const CAM_CX = VIEW_W / 2
  const CAM_CY = 280
  const SCALE_XY = 9
  const COS_A = 0.92
  const SIN_A = 0.4
  const COS_B = 0.86
  const SIN_B = 0.25
  const LIFT_SCALE = 130

  function project(p: { x: number; y: number; label: -1 | 1 }) {
    const dxd = p.x - CX
    const dyd = p.y - CY
    const z = lift(p.x, p.y)
    const sx = CAM_CX + SCALE_XY * (dxd * COS_A + dyd * SIN_A)
    const sy = CAM_CY - SCALE_XY * (-dxd * SIN_B + dyd * COS_B) - LIFT_SCALE * z
    return { sx, sy, z, label: p.label }
  }

  const projected = RING_POINTS.map((p) => project(p))

  // Separating plane: a horizontal slab at z = zStar that cuts between inner
  // and outer. We compute the average lift of class -1 and class +1 and put
  // the plane between them.
  let avgInner = 0
  let nInner = 0
  let avgOuter = 0
  let nOuter = 0
  for (const p of RING_POINTS) {
    const z = lift(p.x, p.y)
    if (p.label === 1) {
      avgInner += z
      nInner++
    } else {
      avgOuter += z
      nOuter++
    }
  }
  avgInner /= nInner
  avgOuter /= nOuter
  const zStar = (avgInner + avgOuter) / 2

  // Render the plane as a quad in projection.
  const PLANE_RADIUS = 14
  function projXY(x: number, y: number, z: number) {
    const dxd = x - CX
    const dyd = y - CY
    const sx = CAM_CX + SCALE_XY * (dxd * COS_A + dyd * SIN_A)
    const sy = CAM_CY - SCALE_XY * (-dxd * SIN_B + dyd * COS_B) - LIFT_SCALE * z
    return { sx, sy }
  }
  const planeCorners = [
    projXY(CX - PLANE_RADIUS, CY - PLANE_RADIUS, zStar),
    projXY(CX + PLANE_RADIUS, CY - PLANE_RADIUS, zStar),
    projXY(CX + PLANE_RADIUS, CY + PLANE_RADIUS, zStar),
    projXY(CX - PLANE_RADIUS, CY + PLANE_RADIUS, zStar),
  ]
  const planePath = `M ${planeCorners[0].sx} ${planeCorners[0].sy} L ${planeCorners[1].sx} ${planeCorners[1].sy} L ${planeCorners[2].sx} ${planeCorners[2].sy} L ${planeCorners[3].sx} ${planeCorners[3].sy} Z`

  const kernelText =
    state.kernel === 'poly'
      ? 'quadratic radial lift: z equals x squared plus y squared'
      : 'radial basis function: z equals exp of minus gamma times r squared'

  // Sort projected points by sy ascending so foreground is drawn last.
  const sortedIdx = projected
    .map((p, i) => ({ p, i }))
    .sort((a, b) => a.p.sy - b.p.sy)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The same ring data lifted to three dimensions by the ${kernelText}. The inner +1 blob sits above the outer −1 ring on the lift axis, so a horizontal plane now separates them.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Three-dimensional projection of the ring data after the kernel lift. A horizontal plane separates the +1 blob from the −1 ring. Active kernel: ${state.kernel === 'poly' ? 'polynomial' : 'RBF'}.`}
      >
        {/* Title */}
        <text
          x={VIEW_W / 2}
          y="48"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE KERNEL TRICK  ·  LIFT TO 3D
        </text>

        {/* Floor — a faint quadrilateral representing the original 2D plane */}
        <g opacity="0.6">
          <polygon
            points={`${projXY(CX - PLANE_RADIUS - 2, CY - PLANE_RADIUS - 2, 0).sx},${projXY(CX - PLANE_RADIUS - 2, CY - PLANE_RADIUS - 2, 0).sy}
                     ${projXY(CX + PLANE_RADIUS + 2, CY - PLANE_RADIUS - 2, 0).sx},${projXY(CX + PLANE_RADIUS + 2, CY - PLANE_RADIUS - 2, 0).sy}
                     ${projXY(CX + PLANE_RADIUS + 2, CY + PLANE_RADIUS + 2, 0).sx},${projXY(CX + PLANE_RADIUS + 2, CY + PLANE_RADIUS + 2, 0).sy}
                     ${projXY(CX - PLANE_RADIUS - 2, CY + PLANE_RADIUS + 2, 0).sx},${projXY(CX - PLANE_RADIUS - 2, CY + PLANE_RADIUS + 2, 0).sy}`}
            fill="var(--color-graph-fade)"
            fillOpacity="0.45"
            stroke="var(--color-graph-ink)"
            strokeWidth="0.6"
            strokeOpacity="0.6"
          />
        </g>

        {/* Separating plane — translucent vermilion slab */}
        <path d={planePath} fill="var(--color-vermilion)" fillOpacity="0.16" stroke="var(--color-vermilion)" strokeWidth="1.4" strokeDasharray="5 3" />

        {/* Vertical stems from each ground point to its lifted point. */}
        {projected.map((p, i) => {
          const ground = projXY(RING_POINTS[i].x, RING_POINTS[i].y, 0)
          return (
            <line
              key={`stem-${i}`}
              x1={ground.sx}
              y1={ground.sy}
              x2={p.sx}
              y2={p.sy}
              stroke="var(--color-graph-ink)"
              strokeOpacity="0.18"
              strokeWidth="0.8"
            />
          )
        })}

        {/* Projected scatter, painter-sorted */}
        {sortedIdx.map(({ p, i }) => {
          if (p.label === 1) {
            return <circle key={i} cx={p.sx} cy={p.sy} r="4.5" fill={classColor(1)} fillOpacity="0.9" />
          }
          return (
            <g key={i}>
              <line x1={p.sx - 4.5} y1={p.sy - 4.5} x2={p.sx + 4.5} y2={p.sy + 4.5} stroke={classColor(-1)} strokeWidth="1.8" />
              <line x1={p.sx - 4.5} y1={p.sy + 4.5} x2={p.sx + 4.5} y2={p.sy - 4.5} stroke={classColor(-1)} strokeWidth="1.8" />
            </g>
          )
        })}

        {/* Axis label for the lift axis */}
        <line
          x1={CAM_CX - 130}
          y1={CAM_CY + 18}
          x2={CAM_CX - 130}
          y2={CAM_CY + 18 - LIFT_SCALE * 1.0}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.8"
        />
        <text
          x={CAM_CX - 142}
          y={CAM_CY + 18 - LIFT_SCALE * 0.5}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          φ(x)
        </text>

        {/* Toggle */}
        <g transform={`translate(${VIEW_W / 2 - 110}, ${VIEW_H - 90})`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            KERNEL
          </text>
          <KernelButton
            x={0}
            y={14}
            active={state.kernel === 'poly'}
            label="POLY"
            onClick={() => setKernel('poly')}
            buttonRef={polyButtonRef}
          />
          <KernelButton
            x={110}
            y={14}
            active={state.kernel === 'rbf'}
            label="RBF"
            onClick={() => setKernel('rbf')}
            buttonRef={rbfButtonRef}
          />
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 28}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          {state.kernel === 'poly'
            ? 'φ(x, y) = (x − x₀)² + (y − y₀)²'
            : 'φ(x, y) = exp(− ‖x − x₀‖² / σ²)'}
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5b &mdash; A plane in 3D is a curve in 2D
      </figcaption>
    </figure>
  )
}

function KernelButton({
  x,
  y,
  active,
  label,
  onClick,
  buttonRef,
}: {
  x: number
  y: number
  active: boolean
  label: string
  onClick: () => void
  buttonRef: React.RefObject<SVGGElement | null>
}) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      ref={buttonRef}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={active}
      aria-label={`Use the ${label} kernel`}
      style={{ cursor: 'pointer' }}
      className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
    >
      <rect
        x={0}
        y={0}
        width={106}
        height={28}
        fill={active ? 'var(--color-vermilion)' : 'transparent'}
        stroke="var(--color-vermilion)"
        strokeWidth="1.2"
      />
      <text
        x={53}
        y={18}
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="12"
        fill={active ? 'var(--color-cream)' : 'var(--color-vermilion)'}
      >
        {label}
      </text>
    </g>
  )
}
