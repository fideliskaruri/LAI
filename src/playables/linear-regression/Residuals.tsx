import { FitLineLeftPane, FitLineRightPane, type LineState } from './FitLine'

/**
 * Act 4 — Residual bars. Same draggable line on the left, but now the right
 * pane lights up with vermilion-or-ink bars from each point to the line and
 * a Σ|r| running readout. Drag → bars resize live.
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
      narrationStyle="residuals"
      figNum="3a"
    />
  )
}

export function RightPane({ state }: { state: LineState }) {
  return <FitLineRightPane state={state} variant="bars" figNum="3b" />
}
