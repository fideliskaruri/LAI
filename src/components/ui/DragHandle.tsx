// Smoke-test component. Just a visible token to prove components-in-MDX works.
// Real draggable primitives live in `src/playables/`.
interface DragHandleProps {
  label: string
}

export function DragHandle({ label }: DragHandleProps) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 mx-1 rounded-sm border border-vermilion/40 bg-vermilion/5 text-vermilion font-sans text-[13px] align-middle">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <circle cx="3" cy="3" r="1" fill="currentColor" />
        <circle cx="9" cy="3" r="1" fill="currentColor" />
        <circle cx="3" cy="9" r="1" fill="currentColor" />
        <circle cx="9" cy="9" r="1" fill="currentColor" />
      </svg>
      {label}
    </span>
  )
}
