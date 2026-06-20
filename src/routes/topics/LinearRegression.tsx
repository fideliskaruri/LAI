import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import {
  TopicPageSplit,
  type SplitActDef,
  type SplitCanvasRenderProps,
} from '../../components/topic/TopicPageSplit'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

// Playables — each act exports a LeftPane and a RightPane.
import * as ColdOpen from '../../playables/linear-regression/ColdOpen'
import * as Data from '../../playables/linear-regression/Data'
import * as DraggableLine from '../../playables/linear-regression/DraggableLine'
import * as Residuals from '../../playables/linear-regression/Residuals'
import * as SumOfSquares from '../../playables/linear-regression/SumOfSquares'
import * as CalculusOnLoss from '../../playables/linear-regression/CalculusOnLoss'
import * as NormalEquations from '../../playables/linear-regression/NormalEquations'
import * as ProjectionInterpretation from '../../playables/linear-regression/ProjectionInterpretation'
import * as OverfittingTeaser from '../../playables/linear-regression/OverfittingTeaser'
import * as Closing from '../../playables/linear-regression/Closing'
import { INITIAL_LINE, type LineState } from '../../playables/linear-regression/FitLine'
import { INITIAL_SLOPE, type SlopeState } from '../../playables/linear-regression/CalculusOnLoss'
import { INITIAL_POLY, type PolyState } from '../../playables/linear-regression/OverfittingTeaser'

// Prose
import ColdOpenProse from '../../content/linear-regression/coldOpen.mdx'
import DataProse from '../../content/linear-regression/data.mdx'
import DraggableLineProse from '../../content/linear-regression/draggableLine.mdx'
import ResidualsProse from '../../content/linear-regression/residuals.mdx'
import SumOfSquaresProse from '../../content/linear-regression/sumOfSquares.mdx'
import CalculusOnLossProse from '../../content/linear-regression/calculusOnLoss.mdx'
import NormalEquationsProse from '../../content/linear-regression/normalEquations.mdx'
import ProjectionInterpretationProse from '../../content/linear-regression/projectionInterpretation.mdx'
import OverfittingTeaserProse from '../../content/linear-regression/overfittingTeaser.mdx'
import ClosingProse from '../../content/linear-regression/closing.mdx'

/**
 * Linear regression — PLAN §7.5. Ten-act split-canvas chapter.
 *
 * Per-act sync mode:
 *
 *   1  cold-open                  : independent       (both panes are static)
 *   2  data                       : independent       (left static scatter; right empty frame)
 *   3  draggable-line             : left-drives-right (drag on left; right is derived view)
 *   4  residuals                  : left-drives-right (drag on left; bars on right derive)
 *   5  sum-of-squares             : left-drives-right (drag on left; bars/squares on right derive)
 *   6  calculus-on-loss           : co-mutating       (slope handle on right updates line on left — genuinely bidirectional)
 *   7  normal-equations           : independent       (left = final fit; right = formula card)
 *   8  projection-interpretation  : independent       (left = 3D; right = symbol card)
 *   9  overfitting-teaser         : left-drives-right (degree slider on left; bar chart on right derives)
 *  10  closing                    : independent       (static; thread forward)
 *
 * Acts 3, 4, 5, 9: the interactive element lives on the LEFT and the right
 * pane is a pure derived view. We use left-drives-right with an identity
 * deriveRight so the two panes share state without each one writing back.
 * Act 6 is the only genuinely co-mutating act — the slope handle on the
 * right edits the same SlopeState the left's loss-curve marker reads.
 */

