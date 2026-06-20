import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Cold-open: a pair of static sketches. Left is a vignette of Pearson at his
 * desk in University College London, c. 1901 — quill on paper, a scatter of
 * points, a fitted line. Right is a stylized title page of his Philosophical
 * Magazine paper "On Lines and Planes of Closest Fit to Systems of Points in
 * Space." Neither pane is interactive; this is scene-setting.
 *
 * Mirrors the Cayley/Cauchy memoir cold-opens in earlier chapters so the
 * reader registers "another founding paper."
 */

const VIEW_W = 600
const VIEW_H = 480

export function PearsonLeftPane() {
  // A small sample of points + the line of best fit, sketched on a page that
  // sits on the desk. The line is the fit minimizing perpendicular distance —
  // which is what Pearson actually wrote about (not OLS).
  const pts: { x: number; y: number }[] = [
    { x: -2.3, y: -1.4 }, { x: -1.7, y: -1.1 }, { x: -1.4, y: -0.6 },
    { x: -0.9, y: -0.7 }, { x: -0.4, y: -0.1 }, { x: 0.1, y: 0.2 },
    { x: 0.5, y: 0.0 }, { x: 0.8, y: 0.6 }, { x: 1.2, y: 0.7 },
    { x: 1.7, y: 1.0 }, { x: 2.1, y: 1.5 }, { x: 2.5, y: 1.4 },
  ]

  const PAGE_X = 130
  const PAGE_Y = 230
  const PAGE_W = 340
  const PAGE_H = 200
  const PAPER_CX = PAGE_X + PAGE_W / 2
  const PAPER_CY = PAGE_Y + PAGE_H / 2

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A vignette of Karl Pearson at his desk in University College London, around 1901, sketching a line of closest fit through a scatter of biometric data."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A pen-and-ink vignette of Karl Pearson seated at his desk, sketching a line of closest fit through a scatter of points on a sheet of paper."
      >
        {/* Wall (warm ivory) and floor line */}
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="#F6F1E4" />
        <line
          x1="0"
          y1="430"
          x2={VIEW_W}
          y2="430"
          stroke="var(--color-graph-fade)"
          strokeWidth="0.6"
        />

        {/* Window suggestion, upper-left */}
        <rect x="50" y="48" width="120" height="140" fill="none" stroke="var(--color-graph-fade)" strokeWidth="0.8" />
        <line x1="110" y1="48" x2="110" y2="188" stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        <line x1="50" y1="118" x2="170" y2="118" stroke="var(--color-graph-fade)" strokeWidth="0.5" />

        {/* Desk top */}
        <rect x="80" y="220" width="440" height="14" fill="none" stroke="var(--color-graph-ink)" strokeWidth="0.9" />
        <line x1="80" y1="234" x2="80" y2="430" stroke="var(--color-graph-ink)" strokeWidth="0.9" />
        <line x1="520" y1="234" x2="520" y2="430" stroke="var(--color-graph-ink)" strokeWidth="0.9" />

        {/* Paper on the desk */}
        <rect x={PAGE_X} y={PAGE_Y} width={PAGE_W} height={PAGE_H} fill="#FBF7EB" stroke="var(--color-graph-ink)" strokeWidth="0.7" />

        {/* Scatter and best-fit line, drawn on the page */}
        <g transform={`translate(${PAPER_CX}, ${PAPER_CY})`}>
          {/* Light axes */}
          <line x1="-130" y1="0" x2="130" y2="0" stroke="var(--color-graph-fade)" strokeWidth="0.5" />
          <line x1="0" y1="-70" x2="0" y2="70" stroke="var(--color-graph-fade)" strokeWidth="0.5" />
          {/* Best-fit line (slope chosen by eye for the data) */}
          <line
            x1="-140"
            y1={-(0.62 * -140) / 1}
            x2="140"
            y2={-(0.62 * 140) / 1}
            stroke="var(--color-vermilion)"
            strokeWidth="1.4"
          />
          {pts.map((p, i) => (
            <circle key={i} cx={p.x * 40} cy={-p.y * 40} r="2" fill="var(--color-ink)" fillOpacity="0.7" />
          ))}
        </g>

        {/* Inkwell + quill, right side of the desk */}
        <ellipse cx="470" cy="218" rx="14" ry="5" fill="var(--color-graph-ink)" fillOpacity="0.18" />
        <rect x="463" y="200" width="14" height="20" fill="none" stroke="var(--color-graph-ink)" strokeWidth="0.9" />
        <line x1="470" y1="200" x2="500" y2="120" stroke="var(--color-graph-ink)" strokeWidth="1.1" />
        <line x1="498" y1="124" x2="506" y2="116" stroke="var(--color-graph-ink)" strokeWidth="0.7" />

        {/* Pearson — a seated silhouette behind the desk, suggested */}
        <g transform="translate(220, 130)" opacity="0.85">
          {/* Head */}
          <circle cx="60" cy="0" r="22" fill="none" stroke="var(--color-graph-ink)" strokeWidth="1" />
          {/* Beard hint */}
          <path d="M 44 12 Q 60 32 76 12" fill="none" stroke="var(--color-graph-ink)" strokeWidth="0.7" />
          {/* Shoulders */}
          <path
            d="M 18 80 Q 22 40 50 28 L 70 28 Q 98 40 102 80 L 102 90 L 18 90 Z"
            fill="none"
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
          />
          {/* Arm reaching toward the paper */}
          <path
            d="M 86 56 Q 130 70 168 90"
            fill="none"
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
          />
        </g>

        {/* Eyebrow label */}
        <text
          x="32"
          y={VIEW_H - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          KARL PEARSON  ·  UNIVERSITY COLLEGE LONDON  ·  1901
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0a &mdash; A line of closest fit, sketched by hand
      </figcaption>
    </figure>
  )
}

