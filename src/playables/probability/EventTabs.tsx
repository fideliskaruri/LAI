import { useRef, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Events act: the same 36-cell grid as SampleSpace, but with three tabs
 * across the top. Each tab defines a subset of the sample space — an
 * *event* — and the matching cells highlight vermilion. The denominator
 * stays at 36; only the numerator changes. The whole point is that an
 * event is just a chosen subset; probability is "cells that match" over
 * "cells total."
 */

const VIEW_W = 600
const VIEW_H = 480
const GRID_LEFT = 90
const GRID_TOP = 90
const CELL = 56

type EventKind = 'sum-7' | 'first-4' | 'both-even'

interface EventDef {
  id: EventKind
  label: string
  predicate: (d1: number, d2: number) => boolean
  formula: string
}

const EVENTS: EventDef[] = [
  {
    id: 'sum-7',
    label: 'sum = 7',
    predicate: (d1, d2) => d1 + d2 === 7,
    formula: 'd₁ + d₂ = 7',
  },
  {
    id: 'first-4',
    label: 'first die is 4',
    predicate: (d1) => d1 === 4,
    formula: 'd₁ = 4',
  },
  {
    id: 'both-even',
    label: 'both even',
    predicate: (d1, d2) => d1 % 2 === 0 && d2 % 2 === 0,
    formula: 'd₁ even ∧ d₂ even',
  },
]

export function EventTabs() {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [eventId, setEventId] = useState<EventKind>('sum-7')
  const event = EVENTS.find((e) => e.id === eventId) ?? EVENTS[0]

  const matching: Array<[number, number]> = []
  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      if (event.predicate(d1, d2)) matching.push([d1, d2])
    }
  }
  const count = matching.length

  const narration = `Event ${event.label}. ${count} of 36 outcomes match. Probability ${(count / 36).toFixed(3)}.`

  // Keyboard nav for the tab strip (left/right arrows).
  function onTabKey(e: React.KeyboardEvent, index: number) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + EVENTS.length) % EVENTS.length
      setEventId(EVENTS[next].id)
      tabRefs.current[next]?.focus()
    }
  }

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="high" />

      {/* Tab strip — HTML, not SVG, so it gets native focus + keyboard semantics */}
      <div role="tablist" aria-label="Event selector" className="flex gap-2 justify-center mb-2">
        {EVENTS.map((e, i) => {
          const active = e.id === eventId
          return (
            <button
              key={e.id}
              ref={(el) => { tabRefs.current[i] = el }}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="event-grid"
              tabIndex={active ? 0 : -1}
              onClick={() => setEventId(e.id)}
              onKeyDown={(ev) => onTabKey(ev, i)}
              className={`
                font-sans text-[11px] uppercase tracking-[0.18em] px-3 py-1.5 rounded-sm transition-colors
                ${
                  active
                    ? 'bg-vermilion text-cream'
                    : 'text-dim hover:text-vermilion border border-graph-fade'
                }
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream
              `}
              style={{
                borderColor: active ? 'transparent' : 'var(--color-graph-fade)',
                backgroundColor: active ? 'var(--color-vermilion)' : 'transparent',
              }}
            >
              {e.label}
            </button>
          )
        })}
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        id="event-grid"
        aria-label={`Sample space grid with the event "${event.label}" highlighted. ${count} of 36 cells match.`}
      >
        {/* Axis labels */}
        <text
          x={GRID_LEFT - 28}
          y={GRID_TOP + 3 * CELL}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
          transform={`rotate(-90, ${GRID_LEFT - 28}, ${GRID_TOP + 3 * CELL})`}
        >
          SECOND DIE
        </text>
        <text
          x={GRID_LEFT + 3 * CELL}
          y={GRID_TOP - 18}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          FIRST DIE
        </text>
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <text
            key={`col-${d}`}
            x={GRID_LEFT + (d - 1) * CELL + CELL / 2}
            y={GRID_TOP - 4}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill="var(--color-dim)"
          >
            {d}
          </text>
        ))}
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <text
            key={`row-${d}`}
            x={GRID_LEFT - 8}
            y={GRID_TOP + (d - 1) * CELL + CELL / 2 + 4}
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill="var(--color-dim)"
          >
            {d}
          </text>
        ))}

        {[1, 2, 3, 4, 5, 6].map((d1) =>
          [1, 2, 3, 4, 5, 6].map((d2) => {
            const x = GRID_LEFT + (d1 - 1) * CELL
            const y = GRID_TOP + (d2 - 1) * CELL
            const match = event.predicate(d1, d2)
            return (
              <g key={`${d1}-${d2}`}>
                <rect
                  x={x + 2}
                  y={y + 2}
                  width={CELL - 4}
                  height={CELL - 4}
                  fill={match ? 'var(--color-vermilion)' : 'transparent'}
                  fillOpacity={match ? 0.22 : 0}
                  stroke={match ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
                  strokeWidth={match ? 1.5 : 1}
                  rx={3}
                />
                <text
                  x={x + CELL / 2}
                  y={y + CELL / 2 + 5}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="14"
                  fontWeight={match ? 600 : 400}
                  fill={match ? 'var(--color-vermilion)' : 'var(--color-ink)'}
                >
                  {d1 + d2}
                </text>
              </g>
            )
          }),
        )}

        {/* Readout */}
        <g transform={`translate(${GRID_LEFT + 6 * CELL + 24}, ${GRID_TOP})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            EVENT
          </text>
          <text y="22" fontFamily="Source Serif 4, Georgia, serif" fontSize="14" fill="var(--color-ink)">
            {event.label}
          </text>
          <text y="42" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            {event.formula}
          </text>
          <text y="78" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
            {count} / 36
          </text>
          <text y="98" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
            P = {(count / 36).toFixed(3)}
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2 — An event is a subset; probability is matching over total
      </figcaption>
    </figure>
  )
}
