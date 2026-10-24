import { FileText, Image as ImageIcon, ListChecks } from 'lucide-react'
import { Badge } from '@/components/ui/feedback'
import {
  GOAL_PRIORITY_LABELS,
  GOAL_STATUS_LABELS,
  GOAL_STATUS_TONE,
  LEARNER_STATUS_LABELS,
  LEARNER_STATUS_TONE,
  PROFILE_STATUS_LABELS,
  SCRIPT_STATUS_LABELS,
  SCRIPT_STATUS_TONE,
  SOURCE_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
} from '@/lib/constants'
import type {
  GoalPriority,
  GoalStatus,
  LearnerStatus,
  ProfileStatus,
  SceneSourceType,
  SceneTaskStatus,
  ScriptStatus,
} from '@/types'

export function TaskStatusBadge({ status }: { status: SceneTaskStatus }) {
  const active = ['pending', 'queued', 'generating'].includes(status)
  return (
    <Badge tone={TASK_STATUS_TONE[status]} dot className={active ? '[&>span]:animate-pulse-soft' : ''}>
      {TASK_STATUS_LABELS[status]}
    </Badge>
  )
}

export function ScriptStatusBadge({ status }: { status: ScriptStatus }) {
  return <Badge tone={SCRIPT_STATUS_TONE[status]}>{SCRIPT_STATUS_LABELS[status]}</Badge>
}

export function GoalStatusBadge({ status }: { status: GoalStatus }) {
  return <Badge tone={GOAL_STATUS_TONE[status]}>{GOAL_STATUS_LABELS[status]}</Badge>
}

export function LearnerStatusBadge({ status }: { status: LearnerStatus }) {
  return <Badge tone={LEARNER_STATUS_TONE[status]}>{LEARNER_STATUS_LABELS[status]}</Badge>
}

export function ProfileStatusBadge({ status }: { status: ProfileStatus | 'none' }) {
  if (status === 'none') {
    return (
      <Badge tone="neutral" className="border-dashed">
        未生成
      </Badge>
    )
  }
  return (
    <Badge tone={status === 'confirmed' ? 'success' : 'warning'}>
      {PROFILE_STATUS_LABELS[status]}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: GoalPriority }) {
  const tones = { high: 'danger', medium: 'warning', low: 'neutral' } as const
  return <Badge tone={tones[priority]}>{GOAL_PRIORITY_LABELS[priority]}</Badge>
}

const sourceIcons = {
  text: FileText,
  image: ImageIcon,
  script: ListChecks,
}

export function SourceTypeBadge({ sourceType }: { sourceType: SceneSourceType }) {
  const Icon = sourceIcons[sourceType]
  return (
    <Badge tone="neutral">
      <Icon className="size-3" />
      {SOURCE_TYPE_LABELS[sourceType]}
    </Badge>
  )
}
