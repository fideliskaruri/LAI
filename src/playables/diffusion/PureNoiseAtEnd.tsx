import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { PixelImage } from './PixelGrid'
import { noisyImageAt, T_STEPS } from './image'

/**
 * Act 3 — Pure noise at the end.
 *
 * Static. Left: three side-by-side panels showing x_0, x_500, x_1000 so the
 * reader can see the chain's endpoints in one frame. Right: a histogram-style
 * sketch — the pixel-value distribution at t=1000 is just N(0, 1), regardless
 * of what the source image was.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  const x0 = noisyImageAt(0)
  const xMid = noisyImageAt(500)
  const xEnd = noisyImageAt(T_STEPS)
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="Three panels showing the same arrow at steps zero, five hundred, and one thousand. By the last panel, the image is indistinguishable from random Gaussian noise."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Three snapshots of the forward process — clean image, half noisy, pure noise."
      >
        <text
          x={VIEW_W / 2}
          y="44"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE ENDPOINTS OF THE CHAIN
        </text>

        {/* Three frames */}
        <PixelImage pixels={x0} cx={120} cy={210} cell={10} />
        <PixelImage pixels={xMid} cx={300} cy={210} cell={10} />
        <PixelImage pixels={xEnd} cx={480} cy={210} cell={10} />

        {/* Labels */}
        <text x={120} y={310} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
          t = 0
        </text>
        <text x={300} y={310} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
          t = 500
        </text>
        <text x={480} y={310} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
          t = 1000
        </text>

        <text
          x={120}
          y={332}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          data
        </text>
        <text
          x={300}
          y={332}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          half-erased
        </text>
        <text
          x={480}
          y={332}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          pure Gaussian
        </text>

        {/* Arrow */}
        <line x1={170} y1={210} x2={250} y2={210} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <polygon points="250,210 244,206 244,214" fill="var(--color-graph-ink)" />
        <line x1={350} y1={210} x2={430} y2={210} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <polygon points="430,210 424,206 424,214" fill="var(--color-graph-ink)" />

        <text
          x={VIEW_W / 2}
          y={400}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          forward is a one-way slide
        </text>
        <text
          x={VIEW_W / 2}
          y={424}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          from data &rarr; pure noise
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2a &mdash; The chain has two ends: one is data, the other is noise
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  // Histogram of pixel values at t=1000 should be roughly N(0, 1) clipped to
  // [0,1] for display. But for the schematic we just sketch the bell curve
  // and the message: regardless of source image, the endpoint distribution
  // is the same.
  const PLOT_X0 = 80
  const PLOT_X1 = VIEW_W - 60
  const PLOT_Y0 = 120
  const PLOT_Y1 = 320
  const xToPx = (x: number) =>
    PLOT_X0 + ((x + 3) / 6) * (PLOT_X1 - PLOT_X0) // x in [-3, 3]
  const yToPx = (y: number) =>
    PLOT_Y1 - y * (PLOT_Y1 - PLOT_Y0)
  const N = 121
  const peak = 0.4 // peak of standard normal pdf
  const path = Array.from({ length: N }, (_, i) => {
    const x = -3 + (i / (N - 1)) * 6
    const y = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
    return `${i === 0 ? 'M' : 'L'} ${xToPx(x).toFixed(2)} ${yToPx(y / peak).toFixed(2)}`
  }).join(' ')

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The pixel-value distribution at the end of the forward chain is a standard normal — the same bell curve no matter what the source image was. This is the universal endpoint we will reverse from."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A standard normal bell curve. The pixel-value distribution at t equals one thousand is N(0, 1) regardless of the source image."
      >
        <text
          x={VIEW_W / 2}
          y="44"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE LAW AT t = 1000
        </text>

        {/* Bell */}
        <line x1={PLOT_X0} y1={PLOT_Y1} x2={PLOT_X1} y2={PLOT_Y1} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <path d={path} fill="none" stroke="var(--color-vermilion)" strokeWidth="2.5" />
        {/* Mean line */}
        <line x1={xToPx(0)} y1={PLOT_Y0} x2={xToPx(0)} y2={PLOT_Y1} stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeDasharray="3 3" />
        {/* Axis ticks */}
        {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
          <g key={v}>
            <line x1={xToPx(v)} y1={PLOT_Y1} x2={xToPx(v)} y2={PLOT_Y1 + 4} stroke="var(--color-graph-ink)" strokeWidth="0.6" />
            <text x={xToPx(v)} y={PLOT_Y1 + 18} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
              {v}
            </text>
          </g>
        ))}

        <text
          x={xToPx(0)}
          y={PLOT_Y0 - 10}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          N(0, 1)
        </text>

        <text
          x={VIEW_W / 2}
          y={PLOT_Y1 + 56}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          every pixel ends up here
        </text>
        <text
          x={VIEW_W / 2}
          y={PLOT_Y1 + 80}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          no matter what image we started from
        </text>

        <line x1={VIEW_W / 2 - 40} y1={PLOT_Y1 + 100} x2={VIEW_W / 2 + 40} y2={PLOT_Y1 + 100} stroke="var(--color-vermilion)" strokeWidth="1" />

        <text
          x={VIEW_W / 2}
          y={PLOT_Y1 + 124}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          REVERSE THIS &middot; AND YOU CAN GENERATE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2b &mdash; The forward process is also a recipe for sampling noise
      </figcaption>
    </figure>
  )
}
