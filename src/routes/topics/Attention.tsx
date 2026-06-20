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
import * as ColdOpen from '../../playables/attention/ColdOpen'
import * as AlignmentProblem from '../../playables/attention/AlignmentProblem'
import * as QkvMechanics from '../../playables/attention/QkvMechanics'
import * as AttentionMatrix from '../../playables/attention/AttentionMatrix'
import * as MultiHead from '../../playables/attention/MultiHead'
import * as SelfAttention from '../../playables/attention/SelfAttention'
import * as Closing from '../../playables/attention/Closing'
import {
  INITIAL_ALIGN,
  type AlignState,
} from '../../playables/attention/AlignmentProblem'
import {
  INITIAL_QKV,
  type QkvState,
} from '../../playables/attention/QkvMechanics'
import {
  INITIAL_MATRIX,
  type MatrixState,
} from '../../playables/attention/AttentionMatrix'
import {
  INITIAL_HEAD,
  type HeadState,
} from '../../playables/attention/MultiHead'
import {
  INITIAL_SELF,
  type SelfState,
} from '../../playables/attention/SelfAttention'

// Prose
import ColdOpenProse from '../../content/attention/coldOpen.mdx'
import AlignmentProblemProse from '../../content/attention/theAlignmentProblem.mdx'
import QkvMechanicsProse from '../../content/attention/qkvMechanics.mdx'
import AttentionMatrixProse from '../../content/attention/attentionMatrix.mdx'
import MultiHeadProse from '../../content/attention/multiHead.mdx'
import SelfAttentionProse from '../../content/attention/selfAttention.mdx'
import ClosingProse from '../../content/attention/closing.mdx'

/**
 * Attention — PLAN §7.6. Seven-act split-canvas chapter.
 *
 * Per-act sync mode:
 *
 *   1  cold-open               : independent       (both panes static)
 *   2  the-alignment-problem   : co-mutating       (hover a French target or
 *                                                   an English source — the
 *                                                   match lights up everywhere)
 *   3  qkv-mechanics           : left-drives-right (clicking a word on left
 *                                                   picks the query word; the
 *                                                   right pane shows that
 *                                                   word's Q · Kⱼ scores and
 *                                                   softmax weights)
 *   4  attention-matrix        : right-drives-left (hover a row in the matrix
 *                                                   on the right; the matching
 *                                                   token highlights on left.
 *                                                   THIS IS THE SHOWCASE.)
 *   5  multi-head              : co-mutating       (the selected head index is
 *                                                   shared — clicking it on
 *                                                   either side switches both)
 *   6  self-attention          : left-drives-right (hover any token on the
 *                                                   left; the right pane shows
 *                                                   that token's attention
 *                                                   weights over the sentence)
 *   7  closing                 : independent       (both panes static)
 */

const acts: SplitActDef[] = [
  {
    id: 'cold-open',
    label: 'Bahdanau · 2014',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'the-alignment-problem',
    label: 'Alignment',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_ALIGN } as AlignState,
    initialRight: { ...INITIAL_ALIGN } as AlignState,
  },
  {
    id: 'qkv-mechanics',
    label: 'Q · K · V',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_QKV } as QkvState,
    initialRight: { ...INITIAL_QKV } as QkvState,
    deriveRight: (l: unknown) => l as QkvState,
  },
  {
    id: 'attention-matrix',
    label: 'Attention matrix',
    syncMode: 'right-drives-left',
    initialLeft: { ...INITIAL_MATRIX } as MatrixState,
    initialRight: { ...INITIAL_MATRIX } as MatrixState,
    deriveLeft: (r: unknown) => r as MatrixState,
  },
  {
    id: 'multi-head',
    label: 'Multi-head',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_HEAD } as HeadState,
    initialRight: { ...INITIAL_HEAD } as HeadState,
  },
  {
    id: 'self-attention',
    label: 'Self-attention',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_SELF } as SelfState,
    initialRight: { ...INITIAL_SELF } as SelfState,
    deriveRight: (l: unknown) => l as SelfState,
  },
  {
    id: 'closing',
    label: 'Next: transformers',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
]

function LeftCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <ColdOpen.LeftPane />
    case 'the-alignment-problem':
      return (
        <AlignmentProblem.LeftPane
          state={props.state as AlignState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'qkv-mechanics':
      return (
        <QkvMechanics.LeftPane
          state={props.state as QkvState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'attention-matrix':
      return <AttentionMatrix.LeftPane state={props.state as MatrixState} />
    case 'multi-head':
      return (
        <MultiHead.LeftPane
          state={props.state as HeadState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'self-attention':
      return (
        <SelfAttention.LeftPane
          state={props.state as SelfState}
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
    case 'the-alignment-problem':
      return (
        <AlignmentProblem.RightPane
          state={props.state as AlignState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'qkv-mechanics':
      return <QkvMechanics.RightPane state={props.state as QkvState} />
    case 'attention-matrix':
      return (
        <AttentionMatrix.RightPane
          state={props.state as MatrixState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'multi-head':
      return (
        <MultiHead.RightPane
          state={props.state as HeadState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'self-attention':
      return <SelfAttention.RightPane state={props.state as SelfState} />
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

export function Attention() {
  return (
    <TopicPageSplit
      topicId="attention"
      topicName="Attention"
      acts={acts}
      leftCanvas={LeftCanvas}
      rightCanvas={RightCanvas}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <AlignmentProblemProse />
        <QkvMechanicsProse />
        <AttentionMatrixProse />
        <MultiHeadProse />
        <SelfAttentionProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={21}
        totalChapters={26}
        topicName="Attention"
        nextTopicId="transformers"
        nextTopicName="Transformers"
        nextStatus="coming-soon"
      />
    </TopicPageSplit>
  )
}
