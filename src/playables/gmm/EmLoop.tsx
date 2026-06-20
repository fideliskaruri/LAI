import { useMemo, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import {
  POINTS,
  COMPONENT_COLORS,
  INITIAL_MIXTURE,
  responsibilities,
  mStep,
  logLikelihood,
  mixColor,
  covEllipse,
  type MixtureComponent,
} from './gmmData'

/**
 * Act 6 — alternate E and M until convergence. Two buttons:
 *   - "Step": one E or one M, alternating
 *   - "Run to convergence": run E/M pairs until Δlog L < 1e-3 (cap 100 iters)
 *
 * Sidebar: log-likelihood history as a sparkline; mention Dempster-Laird-
 * Rubin 1977 in the prose. EM is monotone in log-likelihood — the line only
 * goes up.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const CONVERGED_DELTA = 1e-3
const MAX_ITERS = 100

type Phase = 'init' | 'e-done' | 'm-done' | 'converged'

export function EmLoop() {
  const [mixture, setMixture] = useState<MixtureComponent[]>(INITIAL_MIXTURE)
  const [gammas, setGammas] = useState<number[][]>(() =>
    responsibilities(POINTS, INITIAL_MIXTURE),
  )
  const [phase, setPhase] = useState<Phase>('init')
  const [iter, setIter] = useState(0)
  const [history, setHistory] = useState<number[]>(() => [
    logLikelihood(POINTS, INITIAL_MIXTURE),
  ])

  const ll = history[history.length - 1]

  const contours = useMemo(
    () =>
      mixture.flatMap((c, idx) =>
        [1, 2].map((lvl) => ({
          idx,
          lvl,
          pts: covEllipse(c, lvl).map((p) => ({
            x: ORIGIN_X + p.x * UNIT,
            y: ORIGIN_Y - p.y * UNIT,
          })),
        })),
      ),
    [mixture],
  )

  const handleStep = () => {
    if (phase === 'converged') return
    if (phase === 'init' || phase === 'm-done') {
      // Do E
      const newGammas = responsibilities(POINTS, mixture)
      setGammas(newGammas)
      setPhase('e-done')
    } else {
      // Do M
      const newMixture = mStep(POINTS, gammas)
      const newLl = logLikelihood(POINTS, newMixture)
      setMixture(newMixture)
      setHistory((h) => [...h, newLl])
      setIter((n) => n + 1)
      // Check convergence
      const delta = Math.abs(newLl - ll)
      setPhase(delta < CONVERGED_DELTA && iter > 0 ? 'converged' : 'm-done')
    }
  }

  const handleRun = () => {
    let curMix = mixture
    let curHist = history
    let curIter = iter
    let curG = gammas
    for (let s = 0; s < MAX_ITERS; s++) {
      curG = responsibilities(POINTS, curMix)
      const next = mStep(POINTS, curG)
      const newLl = logLikelihood(POINTS, next)
      const prevLl = curHist[curHist.length - 1]
      curMix = next
      curHist = [...curHist, newLl]
      curIter++
      if (Math.abs(newLl - prevLl) < CONVERGED_DELTA && curIter > 1) break
    }
    setMixture(curMix)
    setGammas(curG)
    setHistory(curHist)
    setIter(curIter)
    setPhase('converged')
  }

  const handleReset = () => {
    setMixture(INITIAL_MIXTURE)
    setGammas(responsibilities(POINTS, INITIAL_MIXTURE))
    setPhase('init')
    setIter(0)
    setHistory([logLikelihood(POINTS, INITIAL_MIXTURE)])
  }

  const stepLabel =
    phase === 'init' || phase === 'm-done'
      ? 'Step → E'
      : phase === 'converged'
        ? 'Converged'
        : 'Step → M'

  const narration =
    phase === 'init'
      ? 'Initial mixture. Press step to run an E phase, then an M phase, alternating.'
      : phase === 'converged'
        ? `Converged after ${iter} iterations. Log-likelihood ${ll.toFixed(2)}.`
        : phase === 'e-done'
          ? `Iteration ${iter + 1}, E phase done. Log-likelihood ${ll.toFixed(2)}. Press step for M.`
          : `Iteration ${iter}, M phase done. Log-likelihood ${ll.toFixed(2)}. Press step for E.`

  // Sparkline of log-likelihood
  const sparkW = 168
  const sparkH = 56
  const sparkPath = useMemo(() => {
    if (history.length < 2) return ''
    const minLl = Math.min(...history)
    const maxLl = Math.max(...history)
    const range = Math.max(maxLl - minLl, 0.01)
    return history
      .map((v, i) => {
        const x = (i / Math.max(history.length - 1, 1)) * sparkW
        const y = sparkH - ((v - minLl) / range) * sparkH
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }, [history])

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority={phase === 'converged' ? 'high' : 'normal'}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`EM loop. Iteration ${iter}. Phase ${phase}. Log-likelihood ${ll.toFixed(2)}.${phase === 'converged' ? ' Converged.' : ''}`}
      >
        <Grid />
        <Axes />

        {contours.map((c, i) => (
          <polyline
            key={`iso-${i}-${iter}-${phase}`}
            points={c.pts.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={COMPONENT_COLORS[c.idx]}
            strokeWidth={c.lvl === 1 ? 1.5 : 1}
            strokeOpacity={c.lvl === 1 ? 0.75 : 0.35}
            strokeDasharray={c.lvl === 2 ? '3 3' : undefined}
          />
        ))}

        {/* Points coloured by current γ */}
        {POINTS.map((p, i) => {
          const cx = ORIGIN_X + p.x * UNIT
          const cy = ORIGIN_Y - p.y * UNIT
          const fill = phase === 'init' ? 'var(--color-graph-ink)' : mixColor(gammas[i])
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="5.5"
              fill={fill}
              fillOpacity={phase === 'init' ? 0.55 : 0.92}
            />
          )
        })}

        {/* Center marks */}
        {mixture.map((c, i) => {
          const cx = ORIGIN_X + c.mean.x * UNIT
          const cy = ORIGIN_Y - c.mean.y * UNIT
          return (
            <polygon
              key={i}
              points={`${cx},${cy - 9} ${cx + 9},${cy} ${cx},${cy + 9} ${cx - 9},${cy}`}
              fill="var(--color-cream)"
              stroke={COMPONENT_COLORS[i]}
              strokeWidth="2.5"
            />
          )
        })}

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            EM LOOP  ·  ITER {iter}
          </text>
          <text
            y="22"
            fontFamily="JetBrains Mono, monospace"
            fontSize="13"
            fill={phase === 'converged' ? 'var(--color-vermilion)' : 'var(--color-ink)'}
          >
            log L = {ll.toFixed(2)}
            {phase === 'converged' ? '  (converged)' : ''}
          </text>
        </g>

        {/* Sparkline */}
        <g transform={`translate(${VIEW_W - sparkW - 36}, 36)`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            LOG-LIKELIHOOD
          </text>
          <g transform="translate(0, 14)">
            <rect
              width={sparkW}
              height={sparkH}
              fill="none"
              stroke="var(--color-graph-fade)"
              strokeWidth="0.6"
            />
            {sparkPath && (
              <path
                d={sparkPath}
                fill="none"
                stroke="var(--color-vermilion)"
                strokeWidth="1.5"
              />
            )}
            {history.length >= 1 && (
              <circle
                cx={(history.length - 1) / Math.max(history.length - 1, 1) * sparkW}
                cy={(() => {
                  const minLl = Math.min(...history)
                  const maxLl = Math.max(...history)
                  const range = Math.max(maxLl - minLl, 0.01)
                  return sparkH - ((ll - minLl) / range) * sparkH
                })()}
                r="2.5"
                fill="var(--color-vermilion)"
              />
            )}
          </g>
        </g>
      </svg>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleStep}
          disabled={phase === 'converged'}
          className="font-sans text-[12px] tracking-[0.18em] uppercase px-4 py-2 border border-vermilion text-vermilion disabled:opacity-40 hover:bg-vermilion hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
        >
          {stepLabel}
        </button>
        <button
          type="button"
          onClick={handleRun}
          disabled={phase === 'converged'}
          className="font-sans text-[12px] tracking-[0.18em] uppercase px-4 py-2 border border-dim text-dim disabled:opacity-40 hover:text-ink hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
        >
          Run to convergence
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="font-sans text-[12px] tracking-[0.18em] uppercase px-4 py-2 border border-dim text-dim hover:text-ink hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
        >
          Reset
        </button>
      </div>

      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5 &mdash; Alternate E and M. The log-likelihood is monotone &mdash; it only goes up.
      </figcaption>
    </figure>
  )
}

function Grid() {
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => {
        const x = ORIGIN_X + (i - 6) * UNIT
        return (
          <line
            key={`v-${i}`}
            x1={x}
            y1="20"
            x2={x}
            y2={VIEW_H - 20}
            stroke="var(--color-graph-fade)"
            strokeWidth="0.5"
          />
        )
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const y = ORIGIN_Y + (i - 4) * UNIT
        return (
          <line
            key={`h-${i}`}
            x1="20"
            y1={y}
            x2={VIEW_W - 20}
            y2={y}
            stroke="var(--color-graph-fade)"
            strokeWidth="0.5"
          />
        )
      })}
    </>
  )
}

function Axes() {
  return (
    <>
      <line
        x1="20"
        y1={ORIGIN_Y}
        x2={VIEW_W - 20}
        y2={ORIGIN_Y}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
      <line
        x1={ORIGIN_X}
        y1="20"
        x2={ORIGIN_X}
        y2={VIEW_H - 20}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
    </>
  )
}
