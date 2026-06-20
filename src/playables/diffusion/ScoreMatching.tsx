import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 5 — Score matching.
 *
 *  Left  : a 2D scatter — a circular cluster of data points (a noisy ring).
 *  Right : the score field — the gradient of log p(x), shown as a grid of
 *          arrows pointing toward the data manifold. The score points
 *          uphill — toward higher density — and walking against the gradient
 *          (i.e. *with* the score) is what reverse diffusion does in 2D.
 *
 * Static. No interaction.
 */

const VIEW_W = 600
const VIEW_H = 480

const CX = VIEW_W / 2
const CY = VIEW_H / 2 + 10
const RING_R = 110
const RING_SIGMA = 18

/** Density at (x, y) — a Gaussian-thickened ring of radius RING_R. */
function logDensity(x: number, y: number) {
  const dx = x - CX
  const dy = y - CY
  const r = Math.sqrt(dx * dx + dy * dy)
  const d = r - RING_R
  return -(d * d) / (2 * RING_SIGMA * RING_SIGMA)
}

/** Numerical gradient of log p(x, y). */
function score(x: number, y: number): { gx: number; gy: number } {
  const eps = 0.5
  const gx = (logDensity(x + eps, y) - logDensity(x - eps, y)) / (2 * eps)
  const gy = (logDensity(x, y + eps) - logDensity(x, y - eps)) / (2 * eps)
  return { gx, gy }
}

/** Deterministic ring scatter. */
function ringPoints(n = 220) {
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + Math.sin(i * 2.71) * 0.04
    const radial = RING_R + (Math.sin(i * 1.7) + Math.cos(i * 3.3)) * RING_SIGMA * 0.55
    pts.push({ x: CX + radial * Math.cos(angle), y: CY + radial * Math.sin(angle) })
  }
  return pts
}

export function LeftPane() {
  const pts = ringPoints()
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A scatter of two hundred-odd data points arranged roughly on a ring. This is our toy data distribution — a one-dimensional manifold embedded in a two-dimensional plane."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A scatter plot of data points arranged in a noisy ring. The data lives on a one-dimensional manifold in a two-dimensional plane."
      >
        <text
          x={VIEW_W / 2}
          y="46"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE DATA &middot; A NOISY RING
        </text>

        {/* Faint reference ring */}
        <circle cx={CX} cy={CY} r={RING_R} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" strokeDasharray="3 4" />

        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="var(--color-vermilion)" />
        ))}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 38}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          everything we have are samples
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4a &mdash; The data lives on a thin curve in the plane
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  // Field grid
  const STEP = 36
  const arrows: React.ReactElement[] = []
  const PAD = 50
  for (let x = PAD; x < VIEW_W - PAD; x += STEP) {
    for (let y = PAD + 60; y < VIEW_H - PAD - 20; y += STEP) {
      const { gx, gy } = score(x, y)
      const mag = Math.sqrt(gx * gx + gy * gy)
      if (mag < 1e-4) continue
      const L = Math.min(22, 14 + mag * 14)
      const nx = (gx / mag) * L
      const ny = (gy / mag) * L
      const opacity = Math.min(1, 0.35 + mag * 0.7)
      const headAngle = Math.atan2(ny, nx)
      const HEAD = 5
      const head1x = x + nx - HEAD * Math.cos(headAngle - 0.5)
      const head1y = y + ny - HEAD * Math.sin(headAngle - 0.5)
      const head2x = x + nx - HEAD * Math.cos(headAngle + 0.5)
      const head2y = y + ny - HEAD * Math.sin(headAngle + 0.5)
      arrows.push(
        <g key={`${x}-${y}`} opacity={opacity}>
          <line x1={x} y1={y} x2={x + nx} y2={y + ny} stroke="var(--color-vermilion)" strokeWidth="1.2" />
          <polygon
            points={`${x + nx},${y + ny} ${head1x},${head1y} ${head2x},${head2y}`}
            fill="var(--color-vermilion)"
          />
        </g>,
      )
    }
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A vector field showing the score — the gradient of log density. Every arrow points toward the data ring. Arrows near the ring are short; arrows far from it are long, urging you back toward where the data lives."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A vector field of the score function. Arrows point toward the data ring; arrows far from the ring are longer than those near it."
      >
        <text
          x={VIEW_W / 2}
          y="46"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE SCORE &middot; &nabla; log p(x)
        </text>

        {/* Faint reference ring */}
        <circle cx={CX} cy={CY} r={RING_R} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" strokeDasharray="3 4" />

        {arrows}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 38}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          every arrow says: this way to the data
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4b &mdash; The score field — a compass pointing home
      </figcaption>
    </figure>
  )
}
