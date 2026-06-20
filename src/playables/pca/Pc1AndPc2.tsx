import { useMemo } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import {
  CANONICAL_COV as cov,
  CANONICAL_EIG as eig,
  CANONICAL_N as N,
  CANONICAL_POINTS as points,
  projectedVariance,
} from './cloud'

/**
 * Act 3 — both principal axes, side by side with their variances. Static
 * once we land here: the closed-form eigendecomposition of the covariance
 * gives PC1 (vermilion, full length) and PC2 (perpendicular, dim).
 *
 * Sync mode: independent. The two panes don't talk; the right is a small
 * pair of variance bars derived from the same eigenvalues.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 60

const fmt = (n: number) => n.toFixed(2)

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

export function Pc1AndPc2LeftPane() {
  const ARROW_SCALE = 1.7
  const len1 = Math.sqrt(Math.max(0, eig.l1)) * ARROW_SCALE
  const len2 = Math.sqrt(Math.max(0, eig.l2)) * ARROW_SCALE

  const O = { x: ORIGIN_X, y: ORIGIN_Y }
  const pc1Tip = toSvg(eig.v1.x * len1, eig.v1.y * len1)
  const pc2Tip = toSvg(eig.v2.x * len2, eig.v2.y * len2)
  const head1 = arrowHead(O, pc1Tip)
  const head2 = arrowHead(O, pc2Tip)

  // Subtle dotted line for the PC1 axis extended both ways
  const pc1Line = {
    a: toSvg(-6 * eig.v1.x, -6 * eig.v1.y),
    b: toSvg(6 * eig.v1.x, 6 * eig.v1.y),
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Two perpendicular principal axes. PC1 is in vermilion, pointing along the direction of largest spread, with variance ${fmt(eig.l1)}. PC2 is perpendicular, dim, with the smaller variance ${fmt(eig.l2)}.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Scatter of ${N} points with PC1 in vermilion and PC2 perpendicular to it, dim. Variances ${fmt(eig.l1)} and ${fmt(eig.l2)} respectively.`}
      >
        <ReferenceGrid />
        <Axes />

        {/* PC1 axis line — dotted, extended */}
        <line
          x1={pc1Line.a.x}
          y1={pc1Line.a.y}
          x2={pc1Line.b.x}
          y2={pc1Line.b.y}
          stroke="var(--color-vermilion)"
          strokeOpacity="0.18"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Scatter */}
        {points.map((p, i) => {
          const sv = toSvg(p.x, p.y)
          return (
            <circle key={i} cx={sv.x} cy={sv.y} r="2.4" fill="var(--color-ink)" fillOpacity="0.55" />
          )
        })}

        {/* PC2 — dim grey, drawn first */}
        <line x1={O.x} y1={O.y} x2={pc2Tip.x} y2={pc2Tip.y} stroke="var(--color-graph-ink)" strokeOpacity="0.7" strokeWidth="2" />
        <polygon
          points={`${pc2Tip.x},${pc2Tip.y} ${head2.p1.x},${head2.p1.y} ${head2.p2.x},${head2.p2.y}`}
          fill="var(--color-graph-ink)"
          fillOpacity="0.7"
        />
        <text
          x={pc2Tip.x + (eig.v2.x >= 0 ? 8 : -8)}
          y={pc2Tip.y + (eig.v2.y >= 0 ? -8 : 16)}
          textAnchor={eig.v2.x >= 0 ? 'start' : 'end'}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-graph-ink)"
        >
          PC₂
        </text>

        {/* PC1 — vermilion */}
        <line x1={O.x} y1={O.y} x2={pc1Tip.x} y2={pc1Tip.y} stroke="var(--color-vermilion)" strokeWidth="3" />
        <polygon
          points={`${pc1Tip.x},${pc1Tip.y} ${head1.p1.x},${head1.p1.y} ${head1.p2.x},${head1.p2.y}`}
          fill="var(--color-vermilion)"
        />
        <text
          x={pc1Tip.x + (eig.v1.x >= 0 ? 8 : -8)}
          y={pc1Tip.y + (eig.v1.y >= 0 ? -8 : 16)}
          textAnchor={eig.v1.x >= 0 ? 'start' : 'end'}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-vermilion)"
        >
          PC₁
        </text>

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            PRINCIPAL AXES
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
            PC₁ at {fmt((Math.atan2(eig.v1.y, eig.v1.x) * 180) / Math.PI)}°
          </text>
          <text y="40" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
            PC₂ at {fmt((Math.atan2(eig.v2.y, eig.v2.x) * 180) / Math.PI)}°
          </text>
        </g>

        <text
          x="32"
          y={VIEW_H - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          PC₁ ⊥ PC₂  ·  ARROW LENGTH = √λ
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3a &mdash; Two perpendicular axes
      </figcaption>
    </figure>
  )
}

