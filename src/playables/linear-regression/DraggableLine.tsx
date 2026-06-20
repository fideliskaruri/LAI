import { FitLineLeftPane, FitLineRightPane, type LineState } from './FitLine'

/**
 * Act 3 — Drag a line. Left pane is the live fit-line draggable; right pane
 * stays as the empty residual frame so the reader registers that the gaps
 * panel is about to wake up in the next act.
 */
export function LeftPane({
  state,
  onChange,
}: {
  state: LineState
  onChange: (s: LineState) => void
}) {
  return (
    <FitLineLeftPane
      state={state}
      onChange={onChange}
      narrationStyle="plain"
      figNum="2a"
    />
  )
}

export function RightPane({ state }: { state: LineState }) {
  return <FitLineRightPane state={state} variant="empty" figNum="2b" />
}
