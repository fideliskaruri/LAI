import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { VIEW_W, VIEW_H, ppoReward, ppoKl, clamp, fmt2 } from './rlhf'

/**
 * Act 6 — the KL constraint.
 *
 *  Left  : a horizontal slider for β, the KL-penalty coefficient. Range
 *          0 to 0.5. A mini reward / KL strip shows the saturating value
 *          of each at the current β.
 *  Right : a sample response card. At β=0, the model exploits the reward
 *          model and emits high-scoring gibberish. At β=0.5, it stays close
 *          to the base model and gives a well-behaved answer.
 *
 * Left-drives-right: β picks which response card is shown on the right.
 */

export interface KlState {
  beta: number
  interacting: boolean
}

export const INITIAL_KL: KlState = { beta: 0.18, interacting: false }

const B_MIN = 0
const B_MAX = 0.5

const SLIDER_X_MIN = 80
const SLIDER_X_MAX = VIEW_W - 80
const SLIDER_Y = 250

const bToSliderX = (b: number) =>
  SLIDER_X_MIN + ((b - B_MIN) / (B_MAX - B_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const sliderXToB = (x: number) =>
  B_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (B_MAX - B_MIN)

/* ============================================================== */
/* LEFT PANE — β slider + mini reward / KL                         */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: KlState
  onChange: (s: KlState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<number | null>(null)

  const update = useCallback(
    (b: number, interacting: boolean) =>
      onChange({ beta: clamp(b, B_MIN, B_MAX), interacting }),
    [onChange],
  )

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startRef.current = state.beta
    const start = startRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startX = bToSliderX(start)
    update(sliderXToB(startX + mx * sx), !last)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? 0.1 : 0.02
        update(state.beta + Math.sign(dx) * step, false)
      },
      [state.beta, update],
    ),
  )

  const rewardAt = ppoReward(40, 40, state.beta)
  const klAt = ppoKl(40, 40, state.beta)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A slider for the KL penalty coefficient beta. Currently ${fmt2(state.beta).trim()}. At zero, the model is free to chase the reward as far as it can. At one-half, the leash is tight. The final reward at this beta is ${fmt2(rewardAt).trim()}; the final KL is ${fmt2(klAt).trim()}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`KL penalty slider. Beta ${fmt2(state.beta).trim()}. Final reward ${fmt2(rewardAt).trim()}. Final KL ${fmt2(klAt).trim()}.`}
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />

        <text
          x={VIEW_W / 2}
          y="36"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          A LEASH ON THE DRIFT
        </text>

        {/* β readout */}
        <text
          x={VIEW_W / 2}
          y={108}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          KL PENALTY · β
        </text>
        <text
          x={VIEW_W / 2}
          y={154}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="44"
          fontWeight="600"
          fill="var(--color-vermilion)"
        >
          {state.beta.toFixed(2)}
        </text>

        {/* Slider track */}
        <line
          x1={SLIDER_X_MIN}
          y1={SLIDER_Y}
          x2={SLIDER_X_MAX}
          y2={SLIDER_Y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map((v) => (
          <g key={v}>
            <line
              x1={bToSliderX(v)}
              y1={SLIDER_Y - 6}
              x2={bToSliderX(v)}
              y2={SLIDER_Y + 6}
              stroke="var(--color-graph-ink)"
              strokeWidth="1"
            />
            <text
              x={bToSliderX(v)}
              y={SLIDER_Y + 22}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {v.toFixed(2)}
            </text>
          </g>
        ))}
        {/* End-of-track labels */}
        <text
          x={SLIDER_X_MIN}
          y={SLIDER_Y - 16}
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          NO LEASH
        </text>
        <text
          x={SLIDER_X_MAX}
          y={SLIDER_Y - 16}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TIGHT LEASH
        </text>

        {/* Handle */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`KL penalty beta. Current ${fmt2(state.beta).trim()}.`}
          aria-valuemin={B_MIN}
          aria-valuemax={B_MAX}
          aria-valuenow={Number(state.beta.toFixed(2))}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={bToSliderX(state.beta)} cy={SLIDER_Y} r="22" fill="transparent" />
          <circle
            cx={bToSliderX(state.beta)}
            cy={SLIDER_Y}
            r="9"
            fill="var(--color-vermilion)"
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
        </g>

        {/* Mini reward / KL strips */}
        <g transform={`translate(80, 320)`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-vermilion)"
          >
            FINAL REWARD
          </text>
          <rect x="0" y="8" width={VIEW_W - 160} height="14" fill="var(--color-graph-fade)" rx="2" />
          <rect
            x="0"
            y="8"
            width={Math.max(2, (VIEW_W - 160) * rewardAt)}
            height="14"
            fill="var(--color-vermilion)"
            rx="2"
          />
          <text
            x={VIEW_W - 160}
            y={18}
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-vermilion)"
          >
            {fmt2(rewardAt).trim()}
          </text>
        </g>

        <g transform={`translate(80, 376)`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-graph-ink)"
          >
            FINAL KL FROM BASE
          </text>
          <rect x="0" y="8" width={VIEW_W - 160} height="14" fill="var(--color-graph-fade)" rx="2" />
          <rect
            x="0"
            y="8"
            width={Math.max(2, (VIEW_W - 160) * Math.min(1, klAt / 4))}
            height="14"
            fill="var(--color-graph-ink)"
            rx="2"
          />
          <text
            x={VIEW_W - 160}
            y={18}
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-graph-ink)"
          >
            {fmt2(klAt).trim()}
          </text>
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 14}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG · ARROWS NUDGE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6a &mdash; The penalty that holds the line
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — model output at this β                             */
/* ============================================================== */