const acts: SplitActDef[] = [
  {
    id: 'cold-open',
    label: 'Legendre · Gauss · 1801',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'data',
    label: 'The fit problem',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'draggable-line',
    label: 'Drag a line',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_LINE } as LineState,
    initialRight: { ...INITIAL_LINE } as LineState,
    deriveRight: (l: unknown) => l as LineState,
  },
  {
    id: 'residuals',
    label: 'Residuals',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_LINE } as LineState,
    initialRight: { ...INITIAL_LINE } as LineState,
    deriveRight: (l: unknown) => l as LineState,
  },
  {
    id: 'sum-of-squares',
    label: 'Σ|r| vs Σr²',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_LINE } as LineState,
    initialRight: { ...INITIAL_LINE } as LineState,
    deriveRight: (l: unknown) => l as LineState,
  },
  {
    id: 'calculus-on-loss',
    label: 'Derivative finds min',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_SLOPE } as SlopeState,
    initialRight: { ...INITIAL_SLOPE } as SlopeState,
  },
  {
    id: 'normal-equations',
    label: 'Closed form',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'projection-interpretation',
    label: 'Geometry',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'overfitting-teaser',
    label: 'Degree slider',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_POLY } as PolyState,
    initialRight: { ...INITIAL_POLY } as PolyState,
    deriveRight: (l: unknown) => l as PolyState,
  },
  {
    id: 'closing',
    label: 'Next: optimization',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
]

function LeftCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <ColdOpen.LeftPane />
    case 'data':
      return <Data.LeftPane />
    case 'draggable-line':
      return (
        <DraggableLine.LeftPane
          state={props.state as LineState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'residuals':
      return (
        <Residuals.LeftPane
          state={props.state as LineState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'sum-of-squares':
      return (
        <SumOfSquares.LeftPane
          state={props.state as LineState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'calculus-on-loss':
      return <CalculusOnLoss.LeftPane state={props.state as SlopeState} />
    case 'normal-equations':
      return <NormalEquations.LeftPane />
    case 'projection-interpretation':
      return <ProjectionInterpretation.LeftPane />
    case 'overfitting-teaser':
      return (
        <OverfittingTeaser.LeftPane
          state={props.state as PolyState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'closing':
      return <Closing.LeftPane />
    default:
      return <ColdOpen.LeftPane />
  }
}

function RightCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <ColdOpen.RightPane />
    case 'data':
      return <Data.RightPane />
    case 'draggable-line':
      return <DraggableLine.RightPane state={props.state as LineState} />
    case 'residuals':
      return <Residuals.RightPane state={props.state as LineState} />
    case 'sum-of-squares':
      return (
        <SumOfSquares.RightPane
          state={props.state as LineState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'calculus-on-loss':
      return (
        <CalculusOnLoss.RightPane
          state={props.state as SlopeState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'normal-equations':
      return <NormalEquations.RightPane />
    case 'projection-interpretation':
      return <ProjectionInterpretation.RightPane />
    case 'overfitting-teaser':
      return <OverfittingTeaser.RightPane state={props.state as PolyState} />
    case 'closing':
      return <Closing.RightPane />
    default:
      return <ColdOpen.RightPane />
  }
}

const mdxComponents = {
  Act,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const href = props.href ?? ''
    if (href.startsWith('/')) {
      return (
        <Link
          to={href}
          className="text-vermilion underline decoration-1 underline-offset-4 hover:text-vermilion-deep"
        >
          {props.children}
        </Link>
      )
    }
    return <a {...props} target="_blank" rel="noreferrer" />
  },
}

export function LinearRegression() {
  return (
    <TopicPageSplit
      topicId="linear-regression"
      topicName="Linear regression"
      acts={acts}
      leftCanvas={LeftCanvas}
      rightCanvas={RightCanvas}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <DataProse />
        <DraggableLineProse />
        <ResidualsProse />
        <SumOfSquaresProse />
        <CalculusOnLossProse />
        <NormalEquationsProse />
        <ProjectionInterpretationProse />
        <OverfittingTeaserProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={10}
        totalChapters={26}
        topicName="Linear regression"
        nextTopicId="optimization"
        nextTopicName="Optimization"
        nextStatus="coming-soon"
      />
    </TopicPageSplit>
  )
}
