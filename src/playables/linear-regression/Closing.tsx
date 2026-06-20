import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 10 — closing thread to Optimization.
 *
 *  Left  : a small sketch of a NON-quadratic loss landscape — wavy, with
 *          multiple basins. The contrast is the point: the parabola from
 *          act 6 had a single minimum we could write down; this surface
 *          doesn't. A vermilion dot sits high on one slope with a tiny
 *          arrow gesturing downhill — the next chapter's image.
 *  Right : a thread card — the closed-form solution exists because SSE is
 *          quadratic; almost no other loss is. We need a way to find a
 *          minimum without a formula. That's optimization.
 *
 * Static. No interaction. Same shape as eigenvalues/Closing.tsx.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  // Build a wavy 1D-projection of a loss surface for the left card.
  const N = 240
  const X0 = 60
  const X1 = VIEW_W - 60
  const baseline = 320
  const amp = 80
  const pts: string[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const x = X0 + t * (X1 - X0)
    // A combination of low-frequency dips so it doesn't look like a sine wave.
    const y =
      baseline -
      amp * 0.25 * Math.sin(t * Math.PI * 2.2 + 0.6) -
      amp * 0.45 * Math.sin(t * Math.PI * 3.7 + 1.4) -
      amp * 0.18 * Math.sin(t * Math.PI * 5.3 + 0.2)
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  const path = pts.join(' ')

  // Sample some downhill arrows to suggest "follow the slope".
  const samplePts: { x: number; y: number; tang: number }[] = []
  for (const t of [0.18, 0.78]) {
    const x = X0 + t * (X1 - X0)
    const y =
      baseline -
      amp * 0.25 * Math.sin(t * Math.PI * 2.2 + 0.6) -
      amp * 0.45 * Math.sin(t * Math.PI * 3.7 + 1.4) -
      amp * 0.18 * Math.sin(t * Math.PI * 5.3 + 0.2)
    const dy =
      -amp * 0.25 * Math.cos(t * Math.PI * 2.2 + 0.6) * Math.PI * 2.2 -
      amp * 0.45 * Math.cos(t * Math.PI * 3.7 + 1.4) * Math.PI * 3.7 -
      amp * 0.18 * Math.cos(t * Math.PI * 5.3 + 0.2) * Math.PI * 5.3
    samplePts.push({ x, y, tang: Math.atan2(dy, X1 - X0) })
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A sketched loss landscape — a wavy curve with several basins, in contrast to the single-basin parabola from act six. A vermilion marker sits high on one slope, with a short arrow pointing downhill, as a visual preview of optimization."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A sketched loss landscape with multiple basins. A vermilion marker on a high slope with a short arrow gesturing downhill."
      >
        {/* Header */}
        <text
          x={VIEW_W / 2}
          y="60"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          MOST LOSSES &middot; NO CLOSED FORM
        </text>

        {/* Baseline */}
        <line
          x1={X0}
          y1={baseline + 100}
          x2={X1}
          y2={baseline + 100}
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* Loss surface */}
        <path d={path} fill="none" stroke="var(--color-graph-ink)" strokeWidth="2" />

        {/* Sample down-arrows */}
        {samplePts.map((s, i) => {
          const L = 28
          const a = s.tang + Math.PI / 2 // downhill is perpendicular-ish; tuned by hand for clarity
          void a
          // simpler: just point straight down with a small angle bias
          const dx = i === 0 ? 14 : -14
          const dy = 22
          return (
            <g key={i}>
              <circle cx={s.x} cy={s.y} r="7" fill="var(--color-vermilion)" />
              <line
                x1={s.x}
                y1={s.y}
                x2={s.x + dx}
                y2={s.y + dy}
                stroke="var(--color-vermilion)"
                strokeWidth="2"
              />
              <polygon
                points={`${s.x + dx},${s.y + dy} ${s.x + dx - 6},${s.y + dy - 6} ${s.x + dx + 6},${s.y + dy - 6}`}
                fill="var(--color-vermilion)"
              />
              <text
                x={s.x + dx + (i === 0 ? 12 : -12)}
                y={s.y + dy + (i === 0 ? 4 : 4)}
                textAnchor={i === 0 ? 'start' : 'end'}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="12"
                fill="var(--color-vermilion)"
              >
                {L > 0 ? 'climb down' : ''}
              </text>
            </g>
          )
        })}

        {/* Side labels */}
        <text
          x={X0 + 12}
          y={baseline + 84}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          basins, ridges, plateaus
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 36}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the picture every neural-net trainer lives inside
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 9a &mdash; The landscape where there is no formula
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A thread card: linear regression has a closed-form solution because its loss is quadratic. Almost everything else doesn't. The next chapter, Optimization, is about how to climb down a loss landscape when you can't write down where the bottom is."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Thread card forward to the Optimization chapter."
      >
        {/* Frame */}
        <rect
          x="60"
          y="60"
          width={VIEW_W - 120}
          height={VIEW_H - 120}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="100"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          WHAT WE GOT &middot; WHAT WE DIDN&apos;T
        </text>

        <text
          x={VIEW_W / 2}
          y="160"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-ink)"
        >
          A quadratic loss has one minimum,
        </text>
        <text
          x={VIEW_W / 2}
          y="184"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-ink)"
        >
          and we can write it down.
        </text>

        <text
          x={VIEW_W / 2}
          y="234"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-vermilion)"
        >
          Almost no other loss does.
        </text>

        <text
          x={VIEW_W / 2}
          y="284"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          So we need a way to climb down a surface
        </text>
        <text
          x={VIEW_W / 2}
          y="304"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          we can&apos;t solve in closed form.
        </text>

        <line
          x1={VIEW_W / 2 - 40}
          y1="344"
          x2={VIEW_W / 2 + 40}
          y2="344"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="376"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          NEXT &middot; OPTIMIZATION &middot; CAUCHY 1847
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 80}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          gradient descent &mdash; the method underneath every neural net
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 9b &mdash; The chapter ends; the loss landscape begins
      </figcaption>
    </figure>
  )
}
