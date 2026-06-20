import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Cold-open for the Distributions chapter. Gauss and the recovery of
 * Ceres, 1801. A starry-night sketch: the orbit of Ceres traced as a
 * thin ellipse against a dark sky, the sun at one focus, and a small
 * vermilion tick marking the spot Gauss predicted — where Franz Xaver
 * von Zach turned his telescope on the night of 31 December 1801 and
 * found the asteroid exactly where the new mathematics said it would be.
 *
 * Static — no interaction. The teaching is in the prose; the canvas sets
 * the moment.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

// Pseudo-random but deterministic starfield. Same seed every render.
function seeded(i: number): number {
  // Cheap deterministic PRNG — good enough for static decoration.
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function Stars({ count, opacity = 0.85 }: { count: number; opacity?: number }) {
  const stars = []
  for (let i = 0; i < count; i++) {
    const cx = seeded(i + 1) * VIEW_W
    const cy = seeded(i + 1001) * (VIEW_H - 90)
    const r = 0.4 + seeded(i + 2001) * 1.2
    const o = opacity * (0.4 + seeded(i + 3001) * 0.6)
    stars.push(
      <circle key={i} cx={cx.toFixed(1)} cy={cy.toFixed(1)} r={r.toFixed(2)} fill="#F4ECDB" fillOpacity={o.toFixed(2)} />,
    )
  }
  return <>{stars}</>
}

export function GaussCeres() {
  // Orbit ellipse — centered slightly off the geometric origin so the
  // Sun sits at one focus (true to Kepler, even at sketch fidelity).
  const ORBIT_CX = 320
  const ORBIT_CY = 250
  const ORBIT_RX = 170
  const ORBIT_RY = 90

  // Predicted re-emergence point — high on the orbit, near the
  // "morning sky" the December 1801 sightings recorded.
  const predAngle = -Math.PI / 2.3
  const predX = ORBIT_CX + ORBIT_RX * Math.cos(predAngle)
  const predY = ORBIT_CY + ORBIT_RY * Math.sin(predAngle)

  // Where Piazzi last saw it — opposite side of the orbit.
  const lastAngle = Math.PI / 1.2
  const lastX = ORBIT_CX + ORBIT_RX * Math.cos(lastAngle)
  const lastY = ORBIT_CY + ORBIT_RY * Math.sin(lastAngle)

  // Sun at one focus.
  const c = Math.sqrt(Math.max(0, ORBIT_RX * ORBIT_RX - ORBIT_RY * ORBIT_RY))
  const sunX = ORBIT_CX + c
  const sunY = ORBIT_CY

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A starry-night sketch. The orbit of the asteroid Ceres traces a thin ellipse against a dark sky. A small vermilion tick marks the spot Gauss predicted — where on the last night of 1801, Franz Xaver von Zach pointed his telescope and found Ceres exactly where the new mathematics said it would be."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A night-sky sketch: the elliptical orbit of the asteroid Ceres against a field of stars. The Sun sits at one focus. A bright vermilion tick on the orbit marks the spot Gauss predicted, where Ceres was recovered on December 31, 1801, using the least-squares method he had invented earlier that year."
      >
        <g aria-hidden="true" data-origin-x={ORIGIN_X} data-origin-y={ORIGIN_Y} data-unit={UNIT} />

        {/* Deep-blue night sky background — bordered so it reads as a
            depicted scene rather than the page bg bleeding through */}
        <rect width={VIEW_W} height={VIEW_H} fill="#0E1422" stroke="var(--color-graph-fade)" strokeWidth="1" />
        {/* Subtle horizon wash */}
        <rect y={VIEW_H - 90} width={VIEW_W} height={90} fill="#161E33" />
        <line x1={0} y1={VIEW_H - 90} x2={VIEW_W} y2={VIEW_H - 90} stroke="#22304F" strokeWidth="0.6" />

        {/* Starfield */}
        <Stars count={120} />

        {/* Milky Way wisp — a soft diagonal smudge for atmosphere */}
        <path
          d={`M -20 ${VIEW_H * 0.18} Q ${VIEW_W * 0.4} ${VIEW_H * 0.45} ${VIEW_W + 20} ${VIEW_H * 0.62}`}
          stroke="#F4ECDB"
          strokeOpacity="0.06"
          strokeWidth="60"
          fill="none"
        />

        {/* Orbit ellipse — thin, dashed: the geometry Gauss had to recover */}
        <ellipse
          cx={ORBIT_CX}
          cy={ORBIT_CY}
          rx={ORBIT_RX}
          ry={ORBIT_RY}
          fill="none"
          stroke="#E6DDC2"
          strokeOpacity="0.55"
          strokeWidth="1"
          strokeDasharray="2 4"
        />

        {/* Sun — at one focus of the orbit */}
        <g>
          <circle cx={sunX} cy={sunY} r={28} fill="#FFE0A0" fillOpacity="0.10" />
          <circle cx={sunX} cy={sunY} r={16} fill="#FFE0A0" fillOpacity="0.22" />
          <circle cx={sunX} cy={sunY} r={7} fill="#FFD17A" />
          <text
            x={sunX + 18}
            y={sunY + 4}
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="#E6DDC2"
            fillOpacity="0.75"
          >
            sun
          </text>
        </g>

        {/* Piazzi's last sighting — a tiny faded mark */}
        <g>
          <circle cx={lastX} cy={lastY} r={3} fill="#E6DDC2" fillOpacity="0.45" />
          <text
            x={lastX - 8}
            y={lastY - 8}
            textAnchor="end"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="10"
            fill="#E6DDC2"
            fillOpacity="0.55"
          >
            Piazzi · Feb 1801
          </text>
        </g>

        {/* The arc of "lost" — the months the asteroid disappeared behind the Sun */}
        <path
          d={`M ${lastX} ${lastY} A ${ORBIT_RX} ${ORBIT_RY} 0 0 1 ${predX} ${predY}`}
          fill="none"
          stroke="#E6DDC2"
          strokeOpacity="0.18"
          strokeWidth="1"
        />

        {/* Predicted re-emergence — vermilion tick, the centrepiece of the scene */}
        <g>
          {/* Halo */}
          <circle cx={predX} cy={predY} r={16} fill="var(--color-vermilion)" fillOpacity="0.10" />
          <circle cx={predX} cy={predY} r={9} fill="var(--color-vermilion)" fillOpacity="0.22" />
          {/* Tick mark — a small cross */}
          <line x1={predX - 8} y1={predY} x2={predX + 8} y2={predY} stroke="var(--color-vermilion)" strokeWidth="1.6" />
          <line x1={predX} y1={predY - 8} x2={predX} y2={predY + 8} stroke="var(--color-vermilion)" strokeWidth="1.6" />
          <circle cx={predX} cy={predY} r="2.4" fill="var(--color-vermilion)" />
          <text
            x={predX + 14}
            y={predY - 12}
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-vermilion)"
          >
            here · Dec 31, 1801
          </text>
        </g>

        {/* Telescope at the lower-right horizon — the von Zach instrument */}
        <g transform="translate(486, 392)">
          {/* Tripod legs */}
          <line x1={-12} y1={26} x2={-2} y2={-2} stroke="#F4ECDB" strokeOpacity="0.7" strokeWidth="1.2" />
          <line x1={12} y1={26} x2={2} y2={-2} stroke="#F4ECDB" strokeOpacity="0.7" strokeWidth="1.2" />
          <line x1={0} y1={26} x2={0} y2={-2} stroke="#F4ECDB" strokeOpacity="0.7" strokeWidth="1.2" />
          {/* Tube — aimed at the prediction */}
          <g transform="rotate(-46)">
            <rect x={-4} y={-46} width={8} height={48} fill="#1E2540" stroke="#F4ECDB" strokeOpacity="0.7" strokeWidth="1" rx={1} />
            <rect x={-7} y={-50} width={14} height={6} fill="#0E1422" stroke="#F4ECDB" strokeOpacity="0.7" strokeWidth="1" rx={1} />
            <rect x={-5} y={0} width={10} height={4} fill="#0E1422" stroke="#F4ECDB" strokeOpacity="0.7" strokeWidth="1" />
          </g>
          <text
            x={0}
            y={46}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="10"
            fill="#E6DDC2"
            fillOpacity="0.7"
          >
            von Zach · Gotha
          </text>
        </g>

        {/* Sight line — telescope to predicted point, faint */}
        <line
          x1={486}
          y1={376}
          x2={predX}
          y2={predY}
          stroke="var(--color-vermilion)"
          strokeOpacity="0.35"
          strokeWidth="0.7"
          strokeDasharray="1 5"
        />

        {/* Place and date whisper, top centre */}
        <text
          x={VIEW_W / 2}
          y={44}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="#E6DDC2"
          fillOpacity="0.85"
        >
          Gotha, the last night of 1801
        </text>

        {/* Caption */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 22}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="#E6DDC2"
          fillOpacity="0.7"
        >
          a small dot of light, exactly where the mathematics said it would be
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0 — Gauss predicts where the lost asteroid will reappear
      </figcaption>
    </figure>
  )
}
