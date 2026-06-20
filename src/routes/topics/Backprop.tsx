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
import * as ColdOpen from '../../playables/backprop/ColdOpen'
import * as HiddenLayers from '../../playables/backprop/HiddenLayers'
import * as ForwardPass from '../../playables/backprop/ForwardPass'
import * as Loss from '../../playables/backprop/Loss'
import * as ChainRuleBackward from '../../playables/backprop/ChainRuleBackward'
import * as ReverseModeAutoDiff from '../../playables/backprop/ReverseModeAutoDiff'
import * as TrainingLoop from '../../playables/backprop/TrainingLoop'
import * as RepresentationLearning from '../../playables/backprop/RepresentationLearning'
import * as Closing from '../../playables/backprop/Closing'

import {
  INITIAL_FORWARD,
  type ForwardState,
} from '../../playables/backprop/ForwardPass'
import {
  INITIAL_LOSS,
  type LossState,
} from '../../playables/backprop/Loss'
import {
  INITIAL_REVERSE,
  type ReverseState,
} from '../../playables/backprop/ReverseModeAutoDiff'
import {
  INITIAL_TRAIN,
  type TrainState,
} from '../../playables/backprop/TrainingLoop'

// Prose
import ColdOpenProse from '../../content/backprop/coldOpen.mdx'
import HiddenLayersProse from '../../content/backprop/hiddenLayers.mdx'
import ForwardPassProse from '../../content/backprop/forwardPass.mdx'
import LossProse from '../../content/backprop/loss.mdx'
import ChainRuleProse from '../../content/backprop/chainRuleBackward.mdx'
import ReverseModeProse from '../../content/backprop/reverseModeAutoDiff.mdx'
import TrainingLoopProse from '../../content/backprop/trainingLoop.mdx'
import RepresentationLearningProse from '../../content/backprop/representationLearning.mdx'
import ClosingProse from '../../content/backprop/closing.mdx'

/**
 * MLP / Backprop — PLAN §7.6. Nine-act split-canvas chapter.
 *
 * Per-act sync mode:
 *
 *   1  cold-open                 : independent  (Nature 1986 card / lineage)
 *   2  hidden-layers             : independent  (static MLP diagram / equations)
 *   3  forward-pass              : co-mutating  (drag inputs, watch numbers cascade)
 *   4  loss                      : co-mutating  (drag target, watch loss bar / parabola)
 *   5  chain-rule-backward       : independent  (static chain / two-line chain rule)
 *   6  reverse-mode-autodiff     : co-mutating  (step button advances backward wavefront)
 *   7  training-loop             : co-mutating  (train an MLP on XOR in real time)
 *   8  representation-learning   : independent  (post-training feature heatmaps)
 *   9  closing                   : independent  (lineage to convolutions/transformers)
 *
 * Interactive acts share a single state object between panes via 'co-mutating'.
 */

const acts: SplitActDef[] = [
  {
    id: 'cold-open',
    label: 'Nature · 1986',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'hidden-layers',
    label: 'Stack neurons',
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
    id: 'loss',
    label: 'Loss',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_LOSS } as LossState,
    initialRight: { ...INITIAL_LOSS } as LossState,
  },
  {
    id: 'chain-rule-backward',
    label: 'Chain rule',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'reverse-mode-autodiff',
    label: 'Reverse mode',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_REVERSE } as ReverseState,
    initialRight: { ...INITIAL_REVERSE } as ReverseState,
  },
  {
    id: 'training-loop',
    label: 'Train on XOR',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_TRAIN } as TrainState,
    initialRight: { ...INITIAL_TRAIN } as TrainState,
  },
  {
    id: 'representation-learning',
    label: 'Features',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'closing',
    label: 'Next: CNN',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
]

function LeftCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <ColdOpen.LeftPane />
    case 'hidden-layers':
      return <HiddenLayers.LeftPane />
    case 'forward-pass':
      return (
        <ForwardPass.LeftPane
          state={props.state as ForwardState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'loss':
      return (
        <Loss.LeftPane
          state={props.state as LossState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'chain-rule-backward':
      return <ChainRuleBackward.LeftPane />
    case 'reverse-mode-autodiff':
      return (
        <ReverseModeAutoDiff.LeftPane
          state={props.state as ReverseState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'training-loop':
      return (
        <TrainingLoop.LeftPane
          state={props.state as TrainState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'representation-learning':
      return <RepresentationLearning.LeftPane />
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
    case 'hidden-layers':
      return <HiddenLayers.RightPane />
    case 'forward-pass':
      return (
        <ForwardPass.RightPane
          state={props.state as ForwardState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'loss':
      return (
        <Loss.RightPane
          state={props.state as LossState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'chain-rule-backward':
      return <ChainRuleBackward.RightPane />
    case 'reverse-mode-autodiff':
      return (
        <ReverseModeAutoDiff.RightPane
          state={props.state as ReverseState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'training-loop':
      return (
        <TrainingLoop.RightPane
          state={props.state as TrainState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'representation-learning':
      return <RepresentationLearning.RightPane />
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

export function Backprop() {
  return (
    <TopicPageSplit
      topicId="backprop"
      topicName="MLP / Backprop"
      acts={acts}
      leftCanvas={LeftCanvas}
      rightCanvas={RightCanvas}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <HiddenLayersProse />
        <ForwardPassProse />
        <LossProse />
        <ChainRuleProse />
        <ReverseModeProse />
        <TrainingLoopProse />
        <RepresentationLearningProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={18}
        totalChapters={26}
        topicName="MLP / Backprop"
        nextTopicId="convolutions"
        nextTopicName="Convolutions"
      />
    </TopicPageSplit>
  )
}