const HACK_REPLY =
  '!!!!! HELPFUL HELPFUL HELPFUL HELPFUL HELPFUL HELPFUL HELPFUL HELPFUL HELPFUL HELPFUL ✓ ★ ★ ★ ★ ★ I am the most helpful and the most safe and the most truthful of all assistants ever made.'
const TIGHT_REPLY =
  'A boil-and-bag rice usually wants 1¼ cups of water for every cup of rice. Bring it to a boil, lower the heat, cover, and leave it for 18 minutes. Don’t lift the lid.'
const HEALTHY_REPLY =
  'For one cup of long-grain rice, use about 1¾ cups of water. Bring it to the boil, drop to a low simmer, cover, and leave it alone for 18 minutes. Then take it off the heat and let it rest 5 minutes before fluffing.'

function pickReply(beta: number): { text: string; tag: string; tagColor: string } {
  if (beta < 0.04)
    return {
      text: HACK_REPLY,
      tag: 'REWARD HACKED · HIGH SCORE, NO SENSE',
      tagColor: '#A8392C',
    }
  if (beta > 0.32)
    return {
      text: TIGHT_REPLY,
      tag: 'TIGHT LEASH · SAFE, A LITTLE FLAT',
      tagColor: 'var(--color-dim)',
    }
  return {
    text: HEALTHY_REPLY,
    tag: 'HEALTHY · ON TASK, ON TONE',
    tagColor: 'var(--color-vermilion)',
  }
}

export function RightPane({ state }: { state: KlState }) {
  const reply = pickReply(state.beta)
  const lines = wrap(reply.text, VIEW_W - 140, 7.4)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The model's reply to: how do I cook rice? At beta equals ${fmt2(state.beta).trim()}, ${reply.tag.toLowerCase()}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Sample reply at beta ${fmt2(state.beta).trim()}. ${reply.tag}.`}
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="var(--color-cream)" />

        <text
          x={VIEW_W / 2}
          y="36"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ONE PROMPT · THE LEASH'S EFFECT
        </text>

        {/* Tag */}
        <text
          x={VIEW_W / 2}
          y="76"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill={reply.tagColor}
        >
          {reply.tag}
        </text>

        {/* Card */}
        <rect
          x="40"
          y="98"
          width={VIEW_W - 80}
          height={310}
          fill="#f6f1e7"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x="60"
          y="124"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          PROMPT
        </text>
        <text
          x="60"
          y="146"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          How do I cook rice?
        </text>

        <line
          x1="60"
          y1="170"
          x2={VIEW_W - 60}
          y2="170"
          stroke="var(--color-graph-fade)"
          strokeWidth="0.8"
        />

        <text
          x="60"
          y="192"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill={reply.tagColor}
        >
          MODEL REPLY · β = {state.beta.toFixed(2)}
        </text>

        {lines.map((line, i) => (
          <text
            key={i}
            x="60"
            y={216 + i * 18}
            fontFamily="Source Serif 4, Georgia, serif"
            fontSize="13"
            fill="var(--color-ink)"
          >
            {line}
          </text>
        ))}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 14}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          a leash too loose and a leash too tight
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6b &mdash; What the slider buys you
      </figcaption>
    </figure>
  )
}

/** Naive word-wrap by character count for SVG text. */
function wrap(text: string, width: number, charPx: number): string[] {
  const lines: string[] = []
  for (const raw of text.split('\n')) {
    const words = raw.split(' ')
    let cur = ''
    const maxChars = Math.floor(width / charPx)
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > maxChars) {
        lines.push(cur)
        cur = w
      } else {
        cur = (cur + ' ' + w).trim()
      }
    }
    if (cur) lines.push(cur)
  }
  return lines.slice(0, 10)
}
