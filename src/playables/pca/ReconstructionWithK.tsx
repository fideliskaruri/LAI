import { useCallback, useMemo, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { covariance, eigenSym, makeCloud } from './cloud'
import type { SplitCanvasRenderProps } from '../../components/topic/TopicPageSplit'

/**
 * Act 5 — projecting down, projecting back. Left pane has the original
 * cloud + a k-slider (k ∈ {1, 2}). When k=1, we draw each point projected
 * onto PC1 as a 1D dot along the PC1 axis. When k=2 we just show the
 * cloud.  Right pane: where the points "would live" if reconstructed from
 * only k principal components — i.e. V[:, :k] V[:, :k]ᵀ x for each x.
 *
 * Sync mode: left-drives-right. The shared state is { k: 1 | 2 }.
 */

export interface ReconstructionState {
  k: 1 | 2
}

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

const points = makeCloud(N, SEED)
const cov = covariance(points)
const eig = eigenSym(cov.a, cov.b, cov.c)

// Slider geometry — for left pane
const SLIDER_Y = VIEW_H - 60
const SLIDER_X_MIN = 200
const SLIDER_X_MAX = 400

function kToSliderX(k: 1 | 2) {
  return k === 1 ? SLIDER_X_MIN : SLIDER_X_MAX
}

export function ReconstructionLeftPane({ state, onChange }: SplitCanvasRenderProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const s = state as ReconstructionState
  const k = s.k

  const bind = useDrag(({ xy: [px] }) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const local = (px - rect.left) * sx
    // Snap to nearest of the two slider stops
    const midpoint = (SLIDER_X_MIN + SLIDER_X_MAX) / 2
    const next: 1 | 2 = local < midpoint ? 1 : 2
    if (next !== k) onChange({ k: next } as ReconstructionState)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const next: 1 | 2 = dx > 0 ? 2 : 1
        if (next !== k) onChange({ k: next } as ReconstructionState)
      },
      [k, onChange],
    ),
  )

  // PC1 line — extended both ways
  const pc1Line = {
    a: toSvg(-6 * eig.v1.x, -6 * eig.v1.y),
    b: toSvg(6 * eig.v1.x, 6 * eig.v1.y),
  }

  // Project each point onto PC1 — get a scalar t = v1 · x. The 1D point is
  // drawn as a dot on the PC1 line at parameter t.
  const projected = useMemo(() => {
    return points.map((p) => {
      const t = p.x * eig.v1.x + p.y * eig.v1.y
      return { t, sv: toSvg(t * eig.v1.x, t * eig.v1.y) }
    })
  }, [])

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={
          k === 1
            ? 'The original cloud, plus each point projected onto PC1 — drawn as a row of dots along the principal axis. Keeping only one principal component squashes the cloud down to a line.'
            : 'The original 2D cloud, with both principal axes available. No compression.'
        }
        priority="normal"
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Scatter of ${N} points. ${k === 1 ? 'Each point is also drawn as a projection onto PC1, along a vermilion line.' : 'Both principal components are kept; the cloud is unchanged.'}`}
      >
        <ReferenceGrid />
        <Axes />

        {/* PC1 line */}
        <line
          x1={pc1Line.a.x}
          y1={pc1Line.a.y}
          x2={pc1Line.b.x}
          y2={pc1Line.b.y}
          stroke="var(--color-vermilion)"
          strokeOpacity={k === 1 ? 0.55 : 0.25}
          strokeWidth="1.2"
          strokeDasharray={k === 1 ? undefined : '4 4'}
        />

        {/* Original points */}
        {points.map((p, i) => {
          const sv = toSvg(p.x, p.y)
          return (
            <circle
              key={i}
              cx={sv.x}
              cy={sv.y}
              r="2.4"
              fill="var(--color-ink)"
              fillOpacity={k === 1 ? 0.32 : 0.55}
            />
          )
        })}

        {/* When k=1 also draw the projected (1D) points on PC1 */}
        {k === 1 &&
          projected.map((q, i) => (
            <circle
              key={`p-${i}`}
              cx={q.sv.x}
              cy={q.sv.y}
              r="2.6"
              fill="var(--color-vermilion)"
              fillOpacity="0.85"
            />
          ))}

        {/* Connector lines from original to projection */}
        {k === 1 &&
          points.map((p, i) => {
            const sv = toSvg(p.x, p.y)
            const q = projected[i]
            return (
              <line
                key={`c-${i}`}
                x1={sv.x}
                y1={sv.y}
                x2={q.sv.x}
                y2={q.sv.y}
                stroke="var(--color-vermilion)"
                strokeOpacity="0.18"
                strokeWidth="0.6"
              />
            )
          })}

        {/* Top-left badge */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            KEEP k COMPONENTS
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-ink)">
            k = {k}
          </text>
        </g>

        {/* Slider */}
        <g>
          <line x1={SLIDER_X_MIN} y1={SLIDER_Y} x2={SLIDER_X_MAX} y2={SLIDER_Y} stroke="var(--color-graph-ink)" strokeWidth="1.2" />
          {[1, 2].map((v) => (
            <g key={v}>
              <line x1={kToSliderX(v as 1 | 2)} y1={SLIDER_Y - 6} x2={kToSliderX(v as 1 | 2)} y2={SLIDER_Y + 6} stroke="var(--color-graph-ink)" strokeWidth="1" />
              <text
                x={kToSliderX(v as 1 | 2)}
                y={SLIDER_Y + 22}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-dim)"
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
            aria-label={`Number of principal components kept. Current value ${k}. Arrow keys to switch between 1 and 2.`}
            aria-valuemin={1}
            aria-valuemax={2}
            aria-valuenow={k}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={kToSliderX(k)} cy={SLIDER_Y} r="22" fill="transparent" />
            <circle cx={kToSliderX(k)} cy={SLIDER_Y} r="8" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
          </g>
          <text x={SLIDER_X_MIN} y={SLIDER_Y - 18} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            DRAG  ·  ARROWS  ·  k
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5a &mdash; Project down to k axes
      </figcaption>
    </figure>
  )
}

export function ReconstructionRightPane({ state }: SplitCanvasRenderProps) {
  const s = state as ReconstructionState
  const k = s.k

  // Reconstructed points: V[:, :k] V[:, :k]ᵀ x.
  // For k=1, this is (v1·x) v1 — the point lying back on the PC1 line.
  // For k=2, full reconstruction = the original point.
  const reconstructed = useMemo(() => {
    return points.map((p) => {
      if (k === 2) return { x: p.x, y: p.y, err: 0 }
      const t1 = p.x * eig.v1.x + p.y * eig.v1.y
      const rx = t1 * eig.v1.x
      const ry = t1 * eig.v1.y
      const ex = p.x - rx
      const ey = p.y - ry
      return { x: rx, y: ry, err: Math.hypot(ex, ey) }
    })
  }, [k])

  // Reconstruction loss = average squared error.
  const loss = useMemo(() => {
    let s = 0
    for (const r of reconstructed) s += r.err * r.err
    return s / reconstructed.length
  }, [reconstructed])

  // Variance retained = sum of first k eigenvalues / sum of all
  const totalVar = eig.l1 + eig.l2
  const retainedVar = k === 1 ? eig.l1 : totalVar
  const retainedPct = (retainedVar / totalVar) * 100

  // PC1 line (faint) so the eye sees what the 1D reconstruction sits on
  const pc1Line = {
    a: toSvg(-6 * eig.v1.x, -6 * eig.v1.y),
    b: toSvg(6 * eig.v1.x, 6 * eig.v1.y),
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={
          k === 1
            ? `Reconstructed cloud, using only PC1. The points all live on the principal axis now. Reconstruction loss is ${fmt(loss)} per point; ${fmt(retainedPct)} percent of the variance is preserved.`
            : 'Reconstructed cloud using both PCs — identical to the original. Zero loss.'
        }
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Reconstructed scatter using ${k} principal component${k === 1 ? '' : 's'}. ${k === 1 ? `Reconstruction loss ${fmt(loss)}, variance retained ${fmt(retainedPct)} percent.` : 'Perfect reconstruction.'}`}
      >
        <ReferenceGrid />
        <Axes />

        {/* PC1 line (faint) so the 1D reconstruction has a stage */}
        <line
          x1={pc1Line.a.x}
          y1={pc1Line.a.y}
          x2={pc1Line.b.x}
          y2={pc1Line.b.y}
          stroke="var(--color-vermilion)"
          strokeOpacity={k === 1 ? 0.35 : 0.15}
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Reconstructed points */}
        {reconstructed.map((p, i) => {
          const sv = toSvg(p.x, p.y)
          return (
            <circle
              key={i}
              cx={sv.x}
              cy={sv.y}
              r="2.6"
              fill="var(--color-vermilion)"
              fillOpacity="0.7"
            />
          )
        })}

        {/* Badge */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            RECONSTRUCTED CLOUD
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
            x̂ = V<tspan baselineShift="sub" fontSize="9">k</tspan> V<tspan baselineShift="sub" fontSize="9">k</tspan><tspan baselineShift="super" fontSize="9">⊤</tspan> x
          </text>
        </g>

        {/* Loss / variance retained */}
        <g transform="translate(36, 380)">
          <text fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
            variance retained: {fmt(retainedPct)}%
          </text>
          <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
            recon. loss (avg): {fmt(loss)}
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
          KEEPING k AXES, DROPPING THE REST
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5b &mdash; What survives the round trip
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
