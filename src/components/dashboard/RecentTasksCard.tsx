import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, FileText } from 'lucide-react'
import type { Learner, SceneTask, SceneTaskStatus } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card, EmptyState } from '@/components/ui'
import { TaskStatusBadge } from '@/components/domain/StatusBadges'
import { ProgressBar } from '@/components/ui/feedback'
import { cn, formatDateTime } from '@/lib/utils'

const statusDots: Record<SceneTaskStatus, string> = {
  draft: 'bg-ink-300',
  pending: 'bg-warning-500',
  queued: 'bg-brand-400',
  generating: 'bg-brand-500',
  succeeded: 'bg-success-500',
  failed: 'bg-danger-500',
}

export function RecentTasksCard({
  tasks,
  learnerMap,
}: {
  tasks: SceneTask[]
  learnerMap: Map<string, Learner>
}) {
  const navigate = useNavigate()

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/60 px-5 py-3 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-brand-50 text-brand-600 ring-1 ring-brand-100/60">
            <FileText className="size-4" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold tracking-tight text-ink-900">最近场景任务</h2>
            <p className="mt-0.5 text-[11px] leading-5 text-ink-400">
              任务状态与进度由服务数据驱动，生成中的任务会自动刷新。
            </p>
          </div>
        </div>
        <Link
          to="/scenes/tasks"
          className="group inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 transition hover:text-brand-700"
        >
          全部任务
          <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          compact
          icon={<FileText />}
          title="还没有场景任务"
          description="可以通过文本描述、图像或训练脚本创建第一个 3D 场景任务。"
          action={
            <Button size="sm" onClick={() => navigate('/scenes')}>
              前往场景生成中心
            </Button>
          }
        />
      ) : (
        <>
        <div className="md:hidden">
          {tasks.map((task) => {
            const learner = task.learnerId ? learnerMap.get(task.learnerId) : undefined
            return (
              <Link
                key={task.id}
                to={`/scenes/tasks/${task.id}`}
                className="flex items-start justify-between gap-3 border-b border-line/50 px-5 py-3 transition last:border-0 hover:bg-brand-50/30"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'size-1.5 shrink-0 rounded-full ring-4 ring-white',
                        statusDots[task.status],
                      )}
                    />
                    <span className="truncate text-[12.5px] font-medium text-ink-800">
                      {task.sceneName}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[10px] text-ink-400">
                    {learner?.name ?? '未关联'} · {task.sceneConfig.sceneType}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <TaskStatusBadge status={task.status} />
                  <span className="text-[10px] text-ink-300">
                    {formatDateTime(task.updatedAt)}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
        <div className="hidden flex-1 overflow-x-auto md:block">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead>
              <tr className="border-y border-line/60 bg-ink-50/40">
                <th className="w-[260px] px-5 py-2.5 text-[10.5px] font-medium tracking-wide text-ink-400">
                  任务名称
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-medium tracking-wide text-ink-400">
                  所属学员
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-medium tracking-wide text-ink-400">
                  场景类型
                </th>
                <th className="px-4 py-2.5 text-[10.5px] font-medium tracking-wide text-ink-400">
                  状态
                </th>
                <th className="px-5 py-2.5 text-right text-[10.5px] font-medium tracking-wide text-ink-400">
                  更新时间
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const learner = task.learnerId ? learnerMap.get(task.learnerId) : undefined
                const active = ['pending', 'queued', 'generating'].includes(task.status)
                return (
                  <tr
                    key={task.id}
                    onClick={() => navigate(`/scenes/tasks/${task.id}`)}
                    className="group cursor-pointer border-b border-line/50 transition-colors last:border-0 hover:bg-brand-50/30"
                  >
                    <td className="px-5 py-2.5 align-middle">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            'size-1.5 shrink-0 rounded-full ring-4 ring-white',
                            statusDots[task.status],
                          )}
                        />
                        <Link
                          to={`/scenes/tasks/${task.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="truncate rounded text-[12.5px] font-medium text-ink-800 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 group-hover:text-brand-700"
                        >
                          {task.sceneName}
                        </Link>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 align-middle">
                      <span className="text-[12px] text-ink-600">{learner?.name ?? '未关联'}</span>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <span className="whitespace-nowrap text-[11.5px] text-ink-500">
                        {task.sceneConfig.sceneType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <div className="flex items-center gap-2">
                        <TaskStatusBadge status={task.status} />
                        {active && (
                          <>
                            <ProgressBar
                              value={task.progress}
                              size="sm"
                              animated
                              className="w-12"
                            />
                            <span className="tnum text-[9.5px] text-brand-600">
                              {task.progress}%
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right align-middle">
                      <span className="text-[11px] text-ink-400">
                        {formatDateTime(task.updatedAt)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </Card>
  )
}
