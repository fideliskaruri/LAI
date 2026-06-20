import { useMemo, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import {
  POINTS,
  COMPONENT_COLORS,
  INITIAL_MIXTURE,
  responsibilities,
  logLikelihood,
  mixColor,
  covEllipse,
} from './gmmData'

/**
 * Act 4 — the E-step in isolation. The mixture is fixed at the (deliberately
 * wrong) INITIAL_MIXTURE pose. Press "E step" and the per-point colours
 * transition from neutral grey to their soft-assignment blend. The
 * log-likelihood readout updates to the current total.
 *
 * Teaching: given current Gaussians, the responsibilities γ_ik are a *closed
 * form* — no iteration, no fitting. Just Bayes' rule.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

export function EmEStep() {
  const [didE, setDidE] = useState(false)

  const mixture = INITIAL_MIXTURE
  const gammas = useMemo(() => responsibilities(POINTS, mixture), [mixture])
  const ll = useMemo(() => logLikelihood(POINTS, mixture), [mixture])

  // 1- and 2-sigma iso-contours per component
  const contours = useMemo(
    () =>
      mixture.flatMap((c, idx) =>
        [1, 2].map((lvl) => ({
          idx,
          lvl,
          pts: covEllipse(c, lvl).map((p) => ({
            x: ORIGIN_X + p.x * UNIT,
            y: ORIGIN_Y - p.y * UNIT,
          })),
        })),
      ),
    [mixture],
  )

  const narration = didE
    ? `E step complete. Each point now carries a probability triple across the three components. Log-likelihood ${ll.toFixed(2)}.`
    : `Three Gaussians, deliberately misplaced. Points still neutral. Press E step to compute every point's responsibility γ across the three components.`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority={didE ? 'high' : 'normal'}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={
          didE
            ? `E step complete. Thirty points coloured by their soft assignments. Log-likelihood ${ll.toFixed(2)}.`
            : 'Three Gaussian components shown as iso-contours; thirty data points in neutral grey, awaiting responsibility assignment.'
        }
      >
        <Grid />
        <Axes />

        {/* Iso-contours */}
        {contours.map((c, i) => (
          <polyline
            key={`iso-${i}`}
            points={c.pts.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={COMPONENT_COLORS[c.idx]}
            strokeWidth={c.lvl === 1 ? 1.5 : 1}
            strokeOpacity={c.lvl === 1 ? 0.7 : 0.35}
            strokeDasharray={c.lvl === 2 ? '3 3' : undefined}
          />
        ))}

        {/* Points */}
        {POINTS.map((p, i) => {
          const cx = ORIGIN_X + p.x * UNIT
          const cy = ORIGIN_Y - p.y * UNIT
          const fill = didE ? mixColor(gammas[i]) : 'var(--color-graph-ink)'
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="5.5"
              fill={fill}
              fillOpacity={didE ? 0.92 : 0.55}
              style={{ transition: 'fill 600ms ease-out, fill-opacity 600ms ease-out' }}
            />
          )
        })}

        {/* Center marks */}
        {mixture.map((c, i) => {
          const cx = ORIGIN_X + c.mean.x * UNIT
          const cy = ORIGIN_Y - c.mean.y * UNIT
          return (
            <polygon
              key={i}
              points={`${cx},${cy - 9} ${cx + 9},${cy} ${cx},${cy + 9} ${cx - 9},${cy}`}
              fill="var(--color-cream)"
              stroke={COMPONENT_COLORS[i]}
              strokeWidth="2.5"
            />
          )
        })}

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            EXPECTATION STEP  ·  GIVEN θ, COMPUTE γ
          </text>
          <text
            y="22"
            fontFamily="JetBrains Mono, monospace"
            fontSize="13"
            fill="var(--color-ink)"
          >
            log L(θ) = {ll.toFixed(2)}
          </text>
          <text
            y="42"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="13"
            fill={didE ? 'var(--color-vermilion)' : 'var(--color-dim)'}
          >
            {didE ? 'Responsibilities computed.' : 'Awaiting E step.'}
          </text>
        </g>
      </svg>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setDidE(true)}
          disabled={didE}
          className="font-sans text-[12px] tracking-[0.18em] uppercase px-4 py-2 border border-vermilion text-vermilion disabled:opacity-40 hover:bg-vermilion hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
        >
          E step
        </button>
        <button
          type="button"
          onClick={() => setDidE(false)}
          className="font-sans text-[12px] tracking-[0.18em] uppercase px-4 py-2 border border-dim text-dim hover:text-ink hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
        >
          Reset
        </button>
      </div>

      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3 &mdash; E step: given the Gaussians, every point gets a probability triple.
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
