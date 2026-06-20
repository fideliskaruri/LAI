import { useEffect, useReducer, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Cold-open for Functions: a stylized inclined plane in the register of
 * Galileo's ~1604 experiments at Padua/Pisa. A bronze ball rolls down a
 * wooden ramp. No user interaction — the autoplay is the question. The
 * ball accelerates (distance ∝ t²) so by eye you can already see the
 * speed isn't constant. That's the hook for everything that follows.
 *
 * Respects prefers-reduced-motion: snaps the ball to mid-ramp and stays
 * still. Loops every ~3.6 seconds otherwise.
 */

const VIEW_W = 600
const VIEW_H = 480

// Ramp geometry (svg coords)
const RAMP_TOP = { x: 110, y: 130 }
const RAMP_BOT = { x: 510, y: 400 }
const TABLE_Y = 410
const BALL_R = 14

// Duration of one roll, in ms
const PERIOD_MS = 3600

export function GalileoIncline() {
  // We tick a single counter; the ball position is derived from a normalised
  // time in [0,1] passed through t² to model uniform acceleration.
  const [, force] = useReducer((x: number) => x + 1, 0)
  const startRef = useRef<number>(performance.now())
  const reducedRef = useRef<boolean>(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedRef.current = mq.matches
    const onChange = () => {
      reducedRef.current = mq.matches
      force()
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (reducedRef.current) return
    let raf = 0
    const tick = () => {
      force()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Normalised time in [0,1]; t=1 means the ball has reached the bottom.
  const now = performance.now()
  const elapsed = (now - startRef.current) % PERIOD_MS
  const tNorm = reducedRef.current ? 0.55 : elapsed / PERIOD_MS

  // Distance along the ramp grows like t². This is the whole teaching:
  // equal time intervals do not mean equal distances. Galileo's discovery.
  const distFrac = Math.min(1, tNorm * tNorm)

  // Brief pause at the bottom so the loop feels less mechanical.
  const ballOnRamp = distFrac < 0.985 || reducedRef.current

  const ball = ballOnRamp
    ? {
        x: RAMP_TOP.x + (RAMP_BOT.x - RAMP_TOP.x) * distFrac,
        y: RAMP_TOP.y + (RAMP_BOT.y - RAMP_TOP.y) * distFrac - BALL_R + 2,
      }
    : { x: RAMP_BOT.x + 14, y: TABLE_Y - BALL_R }

  // Narration: the canvas says what the ball is doing. We pick a state
  // bucket so the live-region doesn't flood. (CanvasNarrative debounces
  // at 350ms anyway, but bucketing keeps re-renders quiet.)
  const phase = reducedRef.current
    ? 'paused'
    : distFrac < 0.15
      ? 'starting'
      : distFrac < 0.6
        ? 'rolling'
        : distFrac < 0.985
          ? 'speeding'
          : 'landed'

  const narrationText = {
    paused: 'A bronze ball rests on a wooden ramp. Galileo could measure distance and total time, but he could not measure speed at a single instant.',
    starting: 'A bronze ball is released at the top of an inclined plane. It barely moves at first.',
    rolling: 'The ball rolls down the ramp, gathering speed.',
    speeding: 'The ball is moving much faster now than when it started — equal time intervals do not mean equal distances.',
    landed: 'The ball has reached the bottom of the ramp.',
  }[phase]

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} priority={phase === 'paused' ? 'high' : 'normal'} />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A stylized inclined plane in the manner of Galileo around 1604. A bronze ball ${reducedRef.current ? 'rests' : 'rolls'} down the ramp; its speed is not constant. ${narrationText}`}
      >
        {/* Faint paper background panel */}
        <rect x="40" y="40" width={VIEW_W - 80} height={VIEW_H - 80} fill="var(--color-paper)" stroke="var(--color-graph-fade)" strokeWidth="1" />

        {/* Sketch eyebrow */}
        <text x="62" y="78" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          PADUA  ·  GALILEO GALILEI  ·  ~1604
        </text>
        <text x="62" y="98" fontFamily="Georgia, serif" fontSize="13" fontStyle="italic" fill="var(--color-paper-ink)">
          De motu locali — equal times, unequal distances
        </text>

        {/* Table line */}
        <line x1="62" y1={TABLE_Y} x2={VIEW_W - 62} y2={TABLE_Y} stroke="var(--color-graph-ink)" strokeWidth="1.4" />

        {/* Ramp triangle (the inclined plane) */}
        <polygon
          points={`${RAMP_TOP.x},${RAMP_TOP.y} ${RAMP_BOT.x},${RAMP_BOT.y} ${RAMP_TOP.x},${RAMP_BOT.y}`}
          fill="var(--color-paper-deep)"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
        />
        {/* Wood grain (decorative) */}
        {Array.from({ length: 5 }, (_, i) => {
          const ty = RAMP_TOP.y + 38 + i * 42
          if (ty > RAMP_BOT.y - 20) return null
          return (
            <line
              key={`grain-${i}`}
              x1={RAMP_TOP.x + 8}
              y1={ty}
              x2={RAMP_TOP.x + 8 + (RAMP_BOT.x - RAMP_TOP.x) * ((ty - RAMP_TOP.y) / (RAMP_BOT.y - RAMP_TOP.y)) - 16}
              y2={ty}
              stroke="var(--color-graph-ink)"
              strokeOpacity="0.18"
              strokeWidth="0.5"
            />
          )
        })}

        {/* Tick marks along the ramp at equal time intervals (1, 4, 9, 16 — Galileo's law). */}
        {[1, 4, 9, 16].map((n) => {
          const f = n / 16
          const x = RAMP_TOP.x + (RAMP_BOT.x - RAMP_TOP.x) * f
          const y = RAMP_TOP.y + (RAMP_BOT.y - RAMP_TOP.y) * f
          return (
            <g key={`tick-${n}`}>
              <line
                x1={x}
                y1={y - 6}
                x2={x}
                y2={y + 6}
                stroke="var(--color-vermilion)"
                strokeWidth="1"
                strokeOpacity="0.6"
              />
              <text
                x={x - 4}
                y={y - 12}
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="var(--color-vermilion)"
                fillOpacity="0.85"
              >
                {n}
              </text>
            </g>
          )
        })}

        {/* Ramp label */}
        <text x={RAMP_TOP.x - 4} y={RAMP_TOP.y - 10} fontFamily="Georgia, serif" fontStyle="italic" fontSize="12" fill="var(--color-dim)">
          release
        </text>

        {/* The bronze ball */}
        <g>
          <circle cx={ball.x} cy={ball.y} r={BALL_R} fill="#A8651F" stroke="var(--color-graph-ink)" strokeWidth="1.2" />
          {/* Highlight */}
          <circle cx={ball.x - 4} cy={ball.y - 4} r={3.5} fill="#D89A53" opacity="0.85" />
        </g>

        {/* Hint */}
        <text x="62" y={VIEW_H - 56} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          1 : 4 : 9 : 16  —  ODD NUMBERS  ·  GALILEO'S LAW OF FALL
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0 — How fast, right now? Galileo couldn&apos;t answer it.
      </figcaption>
    </figure>
  )
}
