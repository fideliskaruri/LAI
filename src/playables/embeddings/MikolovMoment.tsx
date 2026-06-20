import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Cold-open for embeddings. Two static "documents" stacked diagonally:
 *
 *   - Top-left: a 1980s notebook page sketching Brown clustering — words
 *     grouped into cluster IDs (one integer per word). The previous era.
 *   - Bottom-right: the 2013 arXiv title page of Mikolov et al.,
 *     "Efficient Estimation of Word Representations in Vector Space" —
 *     the paper that swapped cluster IDs for dense vectors.
 *
 * Read-only. The emotional beat is the prose. The visual just stages the
 * two documents side by side so the reader sees the era change.
 */
export function MikolovMoment() {
  // Brown clustering: a few words and their integer cluster IDs.
  // Hand-tuned to feel like a 1992 IBM tech memo notebook.
  const brownRows = [
    { word: 'king', id: '0011' },
    { word: 'queen', id: '0011' },
    { word: 'prince', id: '0011' },
    { word: 'duke', id: '0011' },
    { word: 'man', id: '0100' },
    { word: 'woman', id: '0100' },
    { word: 'boy', id: '0101' },
    { word: 'walk', id: '1010' },
    { word: 'run', id: '1010' },
  ]

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="Two stacked documents. The top is a 1980s notebook page showing Brown clustering — each word labelled with a four-bit cluster ID. The bottom is the 2013 arXiv title page of Mikolov et al., Efficient Estimation of Word Representations in Vector Space — the word2vec paper."
        priority="normal"
      />
      <svg
        viewBox="0 0 600 480"
        className="w-full h-auto"
        role="img"
        aria-label="A 1980s notebook page sketching Brown clustering, behind a 2013 arXiv title page of Mikolov's word2vec paper."
      >
        {/* Brown notebook page (back, rotated slightly) */}
        <g transform="translate(40, 28) rotate(-3 140 130)">
          <rect
            width="280"
            height="280"
            fill="var(--color-paper)"
            stroke="var(--color-graph-ink)"
            strokeWidth="1"
          />
          {/* ruled lines */}
          {Array.from({ length: 11 }, (_, i) => (
            <line
              key={i}
              x1="10"
              y1={40 + i * 22}
              x2="270"
              y2={40 + i * 22}
              stroke="var(--color-graph-fade)"
              strokeWidth="0.6"
            />
          ))}
          {/* margin line */}
          <line
            x1="36"
            y1="10"
            x2="36"
            y2="270"
            stroke="var(--color-vermilion)"
            strokeWidth="0.5"
            strokeOpacity="0.5"
          />
          {/* header */}
          <text
            x="46"
            y="26"
            fontFamily="Georgia, serif"
            fontSize="11"
            fontStyle="italic"
            fill="var(--color-paper-ink)"
          >
            Brown et al. — IBM, 1992
          </text>
          <text
            x="46"
            y="38"
            fontFamily="Georgia, serif"
            fontSize="9"
            fontStyle="italic"
            fill="var(--color-dim)"
          >
            class-based n-gram model
          </text>
          {/* two columns: word / cluster id */}
          {brownRows.map((r, i) => (
            <g key={i}>
              <text
                x="46"
                y={60 + i * 22}
                fontFamily="Georgia, serif"
                fontSize="13"
                fill="var(--color-paper-ink)"
              >
                {r.word}
              </text>
              <text
                x="200"
                y={60 + i * 22}
                fontFamily="JetBrains Mono, monospace"
                fontSize="12"
                fill="var(--color-vermilion)"
              >
                {r.id}
              </text>
            </g>
          ))}
        </g>

        {/* arXiv title page (front, slightly off-axis) */}
        <g transform="translate(255, 165) rotate(4 160 140)">
          <rect
            width="320"
            height="295"
            fill="var(--color-paper)"
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
          {/* arXiv masthead */}
          <text
            x="20"
            y="26"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-dim)"
          >
            arXiv:1301.3781v3 [cs.CL]   7 Sep 2013
          </text>
          <line
            x1="20"
            y1="34"
            x2="300"
            y2="34"
            stroke="var(--color-graph-ink)"
            strokeWidth="0.5"
          />
          {/* title */}
          <text
            x="160"
            y="68"
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize="15"
            fontWeight="700"
            fill="var(--color-paper-ink)"
          >
            Efficient Estimation of Word
          </text>
          <text
            x="160"
            y="88"
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize="15"
            fontWeight="700"
            fill="var(--color-paper-ink)"
          >
            Representations in Vector Space
          </text>
          {/* authors */}
          <text
            x="160"
            y="116"
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize="11"
            fontStyle="italic"
            fill="var(--color-paper-ink)"
          >
            Tomas Mikolov, Kai Chen,
          </text>
          <text
            x="160"
            y="130"
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize="11"
            fontStyle="italic"
            fill="var(--color-paper-ink)"
          >
            Greg Corrado, Jeffrey Dean
          </text>
          <text
            x="160"
            y="146"
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize="9"
            fill="var(--color-dim)"
          >
            Google Inc., Mountain View, CA
          </text>

          {/* Abstract block — abstract line */}
          <text
            x="20"
            y="178"
            fontFamily="Georgia, serif"
            fontSize="10"
            fontWeight="700"
            fill="var(--color-paper-ink)"
          >
            Abstract
          </text>
          {Array.from({ length: 6 }, (_, i) => (
            <line
              key={i}
              x1="20"
              y1={194 + i * 12}
              x2={300 - ((i * 13) % 70)}
              y2={194 + i * 12}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.5"
              strokeOpacity="0.6"
            />
          ))}

          {/* highlighted equation */}
          <rect
            x="50"
            y="270"
            width="220"
            height="18"
            fill="var(--color-vermilion)"
            fillOpacity="0.16"
          />
          <text
            x="160"
            y="284"
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize="12"
            fontStyle="italic"
            fill="var(--color-paper-ink)"
          >
            king − man + woman ≈ queen
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 0 — Brown clusters · 1992 → word2vec · 2013
      </figcaption>
    </figure>
  )
}
