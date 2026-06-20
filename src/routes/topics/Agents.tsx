import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import {
  TopicPageSplit,
  type SplitActDef,
  type SplitCanvasRenderProps,
} from '../../components/topic/TopicPageSplit'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

import * as ColdOpen from '../../playables/agents/ColdOpen'
import * as TheThoughtActionLoop from '../../playables/agents/TheThoughtActionLoop'
import * as ToolUse from '../../playables/agents/ToolUse'
import * as Planning from '../../playables/agents/Planning'
import * as Memory from '../../playables/agents/Memory'
import * as Reflection from '../../playables/agents/Reflection'
import * as SafetyAndPermissioning from '../../playables/agents/SafetyAndPermissioning'
import * as Closing from '../../playables/agents/Closing'

import {
  INITIAL_LOOP,
  type LoopState,
} from '../../playables/agents/TheThoughtActionLoop'
import {
  INITIAL_TOOLUSE,
  type ToolUseState,
} from '../../playables/agents/ToolUse'
import {
  INITIAL_PLANNING,
  type PlanningState,
} from '../../playables/agents/Planning'
import {
  INITIAL_MEMORY,
  type MemoryState,
} from '../../playables/agents/Memory'
import {
  INITIAL_REFLECTION,
  type ReflectionState,
} from '../../playables/agents/Reflection'
import {
  INITIAL_SAFETY,
  type SafetyState,
} from '../../playables/agents/SafetyAndPermissioning'

import ColdOpenProse from '../../content/agents/coldOpen.mdx'
import TheThoughtActionLoopProse from '../../content/agents/theThoughtActionLoop.mdx'
import ToolUseProse from '../../content/agents/toolUse.mdx'
import PlanningProse from '../../content/agents/planning.mdx'
import MemoryProse from '../../content/agents/memory.mdx'
import ReflectionProse from '../../content/agents/reflection.mdx'
import SafetyAndPermissioningProse from '../../content/agents/safetyAndPermissioning.mdx'
import ClosingProse from '../../content/agents/closing.mdx'

/**
 * Agents — PLAN §7.6. Eight-act split-canvas closing chapter.
 *
 * Per-act sync mode:
 *
 *   0  cold-open                     : independent       (arXiv card / lineage)
 *   1  the-thought-action-loop       : co-mutating       (step idx drives both)
 *   2  tool-use                      : co-mutating       (tool index drives both)
 *   3  planning                      : co-mutating       (depth + selected node)
 *   4  memory                        : co-mutating       (active memory kind)
 *   5  reflection                    : co-mutating       (iteration index)
 *   6  safety-and-permissioning      : co-mutating       (ladder level)
 *   7  closing                       : independent       (diagonal / closing card)
 *
 * Interactive acts share a single state object between panes via 'co-mutating'.
 */

const acts: SplitActDef[] = [
  {
    id: 'cold-open',
    label: 'ReAct · 2022',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
  {
    id: 'the-thought-action-loop',
    label: 'The loop',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_LOOP } as LoopState,
    initialRight: { ...INITIAL_LOOP } as LoopState,
  },
  {
    id: 'tool-use',
    label: 'Hands',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_TOOLUSE } as ToolUseState,
    initialRight: { ...INITIAL_TOOLUSE } as ToolUseState,
  },
  {
    id: 'planning',
    label: 'A plan',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_PLANNING } as PlanningState,
    initialRight: { ...INITIAL_PLANNING } as PlanningState,
  },
  {
    id: 'memory',
    label: 'Memory',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_MEMORY } as MemoryState,
    initialRight: { ...INITIAL_MEMORY } as MemoryState,
  },
  {
    id: 'reflection',
    label: 'Reflection',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_REFLECTION } as ReflectionState,
    initialRight: { ...INITIAL_REFLECTION } as ReflectionState,
  },
  {
    id: 'safety-and-permissioning',
    label: 'The ladder',
    syncMode: 'co-mutating',
    initialLeft: { ...INITIAL_SAFETY } as SafetyState,
    initialRight: { ...INITIAL_SAFETY } as SafetyState,
  },
  {
    id: 'closing',
    label: 'A door',
    syncMode: 'independent',
    initialLeft: null,
    initialRight: null,
  },
]

function LeftCanvas(props: SplitCanvasRenderProps) {
  switch (props.currentActId) {
    case 'cold-open':
      return <ColdOpen.LeftPane />
    case 'the-thought-action-loop':
      return (
        <TheThoughtActionLoop.LeftPane
          state={props.state as LoopState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'tool-use':
      return (
        <ToolUse.LeftPane
          state={props.state as ToolUseState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'planning':
      return (
        <Planning.LeftPane
          state={props.state as PlanningState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'memory':
      return (
        <Memory.LeftPane
          state={props.state as MemoryState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'reflection':
      return (
        <Reflection.LeftPane
          state={props.state as ReflectionState}
          onChange={(s) => props.onChange(s)}
        />
      )
    case 'safety-and-permissioning':
      return (
        <SafetyAndPermissioning.LeftPane
          state={props.state as SafetyState}
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
    case 'the-thought-action-loop':
      return <TheThoughtActionLoop.RightPane state={props.state as LoopState} />
    case 'tool-use':
      return <ToolUse.RightPane state={props.state as ToolUseState} />

    case 'planning':
      return <Planning.RightPane state={props.state as PlanningState} />
    case 'memory':
      return <Memory.RightPane state={props.state as MemoryState} />
    case 'reflection':
      return <Reflection.RightPane state={props.state as ReflectionState} />
    case 'safety-and-permissioning':
      return (
        <SafetyAndPermissioning.RightPane state={props.state as SafetyState} />
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

export function Agents() {
  return (
    <TopicPageSplit
      topicId="agents"
      topicName="Agents"
      acts={acts}
      leftCanvas={LeftCanvas}
      rightCanvas={RightCanvas}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <TheThoughtActionLoopProse />
        <ToolUseProse />
        <PlanningProse />
        <MemoryProse />
        <ReflectionProse />
        <SafetyAndPermissioningProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={26}
        totalChapters={26}
        topicName="Agents"
        nextTopicId={null}
        nextTopicName={null}
      />
    </TopicPageSplit>
  )
}
