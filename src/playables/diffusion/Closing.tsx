import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 7 — Closing.
 *
 *  Left  : a "what scales" stack — three rows showing the same diffusion
 *          recipe applied at growing scale, each one a milestone product:
 *          Stable Diffusion 2022, DALL·E 3 2023, video & 3D 2024+.
 *  Right : a thread card with the forward link to Agents and a one-line
 *          message: the math is the same, the dataset is what scaled.
 *
 * Static.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  const rows = [
    { year: '2022', name: 'Stable Diffusion', detail: 'open-weight image model' },
    { year: '2023', name: 'DALL·E 3 / Midjourney 5', detail: 'commercial photo quality' },
    { year: '2024', name: 'Sora · Veo · diffusion video', detail: 'frames become moving frames' },
    { year: '2025', name: 'diffusion in audio · 3D · code', detail: 'same recipe, new modalities' },
  ]
  const Y0 = 110
  const ROW = 64
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A stack of milestone products built on the same diffusion recipe — Stable Diffusion in 2022, then DALL·E 3 and Midjourney 5, then video and 3D in 2024 and 2025. The math doesn't change; the scale does."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A list of generative AI products built on diffusion, from Stable Diffusion in 2022 through video and 3D in 2025."
      >
        <text
          x={VIEW_W / 2}
          y="64"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ONE RECIPE &middot; MANY PRODUCTS
        </text>

        {rows.map((r, i) => {
          const y = Y0 + i * ROW
          return (
            <g key={r.year}>
              <text
                x="60"
                y={y}
                fontFamily="JetBrains Mono, monospace"
                fontSize="14"
                fill="var(--color-vermilion)"
              >
                {r.year}
              </text>
              <text
                x="140"
                y={y - 2}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="18"
                fill="var(--color-ink)"
              >
                {r.name}
              </text>
              <text
                x="140"
                y={y + 20}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="12"
                fill="var(--color-dim)"
              >
                {r.detail}
              </text>
              <line
                x1="60"
                y1={y + 40}
                x2={VIEW_W - 60}
                y2={y + 40}
                stroke="var(--color-graph-fade)"
                strokeWidth="0.6"
              />
            </g>
          )
        })}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 40}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the math is the same; what scales is the dataset
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6a &mdash; Five years of products on one paper's math
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A thread card forward to the next chapter, Agents. Diffusion learns the world by adding and removing noise; agents try to act on it."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Thread card forward to the Agents chapter."
      >
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
          WHAT WE GOT &middot; WHAT&apos;S NEXT
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
          A forward chain of small noisings
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
          and a learned reverse.
        </text>

        <text
          x={VIEW_W / 2}
          y="232"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-vermilion)"
        >
          That is the whole machine.
        </text>

        <text
          x={VIEW_W / 2}
          y="280"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          A diffusion model can render the world.
        </text>
        <text
          x={VIEW_W / 2}
          y="302"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          But it can&apos;t act on it.
        </text>

        <line x1={VIEW_W / 2 - 40} y1="344" x2={VIEW_W / 2 + 40} y2="344" stroke="var(--color-vermilion)" strokeWidth="1" />

        <text
          x={VIEW_W / 2}
          y="376"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          NEXT &middot; AGENTS &middot; THE TURN OUTWARD
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
          from a model that draws &mdash; to one that does
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6b &mdash; The chapter ends; the loop with the world begins
      </figcaption>
    </figure>
  )
}
