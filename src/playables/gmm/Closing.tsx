import { useMemo } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import {
  POINTS,
  CONVERGED_MIXTURE,
  COMPONENT_COLORS,
  COMPONENT_RGB,
  gaussianPdf,
  mixturePdf,
  covEllipse,
} from './gmmData'

/**
 * The closing scene. Two panels:
 *   Left — the data as points, what we started with.
 *   Right — the *density* the GMM has learned: a smooth bivariate surface,
 *           a model of where new points are likely to land.
 *
 * The teaching: clustering was the entry point, but the real prize is a
 * generative model — a probability distribution over the data. From here
 * the curriculum can branch toward variational autoencoders and diffusion
 * models, which generalise the same idea.
 *
 * No interaction. The teaching is the prose plus the contrast.
 */

const VIEW_W = 600
const VIEW_H = 480

const PANEL_W = 260
const PANEL_H = 320
const LEFT_X = 30
const RIGHT_X = VIEW_W - PANEL_W - 30
const PANEL_Y = 110

const SUB_ORIGIN_X = PANEL_W / 2
const SUB_ORIGIN_Y = PANEL_H / 2
const SUB_UNIT = 38

const HEAT_NX = 50
const HEAT_NY = 40
const HEAT_W = PANEL_W / HEAT_NX
const HEAT_H = PANEL_H / HEAT_NY

