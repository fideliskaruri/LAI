import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 1 — cold-open. Both panes are decorative.
 *
 *  Left  : a hand-drawn ellipse showing Gauss's predicted orbit for Ceres,
 *          the asteroid that the astronomer Piazzi spotted in Palermo on
 *          1 January 1801 and then lost behind the sun. Gauss, 24, fit an
 *          ellipse to 41 days of observations using least squares and told
 *          everyone where to point their telescopes a year later. Zach
 *          re-spotted Ceres on 7 December 1801 within half a degree of
 *          Gauss's prediction. The episode made his reputation.
 *
 *  Right : a stylized title page of Adrien-Marie Legendre's 1805 book,
 *          *Nouvelles méthodes pour la détermination des orbites des
 *          comètes*, in which the method of least squares — *méthode des
 *          moindres carrés* — first appears in print. Legendre tucks it
 *          into an appendix. Gauss publishes his own version in 1809 in
 *          *Theoria motus* and claims he'd been using it since 1795.
 *          They fight about priority for decades.
 *
 * No interaction. The story moves in the prose.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A hand-drawn ellipse showing Gauss's 1801 predicted orbit for the asteroid Ceres. A sun marker sits near one focus; four observation points cluster along a short arc; the predicted curve continues around to the rediscovery point."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Hand-drawn ellipse of Gauss's 1801 Ceres orbit prediction. The sun sits near one focus; four observed positions cluster along a short arc; the predicted curve continues to the rediscovery point on 7 December 1801."
      >
        {/* Page-edge marginalia frame */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* Header */}
        <text
          x={VIEW_W / 2}
          y="80"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          GAUSS · CERES · 1801
        </text>

        {/* The ellipse — drawn rotated about its centre */}
        <g transform={`translate(${VIEW_W / 2}, ${VIEW_H / 2 + 10}) rotate(-12)`}>
          {/* Outer dashed ellipse — the predicted orbit */}
          <ellipse
            cx="0"
            cy="0"
            rx="200"
            ry="120"
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* Solid arc — the observed portion (41 days of data) */}
          <path
            d={describeArc(0, 0, 200, 120, -28, 12)}
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="2.5"
          />
          {/* Sun at a focus — focus offset c = sqrt(a^2 - b^2) ≈ 160 */}
          <circle cx="-160" cy="0" r="7" fill="var(--color-ink)" />
          <text
            x="-160"
            y="-14"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-ink)"
          >
            sun
          </text>

          {/* Four observation points along the solid arc */}
          {[-26, -16, -4, 8].map((deg, i) => {
            const a = (deg * Math.PI) / 180
            const x = 200 * Math.cos(a)
            const y = 120 * Math.sin(a)
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="3.5" fill="var(--color-vermilion)" />
              </g>
            )
          })}

          {/* Re-acquisition point — the December prediction */}
          {(() => {
            const a = (160 * Math.PI) / 180
            const x = 200 * Math.cos(a)
            const y = 120 * Math.sin(a)
            return (
              <g>
                <circle
                  cx={x}
                  cy={y}
                  r="9"
                  fill="none"
                  stroke="var(--color-vermilion)"
                  strokeWidth="1.5"
                />
                <circle cx={x} cy={y} r="3.5" fill="var(--color-vermilion)" />
                <text
                  x={x - 14}
                  y={y - 14}
                  textAnchor="end"
                  fontFamily="Source Serif 4, Georgia, serif"
                  fontStyle="italic"
                  fontSize="11"
                  fill="var(--color-vermilion)"
                >
                  7 Dec 1801
                </text>
              </g>
            )
          })()}
        </g>

        {/* Bottom caption */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 60}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          forty-one days of data, one ellipse
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0a &mdash; The orbit Gauss predicted by least squares
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  // A handful of "abstract" line lengths drawn as a fake body of text.
  const bodyLines = Array.from({ length: 9 }, (_, i) => ({
    y: 332 + i * 12,
    len: 320 - ((i * 23) % 80),
  }))
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A stylized title page of Adrien-Marie Legendre's 1805 book, Nouvelles méthodes pour la détermination des orbites des comètes — the printed debut of the method of least squares."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Stylized title page of Legendre's 1805 Nouvelles méthodes pour la détermination des orbites des comètes, in which the method of least squares first appears in print."
      >
        {/* Page */}
        <rect
          x="60"
          y="32"
          width="480"
          height="416"
          fill="var(--color-paper)"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* Top rule */}
        <line
          x1="120"
          y1="80"
          x2="480"
          y2="80"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.6"
        />

        {/* Author */}
        <text
          x="300"
          y="112"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="11"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          PAR A. M. LEGENDRE
        </text>
        <text
          x="300"
          y="128"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="10"
          fill="var(--color-dim)"
        >
          membre de l&apos;Institut national
        </text>

        {/* Title */}
        <text
          x="300"
          y="174"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="17"
          fontWeight="700"
          fill="var(--color-paper-ink)"
        >
          NOUVELLES MÉTHODES
        </text>
        <text
          x="300"
          y="194"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          pour la détermination des
        </text>
        <text
          x="300"
          y="222"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="22"
          fontWeight="700"
          fill="var(--color-vermilion)"
        >
          ORBITES DES COMÈTES
        </text>

        {/* Sub-rule */}
        <line
          x1="180"
          y1="248"
          x2="420"
          y2="248"
          stroke="var(--color-graph-ink)"
          strokeWidth="0.4"
        />

        {/* Appendix label */}
        <text
          x="300"
          y="272"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          avec un Appendice
        </text>

        {/* The method's name in the appendix */}
        <text
          x="300"
          y="298"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fontWeight="700"
          fill="var(--color-vermilion)"
        >
          Sur la Méthode des moindres quarrés
        </text>

        {/* Abstract-as-lines */}
        {bodyLines.map((l, i) => (
          <line
            key={i}
            x1={300 - l.len / 2}
            y1={l.y}
            x2={300 + l.len / 2}
            y2={l.y}
            stroke="var(--color-graph-ink)"
            strokeWidth="0.5"
            strokeOpacity="0.55"
          />
        ))}

        {/* Imprint */}
        <text
          x="300"
          y="436"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          Paris &mdash; Firmin Didot &mdash; MDCCCV
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0b &mdash; Legendre, <span style={{ fontStyle: 'normal' }}>Nouvelles méthodes</span>, 1805
      </figcaption>
    </figure>
  )
}

/* SVG arc helper — sweeps from startDeg to endDeg around (cx, cy) on an ellipse
 * with semi-axes rx, ry. Angles in degrees, 0 = positive x. */
function describeArc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = polar(cx, cy, rx, ry, startDeg)
  const end = polar(cx, cy, rx, ry, endDeg)
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  const sweep = endDeg > startDeg ? 1 : 0
  return `M ${start.x} ${start.y} A ${rx} ${ry} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`
}

function polar(cx: number, cy: number, rx: number, ry: number, deg: number) {
  const r = (deg * Math.PI) / 180
  return { x: cx + rx * Math.cos(r), y: cy + ry * Math.sin(r) }
}
