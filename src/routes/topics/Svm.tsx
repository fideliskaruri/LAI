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
import * as ColdOpen from '../../playables/svm/ColdOpen'
import * as TheQuestion from '../../playables/svm/TheQuestion'
import * as MaxMargin from '../../playables/svm/MaxMargin'
import * as SupportVectors from '../../playables/svm/SupportVectors'
import * as NonSeparable from '../../playables/svm/NonSeparable'
import * as KernelTrick from '../../playables/svm/KernelTrick'
import * as Closing from '../../playables/svm/Closing'

import {
  INITIAL_HYPERPLANE,
  type HyperplaneState,
} from '../../playables/svm/MaxMargin'
import { INITIAL_SV_HYPERPLANE } from '../../playables/svm/SupportVectors'
import {
  INITIAL_SOFT_MARGIN,
  type SoftMarginState,
} from '../../playables/svm/NonSeparable'
import {
  INITIAL_KERNEL,
  type KernelState,
} from '../../playables/svm/KernelTrick'

// Prose
import ColdOpenProse from '../../content/svm/coldOpen.mdx'
import TheQuestionProse from '../../content/svm/theQuestion.mdx'
import MaxMarginProse from '../../content/svm/maxMargin.mdx'
import SupportVectorsProse from '../../content/svm/supportVectors.mdx'
import NonSeparableProse from '../../content/svm/nonSeparable.mdx'
import KernelTrickProse from '../../content/svm/kernelTrick.mdx'
import ClosingProse from '../../content/svm/closing.mdx'

/**
 * Support Vector Machines — chapter 17.
 *
 * Per-act sync mode:
 *
 *   1  cold-open        : independent       (both panes static)
 *   2  the-question     : independent       (static comparison)
 *   3  max-margin       : left-drives-right (drag line → margin readout)
 *   4  support-vectors  : left-drives-right (drag line → SV list)
 *   5  non-separable    : right-drives-left (drag C slider → line)
 *   6  kernel-trick     : right-drives-left (toggle kernel → 3D lift)
 *   7  closing          : independent       (forward thread)
 */
const acts: SplitActDef[] = [
  {
    id: 'cold-open',
    label: 'Cortes · Vapnik · 1995',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'the-question',
    label: 'Which line?',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'max-margin',
    label: 'Widen the band',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_HYPERPLANE } as HyperplaneState,
    initialRight: { ...INITIAL_HYPERPLANE } as HyperplaneState,
    deriveRight: (l: unknown) => l as HyperplaneState,
  },
  {
    id: 'support-vectors',
    label: 'Only a few matter',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_SV_HYPERPLANE } as HyperplaneState,
    initialRight: { ...INITIAL_SV_HYPERPLANE } as HyperplaneState,
    deriveRight: (l: unknown) => l as HyperplaneState,
  },
  {
    id: 'non-separable',
    label: 'Soft margin · C',
    syncMode: 'right-drives-left',
    initialLeft: { ...INITIAL_SOFT_MARGIN } as SoftMarginState,
    initialRight: { ...INITIAL_SOFT_MARGIN } as SoftMarginState,
    deriveLeft: (r: unknown) => r as SoftMarginState,
  },
  {
    id: 'kernel-trick',
    label: 'Lift to 3D',
    syncMode: 'independent',
    initialLeft: { ...INITIAL_KERNEL } as KernelState,
    initialRight: { ...INITIAL_KERNEL } as KernelState,
  },
  {
    id: 'closing',
    label: 'Next: backprop',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
]

function LeftCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <ColdOpen.LeftPane />
    case 'the-question':
      return <TheQuestion.LeftPane />
    case 'max-margin':
      return (
        <MaxMargin.LeftPane
          state={props.state as HyperplaneState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'support-vectors':
      return (
        <SupportVectors.LeftPane
          state={props.state as HyperplaneState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'non-separable':
      return <NonSeparable.LeftPane state={props.state as SoftMarginState} />
    case 'kernel-trick':
      return <KernelTrick.LeftPane />
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
    case 'the-question':
      return <TheQuestion.RightPane />
    case 'max-margin':
      return <MaxMargin.RightPane state={props.state as HyperplaneState} />
    case 'support-vectors':
      return <SupportVectors.RightPane state={props.state as HyperplaneState} />
    case 'non-separable':
      return (
        <NonSeparable.RightPane
          state={props.state as SoftMarginState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'kernel-trick':
      return (
        <KernelTrick.RightPane
          state={props.state as KernelState}
          onChange={(s) => props.onChange(s)}
        />
      )
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

export function Svm() {
  return (
    <TopicPageSplit
      topicId="svm"
      topicName="Support Vector Machines"
      acts={acts}
      leftCanvas={LeftCanvas}
      rightCanvas={RightCanvas}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <TheQuestionProse />
        <MaxMarginProse />
        <SupportVectorsProse />
        <NonSeparableProse />
        <KernelTrickProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={17}
        totalChapters={26}
        topicName="Support Vector Machines"
        nextTopicId="backprop"
        nextTopicName="MLP / Backprop"
        nextStatus="coming-soon"
      />
    </TopicPageSplit>
  )
}
