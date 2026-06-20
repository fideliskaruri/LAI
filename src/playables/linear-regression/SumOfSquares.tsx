import { FitLineLeftPane, FitLineRightPane, type LineState } from './FitLine'

/**
 * Act 5 — Σ|r| vs Σr². The right pane gains a small "PENALTY" toggle. When
 * 'sq' is selected, the bars become *squares* whose total area is the SSE;
 * when 'abs' is selected, the picture is back to flat bars. The line is
 * still draggable on the left.
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
      figNum="4a"
    />
  )
}

export function RightPane({
  state,
  onChange,
}: {
  state: LineState
  onChange: (s: LineState) => void
}) {
  return (
    <FitLineRightPane
      state={state}
      onChange={onChange}
      variant="toggle"
      figNum="4b"
    />
  )
}
