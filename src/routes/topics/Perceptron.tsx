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
import * as Rosenblatt1958 from '../../playables/perceptron/Rosenblatt1958'
import * as Mark1Perceptron from '../../playables/perceptron/Mark1Perceptron'
import * as ForwardPass from '../../playables/perceptron/ForwardPass'
import * as LearningRule from '../../playables/perceptron/LearningRule'
import * as Convergence from '../../playables/perceptron/Convergence'
import * as Xor from '../../playables/perceptron/Xor'
import * as TheFixWasHiddenLayers from '../../playables/perceptron/TheFixWasHiddenLayers'
import * as Closing from '../../playables/perceptron/Closing'

import {
  INITIAL_FORWARD,
  type ForwardState,
} from '../../playables/perceptron/ForwardPass'
import {
  INITIAL_LEARNING,
  type LearningState,
} from '../../playables/perceptron/LearningRule'
import {
  INITIAL_CONVERGENCE,
  type ConvergenceState,
} from '../../playables/perceptron/Convergence'
import {
  INITIAL_XOR,
  type XorState,
} from '../../playables/perceptron/Xor'

// Prose
import ColdOpenProse from '../../content/perceptron/coldOpen.mdx'
import TheMachineProse from '../../content/perceptron/theMachine.mdx'
import ForwardPassProse from '../../content/perceptron/forwardPass.mdx'
import TheLearningRuleProse from '../../content/perceptron/theLearningRule.mdx'
import ConvergenceProse from '../../content/perceptron/convergence.mdx'
import XorProse from '../../content/perceptron/xor.mdx'
import TheFixWasHiddenLayersProse from '../../content/perceptron/theFixWasHiddenLayers.mdx'
import ClosingProse from '../../content/perceptron/closing.mdx'

/**
 * Perceptron — PLAN §7.6. Eight-act split-canvas chapter.
 *
 * Per-act sync mode:
 *
 *   1  cold-open                    : independent  (static — NYT headline / title card)
 *   2  the-machine                  : independent  (static — Mark I sketch / one-line equation)
 *   3  forward-pass                 : co-mutating  (drag input point on either pane)
 *   4  the-learning-rule            : co-mutating  (train button on either pane)
 *   5  convergence                  : co-mutating  (reroll button drives auto-play)
 *   6  xor                          : co-mutating  (train button drives the futile loop)
 *   7  the-fix-was-hidden-layers    : independent  (static — MLP sketch / Nature 1986 card)
 *   8  closing                      : independent  (static — lineage / forward thread)
 *
 * Interactive acts share a single state object between panes via 'co-mutating'.
 */

const acts: SplitActDef[] = [
  {
    id: 'cold-open',
    label: 'Rosenblatt · 1958',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'the-machine',
    label: 'Mark I',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'forward-pass',
    label: 'Forward',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_FORWARD } as ForwardState,
    initialRight: { ...INITIAL_FORWARD } as ForwardState,
  },
  {
    id: 'the-learning-rule',
    label: 'Train',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_LEARNING } as LearningState,
    initialRight: { ...INITIAL_LEARNING } as LearningState,
  },
  {
    id: 'convergence',
    label: 'Converges',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_CONVERGENCE } as ConvergenceState,
    initialRight: { ...INITIAL_CONVERGENCE } as ConvergenceState,
  },
  {
    id: 'xor',
    label: 'XOR',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_XOR } as XorState,
    initialRight: { ...INITIAL_XOR } as XorState,
  },
  {
    id: 'the-fix-was-hidden-layers',
    label: 'Hidden layers',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'closing',
    label: 'Next: MLP',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
]

function LeftCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <Rosenblatt1958.LeftPane />
    case 'the-machine':
      return <Mark1Perceptron.LeftPane />
    case 'forward-pass':
      return (
        <ForwardPass.LeftPane
          state={props.state as ForwardState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'the-learning-rule':
      return (
        <LearningRule.LeftPane
          state={props.state as LearningState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'convergence':
      return (
        <Convergence.LeftPane
          state={props.state as ConvergenceState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'xor':
      return (
        <Xor.LeftPane
          state={props.state as XorState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'the-fix-was-hidden-layers':
      return <TheFixWasHiddenLayers.LeftPane />
    case 'closing':
      return <Closing.LeftPane />
    default:
      return <Rosenblatt1958.LeftPane />
  }
}

function RightCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <Rosenblatt1958.RightPane />
    case 'the-machine':
      return <Mark1Perceptron.RightPane />
    case 'forward-pass':
      return (
        <ForwardPass.RightPane
          state={props.state as ForwardState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'the-learning-rule':
      return (
        <LearningRule.RightPane
          state={props.state as LearningState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'convergence':
      return (
        <Convergence.RightPane
          state={props.state as ConvergenceState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'xor':
      return <Xor.RightPane />
    case 'the-fix-was-hidden-layers':
      return <TheFixWasHiddenLayers.RightPane />
    case 'closing':
      return <Closing.RightPane />
    default:
      return <Rosenblatt1958.RightPane />
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

export function Perceptron() {
  return (
    <TopicPageSplit
      topicId="perceptron"
      topicName="Perceptron"
      acts={acts}
      leftCanvas={LeftCanvas}
      rightCanvas={RightCanvas}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <TheMachineProse />
        <ForwardPassProse />
        <TheLearningRuleProse />
        <ConvergenceProse />
        <XorProse />
        <TheFixWasHiddenLayersProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={13}
        totalChapters={26}
        topicName="Perceptron"
        nextTopicId="backprop"
        nextTopicName="MLP / Backprop"
        nextStatus="coming-soon"
      />
    </TopicPageSplit>
  )
}
