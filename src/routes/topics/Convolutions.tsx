import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import {
  TopicPageSplit,
  type SplitActDef,
  type SplitCanvasRenderProps,
} from '../../components/topic/TopicPageSplit'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

import * as ColdOpen from '../../playables/convolutions/ColdOpen'
import * as PixelsAndImages from '../../playables/convolutions/PixelsAndImages'
import * as TheKernel from '../../playables/convolutions/TheKernel'
import * as ConvolutionOperation from '../../playables/convolutions/ConvolutionOperation'
import * as LearnedKernels from '../../playables/convolutions/LearnedKernels'
import * as Pooling from '../../playables/convolutions/Pooling'
import * as StackingLayers from '../../playables/convolutions/StackingLayers'
import * as Closing from '../../playables/convolutions/Closing'

import { INITIAL_PIXEL, type PixelState } from '../../playables/convolutions/PixelsAndImages'
import {
  INITIAL_KERNEL_POS,
  type KernelPosState,
} from '../../playables/convolutions/TheKernel'
import { INITIAL_CONV_POS } from '../../playables/convolutions/ConvolutionOperation'
import {
  INITIAL_LEARNED_KERNELS,
  type LearnedKernelsState,
} from '../../playables/convolutions/LearnedKernels'
import { INITIAL_POOL, type PoolState } from '../../playables/convolutions/Pooling'

import ColdOpenProse from '../../content/convolutions/coldOpen.mdx'
import PixelsAndImagesProse from '../../content/convolutions/pixelsAndImages.mdx'
import TheKernelProse from '../../content/convolutions/theKernel.mdx'
import ConvolutionOperationProse from '../../content/convolutions/convolutionOperation.mdx'
import LearnedKernelsProse from '../../content/convolutions/learnedKernels.mdx'
import PoolingProse from '../../content/convolutions/pooling.mdx'
import StackingLayersProse from '../../content/convolutions/stackingLayers.mdx'
import ClosingProse from '../../content/convolutions/closing.mdx'

/**
 * Convolutions — PLAN §7.19. Eight-act split-canvas chapter.
 *
 * Per-act sync mode:
 *
 *   1  cold-open                : independent      (LeCun 1989 envelope / paper card)
 *   2  pixels-and-images        : co-mutating      (cursor shared between image + numbers)
 *   3  the-kernel               : left-drives-right (drag kernel; right shows patch)
 *   4  convolution-operation    : left-drives-right (drag kernel; right shows feature map cell)
 *   5  learned-kernels          : co-mutating      (kernel chip toggles on both sides)
 *   6  pooling                  : left-drives-right (drag pool window; right shows output cell)
 *   7  stacking-layers          : independent      (LeNet-5 stack / receptive-field hierarchy)
 *   8  closing                  : independent      (Fukushima → LeNet → AlexNet → ViT lineage)
 */

const acts: SplitActDef[] = [
  {
    id: 'cold-open',
    label: 'LeCun · 1989',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'pixels-and-images',
    label: 'Pixels',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_PIXEL } as PixelState,
    initialRight: { ...INITIAL_PIXEL } as PixelState,
  },
  {
    id: 'the-kernel',
    label: 'The kernel',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_KERNEL_POS } as KernelPosState,
    initialRight: { ...INITIAL_KERNEL_POS } as KernelPosState,
  },
  {
    id: 'convolution-operation',
    label: 'Multiply, sum, slide',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_CONV_POS } as KernelPosState,
    initialRight: { ...INITIAL_CONV_POS } as KernelPosState,
  },
  {
    id: 'learned-kernels',
    label: 'Four kernels',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_LEARNED_KERNELS } as LearnedKernelsState,
    initialRight: { ...INITIAL_LEARNED_KERNELS } as LearnedKernelsState,
  },
  {
    id: 'pooling',
    label: 'Pooling',
    syncMode: 'left-drives-right',
    initialLeft: { ...INITIAL_POOL } as PoolState,
    initialRight: { ...INITIAL_POOL } as PoolState,
  },
  {
    id: 'stacking-layers',
    label: 'Stack',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'closing',
    label: 'Next: Transformers',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
]

function LeftCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <ColdOpen.LeftPane />
    case 'pixels-and-images':
      return (
        <PixelsAndImages.LeftPane
          state={props.state as PixelState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'the-kernel':
      return (
        <TheKernel.LeftPane
          state={props.state as KernelPosState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'convolution-operation':
      return (
        <ConvolutionOperation.LeftPane
          state={props.state as KernelPosState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'learned-kernels':
      return (
        <LearnedKernels.LeftPane
          state={props.state as LearnedKernelsState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'pooling':
      return (
        <Pooling.LeftPane
          state={props.state as PoolState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'stacking-layers':
      return <StackingLayers.LeftPane />
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
    case 'pixels-and-images':
      return (
        <PixelsAndImages.RightPane
          state={props.state as PixelState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'the-kernel':
      return <TheKernel.RightPane state={props.state as KernelPosState} />
    case 'convolution-operation':
      return (
        <ConvolutionOperation.RightPane state={props.state as KernelPosState} />
      )
    case 'learned-kernels':
      return <LearnedKernels.RightPane state={props.state as LearnedKernelsState} />
    case 'pooling':
      return <Pooling.RightPane state={props.state as PoolState} />
    case 'stacking-layers':
      return <StackingLayers.RightPane />
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

export function Convolutions() {
  return (
    <TopicPageSplit
      topicId="convolutions"
      topicName="Convolutions"
      acts={acts}
      leftCanvas={LeftCanvas}
      rightCanvas={RightCanvas}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <PixelsAndImagesProse />
        <TheKernelProse />
        <ConvolutionOperationProse />
        <LearnedKernelsProse />
        <PoolingProse />
        <StackingLayersProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={19}
        totalChapters={26}
        topicName="Convolutions"
        nextTopicId="transformers"
        nextTopicName="Transformers"
        nextStatus="coming-soon"
      />
    </TopicPageSplit>
  )
}