export function Closing() {
  // Density heatmap cells for the right panel
  const heatCells = useMemo(() => {
    const cells: Array<{ x: number; y: number; fill: string; opacity: number }> = []
    let maxDens = 0
    const raw: Array<{ x: number; y: number; perComp: number[] }> = []
    for (let iy = 0; iy < HEAT_NY; iy++) {
      for (let ix = 0; ix < HEAT_NX; ix++) {
        const cx = (ix + 0.5) * HEAT_W
        const cy = (iy + 0.5) * HEAT_H
        const mx = (cx - SUB_ORIGIN_X) / SUB_UNIT
        const my = (SUB_ORIGIN_Y - cy) / SUB_UNIT
        const perComp = CONVERGED_MIXTURE.map((c) => c.pi * gaussianPdf({ x: mx, y: my }, c))
        const total = perComp.reduce((a, b) => a + b, 0)
        if (total > maxDens) maxDens = total
        raw.push({ x: ix * HEAT_W, y: iy * HEAT_H, perComp })
      }
    }
    for (const r of raw) {
      const total = r.perComp.reduce((a, b) => a + b, 0)
      if (total < maxDens * 0.01) continue
      const probs = r.perComp.map((w) => w / total)
      let rr = 0
      let gg = 0
      let bb = 0
      for (let k = 0; k < probs.length; k++) {
        rr += COMPONENT_RGB[k][0] * probs[k]
        gg += COMPONENT_RGB[k][1] * probs[k]
        bb += COMPONENT_RGB[k][2] * probs[k]
      }
      cells.push({
        x: r.x,
        y: r.y,
        fill: `rgb(${Math.round(rr)}, ${Math.round(gg)}, ${Math.round(bb)})`,
        opacity: Math.min(0.7, 0.7 * Math.pow(total / maxDens, 0.5)),
      })
    }
    return cells
  }, [])

  const contours = useMemo(
    () =>
      CONVERGED_MIXTURE.flatMap((c, idx) =>
        [1, 2].map((lvl) => ({
          idx,
          lvl,
          pts: covEllipse(c, lvl).map((p) => ({
            x: SUB_ORIGIN_X + p.x * SUB_UNIT,
            y: SUB_ORIGIN_Y - p.y * SUB_UNIT,
          })),
        })),
      ),
    [],
  )

  // Total likelihood, just for the readout
  const totalLogL = useMemo(() => {
    let s = 0
    for (const p of POINTS) s += Math.log(Math.max(mixturePdf(p, CONVERGED_MIXTURE), 1e-300))
    return s
  }, [])

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="Two panels of the same scene. Left: the thirty data points. Right: the smooth density the GMM has learned — a probability surface over the plane. Clustering was the entry point. Density estimation is the prize: a model that can score new points, generate new ones, and compose with the rest of probabilistic ML."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Side-by-side: thirty data points on the left, the same scene with the learned mixture density as a coloured heatmap on the right. The bridge from clustering to density estimation."
      >
        {/* Title */}
        <text
          x={VIEW_W / 2}
          y="56"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DATA  →  DENSITY
        </text>
        <text
          x={VIEW_W / 2}
          y="82"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          From clusters to a probability surface.
        </text>

        {/* LEFT panel — raw points */}
        <g transform={`translate(${LEFT_X}, ${PANEL_Y})`}>
          <rect
            width={PANEL_W}
            height={PANEL_H}
            fill="none"
            stroke="var(--color-graph-fade)"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={SUB_ORIGIN_Y}
            x2={PANEL_W}
            y2={SUB_ORIGIN_Y}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.6"
            strokeOpacity="0.5"
          />
          <line
            x1={SUB_ORIGIN_X}
            y1="0"
            x2={SUB_ORIGIN_X}
            y2={PANEL_H}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.6"
            strokeOpacity="0.5"
          />
          {POINTS.map((p, i) => (
            <circle
              key={i}
              cx={SUB_ORIGIN_X + p.x * SUB_UNIT}
              cy={SUB_ORIGIN_Y - p.y * SUB_UNIT}
              r="3.5"
              fill="var(--color-graph-ink)"
              fillOpacity="0.85"
            />
          ))}
          <text
            x={PANEL_W / 2}
            y={PANEL_H + 26}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            DATA  ·  THIRTY POINTS
          </text>
        </g>

        {/* RIGHT panel — learned density */}
        <g transform={`translate(${RIGHT_X}, ${PANEL_Y})`}>
          <rect
            width={PANEL_W}
            height={PANEL_H}
            fill="none"
            stroke="var(--color-graph-fade)"
            strokeWidth="1"
          />
          {heatCells.map((c, i) => (
            <rect
              key={i}
              x={c.x}
              y={c.y}
              width={HEAT_W + 0.5}
              height={HEAT_H + 0.5}
              fill={c.fill}
              opacity={c.opacity}
            />
          ))}
          <line
            x1="0"
            y1={SUB_ORIGIN_Y}
            x2={PANEL_W}
            y2={SUB_ORIGIN_Y}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.6"
            strokeOpacity="0.35"
          />
          <line
            x1={SUB_ORIGIN_X}
            y1="0"
            x2={SUB_ORIGIN_X}
            y2={PANEL_H}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.6"
            strokeOpacity="0.35"
          />
          {contours.map((c, i) => (
            <polyline
              key={`c-${i}`}
              points={c.pts.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={COMPONENT_COLORS[c.idx]}
              strokeWidth={c.lvl === 1 ? 1.2 : 0.8}
              strokeOpacity={c.lvl === 1 ? 0.65 : 0.3}
              strokeDasharray={c.lvl === 2 ? '3 3' : undefined}
            />
          ))}
          {POINTS.map((p, i) => (
            <circle
              key={i}
              cx={SUB_ORIGIN_X + p.x * SUB_UNIT}
              cy={SUB_ORIGIN_Y - p.y * SUB_UNIT}
              r="2"
              fill="var(--color-ink)"
              fillOpacity="0.6"
            />
          ))}
          <text
            x={PANEL_W / 2}
            y={PANEL_H + 26}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            DENSITY  ·  p(x | θ)
          </text>
        </g>

        {/* Arrow between */}
        <g transform={`translate(${VIEW_W / 2}, ${PANEL_Y + PANEL_H / 2})`}>
          <line
            x1="-22"
            y1="0"
            x2="22"
            y2="0"
            stroke="var(--color-vermilion)"
            strokeWidth="1.5"
          />
          <polygon
            points="28,0 18,-5 18,5"
            fill="var(--color-vermilion)"
          />
        </g>

        {/* Bottom readout */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 22}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-dim)"
        >
          log L = {totalLogL.toFixed(2)}  ·  K = 3 components fit by EM
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6 &mdash; The output of GMM is a density. That's the door to generative modelling.
      </figcaption>
    </figure>
  )
}
