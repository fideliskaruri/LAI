import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { PixelImage } from './PixelGrid'
import {
  CLEAN_IMAGE,
  denoisedImageAt,
  noisyImageAt,
  PIXEL_GRID,
  T_STEPS,
  alphaBarAt,
} from './image'

/**
 * Act 4 — Reverse denoise.
 *
 *  Left  : the noisy image x_t at step t. Slider for t on the left.
 *  Right : the model's predicted clean image — an oracle denoiser (we cheat
 *          because we know the ground truth). A toggle on the right between
 *          "predicted clean image" and "predicted noise epsilon".
 *
 * Co-mutating: the slider on the left updates t; both panes derive from t.
 */

const VIEW_W = 600
const VIEW_H = 480

export interface ReverseState {
  t: number
  mode: 'clean' | 'noise'
}

export const INITIAL_REVERSE: ReverseState = { t: 400, mode: 'clean' }

const SLIDER_Y = VIEW_H - 56
const SLIDER_X_MIN = 60
const SLIDER_X_MAX = VIEW_W - 60
const T_MIN = 1
const T_MAX = T_STEPS

const tToX = (t: number) =>
  SLIDER_X_MIN + ((t - T_MIN) / (T_MAX - T_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const xToT = (x: number) =>
  T_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (T_MAX - T_MIN)

export function LeftPane({
  state,
  onChange,
}: {
  state: ReverseState
  onChange: (s: ReverseState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<number | null>(null)
  const t = state.t

  const setT = useCallback(
    (next: number) => {
      const clamped = Math.max(T_MIN, Math.min(T_MAX, Math.round(next)))
      onChange({ ...state, t: clamped })
    },
    [onChange, state],
  )

  const bind = useDrag(({ first, movement: [mx] }) => {
    if (first) startRef.current = t
    const start = startRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const dxSvg = mx * sx
    const startX = tToX(start)
    const newX = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startX + dxSvg))
    setT(xToT(newX))
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const small = 20
        const large = 100
        const isShift = Math.abs(dx) >= 10
        setT(t + (isShift ? Math.sign(dx) * large : Math.sign(dx) * small))
      },
      [t, setT],
    ),
  )

  const pixels = noisyImageAt(t)
  const handleX = tToX(t)
  const aBar = alphaBarAt(t)
  const signal = Math.sqrt(aBar)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The noisy image at step ${t} — what the denoiser sees as input. Signal share is ${signal.toFixed(2)}.`}
        priority="normal"
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Noisy input at step ${t} of one thousand.`}
      >
        <text
          x={VIEW_W / 2}
          y="46"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          INPUT &middot; x_t (noisy)
        </text>

        <PixelImage pixels={pixels} cx={VIEW_W / 2} cy={220} cell={17} />

        <text
          x={VIEW_W / 2}
          y={360}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="14"
          fill="var(--color-ink)"
        >
          t = {t}
        </text>

        <line
          x1={SLIDER_X_MIN}
          y1={SLIDER_Y}
          x2={SLIDER_X_MAX}
          y2={SLIDER_Y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        {[1, 250, 500, 750, 1000].map((v) => (
          <g key={v}>
            <line x1={tToX(v)} y1={SLIDER_Y - 6} x2={tToX(v)} y2={SLIDER_Y + 6} stroke="var(--color-graph-ink)" strokeWidth="1" />
            <text x={tToX(v)} y={SLIDER_Y + 22} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
              {v}
            </text>
          </g>
        ))}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Diffusion step t. Current value ${t}. Arrow keys to nudge.`}
          aria-valuemin={T_MIN}
          aria-valuemax={T_MAX}
          aria-valuenow={t}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={handleX} cy={SLIDER_Y} r="22" fill="transparent" />
          <circle cx={handleX} cy={SLIDER_Y} r="8" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
        </g>
        <text
          x={SLIDER_X_MIN}
          y={SLIDER_Y - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          DRAG &middot; ARROWS NUDGE &middot; STEP t
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3a &mdash; What the model is given
      </figcaption>
    </figure>
  )
}

export function RightPane({
  state,
  onChange,
}: {
  state: ReverseState
  onChange: (s: ReverseState) => void
}) {
  const { t, mode } = state

  // "predicted noise" = noisy - clean (per pixel); for display, center at 0.5.
  const predNoise = (() => {
    const noisy = noisyImageAt(t)
    const g = PIXEL_GRID
    const out: number[][] = Array.from({ length: g }, () => Array(g).fill(0))
    for (let r = 0; r < g; r++) {
      for (let c = 0; c < g; c++) {
        const epsilon = noisy[r][c] - CLEAN_IMAGE[r][c]
        // map [-1, 1] -> [0, 1] for display
        out[r][c] = Math.max(0, Math.min(1, 0.5 + epsilon * 0.5))
      }
    }
    return out
  })()

  // Predicted clean: oracle denoiser (strength=1) so we recover x_0 exactly.
  const predClean = denoisedImageAt(t, 1)

  const toggleMode = useCallback(() => {
    onChange({ ...state, mode: mode === 'clean' ? 'noise' : 'clean' })
  }, [mode, onChange, state])

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={
          mode === 'clean'
            ? `The model's predicted clean image at step ${t} — what it thinks x_0 looks like, given only x_t.`
            : `The model's predicted noise at step ${t} — the per-pixel epsilon that was added during the forward process.`
        }
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Right pane: the model's ${mode === 'clean' ? 'predicted clean image' : 'predicted noise field'} at step ${t}.`}
      >
        <text
          x={VIEW_W / 2}
          y="46"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          {mode === 'clean' ? 'PREDICTED CLEAN x₀' : 'PREDICTED NOISE ε'}
        </text>

        <PixelImage pixels={mode === 'clean' ? predClean : predNoise} cx={VIEW_W / 2} cy={220} cell={17} />

        <text
          x={VIEW_W / 2}
          y={360}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          {mode === 'clean' ? 'the recovered arrow' : 'the noise that was added'}
        </text>

        {/* Toggle button */}
        <g
          tabIndex={0}
          role="button"
          aria-label={`Toggle output. Currently showing ${mode === 'clean' ? 'predicted clean image' : 'predicted noise'}. Press to switch.`}
          onClick={toggleMode}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggleMode()
            }
          }}
          style={{ cursor: 'pointer' }}
          className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
        >
          <rect
            x={VIEW_W / 2 - 100}
            y={400}
            width="200"
            height="32"
            rx="4"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="1.2"
          />
          <text
            x={VIEW_W / 2}
            y={420}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="11"
            letterSpacing="0.22em"
            fill="var(--color-vermilion)"
          >
            SHOW {mode === 'clean' ? 'ε  (NOISE)' : 'x₀  (CLEAN)'}
          </text>
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 16}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          {mode === 'clean' ? 'one prediction either gives you the other' : 'subtract ε from x_t, you get x₀'}
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3b &mdash; What the model is asked to produce
      </figcaption>
    </figure>
  )
}
