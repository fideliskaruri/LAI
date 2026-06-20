import { useCallback, useRef, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Families act: same axes, three curves. Tabs switch between linear,
 * quadratic, and sin. The point isn't to drag — it's to see that the
 * *same machine idea* gives wildly different shapes depending on the
 * rule.
 *
 * Keyboard: the tabs are a native button group, focusable in document
 * order; ArrowLeft/ArrowRight cycle the selection (standard tab pattern).
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 260
const UNIT = 40

const X_MIN = -5
const X_MAX = 5

type Family = 'linear' | 'quadratic' | 'sin'

interface FamilyDef {
  id: Family
  label: string
  /** Pretty math notation for the readout. */
  formula: string
  /** The actual function. */
  f: (x: number) => number
  /** Short narrative description. */
  describe: string
}

const FAMILIES: FamilyDef[] = [
  {
    id: 'linear',
    label: 'Linear',
    formula: 'f(x) = x',
    f: (x) => x,
    describe: 'a straight line through the origin, rising at forty-five degrees',
  },
  {
    id: 'quadratic',
    label: 'Quadratic',
    formula: 'f(x) = x²',
    f: (x) => x * x,
    describe: 'a parabola, flat at the bottom and steep at the sides',
  },
  {
    id: 'sin',
    label: 'Sine',
    formula: 'f(x) = sin x',
    f: (x) => Math.sin(x),
    describe: 'a wave, rising and falling between minus one and plus one',
  },
]

function curvePath(f: (x: number) => number) {
  // Sample densely so curves look smooth at any aspect ratio.
  const steps = 240
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / steps
    const y = f(x)
    const px = ORIGIN_X + x * UNIT
    const py = ORIGIN_Y - y * UNIT
    // Clip values that would shoot off the panel (e.g. x² at the edges).
    if (py < 20 || py > VIEW_H - 90) {
      if (pts.length === 0) continue
      pts.push(`L${px.toFixed(1)},${Math.max(20, Math.min(VIEW_H - 90, py)).toFixed(1)}`)
      continue
    }
    pts.push(`${pts.length === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return pts.join(' ')
}

export function FamilyToggle() {
  const tablistRef = useRef<HTMLDivElement | null>(null)
  const [current, setCurrent] = useState<Family>('linear')
  const family = FAMILIES.find((f) => f.id === current) ?? FAMILIES[0]

  const handleTabKey = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const idx = FAMILIES.findIndex((f) => f.id === current)
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCurrent(FAMILIES[(idx + 1) % FAMILIES.length].id)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrent(FAMILIES[(idx - 1 + FAMILIES.length) % FAMILIES.length].id)
      }
    },
    [current],
  )

  const narrationText = `Family: ${family.label}. The graph of ${family.formula} is ${family.describe}.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} priority="high" />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Same axes, three function families. Currently showing ${family.label}, the graph of ${family.formula}: ${family.describe}.`}
      >
        <Grid />
        <Axes />

        {/* Faded ghosts of the other two families, so the comparison is felt. */}
        {FAMILIES.filter((f) => f.id !== family.id).map((f) => (
          <path
            key={`ghost-${f.id}`}
            d={curvePath(f.f)}
            fill="none"
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
            strokeOpacity="0.18"
            strokeDasharray="3 4"
          />
        ))}

        {/* Active curve */}
        <path
          d={curvePath(family.f)}
          fill="none"
          stroke="var(--color-vermilion)"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            FAMILY
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="16" fill="var(--color-ink)">
            {family.formula}
          </text>
          <text y="42" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="12" fill="var(--color-dim)">
            {family.describe}
          </text>
        </g>

        <text
          x="32"
          y={VIEW_H - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          SAME AXES  ·  THREE RULES  ·  TAB OR ARROW TO SWITCH
        </text>
      </svg>

      {/* Tab strip — native buttons so keyboard + screen reader behave. */}
      <div
        ref={tablistRef}
        role="tablist"
        aria-label="Function family"
        className="mt-3 flex justify-center gap-2"
      >
        {FAMILIES.map((f) => {
          const active = f.id === current
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="family-canvas"
              onClick={() => setCurrent(f.id)}
              onKeyDown={handleTabKey}
              tabIndex={active ? 0 : -1}
              className={`
                font-sans text-[11px] uppercase tracking-[0.18em] px-3 py-1.5 rounded-sm transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream
                ${
                  active
                    ? 'bg-vermilion text-cream'
                    : 'bg-transparent text-dim hover:text-vermilion border border-fade'
                }
              `}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2 — Same machine idea, three different rules.
      </figcaption>
    </figure>
  )
}

function Grid() {
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => {
        const gx = ORIGIN_X + (i - 6) * UNIT
        return (
          <line key={`v-${i}`} x1={gx} y1="20" x2={gx} y2={VIEW_H - 90} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
      {Array.from({ length: 11 }, (_, i) => {
        const gy = ORIGIN_Y + (i - 5) * UNIT
        return (
          <line key={`h-${i}`} x1="20" y1={gy} x2={VIEW_W - 20} y2={gy} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
    </>
  )
}

function Axes() {
  return (
    <>
      <line x1="20" y1={ORIGIN_Y} x2={VIEW_W - 20} y2={ORIGIN_Y} stroke="var(--color-graph-ink)" strokeWidth="1" />
      <line x1={ORIGIN_X} y1="20" x2={ORIGIN_X} y2={VIEW_H - 90} stroke="var(--color-graph-ink)" strokeWidth="1" />
      <text x={VIEW_W - 30} y={ORIGIN_Y - 8} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">x</text>
      <text x={ORIGIN_X + 8} y="30" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">f(x)</text>
    </>
  )
}
