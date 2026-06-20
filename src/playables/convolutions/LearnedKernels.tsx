import { useCallback, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  IMG_SIZE,
  IMAGE_THREE,
  KERNELS,
  type KernelId,
  convolve,
  presentFeatureMap,
  pixelFill,
  featureFill,
} from './conv'

/**
 * Act 5 — kernels learn what matters.
 *
 *  Left  : the small image, plus a row of four toggle chips below it — Sobel
 *          vertical, Sobel horizontal, blur, sharpen. Whichever is active is
 *          shown as a 3×3 weight grid above the image.
 *  Right : the resulting feature map for the selected kernel. Each kernel
 *          highlights a different aspect of the image.
 *
 * Co-mutating: the selected KernelId drives both panes.
 */

export interface LearnedKernelsState {
  kernelId: KernelId
  interacting: boolean
}

export const INITIAL_LEARNED_KERNELS: LearnedKernelsState = {
  kernelId: 'edge-vertical',
  interacting: false,
}

const PAD = 50
const GRID_W = VIEW_W - 2 * PAD
const CELL = GRID_W / IMG_SIZE
const GRID_TOP = 110

const TOGGLE_Y = GRID_TOP + GRID_W + 40
const TOGGLE_W = (VIEW_W - 2 * PAD) / 4

/* ============================================================== */
/* LEFT PANE — image + kernel toggles                              */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: LearnedKernelsState
  onChange: (s: LearnedKernelsState) => void
}) {
  const toggleRowRef = useRef<SVGGElement | null>(null)

  const setKernel = useCallback(
    (id: KernelId) => onChange({ kernelId: id, interacting: false }),
    [onChange],
  )

  useKeyNudge(
    toggleRowRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const idx = KERNELS.findIndex((k) => k.id === state.kernelId)
        const next = (idx + Math.sign(dx) + KERNELS.length) % KERNELS.length
        setKernel(KERNELS[next].id)
      },
      [state.kernelId, setKernel],
    ),
  )

  const active = KERNELS.find((k) => k.id === state.kernelId) ?? KERNELS[0]
  const K = active.K

  // Kernel mini grid in the upper-left corner of the canvas.
  const MINI = 20
  const MINI_LEFT = 50
  const MINI_TOP = 50

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The same image, four kernel choices. Currently selected: ${active.name}. Tap a chip below or use arrow keys to cycle.`}
        priority="high"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Image of a digit with four kernel choices. Active: ${active.name}.`}
      >
        <text
          x={VIEW_W / 2}
          y="24"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ONE IMAGE · MANY DETECTORS
        </text>

        {/* Mini kernel grid (current K) */}
        <text
          x={MINI_LEFT}
          y={MINI_TOP - 8}
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ACTIVE KERNEL K
        </text>
        {K.map((row, r) =>
          row.map((v, c) => (
            <g key={`k-${r}-${c}`}>
              <rect
                x={MINI_LEFT + c * MINI}
                y={MINI_TOP + r * MINI}
                width={MINI}
                height={MINI}
                fill={
                  v > 0 ? '#fff0e7' : v < 0 ? '#f0eee9' : 'var(--color-cream)'
                }
                stroke="var(--color-vermilion)"
                strokeWidth="1"
              />
              <text
                x={MINI_LEFT + c * MINI + MINI / 2}
                y={MINI_TOP + r * MINI + MINI / 2 + 3}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="8"
                fill={
                  v > 0
                    ? 'var(--color-vermilion)'
                    : v < 0
                      ? 'var(--color-graph-ink)'
                      : 'var(--color-dim)'
                }
              >
                {fmtCell(v)}
              </text>
            </g>
          )),
        )}

        {/* Image */}
        {IMAGE_THREE.map((row, r) =>
          row.map((v, c) => (
            <rect
              key={`p-${r}-${c}`}
              x={PAD + c * CELL}
              y={GRID_TOP + r * CELL}
              width={CELL}
              height={CELL}
              fill={pixelFill(v)}
              stroke="var(--color-graph-fade)"
              strokeWidth="0.5"
            />
          )),
        )}

        {/* Toggle chips */}
        <g ref={toggleRowRef} tabIndex={0} role="radiogroup" aria-label="Kernel choice">
          {KERNELS.map((k, i) => {
            const isActive = k.id === state.kernelId
            return (
              <g
                key={k.id}
                onClick={() => setKernel(k.id)}
                style={{ cursor: 'pointer' }}
                role="radio"
                aria-checked={isActive}
              >
                <rect
                  x={PAD + i * TOGGLE_W + 6}
                  y={TOGGLE_Y}
                  width={TOGGLE_W - 12}
                  height={42}
                  fill={isActive ? 'var(--color-vermilion)' : 'var(--color-cream)'}
                  stroke={isActive ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
                  strokeWidth="1.2"
                  rx="3"
                />
                <text
                  x={PAD + i * TOGGLE_W + TOGGLE_W / 2}
                  y={TOGGLE_Y + 18}
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="9"
                  letterSpacing="0.18em"
                  fill={isActive ? 'var(--color-cream)' : 'var(--color-dim)'}
                >
                  KERNEL {i + 1}
                </text>
                <text
                  x={PAD + i * TOGGLE_W + TOGGLE_W / 2}
                  y={TOGGLE_Y + 34}
                  textAnchor="middle"
                  fontFamily="Source Serif 4, Georgia, serif"
                  fontStyle="italic"
                  fontSize="12"
                  fill={isActive ? 'var(--color-cream)' : 'var(--color-ink)'}
                >
                  {k.short}
                </text>
              </g>
            )
          })}
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 18}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TAP A CHIP · ARROWS CYCLE · WATCH RIGHT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4a &mdash; Four little detectors
      </figcaption>
    </figure>
  )
}

