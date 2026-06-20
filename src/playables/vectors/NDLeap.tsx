import { lazy, Suspense, useRef } from 'react'
import { useNearViewport } from '../../hooks/useNearViewport'

// 3D content is code-split — only fetched when the user actually approaches the nD act.
const NDLeapScene3D = lazy(() => import('./NDLeapScene3D'))

export type NDState = 'nd-1' | 'nd-2' | 'nd-3' | 'nd-4'

interface NDLeapProps {
  state: NDState
}

// A real word2vec-shaped vector for 'king' (truncated to 8 dims for display).
const KING_NUMBERS = ['0.341', '−0.118', '0.776', '0.045', '−0.502', '0.193', '0.022', '0.667']

export function NDLeap({ state }: NDLeapProps) {
  const ref = useRef<HTMLDivElement>(null)
  const near = useNearViewport<HTMLDivElement>(ref)

  return (
    <figure ref={ref} className="w-full">
      {state === 'nd-1' && <NDLeap2D />}

      {(state === 'nd-2' || state === 'nd-3') && (
        <Suspense fallback={<Placeholder caption="loading 3D…" />}>
          {near ? (
            <NDLeapScene3D fadeAxes={state === 'nd-3'} showNumbers={state === 'nd-3'} numbers={KING_NUMBERS} />
          ) : (
            <Placeholder caption="(3D scene parked)" />
          )}
        </Suspense>
      )}

      {state === 'nd-4' && <NDLeapNumbers numbers={KING_NUMBERS} />}

      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 10 — The leap to many dimensions
      </figcaption>
    </figure>
  )
}

function NDLeap2D() {
  return (
    <svg viewBox="0 0 600 480" className="w-full h-auto" role="img" aria-label="A 2D coordinate plane with a single vector from origin pointing into the first quadrant.">
      {/* Grid */}
      {Array.from({ length: 13 }, (_, i) => (
        <line key={`v-${i}`} x1={50 + i * 41.67} y1="40" x2={50 + i * 41.67} y2="440" stroke="var(--color-graph-fade)" strokeWidth="0.5" />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <line key={`h-${i}`} x1="40" y1={50 + i * 47.5} x2="560" y2={50 + i * 47.5} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
      ))}
      <line x1="40" y1="240" x2="560" y2="240" stroke="var(--color-graph-ink)" strokeWidth="1" />
      <line x1="300" y1="40" x2="300" y2="440" stroke="var(--color-graph-ink)" strokeWidth="1" />
      <text x="550" y="232" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">x</text>
      <text x="308" y="48" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">y</text>

      {/* Vector */}
      <line x1="300" y1="240" x2="450" y2="140" stroke="var(--color-vermilion)" strokeWidth="2" />
      <polygon points="450,140 442,138 440,148" fill="var(--color-vermilion)" />
      <text x="460" y="150" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="16" fill="var(--color-vermilion)">v</text>

      <text x="36" y="462" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
        TWO COMPONENTS
      </text>
    </svg>
  )
}

function NDLeapNumbers({ numbers }: { numbers: string[] }) {
  return (
    <svg viewBox="0 0 600 480" className="w-full h-auto" role="img" aria-label="A column of decimal numbers — the components of a high-dimensional vector. The picture has run out of room; only the numbers remain.">
      <rect x="200" y="40" width="200" height="400" fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" />
      {numbers.map((n, i) => (
        <text key={i} x="300" y={84 + i * 42} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="20" fill="var(--color-ink)">
          {n}
        </text>
      ))}
      <text x="300" y={84 + numbers.length * 42 + 14} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="22" fill="var(--color-dim)">
        ⋮
      </text>
      <text x="300" y={462} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="12" fill="var(--color-dim)">
        the same kind of object — 768 of them
      </text>
    </svg>
  )
}

function Placeholder({ caption }: { caption: string }) {
  return (
    <div className="w-full aspect-[5/4] flex items-center justify-center text-fade font-sans uppercase text-[10px] tracking-[0.22em] border border-dashed border-fade rounded-sm">
      {caption}
    </div>
  )
}
