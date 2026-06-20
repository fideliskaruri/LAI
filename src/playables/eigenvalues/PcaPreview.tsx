import { useCallback, useMemo, useRef, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Act 6 — PCA preview.
 *
 * A scatter of synthetic 2D points sampled from a correlated cloud. We
 * compute the (data) covariance matrix once at mount and find its
 * eigenvectors and eigenvalues in closed form (2×2 covariance). Two
 * vermilion arrows along the principal axes, lengths = sqrt(eigenvalues).
 *
 * Toggle: rotate the data so the principal axes line up with the screen
 * axes. (This is what PCA does: re-express the data in the eigenbasis of
 * the covariance.)
 *
 * Phase 5 a11y: the toggle is a button; CanvasNarrative announces the
 * rotation.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const fmt = (n: number) => n.toFixed(2)

// Deterministic seeded RNG so the scatter never re-shuffles between renders.
function mulberry32(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussian(rng: () => number) {
  // Box–Muller
  const u1 = Math.max(1e-9, rng())
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

interface Pt {
  x: number
  y: number
}

function makeCloud(n: number, seed: number): Pt[] {
  const rng = mulberry32(seed)
  const pts: Pt[] = []
  // Generate from N(0, I), then stretch along a tilted axis to get a
  // correlated cloud. Major SD = 1.5, minor SD = 0.5; tilt = 30°.
  const major = 1.6
  const minor = 0.45
  const theta = Math.PI / 6
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  for (let i = 0; i < n; i++) {
    const a = gaussian(rng) * major
    const b = gaussian(rng) * minor
    pts.push({
      x: c * a - s * b,
      y: s * a + c * b,
    })
  }
  return pts
}

// 2×2 closed-form eigen — for a symmetric S=[[a,b],[b,c]]
function eigenSym(a: number, b: number, c: number) {
  const tr = a + c
  const det = a * c - b * b
  const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det))
  const l1 = tr / 2 + disc
  const l2 = tr / 2 - disc
  // eigenvector for l1: solve (a − l1) x + b y = 0
  // pick a stable formula: if |b| > eps use (b, l1 − a); else use (1, 0)/(0, 1).
  const eps = 1e-9
  let v1: Pt
  if (Math.abs(b) > eps) {
    v1 = { x: b, y: l1 - a }
  } else {
    v1 = a >= c ? { x: 1, y: 0 } : { x: 0, y: 1 }
  }
  const n1 = Math.hypot(v1.x, v1.y) || 1
  v1 = { x: v1.x / n1, y: v1.y / n1 }
  // v2 is perpendicular to v1
  const v2: Pt = { x: -v1.y, y: v1.x }
  return { l1, l2, v1, v2 }
}

function toSvg(mx: number, my: number) {
  return { x: ORIGIN_X + mx * UNIT, y: ORIGIN_Y - my * UNIT }
}

function arrowHead(from: { x: number; y: number }, to: { x: number; y: number }) {
  const ang = Math.atan2(to.y - from.y, to.x - from.x)
  const headLen = 12
  const headWide = 5
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

export function PcaPreview() {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [rotated, setRotated] = useState(false)

  const points = useMemo(() => makeCloud(240, 0xc0c0a), [])

  // Empirical covariance of the cloud
  const { covA, covB, covC } = useMemo(() => {
    let sx = 0
    let sy = 0
    for (const p of points) {
      sx += p.x
      sy += p.y
    }
    const mx = sx / points.length
    const my = sy / points.length
    let a = 0
    let b = 0
    let c = 0
    for (const p of points) {
      const dx = p.x - mx
      const dy = p.y - my
      a += dx * dx
      b += dx * dy
      c += dy * dy
    }
    return {
      covA: a / points.length,
      covB: b / points.length,
      covC: c / points.length,
    }
  }, [points])

  const eig = useMemo(() => eigenSym(covA, covB, covC), [covA, covB, covC])

  // For the rotated view we apply the eigenbasis change: x' = Vᵀ x.
  // V = [v1 | v2] so Vᵀ x = (v1·x, v2·x).
  const displayed = useMemo(() => {
    if (!rotated) return points
    return points.map((p) => ({
      x: eig.v1.x * p.x + eig.v1.y * p.y,
      y: eig.v2.x * p.x + eig.v2.y * p.y,
    }))
  }, [points, rotated, eig])

  // Arrow ends — sqrt(λ) along each eigenvector, multiplied by a display
  // factor so the arrows read at the cloud's scale.
  const ARROW_SCALE = 1.6
  const arrowsBefore = [
    { dir: eig.v1, len: Math.sqrt(Math.max(0, eig.l1)) * ARROW_SCALE, label: `λ₁ = ${fmt(eig.l1)}` },
    { dir: eig.v2, len: Math.sqrt(Math.max(0, eig.l2)) * ARROW_SCALE, label: `λ₂ = ${fmt(eig.l2)}` },
  ]
  // After rotation, eigenvectors are axis-aligned.
  const arrowsAfter = [
    { dir: { x: 1, y: 0 }, len: Math.sqrt(Math.max(0, eig.l1)) * ARROW_SCALE, label: `λ₁ = ${fmt(eig.l1)}` },
    { dir: { x: 0, y: 1 }, len: Math.sqrt(Math.max(0, eig.l2)) * ARROW_SCALE, label: `λ₂ = ${fmt(eig.l2)}` },
  ]
  const arrows = rotated ? arrowsAfter : arrowsBefore

  useKeyNudge(
    buttonRef as React.RefObject<HTMLElement>,
    useCallback((dx: number) => {
      if (dx !== 0) setRotated((r) => !r)
    }, []),
  )

  const narrationText = rotated
    ? 'The cloud has been rotated into the eigenbasis of its covariance. The principal axes now lie along the screen axes. The horizontal spread is the dominant eigenvalue; the vertical spread is the smaller one.'
    : 'A correlated cloud of 2D points. Two vermilion arrows along the eigenvectors of the covariance matrix — the principal axes. The longer arrow is the direction of most variance.'

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} priority="normal" />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A scatter of ${points.length} two-dimensional points with the two principal axes drawn as vermilion arrows. ${rotated ? 'The cloud has been rotated into its eigenbasis.' : 'The cloud is in its original orientation.'}`}
      >
        <ReferenceGrid />
        <Axes />

        {/* Scatter */}
        {displayed.map((p, i) => {
          const sv = toSvg(p.x, p.y)
          return (
            <circle
              key={i}
              cx={sv.x}
              cy={sv.y}
              r="2.4"
              fill="var(--color-ink)"
              fillOpacity="0.55"
            />
          )
        })}

        {/* Principal axes */}
        {arrows.map((a, i) => {
          const O = { x: ORIGIN_X, y: ORIGIN_Y }
          const tip = toSvg(a.dir.x * a.len, a.dir.y * a.len)
          const head = arrowHead(O, tip)
          return (
            <g key={i}>
              <line
                x1={O.x}
                y1={O.y}
                x2={tip.x}
                y2={tip.y}
                stroke="var(--color-vermilion)"
                strokeWidth="3"
              />
              <polygon
                points={`${tip.x},${tip.y} ${head.p1.x},${head.p1.y} ${head.p2.x},${head.p2.y}`}
                fill="var(--color-vermilion)"
              />
              <text
                x={tip.x + (a.dir.x >= 0 ? 8 : -8)}
                y={tip.y + (a.dir.y >= 0 ? -8 : 16)}
                textAnchor={a.dir.x >= 0 ? 'start' : 'end'}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="12"
                fill="var(--color-vermilion)"
              >
                {a.label}
              </text>
            </g>
          )
        })}

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            COVARIANCE  ·  Σ
          </text>
          <g transform="translate(0, 14)">
            <path d="M 4 6 L 0 6 L 0 56 L 4 56" fill="none" stroke="var(--color-ink)" strokeWidth="1.4" />
            <text x="14" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
              {fmt(covA)}
            </text>
            <text x="74" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
              {fmt(covB)}
            </text>
            <text x="14" y="44" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
              {fmt(covB)}
            </text>
            <text x="74" y="44" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
              {fmt(covC)}
            </text>
            <path d="M 116 6 L 120 6 L 120 56 L 116 56" fill="none" stroke="var(--color-ink)" strokeWidth="1.4" />
          </g>
          <text y="84" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
            λ₁ = {fmt(eig.l1)}
          </text>
          <text y="100" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
            λ₂ = {fmt(eig.l2)}
          </text>
        </g>

        {/* Hint */}
        <text
          x="32"
          y={VIEW_H - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          PRINCIPAL AXES = EIGENVECTORS OF Σ  ·  PRESS ROTATE TO RE-EXPRESS
        </text>
      </svg>

      {/* HTML toggle below the SVG — a non-SVG button is friendlier and the
          MDX page already has plenty of canvas density */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setRotated((r) => !r)}
          className="font-sans uppercase tracking-[0.22em] text-[11px] text-vermilion border border-vermilion/40 px-4 py-2 hover:bg-vermilion hover:text-cream transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          aria-pressed={rotated}
        >
          {rotated ? 'Restore original orientation' : 'Rotate into the eigenbasis'}
        </button>
      </div>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5 &mdash; The principal axes are eigenvectors of the covariance
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
            y2={VIEW_H - 20}
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
      <line
        x1="20"
        y1={ORIGIN_Y}
        x2={VIEW_W - 20}
        y2={ORIGIN_Y}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
      <line
        x1={ORIGIN_X}
        y1="20"
        x2={ORIGIN_X}
        y2={VIEW_H - 20}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
    </>
  )
}
