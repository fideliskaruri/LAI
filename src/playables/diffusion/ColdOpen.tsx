import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 1 — cold-open. Both panes are decorative.
 *
 *  Left  : a stylized title page of Sohl-Dickstein, Weiss, Maheswaranathan
 *          and Ganguli's 2015 paper, "Deep Unsupervised Learning using
 *          Nonequilibrium Thermodynamics" — the paper that introduced
 *          diffusion models to machine learning, and was then ignored for
 *          almost five years.
 *
 *  Right : a sidebar timeline — the five-year quiet, then the 2020 explosion:
 *          Ho et al. (DDPM), Song & Ermon (score-based generative modeling),
 *          and the cultural arrival in 2022 with Stable Diffusion.
 *
 * No interaction. The story moves in the prose.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  const bodyLines = Array.from({ length: 11 }, (_, i) => ({
    y: 322 + i * 12,
    len: 340 - ((i * 31) % 90),
  }))
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A stylized title page of Sohl-Dickstein, Weiss, Maheswaranathan, and Ganguli's 2015 arxiv paper, Deep Unsupervised Learning using Nonequilibrium Thermodynamics — the paper that quietly introduced diffusion models."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Stylized title page of the 2015 Sohl-Dickstein et al. arxiv paper, Deep Unsupervised Learning using Nonequilibrium Thermodynamics."
      >
        <rect
          x="60"
          y="32"
          width="480"
          height="416"
          fill="#F9F5EA"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x="300"
          y="64"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          arXiv:1503.03585v8 [cs.LG]
        </text>

        <line x1="120" y1="80" x2="480" y2="80" stroke="var(--color-graph-ink)" strokeWidth="0.6" />

        <text
          x="300"
          y="112"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="11"
          letterSpacing="0.16em"
          fill="var(--color-dim)"
        >
          SOHL-DICKSTEIN &middot; WEISS &middot; MAHESWARANATHAN &middot; GANGULI
        </text>

        <text
          x="300"
          y="160"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="19"
          fontWeight="700"
          fill="var(--color-ink)"
        >
          Deep Unsupervised Learning
        </text>
        <text
          x="300"
          y="184"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          using
        </text>
        <text
          x="300"
          y="216"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="20"
          fontWeight="700"
          fill="var(--color-vermilion)"
        >
          Nonequilibrium Thermodynamics
        </text>

        <line x1="180" y1="244" x2="420" y2="244" stroke="var(--color-graph-ink)" strokeWidth="0.4" />

        <text
          x="300"
          y="270"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-ink)"
        >
          Stanford &middot; March 2015
        </text>

        <text
          x="300"
          y="298"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fontWeight="700"
          fill="var(--color-vermilion)"
        >
          a forward diffusion. a learned reverse.
        </text>

        {bodyLines.map((l, i) => (
          <line
            key={i}
            x1={300 - l.len / 2}
            y1={l.y}
            x2={300 + l.len / 2}
            y2={l.y}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.5"
            strokeOpacity="0.5"
          />
        ))}
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0a &mdash; The paper everyone ignored for five years
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  const events = [
    { year: '2015', label: 'Sohl-Dickstein et al.', sub: 'Nonequilibrium thermodynamics', accent: true },
    { year: '2016', label: '— silence —', sub: '', accent: false },
    { year: '2017', label: '— silence —', sub: '', accent: false },
    { year: '2018', label: '— silence —', sub: '', accent: false },
    { year: '2019', label: 'Song & Ermon', sub: 'Score-based generative modeling', accent: true },
    { year: '2020', label: 'Ho, Jain, Abbeel', sub: 'DDPM — denoising diffusion', accent: true },
    { year: '2022', label: 'Stable Diffusion', sub: 'It becomes cultural', accent: true },
  ]
  const X0 = 90
  const Y0 = 92
  const ROW = 46
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A timeline sidebar: the 2015 paper sits alone, then four years of near silence, then in 2019 and 2020 score-based modeling and DDPM revive the idea, and by 2022 Stable Diffusion has made it cultural."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A vertical timeline of diffusion's reception: 2015 introduction, four years of silence, 2019 to 2020 revival, 2022 cultural moment."
      >
        <rect
          x="50"
          y="40"
          width={VIEW_W - 100}
          height={VIEW_H - 80}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="68"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          A SLOW CURRENT
        </text>

        {/* Vertical rail */}
        <line
          x1={X0 + 60}
          y1={Y0}
          x2={X0 + 60}
          y2={Y0 + ROW * (events.length - 1) + 14}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />

        {events.map((e, i) => {
          const y = Y0 + i * ROW
          return (
            <g key={e.year}>
              <circle
                cx={X0 + 60}
                cy={y}
                r="5"
                fill={e.accent ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
              />
              <text
                x={X0 + 44}
                y={y + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontSize="13"
                fill={e.accent ? 'var(--color-ink)' : 'var(--color-dim)'}
              >
                {e.year}
              </text>
              <text
                x={X0 + 80}
                y={y + 1}
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="14"
                fill={e.accent ? 'var(--color-ink)' : 'var(--color-fade)'}
              >
                {e.label}
              </text>
              {e.sub && (
                <text
                  x={X0 + 80}
                  y={y + 18}
                  fontFamily="Source Serif 4, Georgia, serif"
                  fontStyle="italic"
                  fontSize="11"
                  fill="var(--color-dim)"
                >
                  {e.sub}
                </text>
              )}
            </g>
          )
        })}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 56}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          five quiet years, then everything at once
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0b &mdash; The five-year gap, then the avalanche
      </figcaption>
    </figure>
  )
}
