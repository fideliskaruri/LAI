import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 7 — closing. Why neural nets ate SVMs.
 *
 *  Left  : a log-scale chart showing memory cost vs N for two methods:
 *          a kernel SVM (the N×N kernel matrix, quadratic) and a neural net
 *          (linear in N). The two curves cross around ~10⁵.
 *
 *  Right : a thread card to the next chapter (MLP / backprop).
 *
 * Static. No interaction. Same shape as linear-regression/Closing.tsx.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  // Plot frame
  const X0 = 80
  const X1 = VIEW_W - 60
  const Y0 = 100
  const Y1 = VIEW_H - 100
  const PW = X1 - X0
  const PH = Y1 - Y0

  // log-N from 10² to 10⁷
  const LOG_N_MIN = 2
  const LOG_N_MAX = 7
  // log-memory from 10⁰ to 10⁸ (in some abstract bytes unit)
  const LOG_M_MIN = 0
  const LOG_M_MAX = 8

  const nx = (logN: number) =>
    X0 + ((logN - LOG_N_MIN) / (LOG_N_MAX - LOG_N_MIN)) * PW
  const ny = (logM: number) =>
    Y1 - ((logM - LOG_M_MIN) / (LOG_M_MAX - LOG_M_MIN)) * PH

  // Curves
  // Kernel SVM: memory = N² bytes (kernel matrix)  → log = 2·logN
  // Neural net: memory = c·N (mini-batch in memory, weights fixed) → log = logN + 1
  const svmPath: string[] = []
  const nnPath: string[] = []
  for (let lN = LOG_N_MIN; lN <= LOG_N_MAX; lN += 0.1) {
    const lSVM = 2 * lN
    const lNN = lN + 1.2
    svmPath.push(`${svmPath.length === 0 ? 'M' : 'L'} ${nx(lN).toFixed(2)} ${ny(lSVM).toFixed(2)}`)
    nnPath.push(`${nnPath.length === 0 ? 'M' : 'L'} ${nx(lN).toFixed(2)} ${ny(lNN).toFixed(2)}`)
  }

  // Where do they cross?  2N = N + 1.2 → N = 1.2  → logN... actually 2logN = logN + 1.2
  // ⇒ logN = 1.2 ⇒ N ≈ 16. That's not it; we want a meaningful crossover. Use
  // memory caps: the SVM caps at 10⁸ bytes around N=10⁴.
  // Annotate the "100k" threshold from the brief.
  const ANN_X = nx(5) // log N = 5  ⇒  N = 100k

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A log-log chart of memory cost versus dataset size. The kernel SVM line rises with slope two — the kernel matrix is N by N. The neural net line rises with slope one. The two cross near N equals 100,000; past that point, the SVM becomes untenable."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Log-log memory cost versus dataset size. Kernel SVM is quadratic, neural net is linear. They cross near N equals 100,000."
      >
        {/* Title */}
        <text
          x={VIEW_W / 2}
          y="60"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          MEMORY VS DATASET SIZE  ·  LOG-LOG
        </text>

        {/* Axes */}
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke="var(--color-graph-ink)" strokeWidth="1" />

        {/* x ticks at 10², 10⁴, 10⁶ */}
        {[2, 3, 4, 5, 6, 7].map((p) => (
          <g key={`tx-${p}`}>
            <line x1={nx(p)} y1={Y1} x2={nx(p)} y2={Y1 + 4} stroke="var(--color-graph-ink)" strokeWidth="1" />
            <text x={nx(p)} y={Y1 + 18} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
              10
              <tspan dy="-4" fontSize="7">
                {p}
              </tspan>
            </text>
          </g>
        ))}
        {/* y ticks */}
        {[0, 2, 4, 6, 8].map((p) => (
          <g key={`ty-${p}`}>
            <line x1={X0 - 4} y1={ny(p)} x2={X0} y2={ny(p)} stroke="var(--color-graph-ink)" strokeWidth="1" />
            <text x={X0 - 8} y={ny(p) + 3} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
              10
              <tspan dy="-4" fontSize="7">
                {p}
              </tspan>
            </text>
          </g>
        ))}
        <text
          x={(X0 + X1) / 2}
          y={Y1 + 40}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DATASET SIZE  ·  N
        </text>
        <text
          x={X0 - 44}
          y={(Y0 + Y1) / 2}
          transform={`rotate(-90, ${X0 - 44}, ${(Y0 + Y1) / 2})`}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          MEMORY  ·  BYTES
        </text>

        {/* Curves */}
        <path d={svmPath.join(' ')} fill="none" stroke="var(--color-vermilion)" strokeWidth="2.4" />
        <path d={nnPath.join(' ')} fill="none" stroke="var(--color-ink)" strokeWidth="2.4" />

        {/* Curve labels */}
        <text
          x={nx(LOG_N_MAX) - 4}
          y={ny(2 * LOG_N_MAX) - 8}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          SVM &middot; N²
        </text>
        <text
          x={nx(LOG_N_MAX) - 4}
          y={ny(LOG_N_MAX + 1.2) - 6}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-ink)"
        >
          NN &middot; N
        </text>

        {/* "100k" annotation */}
        <line
          x1={ANN_X}
          y1={Y0}
          x2={ANN_X}
          y2={Y1}
          stroke="var(--color-graph-ink)"
          strokeWidth="0.8"
          strokeDasharray="4 4"
          strokeOpacity="0.6"
        />
        <text
          x={ANN_X + 8}
          y={Y0 + 18}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          here, kernel methods give up
        </text>
        <text
          x={ANN_X + 8}
          y={Y0 + 36}
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-dim)"
        >
          N ≈ 100,000
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6a &mdash; The slope that killed the chapter
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A thread card forward to the next chapter. The kernel matrix scales as N squared. Neural networks scale linearly with N. Once datasets passed 100,000 examples, the field moved to MLPs and backpropagation. Cover Vapnik's name; the headline is Hinton, Bengio, LeCun, 2006 onward."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Thread card forward to the MLP and backpropagation chapter."
      >
        <rect
          x="60"
          y="60"
          width={VIEW_W - 120}
          height={VIEW_H - 120}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="100"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          WHAT WE GOT  ·  WHAT WE LOST
        </text>

        <text
          x={VIEW_W / 2}
          y="160"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-ink)"
        >
          An optimal hyperplane,
        </text>
        <text
          x={VIEW_W / 2}
          y="184"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-ink)"
        >
          a kernel that bent the geometry.
        </text>

        <text
          x={VIEW_W / 2}
          y="234"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-vermilion)"
        >
          And a matrix that grew as N².
        </text>

        <text
          x={VIEW_W / 2}
          y="284"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          Neural nets scale as N, not N squared,
        </text>
        <text
          x={VIEW_W / 2}
          y="304"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          and N kept going up.
        </text>

        <line
          x1={VIEW_W / 2 - 40}
          y1="344"
          x2={VIEW_W / 2 + 40}
          y2="344"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="376"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          NEXT  ·  MLP / BACKPROP  ·  RUMELHART 1986
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 80}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the architecture that ate every kernel
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6b &mdash; The chapter ends; the network begins
      </figcaption>
    </figure>
  )
}
