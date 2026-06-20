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
import * as ColdOpen from '../../playables/rlhf/ColdOpen'
import * as WhyPretrainingIsntEnough from '../../playables/rlhf/WhyPretrainingIsntEnough'
import * as SupervisedFineTuning from '../../playables/rlhf/SupervisedFineTuning'
import * as PreferencePairs from '../../playables/rlhf/PreferencePairs'
import * as RewardModel from '../../playables/rlhf/RewardModel'
import * as Ppo from '../../playables/rlhf/Ppo'
import * as KlConstraint from '../../playables/rlhf/KlConstraint'
import * as Closing from '../../playables/rlhf/Closing'

import {
  INITIAL_SFT,
  type SftState,
} from '../../playables/rlhf/SupervisedFineTuning'
import {
  INITIAL_PREF,
  type PrefState,
} from '../../playables/rlhf/PreferencePairs'
import {
  INITIAL_RM,
  type RmState,
} from '../../playables/rlhf/RewardModel'
import {
  INITIAL_PPO,
  type PpoState,
} from '../../playables/rlhf/Ppo'
import {
  INITIAL_KL,
  type KlState,
} from '../../playables/rlhf/KlConstraint'

// Prose
import ColdOpenProse from '../../content/rlhf/coldOpen.mdx'
import WhyPretrainingProse from '../../content/rlhf/whyPretrainingIsntEnough.mdx'
import SupervisedFineTuningProse from '../../content/rlhf/supervisedFineTuning.mdx'
import PreferencePairsProse from '../../content/rlhf/preferencePairs.mdx'
import RewardModelProse from '../../content/rlhf/rewardModel.mdx'
import PpoProse from '../../content/rlhf/ppo.mdx'
import KlConstraintProse from '../../content/rlhf/klConstraint.mdx'
import ClosingProse from '../../content/rlhf/closing.mdx'

/**
 * RLHF — PLAN §7.6 outline. Eight-act split-canvas chapter.
 *
 * Per-act sync mode:
 *
 *   0  cold-open                   : independent       (Christiano 2017 / lineage)
 *   1  why-pretraining-isnt-enough : independent       (base vs aligned reply cards)
 *   2  supervised-fine-tuning      : left-drives-right (step examples, toggle right)
 *   3  preference-pairs            : left-drives-right (click A or B, pile grows)
 *   4  reward-model                : left-drives-right (step training, scatter tightens)
 *   5  ppo                         : left-drives-right (step PPO loop, curves climb)
 *   6  kl-constraint               : left-drives-right (slide β, output changes)
 *   7  closing                     : independent       (HHH / CAI / DPO; thread to Diffusion)
 */

const acts: SplitActDef[] = [
  {
    id: 'cold-open',
    label: 'Christiano · 2017',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'why-pretraining-isnt-enough',
    label: 'Base vs aligned',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'supervised-fine-tuning',
    label: 'SFT',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_SFT } as SftState,
    initialRight: { ...INITIAL_SFT } as SftState,
    deriveRight: (left) => ({ ...(left as SftState) }),
  },
  {
    id: 'preference-pairs',
    label: 'A is better than B',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_PREF } as PrefState,
    initialRight: { ...INITIAL_PREF } as PrefState,
    deriveRight: (left) => ({ ...(left as PrefState) }),
  },
  {
    id: 'reward-model',
    label: 'A judge learns',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_RM } as RmState,
    initialRight: { ...INITIAL_RM } as RmState,
    deriveRight: (left) => ({ ...(left as RmState) }),
  },
  {
    id: 'ppo',
    label: 'PPO',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_PPO } as PpoState,
    initialRight: { ...INITIAL_PPO } as PpoState,
    deriveRight: (left) => ({ ...(left as PpoState) }),
  },
  {
    id: 'kl-constraint',
    label: 'KL leash',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_KL } as KlState,
    initialRight: { ...INITIAL_KL } as KlState,
    deriveRight: (left) => ({ ...(left as KlState) }),
  },
  {
    id: 'closing',
    label: 'Next: Diffusion',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
]

function LeftCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <ColdOpen.LeftPane />
    case 'why-pretraining-isnt-enough':
      return <WhyPretrainingIsntEnough.LeftPane />
    case 'supervised-fine-tuning':
      return (
        <SupervisedFineTuning.LeftPane
          state={props.state as SftState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'preference-pairs':
      return (
        <PreferencePairs.LeftPane
          state={props.state as PrefState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'reward-model':
      return (
        <RewardModel.LeftPane
          state={props.state as RmState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'ppo':
      return (
        <Ppo.LeftPane
          state={props.state as PpoState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'kl-constraint':
      return (
        <KlConstraint.LeftPane
          state={props.state as KlState}
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
    case 'why-pretraining-isnt-enough':
      return <WhyPretrainingIsntEnough.RightPane />
    case 'supervised-fine-tuning':
      return (
        <SupervisedFineTuning.RightPane
          state={props.state as SftState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'preference-pairs':
      return <PreferencePairs.RightPane state={props.state as PrefState} />
    case 'reward-model':
      return <RewardModel.RightPane state={props.state as RmState} />
    case 'ppo':
      return <Ppo.RightPane state={props.state as PpoState} />
    case 'kl-constraint':
      return <KlConstraint.RightPane state={props.state as KlState} />
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

export function Rlhf() {
  return (
    <TopicPageSplit
      topicId="rlhf"
      topicName="RLHF"
      acts={acts}
      leftCanvas={LeftCanvas}
      rightCanvas={RightCanvas}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <WhyPretrainingProse />
        <SupervisedFineTuningProse />
        <PreferencePairsProse />
        <RewardModelProse />
        <PpoProse />
        <KlConstraintProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={24}
        totalChapters={26}
        topicName="RLHF"
        nextTopicId="diffusion"
        nextTopicName="Diffusion"
        nextStatus="available"
      />
    </TopicPageSplit>
  )
}
