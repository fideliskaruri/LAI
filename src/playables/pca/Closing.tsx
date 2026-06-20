import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 6 — closing diptych. Left: a stylized "embedding" plot — a small
 * version of the kind of low-dim projection you see at the top of every
 * representation-learning paper, with one cluster lit in vermilion as a
 * forward link to clustering. Right: a list of three downstream uses,
 * typeset like a small index card so it reads as a reference, not a tease.
 *
 * Sync mode: independent. Both panes static.
 */

const VIEW_W = 600
const VIEW_H = 480

// Cluster centres for a fake "embedding"
const CLUSTERS: { cx: number; cy: number; n: number; r: number; seed: number; vermilion?: boolean }[] = [
  { cx: 180, cy: 160, n: 24, r: 36, seed: 11 },
  { cx: 410, cy: 200, n: 28, r: 32, seed: 23 },
  { cx: 260, cy: 320, n: 30, r: 42, seed: 41, vermilion: true },
  { cx: 440, cy: 340, n: 18, r: 30, seed: 53 },
]

function mulberry32(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function ClosingLeftPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A small, stylized two-dimensional embedding — four clusters of points in a low-dimensional space — pointing forward to dimensionality reduction in modern machine learning."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A stylized low-dimensional embedding with four loose clusters of points. One cluster is highlighted in vermilion, hinting at the clustering chapter that follows."
      >
        {/* Frame */}
        <rect x="60" y="60" width={VIEW_W - 120} height={VIEW_H - 120} fill="none" stroke="var(--color-graph-fade)" strokeWidth="0.7" />

        {/* Clusters */}
        {CLUSTERS.map((cl, i) => {
          const rng = mulberry32(cl.seed)
          const dots = Array.from({ length: cl.n }, () => {
            const u1 = Math.max(1e-9, rng())
            const u2 = rng()
            const r = Math.sqrt(-2 * Math.log(u1))
            const t = 2 * Math.PI * u2
            return { dx: cl.r * 0.5 * r * Math.cos(t), dy: cl.r * 0.5 * r * Math.sin(t) }
          })
          return (
            <g key={i}>
              {dots.map((d, j) => (
                <circle
                  key={j}
                  cx={cl.cx + d.dx}
                  cy={cl.cy + d.dy}
                  r="2.4"
                  fill={cl.vermilion ? 'var(--color-vermilion)' : 'var(--color-ink)'}
                  fillOpacity={cl.vermilion ? 0.85 : 0.55}
                />
              ))}
            </g>
          )
        })}

        {/* Eyebrow */}
        <text
          x="76"
          y="44"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          A 2D PROJECTION OF SOMETHING HIGHER-DIMENSIONAL
        </text>

        {/* Forward link */}
        <text
          x="76"
          y={VIEW_H - 36}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          Next: clustering — what to do with these groups.
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6a &mdash; Once you have axes, structure appears
      </figcaption>
    </figure>
  )
}

export function ClosingRightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A short index of places PCA reappears — gene-expression analysis, word embeddings, anything where features outnumber what the model can hold at once."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A short reference card listing three downstream uses of PCA: gene-expression analysis, word embedding visualization, and feature preprocessing in modern machine learning pipelines."
      >
        {/* Card backdrop */}
        <rect x="60" y="60" width={VIEW_W - 120} height={VIEW_H - 120} fill="#F9F5EA" stroke="var(--color-graph-fade)" strokeWidth="0.7" />

        {/* Header rule */}
        <text
          x="86"
          y="104"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DOWNSTREAM
        </text>
        <line x1="86" y1="116" x2="200" y2="116" stroke="var(--color-vermilion)" strokeWidth="1" />

        {/* Three entries */}
        <g transform="translate(86, 152)">
          <text fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
            01
          </text>
          <text x="44" fontFamily="Source Serif 4, Georgia, serif" fontSize="15" fontWeight="600" fill="var(--color-ink)">
            Gene expression
          </text>
          <text x="44" y="22" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="12" fill="var(--color-dim)">
            Twenty thousand genes per patient; two axes that summarize disease subtype.
          </text>
        </g>

        <g transform="translate(86, 232)">
          <text fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
            02
          </text>
          <text x="44" fontFamily="Source Serif 4, Georgia, serif" fontSize="15" fontWeight="600" fill="var(--color-ink)">
            Word embeddings
          </text>
          <text x="44" y="22" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="12" fill="var(--color-dim)">
            Three-hundred-dimensional vectors, flattened to a picture you can read.
          </text>
        </g>

        <g transform="translate(86, 312)">
          <text fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
            03
          </text>
          <text x="44" fontFamily="Source Serif 4, Georgia, serif" fontSize="15" fontWeight="600" fill="var(--color-ink)">
            Preprocessing
          </text>
          <text x="44" y="22" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="12" fill="var(--color-dim)">
            A first pass before regression, clustering, or any model with too many inputs.
          </text>
        </g>

        {/* Footer */}
        <text
          x="86"
          y={VIEW_H - 96}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          One nineteenth-century paper. A century of uses.
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6b &mdash; Where it shows up
      </figcaption>
    </figure>
  )
}
