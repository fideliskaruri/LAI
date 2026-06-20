import { useMemo, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import {
  POINTS,
  COMPONENT_COLORS,
  INITIAL_MIXTURE,
  responsibilities,
  mStep,
  logLikelihood,
  mixColor,
  covEllipse,
  type MixtureComponent,
} from './gmmData'

/**
 * Act 5 — the M-step. We pre-load the post-E-step state from the previous act
 * (responsibilities already computed). The button runs ONE M-step: π, μ, Σ
 * each update to the weighted statistics. Iso-contours retract / tilt as the
 * covariances tighten onto their populations.
 *
 * Teaching: given the soft assignments, the parameters are weighted
 * statistics. It's the same formulas as fitting one Gaussian — but every
 * point contributes to every component, weighted by its γ.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

export function EmMStep() {
  // Initial pose — same as the E-step act's misplaced mixture
  const initialMixture = INITIAL_MIXTURE
  const initialGammas = useMemo(
    () => responsibilities(POINTS, initialMixture),
    [initialMixture],
  )

  // Current mixture after pressing M-step (or back to initial on reset)
  const [mixture, setMixture] = useState<MixtureComponent[]>(initialMixture)
  const [didM, setDidM] = useState(false)

  // Responsibilities used by the M-step are FROZEN from the initial mixture —
  // the M-step uses γ from the last E-step, not from the current one. After
  // M the points are coloured by those frozen γ to reinforce the teaching.
  const gammas = initialGammas

  const ll = useMemo(() => logLikelihood(POINTS, mixture), [mixture])

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

  const handleM = () => {
    setMixture(mStep(POINTS, gammas))
    setDidM(true)
  }

  const handleReset = () => {
    setMixture(initialMixture)
    setDidM(false)
  }

  const narration = didM
    ? `M step complete. Each Gaussian moved to the weighted mean of the points, with covariance tightened to the weighted spread. Log-likelihood ${ll.toFixed(2)}.`
    : `Responsibilities frozen from the last E step. Three Gaussians, deliberately misplaced. Press M step to update means, covariances, and mixing weights.`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority={didM ? 'high' : 'normal'}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={
          didM
            ? `M step complete. Three Gaussians shifted to their weighted means with covariances tightened. Log-likelihood ${ll.toFixed(2)}.`
            : 'Three Gaussian iso-contours in their initial pose; thirty points coloured by frozen responsibilities, awaiting parameter update.'
        }
      >
        <Grid />
        <Axes />

        {/* Iso-contours — animate with CSS transitions on stroke (we can't
            transform polyline points easily; we just redraw on state change
            and let the eye see the jump. Fine, with the prose narrating). */}
        {contours.map((c, i) => (
          <polyline
            key={`iso-${i}-${didM ? 'm' : 'e'}`}
            points={c.pts.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={COMPONENT_COLORS[c.idx]}
            strokeWidth={c.lvl === 1 ? 1.5 : 1}
            strokeOpacity={c.lvl === 1 ? 0.7 : 0.35}
            strokeDasharray={c.lvl === 2 ? '3 3' : undefined}
            style={{ transition: 'stroke-opacity 500ms' }}
          />
        ))}

        {/* Points coloured by frozen γ (so the eye can verify: M-step uses
            these responsibilities to update the Gaussians) */}
        {POINTS.map((p, i) => {
          const cx = ORIGIN_X + p.x * UNIT
          const cy = ORIGIN_Y - p.y * UNIT
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="5.5"
              fill={mixColor(gammas[i])}
              fillOpacity="0.92"
            />
          )
        })}

        {/* Center marks — animate translation */}
        {mixture.map((c, i) => {
          const cx = ORIGIN_X + c.mean.x * UNIT
          const cy = ORIGIN_Y - c.mean.y * UNIT
          return (
            <g
              key={i}
              style={{ transition: 'transform 600ms ease-out' }}
            >
              <polygon
                points={`${cx},${cy - 9} ${cx + 9},${cy} ${cx},${cy + 9} ${cx - 9},${cy}`}
                fill="var(--color-cream)"
                stroke={COMPONENT_COLORS[i]}
                strokeWidth="2.5"
              />
            </g>
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
            MAXIMIZATION STEP  ·  GIVEN γ, UPDATE θ
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
            fill={didM ? 'var(--color-vermilion)' : 'var(--color-dim)'}
          >
            {didM ? 'Parameters updated.' : 'Awaiting M step.'}
          </text>
        </g>

        {/* Mixing-weights bar, right side */}
        <g transform={`translate(${VIEW_W - 168}, 36)`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            MIXING WEIGHTS π
          </text>
          {mixture.map((c, k) => (
            <g key={k} transform={`translate(0, ${20 + k * 22})`}>
              <text
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-ink)"
              >
                π{k + 1}
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
                width={100 * c.pi}
                height="12"
                fill={COMPONENT_COLORS[k]}
                fillOpacity="0.85"
                style={{ transition: 'width 600ms ease-out' }}
              />
              <text
                x="140"
                y="0"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-ink)"
              >
                {c.pi.toFixed(2)}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleM}
          disabled={didM}
          className="font-sans text-[12px] tracking-[0.18em] uppercase px-4 py-2 border border-vermilion text-vermilion disabled:opacity-40 hover:bg-vermilion hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
        >
          M step
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="font-sans text-[12px] tracking-[0.18em] uppercase px-4 py-2 border border-dim text-dim hover:text-ink hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
        >
          Reset
        </button>
      </div>

      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4 &mdash; M step: each Gaussian walks to the weighted mean and tightens to fit.
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
