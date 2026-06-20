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
import * as TheClassificationProblem from '../../playables/logistic-regression/TheClassificationProblem'
import * as TheSigmoid from '../../playables/logistic-regression/TheSigmoid'
import * as TheBoundary from '../../playables/logistic-regression/TheBoundary'
import * as LogLoss from '../../playables/logistic-regression/LogLoss'
import * as GradientDescent from '../../playables/logistic-regression/GradientDescent'
import * as Multiclass from '../../playables/logistic-regression/Multiclass'
import * as Closing from '../../playables/logistic-regression/Closing'

import {
  INITIAL_SIGMOID,
  type SigmoidState,
} from '../../playables/logistic-regression/TheSigmoid'
import {
  INITIAL_BOUNDARY,
  type BoundaryState,
} from '../../playables/logistic-regression/dataset'
import {
  INITIAL_LOSS,
  type LossState,
} from '../../playables/logistic-regression/LogLoss'
import {
  INITIAL_GD,
  type GDState,
} from '../../playables/logistic-regression/GradientDescent'
import {
  INITIAL_MULTICLASS,
  type MulticlassState,
} from '../../playables/logistic-regression/Multiclass'

// Prose
import ColdOpenProse from '../../content/logistic-regression/coldOpen.mdx'
import TheSigmoidProse from '../../content/logistic-regression/theSigmoid.mdx'
import TheBoundaryProse from '../../content/logistic-regression/theBoundary.mdx'
import LogLossProse from '../../content/logistic-regression/logLoss.mdx'
import GradientDescentProse from '../../content/logistic-regression/gradientDescent.mdx'
import MulticlassProse from '../../content/logistic-regression/multiclass.mdx'
import ClosingProse from '../../content/logistic-regression/closing.mdx'

/**
 * Logistic regression — PLAN §7.6. Seven-act split-canvas chapter.
 *
 * Per-act sync mode:
 *
 *   1  cold-open         : independent   (both panes are static)
 *   2  the-sigmoid       : co-mutating   (drag z on left or marker on right)
 *   3  the-boundary      : co-mutating   (drag line on left, gain slider on right)
 *   4  log-loss          : co-mutating   (drag boundary on left, toggle on right)
 *   5  gradient-descent  : co-mutating   (step button on either side)
 *   6  multiclass        : co-mutating   (focus pill on either, point click on left)
 *   7  closing           : independent   (static; thread forward)
 *
 * Interactive acts share a single state object between panes via 'co-mutating'.
 * The right pane often surfaces a different facet of the same state (sigmoid
 * profile vs. boundary line; loss readout vs. boundary; weight-space heatmap
 * vs. feature-space boundary; softmax bar chart vs. one-vs-rest line).
 */

const acts: SplitActDef[] = [
  {
    id: 'cold-open',
    label: 'Verhulst · 1838',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'the-sigmoid',
    label: 'σ',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_SIGMOID } as SigmoidState,
    initialRight: { ...INITIAL_SIGMOID } as SigmoidState,
  },
  {
    id: 'the-boundary',
    label: 'Boundary',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_BOUNDARY } as BoundaryState,
    initialRight: { ...INITIAL_BOUNDARY } as BoundaryState,
  },
  {
    id: 'log-loss',
    label: 'Log loss',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_LOSS } as LossState,
    initialRight: { ...INITIAL_LOSS } as LossState,
  },
  {
    id: 'gradient-descent',
    label: 'Descend',
    syncMode: 'co-mutating',
    initialLeft: INITIAL_GD as GDState,
    initialRight: INITIAL_GD as GDState,
  },
  {
    id: 'multiclass',
    label: 'Softmax',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_MULTICLASS } as MulticlassState,
    initialRight: { ...INITIAL_MULTICLASS } as MulticlassState,
  },
  {
    id: 'closing',
    label: 'Next: perceptron',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
]

function LeftCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <TheClassificationProblem.LeftPane />
    case 'the-sigmoid':
      return (
        <TheSigmoid.LeftPane
          state={props.state as SigmoidState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'the-boundary':
      return (
        <TheBoundary.LeftPane
          state={props.state as BoundaryState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'log-loss':
      return (
        <LogLoss.LeftPane
          state={props.state as LossState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'gradient-descent':
      return (
        <GradientDescent.LeftPane
          state={props.state as GDState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'multiclass':
      return (
        <Multiclass.LeftPane
          state={props.state as MulticlassState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'closing':
      return <Closing.LeftPane />
    default:
      return <TheClassificationProblem.LeftPane />
  }
}

function RightCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <TheClassificationProblem.RightPane />
    case 'the-sigmoid':
      return (
        <TheSigmoid.RightPane
          state={props.state as SigmoidState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'the-boundary':
      return (
        <TheBoundary.RightPane
          state={props.state as BoundaryState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'log-loss':
      return (
        <LogLoss.RightPane
          state={props.state as LossState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'gradient-descent':
      return (
        <GradientDescent.RightPane
          state={props.state as GDState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'multiclass':
      return (
        <Multiclass.RightPane
          state={props.state as MulticlassState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'closing':
      return <Closing.RightPane />
    default:
      return <TheClassificationProblem.RightPane />
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

export function LogisticRegression() {
  return (
    <TopicPageSplit
      topicId="logistic-regression"
      topicName="Logistic regression"
      acts={acts}
      leftCanvas={LeftCanvas}
      rightCanvas={RightCanvas}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <TheSigmoidProse />
        <TheBoundaryProse />
        <LogLossProse />
        <GradientDescentProse />
        <MulticlassProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={12}
        totalChapters={26}
        topicName="Logistic regression"
        nextTopicId="perceptron"
        nextTopicName="Perceptron"
      />
    </TopicPageSplit>
  )
}