export function PearsonTitlePagePane() {
  // Stylized title page of Pearson's 1901 paper, matching the journal masthead
  // of Philosophical Magazine (Sixth Series).
  const lines = Array.from({ length: 12 }, (_, i) => ({
    y: 332 + i * 12,
    len: 320 - ((i * 23) % 90),
  }))

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A stylized title page of Pearson's 1901 paper, On Lines and Planes of Closest Fit to Systems of Points in Space, published in the Philosophical Magazine, Sixth Series, Volume 2."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A stylized mockup of the title page of Karl Pearson's 1901 paper, On Lines and Planes of Closest Fit to Systems of Points in Space."
      >
        {/* Page */}
        <rect x="60" y="32" width="480" height="416" fill="#F9F5EA" stroke="var(--color-graph-fade)" strokeWidth="1" />

        {/* Top rule */}
        <line x1="120" y1="80" x2="480" y2="80" stroke="var(--color-graph-ink)" strokeWidth="0.6" />

        {/* Journal masthead */}
        <text
          x="300"
          y="116"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="12"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          THE LONDON, EDINBURGH, AND DUBLIN
        </text>
        <text
          x="300"
          y="134"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="13"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          PHILOSOPHICAL MAGAZINE
        </text>
        <text
          x="300"
          y="152"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-dim)"
        >
          Sixth Series &mdash; Vol. 2 &mdash; November 1901
        </text>
        <line x1="200" y1="166" x2="400" y2="166" stroke="var(--color-graph-ink)" strokeWidth="0.4" />

        {/* Article title */}
        <text
          x="300"
          y="208"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="16"
          fontWeight="700"
          fill="var(--color-ink)"
        >
          ON LINES AND PLANES
        </text>
        <text
          x="300"
          y="234"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          of
        </text>
        <text
          x="300"
          y="262"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="20"
          fontWeight="700"
          fill="var(--color-vermilion)"
        >
          CLOSEST FIT
        </text>
        <text
          x="300"
          y="286"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          to Systems of Points in Space
        </text>

        {/* Author */}
        <text
          x="300"
          y="314"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-ink)"
        >
          By Karl Pearson, F.R.S.
        </text>

        {/* Abstract-as-lines */}
        {lines.map((l, i) => (
          <line
            key={i}
            x1={300 - l.len / 2}
            y1={l.y}
            x2={300 + l.len / 2}
            y2={l.y}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />
        ))}

        {/* Equation hint, bottom — the variance-maximization thread */}
        <text
          x="300"
          y="436"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-vermilion)"
        >
          maximize  Var( w<tspan baselineShift="super" fontSize="9">⊤</tspan>x )  &mdash;  &#8214;w&#8214; = 1
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0b &mdash; Pearson, <span style={{ fontStyle: 'normal' }}>Phil. Mag.</span>, 1901
      </figcaption>
    </figure>
  )
}
