import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import {
  TopicPageSplit,
  type SplitActDef,
  type SplitCanvasRenderProps,
} from '../../components/topic/TopicPageSplit'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

import * as ColdOpen from '../../playables/transformers/ColdOpen'
import * as TokensAndEmbeddings from '../../playables/transformers/TokensAndEmbeddings'
import * as PositionalEncoding from '../../playables/transformers/PositionalEncoding'
import * as SelfAttention from '../../playables/transformers/SelfAttention'
import * as MultiHead from '../../playables/transformers/MultiHead'
import * as FeedforwardAndResidual from '../../playables/transformers/FeedforwardAndResidual'
import * as EncoderDecoderWalkthrough from '../../playables/transformers/EncoderDecoderWalkthrough'
import * as Closing from '../../playables/transformers/Closing'

import {
  INITIAL_TOK,
  type TokState,
} from '../../playables/transformers/TokensAndEmbeddings'
import {
  INITIAL_POS,
  type PosState,
} from '../../playables/transformers/PositionalEncoding'
import {
  INITIAL_SA,
  type SaState,
} from '../../playables/transformers/SelfAttention'
import {
  INITIAL_MH,
  type MhState,
} from '../../playables/transformers/MultiHead'
import {
  INITIAL_BLOCK,
  type BlockState,
} from '../../playables/transformers/FeedforwardAndResidual'
import {
  INITIAL_WALK,
  type WalkState,
} from '../../playables/transformers/EncoderDecoderWalkthrough'

import ColdOpenProse from '../../content/transformers/coldOpen.mdx'
import TokensAndEmbeddingsProse from '../../content/transformers/tokensAndEmbeddings.mdx'
import PositionalEncodingProse from '../../content/transformers/positionalEncoding.mdx'
import SelfAttentionProse from '../../content/transformers/selfAttention.mdx'
import MultiHeadProse from '../../content/transformers/multiHead.mdx'
import FeedforwardAndResidualProse from '../../content/transformers/feedforwardAndResidual.mdx'
import EncoderDecoderWalkthroughProse from '../../content/transformers/encoderDecoderWalkthrough.mdx'
import ClosingProse from '../../content/transformers/closing.mdx'

/**
 * Transformers — PLAN §7.6. Eight-act split-canvas chapter.
 *
 * Per-act sync mode:
 *
 *   0  cold-open                       : independent       (Vaswani 2017 title / lineage)
 *   1  tokens-and-embeddings           : co-mutating       (tap either side; same selection)
 *   2  positional-encoding             : left-drives-right (drag position; waves shift)
 *   3  self-attention                  : left-drives-right (select query; attn matrix row lights up)
 *   4  multi-head                      : left-drives-right (pick head; pattern changes)
 *   5  feedforward-and-residual        : left-drives-right (click sub-block; right card describes it)
 *   6  encoder-decoder-walkthrough     : left-drives-right (step slider; cross-attn row lights)
 *   7  closing                         : independent       (lineage tree / forward thread)
 */

const acts: SplitActDef[] = [
  {
    id: 'cold-open',
    label: 'Vaswani · 2017',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'tokens-and-embeddings',
    label: 'Tokens',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_TOK } as TokState,
    initialRight: { ...INITIAL_TOK } as TokState,
  },
  {
    id: 'positional-encoding',
    label: 'Position',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_POS } as PosState,
    initialRight: { ...INITIAL_POS } as PosState,
    deriveRight: (left) => ({ ...(left as PosState) }),
  },
  {
    id: 'self-attention',
    label: 'Q, K, V',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_SA } as SaState,
    initialRight: { ...INITIAL_SA } as SaState,
    deriveRight: (left) => ({ ...(left as SaState) }),
  },
  {
    id: 'multi-head',
    label: 'Eight heads',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_MH } as MhState,
    initialRight: { ...INITIAL_MH } as MhState,
    deriveRight: (left) => ({ ...(left as MhState) }),
  },
  {
    id: 'feedforward-and-residual',
    label: 'The block',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_BLOCK } as BlockState,
    initialRight: { ...INITIAL_BLOCK } as BlockState,
    deriveRight: (left) => ({ ...(left as BlockState) }),
  },
  {
    id: 'encoder-decoder-walkthrough',
    label: 'Translate',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_WALK } as WalkState,
    initialRight: { ...INITIAL_WALK } as WalkState,
    deriveRight: (left) => ({ ...(left as WalkState) }),
  },
  {
    id: 'closing',
    label: 'Next: Language models',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
]

function LeftCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <ColdOpen.LeftPane />
    case 'tokens-and-embeddings':
      return (
        <TokensAndEmbeddings.LeftPane
          state={props.state as TokState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'positional-encoding':
      return (
        <PositionalEncoding.LeftPane
          state={props.state as PosState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'self-attention':
      return (
        <SelfAttention.LeftPane
          state={props.state as SaState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'multi-head':
      return (
        <MultiHead.LeftPane
          state={props.state as MhState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'feedforward-and-residual':
      return (
        <FeedforwardAndResidual.LeftPane
          state={props.state as BlockState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'encoder-decoder-walkthrough':
      return (
        <EncoderDecoderWalkthrough.LeftPane
          state={props.state as WalkState}
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
    case 'tokens-and-embeddings':
      return (
        <TokensAndEmbeddings.RightPane
          state={props.state as TokState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'positional-encoding':
      return <PositionalEncoding.RightPane state={props.state as PosState} />
    case 'self-attention':
      return <SelfAttention.RightPane state={props.state as SaState} />
    case 'multi-head':
      return <MultiHead.RightPane state={props.state as MhState} />
    case 'feedforward-and-residual':
      return (
        <FeedforwardAndResidual.RightPane state={props.state as BlockState} />
      )
    case 'encoder-decoder-walkthrough':
      return (
        <EncoderDecoderWalkthrough.RightPane state={props.state as WalkState} />
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

export function Transformers() {
  return (
    <TopicPageSplit
      topicId="transformers"
      topicName="Transformers"
      acts={acts}
      leftCanvas={LeftCanvas}
      rightCanvas={RightCanvas}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <TokensAndEmbeddingsProse />
        <PositionalEncodingProse />
        <SelfAttentionProse />
        <MultiHeadProse />
        <FeedforwardAndResidualProse />
        <EncoderDecoderWalkthroughProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={22}
        totalChapters={26}
        topicName="Transformers"
        nextTopicId="language-models"
        nextTopicName="Language models"
      />
    </TopicPageSplit>
  )
}
