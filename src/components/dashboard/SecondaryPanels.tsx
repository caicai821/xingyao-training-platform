import { Link } from 'react-router-dom'
import { FileText, History, Users } from 'lucide-react'
import type {
  AbilityProfile,
  Activity,
  ActivityType,
  Learner,
  TrainingScript,
} from '@/types'
import { Avatar, SectionCard } from '@/components/ui'
import { Badge } from '@/components/ui/feedback'
import { ScriptStatusBadge } from '@/components/domain/StatusBadges'
import { latestProfileFor } from '@/lib/selectors'
import { cn, relativeTime } from '@/lib/utils'

const activityDots: Record<ActivityType, string> = {
  learner: 'bg-brand-400',
  assessment: 'bg-accent-400',
  profile: 'bg-brand-500',
  goal: 'bg-warning-500',
  script: 'bg-violet-500',
  task: 'bg-brand-300',
  asset: 'bg-success-500',
}

export function SecondaryPanels({
  scripts,
  learners,
  profiles,
  activities,
}: {
  scripts: TrainingScript[]
  learners: Learner[]
  profiles: AbilityProfile[]
  activities: Activity[]
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <SectionCard
        title="最近训练脚本"
        icon={<FileText />}
        actions={
          <Link to="/scripts" className="text-[11px] font-medium text-brand-600 hover:text-brand-700">
            全部脚本
          </Link>
        }
        contentClassName="p-0"
      >
        {scripts.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-ink-400">暂无训练脚本</p>
        ) : (
          scripts.map((script) => (
            <Link
              key={script.id}
              to={`/scripts/${script.id}`}
              className="flex items-center gap-3 border-b border-line/60 px-5 py-3 transition last:border-0 hover:bg-brand-50/35"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600 ring-1 ring-accent-100/50">
                <FileText className="size-3.5" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium text-ink-800">
                  {script.name}
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-ink-400">
                  v{script.version} · {script.steps.length} 个步骤 · {relativeTime(script.updatedAt)}
                </span>
              </span>
              <ScriptStatusBadge status={script.status} />
            </Link>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="最近学员"
        icon={<Users />}
        actions={
          <Link to="/learners" className="text-[11px] font-medium text-brand-600 hover:text-brand-700">
            全部
          </Link>
        }
        contentClassName="p-0"
      >
        {learners.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-ink-400">暂无学员档案</p>
        ) : (
          learners.map((learner) => {
            const profile = latestProfileFor(profiles, learner.id)
            return (
              <Link
                key={learner.id}
                to={`/learners/${learner.id}`}
                className="flex items-center gap-3 border-b border-line/60 px-5 py-3 transition last:border-0 hover:bg-brand-50/35"
              >
                <Avatar name={learner.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium text-ink-800">
                    {learner.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-ink-400">
                    {learner.currentGoalText || '尚未设置训练目标'}
                  </span>
                </span>
                {profile ? (
                  <Badge tone={profile.status === 'confirmed' ? 'success' : 'warning'}>
                    {profile.status === 'confirmed' ? '画像已确认' : '画像待确认'}
                  </Badge>
                ) : (
                  <Badge tone="neutral" className="border-dashed">
                    待建立画像
                  </Badge>
                )}
              </Link>
            )
          })
        )}
      </SectionCard>

      <SectionCard
        title="最近操作"
        icon={<History />}
        actions={
          <Link to="/records" className="text-[11px] font-medium text-brand-600 hover:text-brand-700">
            查看记录
          </Link>
        }
        contentClassName="px-5 py-4"
      >
        {activities.length === 0 ? (
          <p className="py-4 text-center text-xs text-ink-400">暂无操作记录</p>
        ) : (
          activities.map((activity, index) => {
            const content = (
              <>
                <span className="relative z-10 mt-1 flex size-2 shrink-0 rounded-full ring-4 ring-white">
                  <span className={cn('size-2 rounded-full', activityDots[activity.type])} />
                </span>
                <span className="min-w-0 flex-1 pb-4">
                  <span className="block text-[11px] font-medium text-ink-700">{activity.title}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-ink-400">
                    {activity.detail}
                  </span>
                  <span className="mt-1 block text-[9.5px] text-ink-300">
                    {relativeTime(activity.at)}
                  </span>
                </span>
              </>
            )
            return (
              <div key={activity.id} className="relative flex gap-3">
                {index < activities.length - 1 && (
                  <span className="absolute left-[3.5px] top-3 h-full w-px bg-line/70" />
                )}
                {activity.link ? (
                  <Link
                    to={activity.link}
                    className="flex min-w-0 flex-1 items-start gap-3 rounded-lg transition hover:bg-ink-50/60"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex min-w-0 flex-1 items-start gap-3">{content}</div>
                )}
              </div>
            )
          })
        )}
      </SectionCard>
    </div>
  )
}
