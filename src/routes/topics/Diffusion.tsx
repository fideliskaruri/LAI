import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import {
  TopicPageSplit,
  type SplitActDef,
  type SplitCanvasRenderProps,
} from '../../components/topic/TopicPageSplit'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

// Playables
import * as ColdOpen from '../../playables/diffusion/ColdOpen'
import * as ForwardNoise from '../../playables/diffusion/ForwardNoise'
import * as PureNoiseAtEnd from '../../playables/diffusion/PureNoiseAtEnd'
import * as ReverseDenoise from '../../playables/diffusion/ReverseDenoise'
import * as ScoreMatching from '../../playables/diffusion/ScoreMatching'
import * as SamplingFromNoise from '../../playables/diffusion/SamplingFromNoise'
import * as Closing from '../../playables/diffusion/Closing'
import { INITIAL_FORWARD, type ForwardState } from '../../playables/diffusion/ForwardNoise'
import { INITIAL_REVERSE, type ReverseState } from '../../playables/diffusion/ReverseDenoise'
import { INITIAL_SAMPLING, type SamplingState } from '../../playables/diffusion/SamplingFromNoise'

// Prose
import ColdOpenProse from '../../content/diffusion/coldOpen.mdx'
import ForwardNoiseProse from '../../content/diffusion/forwardNoise.mdx'
import PureNoiseAtEndProse from '../../content/diffusion/pureNoiseAtEnd.mdx'
import ReverseDenoiseProse from '../../content/diffusion/reverseDenoise.mdx'
import ScoreMatchingProse from '../../content/diffusion/scoreMatching.mdx'
import SamplingFromNoiseProse from '../../content/diffusion/samplingFromNoise.mdx'
import ClosingProse from '../../content/diffusion/closing.mdx'

/**
 * Diffusion — PLAN §7.6. Seven-act split-canvas chapter.
 *
 * Per-act sync mode:
 *   1  cold-open          : independent       (both static)
 *   2  forward-noise      : co-mutating       (slider on left updates t shared with right)
 *   3  pure-noise-at-end  : independent       (both static)
 *   4  reverse-denoise    : co-mutating       (left slider + right toggle share one state)
 *   5  score-matching     : independent       (both static)
 *   6  sampling-from-noise: co-mutating       (step counter shared)
 *   7  closing            : independent
 */

const acts: SplitActDef[] = [
  {
    id: 'cold-open',
    label: 'Sohl-Dickstein · 2015',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'forward-noise',
    label: 'Forward noise',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_FORWARD } as ForwardState,
    initialRight: { ...INITIAL_FORWARD } as ForwardState,
  },
  {
    id: 'pure-noise-at-end',
    label: 'Pure noise',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'reverse-denoise',
    label: 'Reverse denoise',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_REVERSE } as ReverseState,
    initialRight: { ...INITIAL_REVERSE } as ReverseState,
  },
  {
    id: 'score-matching',
    label: 'Score field',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'sampling-from-noise',
    label: 'Sampling',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_SAMPLING } as SamplingState,
    initialRight: { ...INITIAL_SAMPLING } as SamplingState,
  },
  {
    id: 'closing',
    label: 'Why it took over',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
]

function LeftCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <ColdOpen.LeftPane />
    case 'forward-noise':
      return (
        <ForwardNoise.LeftPane
          state={props.state as ForwardState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'pure-noise-at-end':
      return <PureNoiseAtEnd.LeftPane />
    case 'reverse-denoise':
      return (
        <ReverseDenoise.LeftPane
          state={props.state as ReverseState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'score-matching':
      return <ScoreMatching.LeftPane />
    case 'sampling-from-noise':
      return (
        <SamplingFromNoise.LeftPane
          state={props.state as SamplingState}
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
    case 'forward-noise':
      return <ForwardNoise.RightPane state={props.state as ForwardState} />
    case 'pure-noise-at-end':
      return <PureNoiseAtEnd.RightPane />
    case 'reverse-denoise':
      return (
        <ReverseDenoise.RightPane
          state={props.state as ReverseState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'score-matching':
      return <ScoreMatching.RightPane />
    case 'sampling-from-noise':
      return <SamplingFromNoise.RightPane state={props.state as SamplingState} />
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

export function Diffusion() {
  return (
    <TopicPageSplit
      topicId="diffusion"
      topicName="Diffusion"
      acts={acts}
      leftCanvas={LeftCanvas}
      rightCanvas={RightCanvas}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <ForwardNoiseProse />
        <PureNoiseAtEndProse />
        <ReverseDenoiseProse />
        <ScoreMatchingProse />
        <SamplingFromNoiseProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={25}
        totalChapters={26}
        topicName="Diffusion"
        nextTopicId="agents"
        nextTopicName="Agents"
      />
    </TopicPageSplit>
  )
}
