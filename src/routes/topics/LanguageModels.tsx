import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import {
  TopicPageSplit,
  type SplitActDef,
  type SplitCanvasRenderProps,
} from '../../components/topic/TopicPageSplit'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

import * as ColdOpen from '../../playables/language-models/ColdOpen'
import * as TheNextTokenGame from '../../playables/language-models/TheNextTokenGame'
import * as Pretraining from '../../playables/language-models/Pretraining'
import * as ScalingLaws from '../../playables/language-models/ScalingLaws'
import * as Emergence from '../../playables/language-models/Emergence'
import * as InContextLearning from '../../playables/language-models/InContextLearning'
import * as InstructionTuning from '../../playables/language-models/InstructionTuning'
import * as Closing from '../../playables/language-models/Closing'

import {
  INITIAL_NEXT_TOKEN,
  deriveNextTokenRight,
  type NextTokenState,
} from '../../playables/language-models/TheNextTokenGame'
import {
  INITIAL_PRETRAIN,
  type PretrainState,
} from '../../playables/language-models/Pretraining'
import {
  INITIAL_SCALING,
  deriveScalingRight,
  type ScalingState,
} from '../../playables/language-models/ScalingLaws'
import {
  INITIAL_EMERGENCE,
  deriveEmergenceRight,
  type EmergenceState,
} from '../../playables/language-models/Emergence'
import {
  INITIAL_ICL,
  deriveICLRight,
  type ICLState,
} from '../../playables/language-models/InContextLearning'

import ColdOpenProse from '../../content/language-models/coldOpen.mdx'
import TheNextTokenGameProse from '../../content/language-models/theNextTokenGame.mdx'
import PretrainingProse from '../../content/language-models/pretraining.mdx'
import ScalingLawsProse from '../../content/language-models/scalingLaws.mdx'
import EmergenceProse from '../../content/language-models/emergence.mdx'
import InContextLearningProse from '../../content/language-models/inContextLearning.mdx'
import InstructionTuningProse from '../../content/language-models/instructionTuning.mdx'
import ClosingProse from '../../content/language-models/closing.mdx'

/**
 * Language Models — PLAN §7.6. Eight-act split-canvas chapter.
 *
 * Per-act sync mode:
 *
 *   0  cold-open               : independent       (Shannon 1948 / timeline)
 *   1  the-next-token-game     : left-drives-right (temperature slider → bars)
 *   2  pretraining             : left-drives-right (corpus cursor → loss-dot)
 *   3  scaling-laws            : left-drives-right (model-size slider → readout)
 *   4  emergence               : left-drives-right (scale slider → capabilities)
 *   5  in-context-learning     : left-drives-right (deck swap → completion)
 *   6  instruction-tuning      : independent       (two boxes / two outputs)
 *   7  closing                 : independent       (2020s constellation / forward to RLHF)
 */

const acts: SplitActDef[] = [
  {
    id: 'cold-open',
    label: 'Shannon · 1948',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'the-next-token-game',
    label: 'Next token',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_NEXT_TOKEN } as NextTokenState,
    initialRight: { ...INITIAL_NEXT_TOKEN } as NextTokenState,
    deriveRight: (l) => deriveNextTokenRight(l as NextTokenState),
  },
  {
    id: 'pretraining',
    label: 'Pretrain',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_PRETRAIN } as PretrainState,
    initialRight: { ...INITIAL_PRETRAIN } as PretrainState,
    deriveRight: (l) => ({ ...(l as PretrainState) }),
  },
  {
    id: 'scaling-laws',
    label: 'Kaplan · 2020',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_SCALING } as ScalingState,
    initialRight: { ...INITIAL_SCALING } as ScalingState,
    deriveRight: (l) => deriveScalingRight(l as ScalingState),
  },
  {
    id: 'emergence',
    label: 'Emergence',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_EMERGENCE } as EmergenceState,
    initialRight: { ...INITIAL_EMERGENCE } as EmergenceState,
    deriveRight: (l) => deriveEmergenceRight(l as EmergenceState),
  },
  {
    id: 'in-context-learning',
    label: 'In-context',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_ICL } as ICLState,
    initialRight: { ...INITIAL_ICL } as ICLState,
    deriveRight: (l) => deriveICLRight(l as ICLState),
  },
  {
    id: 'instruction-tuning',
    label: 'Instruct',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'closing',
    label: 'Next: RLHF',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
]

function LeftCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <ColdOpen.LeftPane />
    case 'the-next-token-game':
      return (
        <TheNextTokenGame.LeftPane
          state={props.state as NextTokenState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'pretraining':
      return (
        <Pretraining.LeftPane
          state={props.state as PretrainState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'scaling-laws':
      return (
        <ScalingLaws.LeftPane
          state={props.state as ScalingState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'emergence':
      return (
        <Emergence.LeftPane
          state={props.state as EmergenceState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'in-context-learning':
      return (
        <InContextLearning.LeftPane
          state={props.state as ICLState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'instruction-tuning':
      return <InstructionTuning.LeftPane />
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
    case 'the-next-token-game':
      return <TheNextTokenGame.RightPane state={props.state as NextTokenState} />
    case 'pretraining':
      return <Pretraining.RightPane state={props.state as PretrainState} />
    case 'scaling-laws':
      return <ScalingLaws.RightPane state={props.state as ScalingState} />
    case 'emergence':
      return <Emergence.RightPane state={props.state as EmergenceState} />
    case 'in-context-learning':
      return (
        <InContextLearning.RightPane
          state={props.state as ICLState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'instruction-tuning':
      return <InstructionTuning.RightPane />
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

export function LanguageModels() {
  return (
    <TopicPageSplit
      topicId="language-models"
      topicName="Language models"
      acts={acts}
      leftCanvas={LeftCanvas}
      rightCanvas={RightCanvas}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <TheNextTokenGameProse />
        <PretrainingProse />
        <ScalingLawsProse />
        <EmergenceProse />
        <InContextLearningProse />
        <InstructionTuningProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={23}
        totalChapters={26}
        topicName="Language models"
        nextTopicId="rlhf"
        nextTopicName="RLHF"
        nextStatus="coming-soon"
      />
    </TopicPageSplit>
  )
}
