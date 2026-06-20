import { useMemo, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Drag-and-drop analogy. Three dropdowns: A, B, C. Compute A − B + C,
 * then look up the precomputed nearest word.
 *
 * Hand-tuned lookup table — every (A, B, C) listed corresponds to a real
 * word2vec analogy that the published model gets right. Anything outside
 * the table falls back to "result unclear".
 *
 *   paris  − france + england  ≈  london
 *   king   − man    + woman    ≈  queen
 *   walk   − slow   + fast     ≈  run
 *   berlin − germany + italy   ≈  rome
 *   man    − king   + queen    ≈  woman
 *   puppy  − dog    + cat      ≈  kitten
 */

interface AnalogyKey {
  a: string
  b: string
  c: string
  result: string
}

const ALL_WORDS = [
  'paris',
  'france',
  'london',
  'england',
  'berlin',
  'germany',
  'rome',
  'italy',
  'king',
  'queen',
  'prince',
  'princess',
  'man',
  'woman',
  'boy',
  'girl',
  'dog',
  'cat',
  'puppy',
  'kitten',
  'walk',
  'run',
  'fast',
  'slow',
] as const

const KNOWN: AnalogyKey[] = [
  { a: 'paris', b: 'france', c: 'england', result: 'london' },
  { a: 'london', b: 'england', c: 'france', result: 'paris' },
  { a: 'berlin', b: 'germany', c: 'italy', result: 'rome' },
  { a: 'rome', b: 'italy', c: 'germany', result: 'berlin' },
  { a: 'king', b: 'man', c: 'woman', result: 'queen' },
  { a: 'queen', b: 'woman', c: 'man', result: 'king' },
  { a: 'man', b: 'king', c: 'queen', result: 'woman' },
  { a: 'prince', b: 'boy', c: 'girl', result: 'princess' },
  { a: 'walk', b: 'slow', c: 'fast', result: 'run' },
  { a: 'run', b: 'fast', c: 'slow', result: 'walk' },
  { a: 'puppy', b: 'dog', c: 'cat', result: 'kitten' },
  { a: 'kitten', b: 'cat', c: 'dog', result: 'puppy' },
]

const VIEW_W = 600
const VIEW_H = 480

function resolve(a: string, b: string, c: string): string | null {
  return KNOWN.find((k) => k.a === a && k.b === b && k.c === c)?.result ?? null
}

export function AnalogyArithmetic() {
  const [a, setA] = useState('king')
  const [b, setB] = useState('man')
  const [c, setC] = useState('woman')

  const result = useMemo(() => resolve(a, b, c), [a, b, c])

  const narrationText = result
    ? `${a} minus ${b} plus ${c} equals ${result}.`
    : `${a} minus ${b} plus ${c}. No clean analogy in the lookup table — try one of the suggested combinations.`
  const narrationPriority = result ? ('high' as const) : ('normal' as const)

  // Each dropdown rendered as a foreignObject inside the SVG so we keep one
  // canvas + can position rows precisely.
  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} priority={narrationPriority} />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Analogy arithmetic. Pick three words for A, B, C. Compute A minus B plus C. Current: ${a} minus ${b} plus ${c} equals ${result ?? 'unknown'}.`}
      >
        {/* HUD */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            ANALOGY ARITHMETIC
          </text>
          <text
            y="22"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="13"
            fill="var(--color-dim)"
          >
            pick three words. compute A − B + C.
          </text>
        </g>

        {/* Equation row: A  −  B  +  C  ≈  RESULT */}
        <foreignObject x={60} y={130} width={120} height={48}>
          <Dropdown label="A" value={a} onChange={setA} />
        </foreignObject>

        <text
          x={190}
          y={163}
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="28"
          fill="var(--color-ink)"
        >
          −
        </text>

        <foreignObject x={210} y={130} width={120} height={48}>
          <Dropdown label="B" value={b} onChange={setB} />
        </foreignObject>

        <text
          x={340}
          y={163}
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="28"
          fill="var(--color-ink)"
        >
          +
        </text>

        <foreignObject x={360} y={130} width={120} height={48}>
          <Dropdown label="C" value={c} onChange={setC} />
        </foreignObject>

        <text
          x={495}
          y={163}
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="22"
          fill="var(--color-ink)"
        >
          ≈
        </text>

        {/* Result */}
        <g transform="translate(300, 260)">
          <rect
            x={-110}
            y={-30}
            width={220}
            height={70}
            rx={6}
            fill={result ? 'var(--color-vermilion)' : 'var(--color-cream-deep)'}
            stroke={result ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
            strokeWidth="1.5"
            style={{ transition: 'fill 200ms' }}
          />
          {result ? (
            <>
              <text
                x={0}
                y={2}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="26"
                fontWeight="600"
                fill="var(--color-cream)"
              >
                {result}
              </text>
              <text
                x={0}
                y={28}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="10"
                letterSpacing="0.18em"
                fill="var(--color-cream)"
                opacity="0.8"
              >
                NEAREST WORD
              </text>
            </>
          ) : (
            <>
              <text
                x={0}
                y={2}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="16"
                fill="var(--color-dim)"
              >
                no clean match
              </text>
              <text
                x={0}
                y={26}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="11"
                fill="var(--color-dim)"
              >
                try a suggested combination
              </text>
            </>
          )}
        </g>

        {/* Suggested presets */}
        <g transform="translate(300, 360)">
          <text
            x={0}
            y={0}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            TRY
          </text>
          {[
            { a: 'king', b: 'man', c: 'woman' },
            { a: 'paris', b: 'france', c: 'england' },
            { a: 'walk', b: 'slow', c: 'fast' },
          ].map((p, i) => (
            <foreignObject
              key={i}
              x={-220 + i * 150}
              y={16}
              width={140}
              height={56}
            >
              <button
                type="button"
                onClick={() => {
                  setA(p.a)
                  setB(p.b)
                  setC(p.c)
                }}
                className="w-full h-full px-2 py-2 font-serif italic text-[12px] text-ink bg-cream-deep/60 hover:bg-vermilion/15 border border-[var(--color-graph-fade)] rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion"
              >
                {p.a} − {p.b} + {p.c}
              </button>
            </foreignObject>
          ))}
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4 — Vector arithmetic on words
      </figcaption>
    </figure>
  )
}

interface DropdownProps {
  label: string
  value: string
  onChange: (v: string) => void
}

function Dropdown({ label, value, onChange }: DropdownProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-dim">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-serif italic text-[14px] text-ink bg-cream border border-[var(--color-graph-ink)] rounded-sm px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion"
        aria-label={`Word ${label}`}
      >
        {ALL_WORDS.map((w) => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </select>
    </label>
  )
}
