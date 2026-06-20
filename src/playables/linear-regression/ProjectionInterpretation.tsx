import { lazy, Suspense, useRef } from 'react'
import { useNearViewport } from '../../hooks/useNearViewport'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { PLOT_X0, PLOT_X1, PLOT_Y0, PLOT_Y1, VIEW_H, VIEW_W, OLS } from './dataset'

/**
 * Act 8 — Projection interpretation.
 *
 *  Left  : 3D scene (lazy-loaded; r3f + three) — y as a vector above a plane
 *          (the column space of X), with its perpendicular projection ŷ on
 *          the plane and the residual segment between them. Camera orbits
 *          slowly.
 *  Right : an annotated picture of the same idea in symbols — the same
 *          normal-equations card, re-titled "y = Xβ̂ + r, r ⊥ col(X)".
 *
 * The lazy-mount sentinel matches NDLeap.tsx: useNearViewport with the
 * default 2-viewports rootMargin parks the GPU canvas while the reader is
 * far from this act.
 */

const LinRegProjectionScene3D = lazy(() => import('./LinRegProjectionScene3D'))

export function LeftPane() {
  const ref = useRef<HTMLDivElement>(null)
  const near = useNearViewport<HTMLDivElement>(ref)
  return (
    <figure ref={ref} className="w-full">
      <CanvasNarrative
        text="A 3D scene. A faint vermilion plane sits horizontally through the origin — the column space of the design matrix X. A vermilion arrow labelled y points above the plane. A grey arrow labelled X-beta-hat sits ON the plane directly below the tip of y. A short dashed segment connects them; that's the residual, and it stands perpendicular to the plane. The camera orbits slowly so the perpendicularity reads."
        priority="normal"
      />
      <div role="img" aria-label="3D scene: the response vector y, projected onto the column space of the design matrix X. The projection X-beta-hat is the foot of the perpendicular from y to the plane; the residual is the perpendicular segment between them.">
        <Suspense fallback={<Placeholder caption="loading 3D…" />}>
          {near ? <LinRegProjectionScene3D /> : <Placeholder caption="(3D scene parked)" />}
        </Suspense>
      </div>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7a &mdash; Least squares as a perpendicular drop
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A card restating the same idea symbolically. The response y splits into its projection X-beta-hat onto the column space plus a residual r, and r is perpendicular to every column of X."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Symbolic restatement: y equals X-beta-hat plus r, with r perpendicular to the columns of X."
      >
        <rect
          x={PLOT_X0}
          y={PLOT_Y0}
          width={PLOT_X1 - PLOT_X0}
          height={PLOT_Y1 - PLOT_Y0}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />
        <text
          x={PLOT_X0 + 18}
          y={PLOT_Y0 + 28}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          GEOMETRY OF LEAST SQUARES
        </text>

        {/* Headline equation */}
        <text
          x={(PLOT_X0 + PLOT_X1) / 2}
          y={PLOT_Y0 + 100}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="24"
          fill="var(--color-ink)"
        >
          y = X β̂ + r
        </text>
        <text
          x={(PLOT_X0 + PLOT_X1) / 2}
          y={PLOT_Y0 + 142}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="20"
          fill="var(--color-vermilion)"
        >
          r ⟂ col(X)
        </text>

        {/* Annotations */}
        <text
          x={PLOT_X0 + 32}
          y={PLOT_Y0 + 200}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          col(X) &mdash; every vector you can build as Xβ for some β.
        </text>
        <text
          x={PLOT_X0 + 32}
          y={PLOT_Y0 + 224}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          Xβ̂ &mdash; the closest point in col(X) to y.
        </text>
        <text
          x={PLOT_X0 + 32}
          y={PLOT_Y0 + 248}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          r &mdash; the perpendicular gap. Squared length is SSE.
        </text>

        {/* This rederivation */}
        <text
          x={(PLOT_X0 + PLOT_X1) / 2}
          y={PLOT_Y1 - 74}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          &ldquo;Perpendicular&rdquo; means X
          <tspan baselineShift="super" fontSize="10">
            T
          </tspan>
          r = 0.
        </text>
        <text
          x={(PLOT_X0 + PLOT_X1) / 2}
          y={PLOT_Y1 - 50}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          Substitute r = y − Xβ. You get the normal equations.
        </text>

        <text
          x={PLOT_X1 - 16}
          y={PLOT_Y1 - 16}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          MML §9.4
        </text>

        {/* Tiny readout */}
        <g transform={`translate(${PLOT_X0 + 18}, ${PLOT_Y1 - 110})`}>
          <text fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            β̂ = ({OLS.intercept.toFixed(2)}, {OLS.slope.toFixed(2)})
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7b &mdash; The same scene in symbols
      </figcaption>
    </figure>
  )
}

function Placeholder({ caption }: { caption: string }) {
  return (
    <div className="w-full aspect-[5/4] flex items-center justify-center text-fade font-sans uppercase text-[10px] tracking-[0.22em] border border-dashed border-fade rounded-sm">
      {caption}
    </div>
  )
}
