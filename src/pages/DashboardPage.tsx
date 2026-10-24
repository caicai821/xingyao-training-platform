import { Box, Clock, FileText, Users } from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { DashboardHero } from '@/components/dashboard/DashboardHero'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { WorkflowCard } from '@/components/dashboard/WorkflowCard'
import { RecentTasksCard } from '@/components/dashboard/RecentTasksCard'
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard'
import { SecondaryPanels } from '@/components/dashboard/SecondaryPanels'
import {
  cumulativeSeries,
  dailySeries,
  formatWeekDelta,
  weekOverWeek,
} from '@/lib/metrics'
import { formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const { learners, profiles, goals, scripts, tasks, assets, activities } = useAppData()

  const learnerMap = new Map(learners.map((learner) => [learner.id, learner]))
  const activeTasks = tasks.filter((task) =>
    ['pending', 'queued', 'generating'].includes(task.status),
  )
  const generatingTasks = activeTasks.filter((task) => task.status === 'generating')
  const successfulTasks = tasks.filter((task) => task.status === 'succeeded')
  const confirmedScripts = scripts.filter((script) => script.status === 'confirmed')
  const pendingScripts = scripts.filter((script) => script.status === 'generated')
  const profileLearnerCount = new Set(profiles.map((profile) => profile.learnerId)).size

  const learnerWeek = weekOverWeek(learners.map((learner) => learner.createdAt))
  const learnerSeries = cumulativeSeries(learners.map((learner) => learner.createdAt))
  const scriptSeries = cumulativeSeries(scripts.map((script) => script.createdAt))
  const taskSeries = dailySeries(tasks.map((task) => task.createdAt))
  const assetSeries = cumulativeSeries(assets.map((asset) => asset.createdAt))

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4)
  const recentScripts = [...scripts]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)
  const recentLearners = [...learners]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)
  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 4)

  return (
    <div className="animate-fade-up space-y-3">
      <DashboardHero />

      <section
        aria-label="核心指标"
        className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="学员档案"
          value={learners.length}
          unit="份"
          description={formatWeekDelta(learnerWeek, '份')}
          icon={<Users />}
          tone="brand"
          to="/learners"
          sparkValues={learnerSeries}
          sparkLabel="近 8 周学员档案累计趋势"
        />
        <MetricCard
          label="训练脚本"
          value={scripts.length}
          unit="份"
          description={`已确认 ${confirmedScripts.length} · 待确认 ${pendingScripts.length}`}
          icon={<FileText />}
          tone="mint"
          to="/scripts"
          sparkValues={scriptSeries}
          sparkLabel="近 8 周训练脚本累计趋势"
        />
        <MetricCard
          label="待处理场景任务"
          value={activeTasks.length}
          unit="个"
          description={
            activeTasks.length
              ? `其中 ${generatingTasks.length} 个正在生成`
              : '当前没有排队中的任务'
          }
          icon={<Clock />}
          tone="amber"
          to="/scenes/tasks"
          sparkValues={taskSeries}
          sparkLabel="近 7 天场景任务创建趋势"
        />
        <MetricCard
          label="场景资产"
          value={assets.length}
          unit="个"
          description={`累计完成 ${successfulTasks.length} 次场景生成`}
          icon={<Box />}
          tone="teal"
          to="/assets"
          sparkValues={assetSeries}
          sparkLabel="近 8 周场景资产累计趋势"
        />
      </section>

      <WorkflowCard
        counts={{
          learner: learners.length,
          profile: profileLearnerCount,
          goal: goals.filter((goal) => goal.status !== 'archived').length,
          script: scripts.length,
          task: activeTasks.length,
          asset: assets.length,
        }}
      />

      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(390px,1fr)]">
        <div className="min-w-0">
          <RecentTasksCard tasks={recentTasks} learnerMap={learnerMap} />
        </div>
        <QuickActionsCard />
      </div>

      <section className="pt-2">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight text-ink-900">更多工作区动态</h2>
            <p className="mt-0.5 text-[11px] text-ink-400">最近脚本、学员档案与操作记录。</p>
          </div>
        </div>
        <SecondaryPanels
          scripts={recentScripts}
          learners={recentLearners}
          profiles={profiles}
          activities={recentActivities}
        />
      </section>

      <p className="pt-1 text-center text-[10px] text-ink-300">
        {formatDate(new Date().toISOString())} · 演示环境数据均为虚构示例，仅用于产品流程演示。
      </p>
    </div>
  )
}