function fmtCell(v: number): string {
  if (v === 0) return '0'
  if (Math.abs(v) >= 1) return String(v)
  // For fractional (blur) — keep readable.
  return v.toFixed(2).replace(/^0\./, '.')
}

/* ============================================================== */
/* RIGHT PANE — feature map for active kernel                      */
/* ============================================================== */

export function RightPane({ state }: { state: LearnedKernelsState }) {
  const active = KERNELS.find((k) => k.id === state.kernelId) ?? KERNELS[0]
  const raw = convolve(IMAGE_THREE, active.K)
  const fmap = presentFeatureMap(raw, active.scale ?? 1, active.bias ?? 0)

  const FMAP_SIZE = fmap.length
  const FCELL = GRID_W / FMAP_SIZE

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The feature map for the ${active.name} kernel. Each kernel emphasises a different aspect of the image — vertical strokes, horizontal strokes, smoothness, or sharpness.`}
        priority="high"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Feature map for the ${active.name} kernel applied to the digit image.`}
      >
        <text
          x={VIEW_W / 2}
          y="24"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          FEATURE MAP · {active.short.toUpperCase()}
        </text>

        {/* Feature-map cells */}
        {fmap.map((row, r) =>
          row.map((v, c) => (
            <rect
              key={`f-${r}-${c}`}
              x={PAD + c * FCELL}
              y={GRID_TOP + r * FCELL}
              width={FCELL}
              height={FCELL}
              fill={featureFill(v)}
              stroke="var(--color-graph-fade)"
              strokeWidth="0.5"
            />
          )),
        )}

        {/* What this kernel highlights */}
        <g transform={`translate(${PAD}, ${GRID_TOP + GRID_W + 40})`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            WHAT IT HIGHLIGHTS
          </text>
          <text
            y="22"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-vermilion)"
          >
            {whatItHighlights(active.id)}
          </text>
          <text
            y="46"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="13"
            fill="var(--color-dim)"
          >
            in a CNN, these weights are learned by gradient descent.
          </text>
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 18}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          HAND-DESIGNED HERE · LEARNED IN A REAL NETWORK
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4b &mdash; Each detector tells a different story
      </figcaption>
    </figure>
  )
}

function whatItHighlights(id: KernelId): string {
  switch (id) {
    case 'edge-vertical':
      return 'vertical contrast — left dark, right bright'
    case 'edge-horizontal':
      return 'horizontal contrast — top dark, bottom bright'
    case 'blur':
      return 'local average — softens, removes noise'
    case 'sharpen':
      return 'centre minus neighbours — accentuates detail'
  }
}
