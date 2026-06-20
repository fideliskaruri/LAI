import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { covariance, eigenSym, makeCloud } from './cloud'

/**
 * Act 4 — the connection back to Eigenvalues. Left: same scatter, with
 * eigenvectors of the 2×2 covariance Σ shown as vermilion arrows. Right:
 * the matrix Σ itself, written out in JetBrains Mono, with the eigenvalues
 * λ₁ and λ₂ as a readout beneath. A sidebar callout names this as the same
 * Cauchy 1829 spectral theorem applied to data.
 *
 * Sync mode: independent.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 60

const SEED = 0xa901
const N = 180

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

const points = makeCloud(N, SEED)
const cov = covariance(points)
const eig = eigenSym(cov.a, cov.b, cov.c)

export function EigenvectorsLeftPane() {
  const ARROW_SCALE = 1.7
  const len1 = Math.sqrt(Math.max(0, eig.l1)) * ARROW_SCALE
  const len2 = Math.sqrt(Math.max(0, eig.l2)) * ARROW_SCALE

  const O = { x: ORIGIN_X, y: ORIGIN_Y }
  const v1Tip = toSvg(eig.v1.x * len1, eig.v1.y * len1)
  const v2Tip = toSvg(eig.v2.x * len2, eig.v2.y * len2)
  const head1 = arrowHead(O, v1Tip)
  const head2 = arrowHead(O, v2Tip)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The same scatter, with two arrows along the eigenvectors of the 2 by 2 covariance matrix. The longer vermilion arrow is the dominant eigenvector with eigenvalue ${fmt(eig.l1)}. The shorter one is the second eigenvector with eigenvalue ${fmt(eig.l2)}.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Scatter of ${N} points with two arrows along the eigenvectors of the covariance matrix. The first has eigenvalue ${fmt(eig.l1)}; the second ${fmt(eig.l2)}.`}
      >
        <ReferenceGrid />
        <Axes />

        {points.map((p, i) => {
          const sv = toSvg(p.x, p.y)
          return (
            <circle key={i} cx={sv.x} cy={sv.y} r="2.4" fill="var(--color-ink)" fillOpacity="0.55" />
          )
        })}

        {/* Eigenvector 2 (smaller) */}
        <line x1={O.x} y1={O.y} x2={v2Tip.x} y2={v2Tip.y} stroke="var(--color-vermilion)" strokeOpacity="0.55" strokeWidth="2" />
        <polygon
          points={`${v2Tip.x},${v2Tip.y} ${head2.p1.x},${head2.p1.y} ${head2.p2.x},${head2.p2.y}`}
          fill="var(--color-vermilion)"
          fillOpacity="0.55"
        />
        <text
          x={v2Tip.x + (eig.v2.x >= 0 ? 8 : -8)}
          y={v2Tip.y + (eig.v2.y >= 0 ? -8 : 16)}
          textAnchor={eig.v2.x >= 0 ? 'start' : 'end'}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
          fillOpacity="0.85"
        >
          v₂  ·  λ₂ = {fmt(eig.l2)}
        </text>

        {/* Eigenvector 1 (larger) */}
        <line x1={O.x} y1={O.y} x2={v1Tip.x} y2={v1Tip.y} stroke="var(--color-vermilion)" strokeWidth="3" />
        <polygon
          points={`${v1Tip.x},${v1Tip.y} ${head1.p1.x},${head1.p1.y} ${head1.p2.x},${head1.p2.y}`}
          fill="var(--color-vermilion)"
        />
        <text
          x={v1Tip.x + (eig.v1.x >= 0 ? 8 : -8)}
          y={v1Tip.y + (eig.v1.y >= 0 ? -8 : 16)}
          textAnchor={eig.v1.x >= 0 ? 'start' : 'end'}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-vermilion)"
        >
          v₁  ·  λ₁ = {fmt(eig.l1)}
        </text>

        {/* Top-left badge */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            EIGENVECTORS OF Σ
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            Σ v = λ v
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
          THE PRINCIPAL AXES ARE EIGENVECTORS OF Σ
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4a &mdash; The shape, decomposed
      </figcaption>
    </figure>
  )
}

export function CovarianceMatrixPane() {
  // Numbers
  const a = cov.a
  const b = cov.b
  const c = cov.c
  const tr = a + c
  const det = a * c - b * b

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The 2 by 2 covariance matrix has diagonal entries ${fmt(a)} and ${fmt(c)} and off-diagonal entry ${fmt(b)}. Its eigenvalues are ${fmt(eig.l1)} and ${fmt(eig.l2)}.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`The covariance matrix Sigma written out as a 2 by 2 array of numbers, with its eigenvalues displayed.`}
      >
        <text
          x="60"
          y="60"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          COVARIANCE MATRIX Σ
        </text>

        {/* Matrix with brackets */}
        <g transform="translate(140, 110)">
          <path d="M 16 10 L 4 10 L 4 130 L 16 130" fill="none" stroke="var(--color-ink)" strokeWidth="1.6" />
          <text x="40" y="50" fontFamily="JetBrains Mono, monospace" fontSize="22" fill="var(--color-ink)">
            {fmt(a)}
          </text>
          <text x="180" y="50" fontFamily="JetBrains Mono, monospace" fontSize="22" fill="var(--color-ink)">
            {fmt(b)}
          </text>
          <text x="40" y="100" fontFamily="JetBrains Mono, monospace" fontSize="22" fill="var(--color-ink)">
            {fmt(b)}
          </text>
          <text x="180" y="100" fontFamily="JetBrains Mono, monospace" fontSize="22" fill="var(--color-ink)">
            {fmt(c)}
          </text>
          <path d="M 300 10 L 312 10 L 312 130 L 300 130" fill="none" stroke="var(--color-ink)" strokeWidth="1.6" />
        </g>

        {/* Hint that the off-diagonals match (= symmetric) */}
        <text
          x="60"
          y="276"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          Symmetric: Σ<tspan baselineShift="sub" fontSize="9">12</tspan> = Σ<tspan baselineShift="sub" fontSize="9">21</tspan>. (That is what guarantees the eigenvectors are perpendicular.)
        </text>

        {/* Eigenvalue readout */}
        <line x1="60" y1="304" x2="540" y2="304" stroke="var(--color-graph-fade)" strokeWidth="0.6" />

        <text x="60" y="334" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          EIGENVALUES
        </text>
        <text x="60" y="364" fontFamily="JetBrains Mono, monospace" fontSize="18" fill="var(--color-vermilion)">
          λ₁ = {fmt(eig.l1)}
        </text>
        <text x="60" y="392" fontFamily="JetBrains Mono, monospace" fontSize="18" fill="var(--color-vermilion)">
          λ₂ = {fmt(eig.l2)}
        </text>

        {/* Trace / det sanity check */}
        <text x="320" y="364" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
          tr(Σ) = λ₁+λ₂ = {fmt(tr)}
        </text>
        <text x="320" y="384" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
          det(Σ) = λ₁·λ₂ = {fmt(det)}
        </text>

        {/* Sidebar callout */}
        <g transform="translate(60, 430)">
          <rect x="-12" y="-22" width="500" height="34" fill="var(--color-vermilion)" fillOpacity="0.08" />
          <text fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="12" fill="var(--color-vermilion)">
            Cauchy, 1829 — real symmetric matrices have real eigenvalues — applied to data.
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4b &mdash; The covariance, written out
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
