import {
  TopicPageSplit,
  type SplitActDef,
  type SplitCanvasRenderProps,
} from '../../components/topic/TopicPageSplit'

/**
 * Phase 4 deliverable: prove the split-canvas template works for all four
 * sync modes. Each act is a tiny counter pair; the sync mode determines how
 * + clicks propagate (or don't) between the two panes.
 *
 * Real consumers (LinReg, PCA, SVM, Convolutions, Attention, Diffusion,
 * Logistic) come in their own topic build cycles.
 */

interface Toy {
  count: number
}

const acts: SplitActDef[] = [
  {
    id: 'independent',
    label: 'Independent',
    syncMode: 'independent',
    initialLeft: { count: 0 } as Toy,
    initialRight: { count: 0 } as Toy,
  },
  {
    id: 'left-drives-right',
    label: 'Left drives right',
    syncMode: 'left-drives-right',
    initialLeft: { count: 0 } as Toy,
    initialRight: { count: 0 } as Toy,
    deriveRight: (l) => {
      const t = l as Toy
      return { count: t.count * t.count } as Toy
    },
  },
  {
    id: 'right-drives-left',
    label: 'Right drives left',
    syncMode: 'right-drives-left',
    initialLeft: { count: 0 } as Toy,
    initialRight: { count: 0 } as Toy,
    deriveLeft: (r) => {
      const t = r as Toy
      return { count: -t.count } as Toy
    },
  },
  {
    id: 'co-mutating',
    label: 'Co-mutating',
    syncMode: 'co-mutating',
    initialLeft: { count: 0 } as Toy,
    initialRight: { count: 0 } as Toy,
  },
]

function CounterPane({
  state,
  onChange,
  label,
}: SplitCanvasRenderProps & { label: string }) {
  const toy = state as Toy
  return (
    <div className="p-8 rounded-sm border border-graph-fade text-center min-h-[200px] flex flex-col items-center justify-center">
      <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-vermilion mb-3">
        {label}
      </p>
      <p className="font-mono text-[32px] text-ink mb-5">{toy.count}</p>
      <button
        type="button"
        onClick={() => onChange({ count: toy.count + 1 })}
        className="font-sans text-[11px] uppercase tracking-[0.15em] text-vermilion border border-vermilion px-3 py-1.5 hover:bg-vermilion hover:text-cream transition-colors"
      >
        + 1
      </button>
    </div>
  )
}

export function SplitCanvasTest() {
  return (
    <TopicPageSplit
      topicId="__test"
      topicName="Split canvas test"
      acts={acts}
      leftCanvas={(p) => <CounterPane {...p} label="LEFT" />}
      rightCanvas={(p) => <CounterPane {...p} label="RIGHT" />}
    >
      <article className="font-serif text-[18px] leading-[1.7] text-ink">
        <section id="independent" className="mb-24 scroll-mt-[14vh]">
          <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-vermilion mb-3">
            Mode 1 of 4
          </p>
          <h2 className="font-serif text-[28px] font-semibold mb-4">
            Independent
          </h2>
          <p>
            Each pane's state is its own. Click + on either side. The other
            doesn't move. This is the mode for Logistic regression (feature
            space + sigmoid are visual mirrors) and PCA (original axes +
            principal axes).
          </p>
        </section>

        <section id="left-drives-right" className="mb-24 scroll-mt-[14vh]">
          <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-vermilion mb-3">
            Mode 2 of 4
          </p>
          <h2 className="font-serif text-[28px] font-semibold mb-4">
            Left drives right
          </h2>
          <p>
            The left pane is interactive. Right derives. Click + on the left:
            the right shows the left value squared. The right's button is
            decorative in this mode — clicking it has no effect (this is
            deliberate; consumers can wire it differently if they want).
            This is the mode for Linear regression (drag the fit line ⇒
            residual bars on the right) and Convolutions (drag the kernel ⇒
            feature map updates).
          </p>
        </section>

        <section id="right-drives-left" className="mb-24 scroll-mt-[14vh]">
          <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-vermilion mb-3">
            Mode 3 of 4
          </p>
          <h2 className="font-serif text-[28px] font-semibold mb-4">
            Right drives left
          </h2>
          <p>
            Mirror of mode 2. Click + on the right: the left shows the right
            value negated. Mode for Attention (hover a token on the right ⇒
            the matching token highlights in the left sequence pane).
          </p>
        </section>

        <section id="co-mutating" className="mb-24 scroll-mt-[14vh]">
          <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-vermilion mb-3">
            Mode 4 of 4
          </p>
          <h2 className="font-serif text-[28px] font-semibold mb-4">
            Co-mutating
          </h2>
          <p>
            Both panes share one state. Click + on either side; both panes
            mirror. Mode for Diffusion (scrubbing time t updates both the
            image-at-step-t and the noise-schedule curve from a single source).
          </p>
        </section>
      </article>
    </TopicPageSplit>
  )
}
