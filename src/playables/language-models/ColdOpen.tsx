import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H } from './lm'

/**
 * Act 0 — cold open. Shannon · Bell Labs · 1948.
 *
 *  Left  : a stylised page from Shannon's *A Mathematical Theory of
 *          Communication* (Bell Sys Tech J, Oct 1948), with the famous
 *          bigram-statistics passage highlighted.
 *  Right : a short visual timeline from Shannon n-grams 1948 to ChatGPT 2022.
 *
 * Static.
 */

interface TimelineStop {
  y: number
  year: string
  label: string
  detail: string
  accent?: boolean
}

const TIMELINE: TimelineStop[] = [
  { y: 96, year: '1948', label: 'Shannon n-grams', detail: 'Bell Labs', accent: true },
  { y: 142, year: '1992', label: 'Brown clusters', detail: 'IBM Research' },
  { y: 178, year: '1993', label: 'IBM translation models', detail: 'word-alignment' },
  { y: 214, year: '1998', label: 'SRI-LM toolkit', detail: 'smoothed n-grams' },
  { y: 250, year: '2003', label: 'Bengio neural LM', detail: 'JMLR' },
  { y: 286, year: '2013', label: 'word2vec', detail: 'Mikolov', accent: true },
  { y: 322, year: '2019', label: 'GPT-2', detail: 'OpenAI' },
  { y: 360, year: 'Nov 2022', label: 'ChatGPT', detail: 'public release', accent: true },
]

export function LeftPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A facsimile of the title page of Claude Shannon's 1948 paper A Mathematical Theory of Communication, published in the Bell System Technical Journal in October 1948. A passage is highlighted in vermilion: the famous bigram-statistics demonstration in which Shannon hand-built a Markov chain from English letter frequencies and showed that it produced fragments that read like garbled English."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A facsimile of Shannon's 1948 paper, with the bigram-entropy passage highlighted."
      >
        {/* Paper stock */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="var(--color-paper)"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* Masthead */}
        <text
          x={VIEW_W / 2}
          y="82"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fontWeight="600"
          fill="var(--color-paper-ink)"
        >
          The Bell System Technical Journal
        </text>
        <line
          x1="80"
          y1="96"
          x2={VIEW_W - 80}
          y2="96"
          stroke="var(--color-paper-ink)"
          strokeWidth="0.6"
        />
        <text
          x="80"
          y="114"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          VOL. XXVII · NO. 4 · OCTOBER 1948
        </text>
        <text
          x={VIEW_W - 80}
          y="114"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          PP. 623–656
        </text>

        {/* Title */}
        <text
          x="80"
          y="158"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="22"
          fontWeight="600"
          fill="var(--color-paper-ink)"
        >
          A Mathematical Theory
        </text>
        <text
          x="80"
          y="184"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="22"
          fontWeight="600"
          fill="var(--color-paper-ink)"
        >
          of Communication
        </text>

        <text
          x="80"
          y="216"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-paper-ink)"
        >
          by C. E. Shannon
        </text>

        {/* Highlighted passage */}
        <rect
          x="74"
          y="252"
          width={VIEW_W - 148}
          height="116"
          fill="var(--color-vermilion)"
          fillOpacity="0.08"
          stroke="var(--color-vermilion)"
          strokeWidth="0.6"
          strokeDasharray="3 3"
        />
        <text
          x="84"
          y="276"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          “One might try to approximate English text by generating
        </text>
        <text
          x="84"
          y="294"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          successive letters with the appropriate digram or trigram
        </text>
        <text
          x="84"
          y="312"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-paper-ink)"
        >
          frequencies … the result is text such as
        </text>

        <text
          x="84"
          y="338"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          IN NO IST LAT WHEY CRATICT FROURE
        </text>
        <text
          x="84"
          y="356"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          BIRS GROCID PONDENOME OF DEMONSTURES
        </text>

        {/* Footer */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 64}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          the bigram model, July &amp; October 1948
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0a &mdash; Shannon, predicting one letter at a time
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A vertical timeline of language modelling from 1948 to 2022. Shannon's n-grams in 1948. Brown clusters at IBM in 1992. IBM translation models in 1993. The SRI-LM toolkit in the late 1990s. Bengio's neural language model in 2003. word2vec in 2013. GPT-2 in 2019. ChatGPT in November 2022. Three quarters of a century of work."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A vertical timeline from Shannon n-grams 1948 to ChatGPT November 2022."
      >
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="70"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          SEVENTY-FOUR YEARS
        </text>

        {/* Spine */}
        <line
          x1="140"
          y1="92"
          x2="140"
          y2={TIMELINE[TIMELINE.length - 1].y + 8}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />

        {TIMELINE.map((s, i) => (
          <g key={i}>
            <circle
              cx="140"
              cy={s.y}
              r={s.accent ? 5 : 3.5}
              fill={s.accent ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
            />
            <text
              x="120"
              y={s.y + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill={s.accent ? 'var(--color-vermilion)' : 'var(--color-dim)'}
            >
              {s.year}
            </text>
            <text
              x="156"
              y={s.y + 2}
              fontFamily="Source Serif 4, Georgia, serif"
              fontSize="13"
              fontWeight={s.accent ? 600 : 400}
              fill={s.accent ? 'var(--color-ink)' : 'var(--color-ink)'}
            >
              {s.label}
            </text>
            <text
              x="156"
              y={s.y + 18}
              fontFamily="Source Serif 4, Georgia, serif"
              fontStyle="italic"
              fontSize="11"
              fill="var(--color-dim)"
            >
              {s.detail}
            </text>
          </g>
        ))}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 64}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          one problem, predicted one token at a time
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0b &mdash; The long arc from bigrams to chat
      </figcaption>
    </figure>
  )
}
