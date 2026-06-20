import { useMemo } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { makeCloud, type Pt } from './cloud'

/**
 * Act 1 — A correlated 2D cloud. Static. Left pane shows the scatter on
 * original ink axes; right pane lists the first batch of (x, y) coordinates
 * in JetBrains Mono, as the kind of raw table the computer would see.
 *
 * Independent sync. Neither pane is interactive — this is data-as-data.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 60

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

function toSvg(mx: number, my: number) {
  return { x: ORIGIN_X + mx * UNIT, y: ORIGIN_Y - my * UNIT }
}

export function CorrelatedCloudLeftPane() {
  const points = useMemo<Pt[]>(() => makeCloud(180, 0xa901), [])

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A cloud of ${points.length} two-dimensional points, stretched along a tilted axis from lower-left to upper-right. The points are correlated: when x is large, y tends to be large.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A scatter plot of ${points.length} correlated two-dimensional points on ink axes. The cloud is stretched along a diagonal from lower-left to upper-right.`}
      >
        <ReferenceGrid />
        <Axes />

        {points.map((p, i) => {
          const sv = toSvg(p.x, p.y)
          return (
            <circle key={i} cx={sv.x} cy={sv.y} r="2.6" fill="var(--color-ink)" fillOpacity="0.6" />
          )
        })}

        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            DATA  ·  N = {points.length}
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
          ORIGINAL AXES  ·  TWO MEASURED FEATURES
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1a &mdash; A correlated cloud
      </figcaption>
    </figure>
  )
}

export function CorrelatedCloudRightPane() {
  const points = useMemo<Pt[]>(() => makeCloud(180, 0xa901).slice(0, 16), [])

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The first sixteen points of the cloud, written as raw coordinates — the table the computer actually sees."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A list of x,y coordinate pairs in monospaced type, representing the raw observations in the cloud."
      >
        {/* Page background */}
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="transparent" />

        {/* Header */}
        <text
          x="60"
          y="60"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          OBSERVATIONS  ·  FIRST 16 OF {180}
        </text>

        {/* Column headers */}
        <text x="60" y="92" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
          i
        </text>
        <text x="160" y="92" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
          x
        </text>
        <text x="320" y="92" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-dim)">
          y
        </text>

        <line x1="60" y1="100" x2="480" y2="100" stroke="var(--color-graph-fade)" strokeWidth="0.6" />

        {points.map((p, i) => (
          <g key={i} transform={`translate(0, ${122 + i * 20})`}>
            <text
              x="60"
              fontFamily="JetBrains Mono, monospace"
              fontSize="13"
              fill="var(--color-dim)"
            >
              {String(i + 1).padStart(2, ' ')}
            </text>
            <text
              x="140"
              fontFamily="JetBrains Mono, monospace"
              fontSize="13"
              fill="var(--color-ink)"
            >
              {fmt(p.x)}
            </text>
            <text
              x="300"
              fontFamily="JetBrains Mono, monospace"
              fontSize="13"
              fill="var(--color-ink)"
            >
              {fmt(p.y)}
            </text>
          </g>
        ))}

        <text
          x="60"
          y={VIEW_H - 26}
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-dim)"
        >
          &hellip;
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1b &mdash; The same cloud, as numbers
      </figcaption>
    </figure>
  )
}

function ReferenceGrid() {
  return (
    <>
      {Array.from({ length: 11 }, (_, i) => {
        const x = ORIGIN_X + (i - 5) * UNIT
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