export function Pc1AndPc2RightPane() {
  // Sanity-check the variances by recomputing them from the angles
  const var1 = useMemo(() => projectedVariance(Math.atan2(eig.v1.y, eig.v1.x), cov), [])
  const var2 = useMemo(() => projectedVariance(Math.atan2(eig.v2.y, eig.v2.x), cov), [])
  const total = var1 + var2

  const BAR_BOTTOM = 380
  const FULL = 280
  const max = Math.max(var1, var2)
  const h1 = (var1 / max) * FULL
  const h2 = (var2 / max) * FULL

  const X1 = 180
  const X2 = 360
  const W = 80

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Variance along PC1 is ${fmt(var1)}; variance along PC2 is ${fmt(var2)}. PC1 carries ${fmt((100 * var1) / total)} percent of the total variance.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Two vertical bars showing variance along the two principal components. PC1 variance ${fmt(var1)}, PC2 variance ${fmt(var2)}.`}
      >
        <text
          x="60"
          y="60"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          VARIANCE ALONG EACH AXIS
        </text>

        {/* Baseline */}
        <line x1="80" y1={BAR_BOTTOM} x2={VIEW_W - 60} y2={BAR_BOTTOM} stroke="var(--color-graph-ink)" strokeWidth="0.8" />

        {/* PC1 bar */}
        <rect x={X1} y={BAR_BOTTOM - h1} width={W} height={h1} fill="var(--color-vermilion)" fillOpacity="0.85" />
        <text x={X1 + W / 2} y={BAR_BOTTOM + 22} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-vermilion)">
          PC₁
        </text>
        <text x={X1 + W / 2} y={BAR_BOTTOM - h1 - 10} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
          λ₁ = {fmt(var1)}
        </text>

        {/* PC2 bar */}
        <rect x={X2} y={BAR_BOTTOM - h2} width={W} height={h2} fill="var(--color-graph-ink)" fillOpacity="0.6" />
        <text x={X2 + W / 2} y={BAR_BOTTOM + 22} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-dim)">
          PC₂
        </text>
        <text x={X2 + W / 2} y={BAR_BOTTOM - h2 - 10} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-dim)">
          λ₂ = {fmt(var2)}
        </text>

        {/* Percent of total */}
        <g transform={`translate(60, ${BAR_BOTTOM + 60})`}>
          <text fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
            PC₁ explains {((100 * var1) / total).toFixed(1)}% of the variance.
          </text>
          <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
            PC₂ explains {((100 * var2) / total).toFixed(1)}%.
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3b &mdash; Where the spread lives
      </figcaption>
    </figure>
  )
}

function ReferenceGrid() {
  return (
    <>
      {Array.from({ length: 11 }, (_, i) => {
        const x = ORIGIN_X + (i - 5) * UNIT
        return (
          <line key={`v-${i}`} x1={x} y1="20" x2={x} y2={VIEW_H - 20} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
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
      <line x1={ORIGIN_X} y1="20" x2={ORIGIN_X} y2={VIEW_H - 20} stroke="var(--color-graph-ink)" strokeWidth="1" />
    </>
  )
}
