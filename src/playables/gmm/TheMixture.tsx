import { useCallback, useMemo, useRef, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  CONVERGED_MIXTURE,
  COMPONENT_COLORS,
  COMPONENT_RGB,
  responsibilities,
  mixturePdf,
  gaussianPdf,
  type Pt,
} from './gmmData'

/**
 * Act 2 — three 2D Gaussian bumps as a tinted heatmap; click anywhere to
 * read off the per-component responsibility at that point.
 *
 * Heatmap: per-cell density is computed for each component; the cell is
 * coloured by per-component weight (mixed RGB) and opacity scales with the
 * total mixture density. So you can SEE the mixture: three coloured hills
 * fading into the cream background, overlapping where the components
 * overlap.
 *
 * Probe: a focusable diamond cursor the reader drags around. The readout
 * shows the three responsibilities γ_1, γ_2, γ_3. Arrow-keys nudge the
 * probe by 0.1 math-units, Shift+arrow by 1.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

// Density heatmap grid
const GRID_NX = 60
const GRID_NY = 48
const CELL_W = VIEW_W / GRID_NX
const CELL_H = VIEW_H / GRID_NY

// Map an SVG pixel back to math coordinates
const pixelToMath = (px: number, py: number): Pt => ({
  x: (px - ORIGIN_X) / UNIT,
  y: (ORIGIN_Y - py) / UNIT,
})

const mathToPixel = (p: Pt) => ({
  x: ORIGIN_X + p.x * UNIT,
  y: ORIGIN_Y - p.y * UNIT,
})

export function TheMixture() {
  // Static mixture — converged pose so the three bumps are crisp
  const mixture = CONVERGED_MIXTURE

  // Heatmap cells: precompute density and dominant component color per cell
  const cells = useMemo(() => {
    const out: Array<{
      x: number
      y: number
      fill: string
      opacity: number
    }> = []
    // Find max mixture density for normalization
    let maxDens = 0
    const perCell: Array<{ x: number; y: number; perComp: number[] }> = []
    for (let iy = 0; iy < GRID_NY; iy++) {
      for (let ix = 0; ix < GRID_NX; ix++) {
        const cx = (ix + 0.5) * CELL_W
        const cy = (iy + 0.5) * CELL_H
        const p = pixelToMath(cx, cy)
        const perComp = mixture.map((c) => c.pi * gaussianPdf(p, c))
        const total = perComp.reduce((a, b) => a + b, 0)
        if (total > maxDens) maxDens = total
        perCell.push({ x: ix * CELL_W, y: iy * CELL_H, perComp })
      }
    }
    for (const cell of perCell) {
      const total = cell.perComp.reduce((a, b) => a + b, 0)
      if (total < maxDens * 0.012) continue // skip near-zero cells for legibility
      const probs = cell.perComp.map((w) => w / total)
      // Mix RGB by component
      let r = 0
      let g = 0
      let b = 0
      for (let k = 0; k < probs.length; k++) {
        r += COMPONENT_RGB[k][0] * probs[k]
        g += COMPONENT_RGB[k][1] * probs[k]
        b += COMPONENT_RGB[k][2] * probs[k]
      }
      out.push({
        x: cell.x,
        y: cell.y,
        fill: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
        opacity: Math.min(0.6, 0.65 * Math.pow(total / maxDens, 0.55)),
      })
    }
    return out
  }, [mixture])

  // Probe point — what the reader is interrogating
  const [probe, setProbe] = useState<Pt>({ x: 0.0, y: 0.5 })
  const probeRef = useRef<SVGGElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const probeGammas = useMemo(
    () => responsibilities([probe], mixture)[0],
    [probe, mixture],
  )
  const probeDensity = useMemo(() => mixturePdf(probe, mixture), [probe, mixture])

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const sx = VIEW_W / rect.width
    const sy = VIEW_H / rect.height
    const px = (e.clientX - rect.left) * sx
    const py = (e.clientY - rect.top) * sy
    const m = pixelToMath(px, py)
    // Clamp to a sensible window so the probe doesn't fly offscreen
    const clamped: Pt = {
      x: Math.max(-5.5, Math.min(5.5, m.x)),
      y: Math.max(-4.2, Math.min(4.2, m.y)),
    }
    setProbe(clamped)
  }

  useKeyNudge(
    probeRef,
    useCallback((dx: number, dy: number) => {
      setProbe((p) => ({
        x: Math.max(-5.5, Math.min(5.5, p.x + dx * 0.1)),
        y: Math.max(-4.2, Math.min(4.2, p.y + dy * 0.1)),
      }))
    }, []),
  )

  const probePix = mathToPixel(probe)

  // Narration — round to ints so the announcement is readable
  const pct = probeGammas.map((g) => Math.round(g * 100))
  const dominant = pct.indexOf(Math.max(...pct))
  const dominantLabel = ['vermilion', 'blue', 'olive'][dominant]
  const narration = `Probe at (${probe.x.toFixed(1)}, ${probe.y.toFixed(1)}). Responsibilities: ${pct[0]} percent vermilion, ${pct[1]} percent blue, ${pct[2]} percent olive. The ${dominantLabel} component takes the largest share.`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority="normal"
        isInteracting
        debounceMs={300}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Three 2D Gaussian bumps shown as a heatmap. Vermilion at lower-left, blue at upper, olive at lower-right. A draggable probe at (${probe.x.toFixed(1)}, ${probe.y.toFixed(1)}) reports the per-component responsibilities.`}
        onClick={handleSvgClick}
        style={{ cursor: 'crosshair' }}
      >
        {/* Heatmap */}
        <g>
          {cells.map((c, i) => (
            <rect
              key={i}
              x={c.x}
              y={c.y}
              width={CELL_W + 0.5}
              height={CELL_H + 0.5}
              fill={c.fill}
              opacity={c.opacity}
            />
          ))}
        </g>

        <Grid />
        <Axes />

        {/* Center marks */}
        {mixture.map((c, i) => {
          const px = ORIGIN_X + c.mean.x * UNIT
          const py = ORIGIN_Y - c.mean.y * UNIT
          return (
            <g key={i}>
              <polygon
                points={`${px},${py - 8} ${px + 8},${py} ${px},${py + 8} ${px - 8},${py}`}
                fill="var(--color-cream)"
                stroke={COMPONENT_COLORS[i]}
                strokeWidth="2"
              />
            </g>
          )
        })}

        {/* Probe — focusable handle */}
        <g
          ref={probeRef}
          tabIndex={0}
          role="slider"
          aria-label={`Probe point. At math coordinates (${probe.x.toFixed(2)}, ${probe.y.toFixed(2)}). Responsibilities: vermilion ${pct[0]} percent, blue ${pct[1]} percent, olive ${pct[2]} percent. Arrow keys to nudge, Shift+arrow for larger steps. Click the canvas to move the probe.`}
          aria-valuemin={-5.5}
          aria-valuemax={5.5}
          aria-valuenow={Number(probe.x.toFixed(2))}
          style={{ cursor: 'pointer', outline: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={probePix.x} cy={probePix.y} r="22" fill="transparent" />
          <circle
            cx={probePix.x}
            cy={probePix.y}
            r="8"
            fill="var(--color-cream)"
            stroke="var(--color-ink)"
            strokeWidth="2"
          />
          <circle
            cx={probePix.x}
            cy={probePix.y}
            r="3.5"
            fill="var(--color-ink)"
          />
        </g>

        {/* Readout: P(component i | x) */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            MIXTURE  ·  CLICK TO PROBE
          </text>
          <text
            y="22"
            fontFamily="JetBrains Mono, monospace"
            fontSize="13"
            fill="var(--color-ink)"
          >
            x = ({probe.x.toFixed(2)}, {probe.y.toFixed(2)})
          </text>
          <text
            y="42"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-dim)"
          >
            p(x) = {probeDensity.toFixed(4)}
          </text>
        </g>

        {/* Per-component responsibility bars, right side */}
        <g transform={`translate(${VIEW_W - 168}, 36)`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            P(k | x)
          </text>
          {probeGammas.map((g, k) => (
            <g key={k} transform={`translate(0, ${20 + k * 22})`}>
              <text
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-ink)"
              >
                k={k + 1}
              </text>
              <rect
                x="34"
                y="-9"
                width="100"
                height="12"
                fill="none"
                stroke="var(--color-graph-fade)"
                strokeWidth="0.8"
              />
              <rect
                x="34"
                y="-9"
                width={100 * g}
                height="12"
                fill={COMPONENT_COLORS[k]}
                fillOpacity="0.85"
              />
              <text
                x="140"
                y="0"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-ink)"
              >
                {(g * 100).toFixed(0)}%
              </text>
            </g>
          ))}
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1 &mdash; The density is a sum of three bumps. Click anywhere to ask: who owns this point?
      </figcaption>
    </figure>
  )
}

function Grid() {
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
            strokeOpacity="0.7"
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
            strokeOpacity="0.7"
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
        strokeWidth="0.8"
        strokeOpacity="0.7"
      />
      <line
        x1={ORIGIN_X}
        y1="20"
        x2={ORIGIN_X}
        y2={VIEW_H - 20}
        stroke="var(--color-graph-ink)"
        strokeWidth="0.8"
        strokeOpacity="0.7"
      />
    </>
  )
}
