import { lazy, Suspense, useRef } from 'react'
import { useNearViewport } from '../../hooks/useNearViewport'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

// The r3f scene is code-split — only fetched when the act is near viewport.
const OptimizationScene3D = lazy(() => import('./OptimizationScene3D'))

export function LossLandscape3D() {
  const ref = useRef<HTMLDivElement | null>(null)
  const near = useNearViewport<HTMLDivElement>(ref)

  return (
    <figure ref={ref} className="w-full">
      <CanvasNarrative
        text="A three-dimensional surface for f equals x to the fourth minus two x squared plus y squared. Two basins on either side of the y axis, with a saddle at the origin. A vermilion ball auto-traces a gradient descent path starting from the upper left, falling into the left basin. The camera slowly orbits."
        priority="high"
      />
      <Suspense fallback={<Placeholder caption="loading 3D…" />}>
        {near ? <OptimizationScene3D /> : <Placeholder caption="(3D scene parked)" />}
      </Suspense>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5 &mdash; In three dimensions you can see the climbing. In a thousand, you trust the algorithm.
      </figcaption>
    </figure>
  )
}

function Placeholder({ caption }: { caption: string }) {
  return (
    <div className="w-full aspect-[5/4] flex items-center justify-center text-fade font-sans uppercase text-[10px] tracking-[0.22em] border border-dashed border-fade rounded-sm">
      {caption}
    </div>
  )
}
