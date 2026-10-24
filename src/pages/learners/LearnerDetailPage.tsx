import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Box,
  ClipboardList,
  FileText,
  MessageSquareText,
  Pencil,
  Plus,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  InfoGrid,
  SectionCard,
  Tabs,
} from '@/components/ui'
import { Alert, Badge, DemoBadge, ProgressBar } from '@/components/ui/feedback'
import {
  GoalStatusBadge,
  LearnerStatusBadge,
  PriorityBadge,
  ProfileStatusBadge,
  ScriptStatusBadge,
  SourceTypeBadge,
  TaskStatusBadge,
} from '@/components/domain/StatusBadges'
import { RadarChart, ScoreBars, TrendChart } from '@/components/charts'
import {
  ABILITY_DIMENSIONS,
  GOAL_PRIORITY_LABELS,
  SCORE_LABELS,
} from '@/lib/constants'
import {
  assessmentAverage,
  assessmentTrend,
  latestAssessmentFor,
  latestProfileFor,
  radarData,
} from '@/lib/selectors'
import { formatDate, relativeTime } from '@/lib/utils'

export default function LearnerDetailPage() {
  const { id } = useParams()
  const { learners, assessments, profiles, goals, scripts, tasks, assets } = useAppData()
  const [tab, setTab] = useState('profile')

  const learner = learners.find((item) => item.id === id)

  if (!learner) {
    return (
      <EmptyState
        icon={<UserRound />}
        title="未找到该学员档案"
        description="档案可能已被移除，或链接地址不正确。"
        action={
          <Link to="/learners">
            <Button variant="outline">返回学员列表</Button>
          </Link>
        }
        className="rounded-card border border-line bg-white shadow-card"
      />
    )
  }

  const learnerAssessments = assessments
    .filter((item) => item.learnerId === learner.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const latestAssessment = latestAssessmentFor(assessments, learner.id)
  const latestProfile = latestProfileFor(profiles, learner.id)
  const learnerGoals = goals
    .filter((goal) => goal.learnerId === learner.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  const learnerScripts = scripts
    .filter((script) => script.learnerId === learner.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  const learnerTasks = tasks
    .filter((task) => task.learnerId === learner.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const learnerAssets = assets.filter((asset) => asset.learnerId === learner.id)
  const trend = assessmentTrend(assessments, learner.id).map((item) => ({
    label: formatDate(item.createdAt).slice(5),
    value: assessmentAverage(item),
  }))

  const tabs = [
    { key: 'profile', label: '能力画像', count: latestProfile ? 1 : 0 },
    { key: 'training', label: '训练方案与脚本', count: learnerGoals.length + learnerScripts.length },
    { key: 'tasks', label: '场景任务', count: learnerTasks.length },
    { key: 'assessments', label: '能力记录', count: learnerAssessments.length },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={learner.name}
        description={`${learner.code} · ${learner.ageGroup} · 最近更新于 ${relativeTime(learner.updatedAt)}`}
        breadcrumbs={[
          { label: '学员档案', to: '/learners' },
          { label: learner.name },
        ]}
        actions={
          <>
            <Link to={`/learners/${learner.id}/edit`}>
              <Button variant="outline" icon={<Pencil />}>
                编辑档案
              </Button>
            </Link>
            <Link to={`/learners/${learner.id}/assessment`}>
              <Button variant="outline" icon={<ClipboardList />}>
                录入能力信息
              </Button>
            </Link>
            <Link to={`/profiles/${learner.id}`}>
              <Button icon={<Sparkles />}>查看能力画像</Button>
            </Link>
          </>
        }
      />

      <Card className="mb-5 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex items-start gap-4 lg:w-[300px] lg:shrink-0">
            <Avatar name={learner.name} size="xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-ink-900">{learner.name}</h2>
                <LearnerStatusBadge status={learner.status} />
              </div>
              <p className="mt-1 text-xs text-ink-400">
                {learner.nickname ? `${learner.nickname} · ` : ''}
                {learner.ageGroup}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {learner.traits.slice(0, 4).map((trait) => (
                  <Badge key={trait} tone="neutral">
                    {trait}
                  </Badge>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {learner.interests.slice(0, 4).map((interest) => (
                  <span
                    key={interest}
                    className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] text-brand-700"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden h-24 w-px self-stretch bg-line lg:block" />
          <InfoGrid
            columns={3}
            className="flex-1"
            items={[
              { label: '档案编号', value: learner.code },
              {
                label: '最近能力评估',
                value: latestAssessment
                  ? `${formatDate(latestAssessment.createdAt)} · 综合 ${assessmentAverage(latestAssessment).toFixed(1)}`
                  : '尚未录入',
              },
              {
                label: '能力画像',
                value: <ProfileStatusBadge status={latestProfile?.status ?? 'none'} />,
              },
              { label: '当前训练目标', value: learner.currentGoalText || '尚未设置' },
              {
                label: '训练记录',
                value: `${learnerGoals.length} 个目标 · ${learnerScripts.length} 份脚本 · ${learnerTasks.length} 个场景任务`,
              },
              { label: '最近更新', value: relativeTime(learner.updatedAt) },
            ]}
          />
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <Card className="p-5 sm:p-6">
            <Tabs items={tabs} value={tab} onChange={setTab} />

            <div className="pt-5">
              {tab === 'profile' && (
                <div className="space-y-5">
                  {latestProfile ? (
                    <>
                      {latestProfile.status === 'unconfirmed' && (
                        <Alert
                          tone="warning"
                          title="该能力画像尚未确认"
                          description="分析结果仅作辅助参考，请核对后确认，再用于训练目标与脚本设计。"
                          action={
                            <Link to={`/profiles/${learner.id}`}>
                              <Button size="sm" variant="outline">
                                去确认
                              </Button>
                            </Link>
                          }
                        />
                      )}
                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <ProfileStatusBadge status={latestProfile.status} />
                            {latestProfile.isDemo && <DemoBadge label="分析演示" />}
                            <span className="text-[11px] text-ink-400">
                              更新于 {relativeTime(latestProfile.updatedAt)}
                            </span>
                          </div>
                          <Link
                            to={`/profiles/${learner.id}`}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700"
                          >
                            查看完整画像与编辑
                          </Link>
                        </div>
                        <p className="mt-3 text-[13px] leading-7 text-ink-600">
                          {latestProfile.summary}
                        </p>
                      </div>

                      {latestAssessment && (
                        <div className="grid gap-6 rounded-xl border border-line bg-ink-50/30 p-4 lg:grid-cols-2">
                          <div>
                            <p className="mb-1 text-xs font-medium text-ink-700">能力维度概览</p>
                            <RadarChart data={radarData(latestAssessment.scores)} />
                          </div>
                          <div>
                            <p className="mb-3 text-xs font-medium text-ink-700">维度评分</p>
                            <ScoreBars
                              items={ABILITY_DIMENSIONS.map((dimension) => ({
                                label: dimension.name,
                                value: latestAssessment.scores[dimension.key].score,
                                detail: SCORE_LABELS[latestAssessment.scores[dimension.key].score],
                              }))}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-success-100 bg-success-50/40 p-4">
                          <p className="text-xs font-medium text-success-600">已有优势</p>
                          <ul className="mt-2 space-y-1.5">
                            {latestProfile.strengths.map((item) => (
                              <li key={item} className="flex gap-2 text-xs leading-5 text-ink-600">
                                <span className="mt-2 size-1 shrink-0 rounded-full bg-success-500" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-xl border border-warning-100 bg-warning-50/40 p-4">
                          <p className="text-xs font-medium text-warning-600">值得关注的发展方向</p>
                          <ul className="mt-2 space-y-1.5">
                            {latestProfile.developmentAreas.map((item) => (
                              <li key={item} className="flex gap-2 text-xs leading-5 text-ink-600">
                                <span className="mt-2 size-1 shrink-0 rounded-full bg-warning-500" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-ink-700">建议的下一步</p>
                        <ol className="mt-2 space-y-2">
                          {latestProfile.recommendations.map((item, index) => (
                            <li key={item} className="flex gap-2.5 text-xs leading-5 text-ink-600">
                              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-medium text-brand-700">
                                {index + 1}
                              </span>
                              {item}
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                        <Link to={`/goals/new?learner=${learner.id}`}>
                          <Button size="sm" variant="secondary" icon={<Target />}>
                            基于画像创建训练目标
                          </Button>
                        </Link>
                        <Link to={`/scripts/new?learner=${learner.id}`}>
                          <Button size="sm" variant="outline" icon={<FileText />}>
                            生成训练脚本
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : latestAssessment ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-line bg-ink-50/30 p-4">
                        <p className="mb-2 text-xs font-medium text-ink-700">
                          最近一次能力记录 · {formatDate(latestAssessment.createdAt)}
                        </p>
                        <RadarChart data={radarData(latestAssessment.scores)} />
                      </div>
                      <Alert
                        tone="info"
                        title="已有能力信息，尚未生成能力画像"
                        description="可基于最近一次能力记录生成画像分析，并由使用者核对确认。"
                        action={
                          <Link to={`/profiles/${learner.id}`}>
                            <Button size="sm">生成能力画像</Button>
                          </Link>
                        }
                      />
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Sparkles />}
                      title="尚未建立能力画像"
                      description="先录入能力信息，再生成能力画像，用于确定训练目标与脚本方向。"
                      action={
                        <Link to={`/learners/${learner.id}/assessment`}>
                          <Button icon={<ClipboardList />}>录入能力信息</Button>
                        </Link>
                      }
                    />
                  )}
                </div>
              )}

              {tab === 'training' && (
                <div className="space-y-5">
                  <SectionCard
                    title="训练目标"
                    description="与当前学员关联的训练方向。"
                    actions={
                      <Link to={`/goals/new?learner=${learner.id}`}>
                        <Button size="sm" variant="outline" icon={<Plus />}>
                          新建目标
                        </Button>
                      </Link>
                    }
                    contentClassName="p-0"
                  >
                    {learnerGoals.length === 0 ? (
                      <EmptyState compact icon={<Target />} title="还没有训练目标" />
                    ) : (
                      learnerGoals.map((goal) => (
                        <div
                          key={goal.id}
                          className="flex flex-wrap items-start gap-3 border-b border-line/70 px-5 py-3.5 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[13px] font-medium text-ink-800">{goal.title}</p>
                              <GoalStatusBadge status={goal.status} />
                              <PriorityBadge priority={goal.priority} />
                            </div>
                            <p className="mt-1 line-clamp-2-safe text-[11px] leading-5 text-ink-400">
                              {goal.description}
                            </p>
                            <p className="mt-1 text-[10px] text-ink-300">
                              {goal.category}
                              {goal.targetDate ? ` · 目标日期 ${goal.targetDate}` : ''}
                              {` · ${GOAL_PRIORITY_LABELS[goal.priority]}`}
                            </p>
                          </div>
                          <Link
                            to={`/scripts/new?learner=${learner.id}&goal=${goal.id}`}
                            className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700"
                          >
                            生成脚本
                          </Link>
                        </div>
                      ))
                    )}
                  </SectionCard>

                  <SectionCard
                    title="训练脚本"
                    actions={
                      <Link to={`/scripts/new?learner=${learner.id}`}>
                        <Button size="sm" variant="outline" icon={<Plus />}>
                          生成脚本
                        </Button>
                      </Link>
                    }
                    contentClassName="p-0"
                  >
                    {learnerScripts.length === 0 ? (
                      <EmptyState compact icon={<FileText />} title="还没有训练脚本" />
                    ) : (
                      learnerScripts.map((script) => (
                        <Link
                          key={script.id}
                          to={`/scripts/${script.id}`}
                          className="flex items-start gap-3 border-b border-line/70 px-5 py-3.5 transition last:border-0 hover:bg-ink-50/60"
                        >
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                            <FileText className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-[13px] font-medium text-ink-800">
                                {script.name}
                              </span>
                              <ScriptStatusBadge status={script.status} />
                            </span>
                            <span className="mt-0.5 block text-[11px] text-ink-400">
                              {script.code} · v{script.version} · {script.steps.length} 个步骤 ·
                              更新于 {relativeTime(script.updatedAt)}
                            </span>
                          </span>
                        </Link>
                      ))
                    )}
                  </SectionCard>
                </div>
              )}

              {tab === 'tasks' && (
                <SectionCard
                  title="场景生成任务"
                  description={`该学员关联的 ${learnerTasks.length} 个任务，以及 ${learnerAssets.length} 个场景资产。`}
                  actions={
                    <Link to={`/scenes/text?learner=${learner.id}`}>
                      <Button size="sm" variant="outline" icon={<Plus />}>
                        创建场景
                      </Button>
                    </Link>
                  }
                  contentClassName="p-0"
                >
                  {learnerTasks.length === 0 ? (
                    <EmptyState
                      compact
                      icon={<Box />}
                      title="还没有场景生成任务"
                      description="可以从训练脚本生成对应场景，也可以通过文本或图像独立创建。"
                    />
                  ) : (
                    learnerTasks.map((task) => {
                      const active = ['pending', 'queued', 'generating'].includes(task.status)
                      return (
                        <Link
                          key={task.id}
                          to={`/scenes/tasks/${task.id}`}
                          className="flex items-start gap-3 border-b border-line/70 px-5 py-3.5 transition last:border-0 hover:bg-ink-50/60"
                        >
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                            <Box className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-[13px] font-medium text-ink-800">
                                {task.sceneName}
                              </span>
                              <TaskStatusBadge status={task.status} />
                              <SourceTypeBadge sourceType={task.sourceType} />
                            </span>
                            <span className="mt-0.5 block text-[11px] text-ink-400">
                              {task.code} · {relativeTime(task.createdAt)}
                            </span>
                            {active && (
                              <span className="mt-2 flex items-center gap-2">
                                <ProgressBar value={task.progress} size="sm" animated />
                                <span className="tnum text-[10px] text-ink-400">{task.progress}%</span>
                              </span>
                            )}
                          </span>
                        </Link>
                      )
                    })
                  )}
                </SectionCard>
              )}

              {tab === 'assessments' && (
                <div className="space-y-5">
                  {trend.length >= 2 && (
                    <div className="rounded-xl border border-line bg-ink-50/30 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium text-ink-700">综合评分趋势</p>
                        <span className="text-[10px] text-ink-400">仅基于已有能力记录</span>
                      </div>
                      <TrendChart points={trend} />
                    </div>
                  )}
                  {latestAssessment && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-ink-400">
                        共 {learnerAssessments.length} 次能力记录，评分仅用于记录当前观察。
                      </p>
                      <Link to={`/learners/${learner.id}/assessment`}>
                        <Button size="sm" variant="outline" icon={<Plus />}>
                          新增记录
                        </Button>
                      </Link>
                    </div>
                  )}
                  {learnerAssessments.length === 0 ? (
                    <EmptyState
                      compact
                      icon={<ClipboardList />}
                      title="还没有能力信息记录"
                      action={
                        <Link to={`/learners/${learner.id}/assessment`}>
                          <Button size="sm">录入能力信息</Button>
                        </Link>
                      }
                    />
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-line">
                      {learnerAssessments.map((assessment) => {
                        const topDimensions = [...ABILITY_DIMENSIONS]
                          .sort(
                            (a, b) =>
                              assessment.scores[b.key].score - assessment.scores[a.key].score,
                          )
                          .slice(0, 2)
                        return (
                          <div
                            key={assessment.id}
                            className="flex flex-wrap items-start gap-3 border-b border-line/70 bg-white px-4 py-3.5 last:border-0"
                          >
                            <span className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                              <span className="text-[10px] leading-3">综合</span>
                              <span className="tnum text-sm font-semibold leading-5">
                                {assessmentAverage(assessment).toFixed(1)}
                              </span>
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-ink-800">
                                {formatDate(assessment.createdAt)} · {assessment.author}
                              </p>
                              <p className="mt-0.5 text-[11px] text-ink-400">
                                相对优势：{topDimensions.map((item) => item.shortName).join('、')}
                              </p>
                              {assessment.generalNotes && (
                                <p className="mt-1 line-clamp-2-safe text-[11px] leading-5 text-ink-500">
                                  {assessment.generalNotes}
                                </p>
                              )}
                            </div>
                            {assessment.id === latestAssessment?.id && (
                              <Badge tone="brand">最近一次</Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <SectionCard title="沟通与支持" icon={<MessageSquareText />}>
            <div className="space-y-4">
              {[
                ['沟通方式及表达特点', learner.communicationStyle],
                ['适合的提示方式', learner.promptPreference],
                ['需要关注的环境因素', learner.environmentNotes],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] text-ink-400">{label}</p>
                  <p className="mt-1 text-xs leading-6 text-ink-700">
                    {value || <span className="text-ink-300">未填写</span>}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="关联记录" contentClassName="p-0">
            {[
              { label: '训练目标', count: learnerGoals.length, to: '/goals', icon: Target },
              { label: '训练脚本', count: learnerScripts.length, to: '/scripts', icon: FileText },
              { label: '场景任务', count: learnerTasks.length, to: '/scenes/tasks', icon: Box },
              { label: '场景资产', count: learnerAssets.length, to: '/assets', icon: Box },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex items-center gap-3 border-b border-line/70 px-5 py-3 transition last:border-0 hover:bg-ink-50/60"
                >
                  <Icon className="size-4 text-ink-400" />
                  <span className="flex-1 text-xs text-ink-600">{item.label}</span>
                  <span className="tnum text-xs font-medium text-ink-800">{item.count}</span>
                </Link>
              )
            })}
          </SectionCard>

          <Card className="p-5">
            <p className="text-xs font-medium text-ink-700">档案备注</p>
            <p className="mt-2 text-xs leading-6 text-ink-500">
              {learner.notes || '暂无备注信息。'}
            </p>
            <div className="mt-4 border-t border-line pt-3 text-[10px] leading-5 text-ink-300">
              档案创建于 {formatDate(learner.createdAt)} · 最近更新 {relativeTime(learner.updatedAt)}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
