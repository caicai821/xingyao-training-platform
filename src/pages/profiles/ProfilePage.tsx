import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Pencil,
  RefreshCw,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { useToast } from '@/context/ToastContext'
import { errorMessage } from '@/hooks/useAsyncAction'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  SectionCard,
  TagInput,
  Textarea,
} from '@/components/ui'
import { Alert, Badge, DemoBadge, Skeleton, Spinner } from '@/components/ui/feedback'
import {
  GoalStatusBadge,
  LearnerStatusBadge,
  ProfileStatusBadge,
} from '@/components/domain/StatusBadges'
import { RadarChart, ScoreBars, TrendChart } from '@/components/charts'
import {
  ABILITY_DIMENSIONS,
  SCORE_LABELS,
} from '@/lib/constants'
import {
  assessmentAverage,
  assessmentTrend,
  latestAssessmentFor,
  latestProfileFor,
  radarData,
} from '@/lib/selectors'
import { formatDate, formatDateTime, relativeTime } from '@/lib/utils'
import type { AbilityProfile } from '@/types'

type ProfileEditForm = Pick<
  AbilityProfile,
  | 'summary'
  | 'strengths'
  | 'developmentAreas'
  | 'recommendations'
  | 'dimensionInsights'
  | 'observationSnapshot'
>

export default function ProfilePage() {
  const { learnerId } = useParams()
  const [searchParams] = useSearchParams()
  const { learners, assessments, profiles, goals, scripts, services, refreshAll } = useAppData()
  const { toast } = useToast()

  const [extraNotes, setExtraNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<ProfileEditForm | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [regenerateOpen, setRegenerateOpen] = useState(false)

  const learner = learners.find((item) => item.id === learnerId)
  const latestAssessment = useMemo(
    () => (learnerId ? latestAssessmentFor(assessments, learnerId) : undefined),
    [assessments, learnerId],
  )
  const latestProfile = useMemo(
    () => (learnerId ? latestProfileFor(profiles, learnerId) : undefined),
    [learnerId, profiles],
  )
  const trend = useMemo(() => {
    if (!learnerId) return []
    return assessmentTrend(assessments, learnerId).map((item) => ({
      label: formatDate(item.createdAt).slice(5),
      value: assessmentAverage(item),
    }))
  }, [assessments, learnerId])

  const learnerGoals = goals.filter((goal) => goal.learnerId === learnerId)
  const learnerScripts = scripts.filter((script) => script.learnerId === learnerId)
  const profileMatchesLatest = Boolean(
    latestProfile && latestAssessment && latestProfile.assessmentId === latestAssessment.id,
  )
  const isFresh = searchParams.get('fresh') === '1'

  useEffect(() => {
    setEditing(false)
    setEditForm(null)
  }, [latestProfile?.id])

  if (!learner) {
    return (
      <EmptyState
        icon={<UserRound />}
        title="未找到对应学员"
        description="学员档案可能已被移除，或链接地址不正确。"
        action={
          <Link to="/profiles">
            <Button variant="outline">返回能力画像列表</Button>
          </Link>
        }
        className="rounded-card border border-line bg-white shadow-card"
      />
    )
  }

  if (!latestAssessment) {
    return (
      <div className="animate-fade-up">
        <PageHeader
          title={`${learner.name} · 能力画像`}
          description="生成能力画像前，需要先录入至少一次能力信息。"
          breadcrumbs={[
            { label: '能力画像', to: '/profiles' },
            { label: learner.name },
          ]}
          actions={
            <Link to={`/learners/${learner.id}`}>
              <Button variant="outline">返回学员档案</Button>
            </Link>
          }
        />
        <Card>
          <EmptyState
            icon={<ClipboardList />}
            title="尚未录入能力信息"
            description="能力信息是生成画像与分析训练方向的基础，录入后即可在此生成能力画像。"
            action={
              <Link to={`/learners/${learner.id}/assessment`}>
                <Button icon={<ClipboardList />}>录入能力信息</Button>
              </Link>
            }
          />
        </Card>
      </div>
    )
  }

  const radar = radarData(latestAssessment.scores)

  const runGenerate = async () => {
    if (!latestAssessment) return
    setGenerating(true)
    setRegenerateOpen(false)
    try {
      await services.profiles.generate({
        learnerId: learner.id,
        assessmentId: latestAssessment.id,
        extraNotes,
      })
      await refreshAll(true)
      setExtraNotes('')
      toast({
        title: '能力画像已生成',
        description: '分析结果已保存为待确认状态，请核对内容后确认。',
      })
    } catch (cause) {
      toast({ tone: 'error', title: '生成失败', description: errorMessage(cause) })
    } finally {
      setGenerating(false)
    }
  }

  const requestGenerate = () => {
    if (latestProfile) {
      setRegenerateOpen(true)
    } else {
      void runGenerate()
    }
  }

  const startEditing = () => {
    if (!latestProfile) return
    setEditForm({
      summary: latestProfile.summary,
      strengths: [...latestProfile.strengths],
      developmentAreas: [...latestProfile.developmentAreas],
      recommendations: [...latestProfile.recommendations],
      dimensionInsights: { ...latestProfile.dimensionInsights },
      observationSnapshot: latestProfile.observationSnapshot,
    })
    setEditing(true)
  }

  const saveEditing = async () => {
    if (!latestProfile || !editForm) return
    setSaving(true)
    try {
      await services.profiles.update(latestProfile.id, editForm)
      await refreshAll(true)
      setEditing(false)
      setEditForm(null)
      toast({
        title: '分析内容已保存',
        description: '修改后将恢复为待确认状态，请核对后重新确认。',
      })
    } catch (cause) {
      toast({ tone: 'error', title: '保存失败', description: errorMessage(cause) })
    } finally {
      setSaving(false)
    }
  }

  const confirmProfile = async () => {
    if (!latestProfile) return
    setSaving(true)
    try {
      await services.profiles.confirm(latestProfile.id)
      await refreshAll(true)
      setConfirmOpen(false)
      toast({ title: '能力画像已确认', description: '可基于该画像创建训练目标与训练脚本。' })
    } catch (cause) {
      toast({ tone: 'error', title: '确认失败', description: errorMessage(cause) })
    } finally {
      setSaving(false)
    }
  }

  const headerActions = (
    <>
      <Link to={`/learners/${learner.id}/assessment`}>
        <Button variant="outline" icon={<ClipboardList />}>
          录入新的能力信息
        </Button>
      </Link>
      {latestProfile?.status === 'confirmed' && (
        <Link to={`/goals/new?learner=${learner.id}`}>
          <Button icon={<Target />}>创建训练目标</Button>
        </Link>
      )}
    </>
  )

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`${learner.name} · 能力画像`}
        description={
          latestProfile && !profileMatchesLatest
            ? `最新能力记录为 ${formatDate(latestAssessment.createdAt)}；当前画像基于较早的记录，建议重新生成后再使用。`
            : `基于 ${formatDate(latestAssessment.createdAt)} 的能力记录${
                latestProfile ? `，画像更新于 ${relativeTime(latestProfile.updatedAt)}` : ''
              }。分析结果仅作辅助参考，需由使用者核对确认。`
        }
        breadcrumbs={[
          { label: '能力画像', to: '/profiles' },
          { label: learner.name },
        ]}
        meta={
          latestProfile && <ProfileStatusBadge status={latestProfile.status} />
        }
        actions={headerActions}
      />

      {isFresh && (
        <Alert
          tone="success"
          title="新的能力记录已保存"
          description="可补充本次观察记录后生成新的能力画像；历史分析结果不会被覆盖。"
          className="mb-5"
        />
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-[15px] font-semibold text-ink-900">能力信息概况</h2>
                <p className="mt-0.5 text-xs text-ink-400">
                  {formatDate(latestAssessment.createdAt)} · {latestAssessment.author} · 综合{' '}
                  {assessmentAverage(latestAssessment).toFixed(1)} / 5
                </p>
              </div>
              <Link
                to={`/learners/${learner.id}/assessment`}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                新增能力记录
              </Link>
            </div>
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-ink-700">能力维度雷达图</p>
                <RadarChart data={radar} />
              </div>
              <div>
                <p className="mb-3 text-xs font-medium text-ink-700">各维度评分</p>
                <ScoreBars
                  items={ABILITY_DIMENSIONS.map((dimension) => ({
                    label: dimension.name,
                    value: latestAssessment.scores[dimension.key].score,
                    detail: SCORE_LABELS[latestAssessment.scores[dimension.key].score],
                  }))}
                />
              </div>
            </div>
            <div className="border-t border-line px-5 py-4 sm:px-6">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-ink-700">历史综合评分趋势</p>
                {trend.length < 2 && (
                  <span className="text-[10px] text-ink-400">当前仅有 1 次记录，暂不展示趋势</span>
                )}
              </div>
              {trend.length >= 2 ? (
                <TrendChart points={trend} />
              ) : (
                <p className="rounded-lg bg-ink-50/70 px-3 py-3 text-[11px] leading-5 text-ink-400">
                  历史趋势仅在存在多次能力记录时展示，不对缺失数据做推测。
                </p>
              )}
            </div>
          </Card>

          <SectionCard
            title="典型观察记录"
            description={`基于 ${formatDate(latestAssessment.createdAt)} 的能力记录整理，可作为生成分析时的参考。`}
            icon={<ClipboardList />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {ABILITY_DIMENSIONS.filter(
                (dimension) => latestAssessment.scores[dimension.key].observation,
              ).map((dimension) => (
                <div key={dimension.key} className="rounded-xl border border-line bg-ink-50/30 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-ink-700">{dimension.name}</p>
                    <span className="text-[10px] text-ink-400">
                      {latestAssessment.scores[dimension.key].score} 分
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-5 text-ink-500">
                    {latestAssessment.scores[dimension.key].observation}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="补充观察记录"
            description="可补充最近一段时间的观察、任务表现或需要特别说明的背景信息。"
            icon={<Sparkles />}
            actions={<DemoBadge label="模拟分析服务" />}
          >
            <Field label="补充说明（可选）">
              <Textarea
                value={extraNotes}
                onChange={(event) => setExtraNotes(event.target.value)}
                placeholder="例如：近两周在点心时间主动表达 2–3 次/天；小组活动中仍需要提示后参与。"
                disabled={generating}
              />
            </Field>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] leading-5 text-ink-400">
                分析将基于最新能力记录与补充说明生成，结果会关联至该学员档案。
              </p>
              <Button
                icon={<Sparkles />}
                onClick={requestGenerate}
                loading={generating}
              >
                {latestProfile ? '重新生成能力画像' : '生成能力画像'}
              </Button>
            </div>
          </SectionCard>

          {latestProfile && !profileMatchesLatest && (
            <Alert
              tone="warning"
              title="最新能力记录尚未纳入分析"
              description={`当前画像基于 ${formatDate(
                assessments.find((item) => item.id === latestProfile.assessmentId)?.createdAt ?? latestProfile.createdAt,
              )} 的能力记录；最近一次记录为 ${formatDate(latestAssessment.createdAt)}。建议生成新的画像。`}
              action={
                <Button size="sm" variant="outline" onClick={requestGenerate}>
                  生成新画像
                </Button>
              }
            />
          )}

          {generating ? (
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Spinner label="正在生成能力画像" />
                <span className="text-[11px] text-ink-400">通常需要数秒</span>
              </div>
              <p className="mt-3 text-xs leading-6 text-ink-500">
                正在汇总能力维度评分、已有优势与补充观察，生成后会显示在此处供你核对和修改。
              </p>
              <div className="mt-5 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </Card>
          ) : latestProfile ? (
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-semibold text-ink-900">能力画像分析结果</h2>
                    <ProfileStatusBadge status={latestProfile.status} />
                    {latestProfile.isDemo && <DemoBadge label="演示分析" />}
                  </div>
                  <p className="mt-1 text-[11px] text-ink-400">
                    生成于 {formatDateTime(latestProfile.createdAt)} · 最近更新 {relativeTime(latestProfile.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editing ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(false)
                          setEditForm(null)
                        }}
                        disabled={saving}
                      >
                        取消编辑
                      </Button>
                      <Button size="sm" onClick={saveEditing} loading={saving}>
                        保存修改
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" icon={<Pencil />} onClick={startEditing}>
                        编辑内容
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<RefreshCw />}
                        onClick={requestGenerate}
                        disabled={generating}
                      >
                        重新生成
                      </Button>
                      {latestProfile.status === 'unconfirmed' && (
                        <Button size="sm" icon={<CheckCircle2 />} onClick={() => setConfirmOpen(true)}>
                          确认画像
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                {latestProfile.status === 'unconfirmed' ? (
                  <Alert
                    tone="warning"
                    title="分析结果待确认"
                    description="以下内容由模拟分析服务生成，仅作辅助参考。请核对并修改后再确认，确认后可据此创建训练目标。"
                  />
                ) : (
                  <Alert
                    tone="success"
                    title="画像已确认"
                    description="该画像已由使用者确认，可作为训练目标与脚本生成的参考。"
                    action={
                      <Link to={`/goals/new?learner=${learner.id}`}>
                        <Button size="sm" variant="outline" icon={<Target />}>
                          创建训练目标
                        </Button>
                      </Link>
                    }
                  />
                )}

                <div>
                  <p className="mb-2 text-xs font-medium text-ink-700">能力特点概述</p>
                  {editing && editForm ? (
                    <Textarea
                      value={editForm.summary}
                      onChange={(event) =>
                        setEditForm((previous) =>
                          previous ? { ...previous, summary: event.target.value } : previous,
                        )
                      }
                      className="min-h-[110px]"
                    />
                  ) : (
                    <p className="rounded-xl border border-line bg-ink-50/30 p-4 text-[13px] leading-7 text-ink-600">
                      {latestProfile.summary}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-success-100 bg-success-50/40 p-4">
                    <p className="text-xs font-medium text-success-600">已有优势</p>
                    {editing && editForm ? (
                      <div className="mt-2">
                        <TagInput
                          value={editForm.strengths}
                          onChange={(value) =>
                            setEditForm((previous) => (previous ? { ...previous, strengths: value } : previous))
                          }
                          placeholder="添加优势"
                        />
                      </div>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {latestProfile.strengths.map((item) => (
                          <li key={item} className="flex gap-2 text-xs leading-5 text-ink-600">
                            <span className="mt-2 size-1 shrink-0 rounded-full bg-success-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-xl border border-warning-100 bg-warning-50/40 p-4">
                    <p className="text-xs font-medium text-warning-600">值得关注的发展方向</p>
                    {editing && editForm ? (
                      <div className="mt-2">
                        <TagInput
                          value={editForm.developmentAreas}
                          onChange={(value) =>
                            setEditForm((previous) =>
                              previous ? { ...previous, developmentAreas: value } : previous,
                            )
                          }
                          placeholder="添加关注方向"
                        />
                      </div>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {latestProfile.developmentAreas.map((item) => (
                          <li key={item} className="flex gap-2 text-xs leading-5 text-ink-600">
                            <span className="mt-2 size-1 shrink-0 rounded-full bg-warning-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-ink-700">建议的下一步</p>
                  {editing && editForm ? (
                    <TagInput
                      value={editForm.recommendations}
                      onChange={(value) =>
                        setEditForm((previous) => (previous ? { ...previous, recommendations: value } : previous))
                      }
                      placeholder="输入建议后按回车添加"
                    />
                  ) : (
                    <ol className="space-y-2">
                      {latestProfile.recommendations.map((item, index) => (
                        <li key={item} className="flex gap-2.5 text-xs leading-5 text-ink-600">
                          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-medium text-brand-700">
                            {index + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-ink-700">各维度分析说明</p>
                  {editing && editForm ? (
                    <div className="space-y-3">
                      {ABILITY_DIMENSIONS.map((dimension) => (
                        <div key={dimension.key} className="rounded-lg border border-line p-3">
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-ink-700">{dimension.name}</p>
                            <span className="tnum text-xs text-ink-500">
                              {latestAssessment.scores[dimension.key].score} 分
                            </span>
                          </div>
                          <Textarea
                            value={editForm.dimensionInsights[dimension.key] ?? ''}
                            onChange={(event) =>
                              setEditForm((previous) =>
                                previous
                                  ? {
                                      ...previous,
                                      dimensionInsights: {
                                        ...previous.dimensionInsights,
                                        [dimension.key]: event.target.value,
                                      },
                                    }
                                  : previous,
                              )
                            }
                            className="min-h-[64px] text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {ABILITY_DIMENSIONS.map((dimension) => (
                        <div key={dimension.key} className="rounded-xl border border-line p-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-ink-700">{dimension.shortName}</p>
                            <Badge tone="brand">
                              {latestAssessment.scores[dimension.key].score} 分
                            </Badge>
                          </div>
                          <p className="mt-1.5 text-[11px] leading-5 text-ink-500">
                            {latestProfile.dimensionInsights[dimension.key]}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-ink-700">本次观察依据</p>
                  {editing && editForm ? (
                    <Textarea
                      value={editForm.observationSnapshot}
                      onChange={(event) =>
                        setEditForm((previous) =>
                          previous ? { ...previous, observationSnapshot: event.target.value } : previous,
                        )
                      }
                      className="min-h-[80px]"
                    />
                  ) : (
                    <p className="rounded-lg bg-ink-50 px-3.5 py-3 text-[11px] leading-5 text-ink-500">
                      {latestProfile.observationSnapshot}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-ink-50/40 px-5 py-3.5 sm:px-6">
                <p className="text-[10px] text-ink-400">
                  分析来源：{latestProfile.generatedBy === 'mock' ? '模拟分析服务' : '外部分析服务'} · 仅用于辅助参考
                </p>
                {latestProfile.status === 'confirmed' && !editing && (
                  <div className="flex gap-2">
                    <Link to={`/scripts/new?learner=${learner.id}`}>
                      <Button size="sm" variant="outline" icon={<FileText />}>
                        生成训练脚本
                      </Button>
                    </Link>
                    <Link to={`/goals/new?learner=${learner.id}`}>
                      <Button size="sm" icon={<Target />}>
                        创建训练目标
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon={<Sparkles />}
                title="尚未生成能力画像"
                description="将基于最新能力记录生成分析结果，你可以查看、修改并确认分析内容。"
                action={
                  <Button icon={<Sparkles />} onClick={requestGenerate} loading={generating}>
                    生成能力画像
                  </Button>
                }
              />
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Avatar name={learner.name} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/learners/${learner.id}`}
                    className="text-sm font-semibold text-ink-900 hover:text-brand-700"
                  >
                    {learner.name}
                  </Link>
                  <LearnerStatusBadge status={learner.status} />
                </div>
                <p className="mt-0.5 text-[11px] text-ink-400">
                  {learner.code} · {learner.ageGroup}
                </p>
                <div className="mt-1.5">
                  <ProfileStatusBadge status={latestProfile?.status ?? 'none'} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {learner.traits.slice(0, 4).map((trait) => (
                <Badge key={trait} tone="neutral">
                  {trait}
                </Badge>
              ))}
            </div>
            <div className="mt-4 space-y-3 border-t border-line pt-4">
              <div>
                <p className="text-[10px] text-ink-400">当前训练目标</p>
                <p className="mt-0.5 text-xs leading-5 text-ink-700">
                  {learner.currentGoalText || '尚未设置'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-ink-400">最近能力评估</p>
                <p className="mt-0.5 text-xs leading-5 text-ink-700">
                  {formatDate(latestAssessment.createdAt)} · 综合{' '}
                  {assessmentAverage(latestAssessment).toFixed(1)} / 5
                </p>
              </div>
              <div>
                <p className="text-[10px] text-ink-400">关联记录</p>
                <p className="mt-0.5 text-xs leading-5 text-ink-700">
                  {learnerGoals.length} 个训练目标 · {learnerScripts.length} 份训练脚本
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={`/learners/${learner.id}`}>
                <Button size="sm" variant="outline">
                  查看学员档案
                </Button>
              </Link>
              <Link to={`/learners/${learner.id}/assessment`}>
                <Button size="sm" variant="ghost">
                  录入能力信息
                </Button>
              </Link>
            </div>
          </Card>

          {learnerGoals.length > 0 && (
            <SectionCard title="关联训练目标" contentClassName="p-0">
              {learnerGoals.slice(0, 3).map((goal) => (
                <Link
                  key={goal.id}
                  to={`/goals?learner=${learner.id}`}
                  className="flex items-center gap-2 border-b border-line/70 px-5 py-3 last:border-0 hover:bg-ink-50/60"
                >
                  <span className="min-w-0 flex-1 truncate text-xs text-ink-600">{goal.title}</span>
                  <GoalStatusBadge status={goal.status} />
                </Link>
              ))}
            </SectionCard>
          )}

          <Alert
            tone="info"
            title="分析与使用边界"
            description={
              <>
                能力画像由{latestProfile?.generatedBy === 'api' ? '外部分析服务' : '模拟分析服务'}生成，
                仅用于辅助整理观察与训练方向，不替代专业评估或诊断。使用者应核对内容并保存确认。
                所有演示学员与记录均为虚构数据。
              </>
            }
          />

          <SectionCard title="分析流程" description="结果可修改，不会直接视为客观事实。">
            <ol className="space-y-3">
              {[
                '查看已有能力信息与观察记录',
                '补充本次观察或背景说明',
                '生成能力画像分析结果',
                '核对、修改并确认分析内容',
                '基于确认后的画像创建训练目标',
              ].map((item, index) => (
                <li key={item} className="flex gap-2.5 text-[11px] leading-5 text-ink-500">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[9px] font-medium text-ink-500">
                    {index + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="确认能力画像"
        description="确认后，该分析结果将作为训练目标与脚本生成的参考依据。你仍可以在后续修改并重新确认。"
        confirmLabel="确认画像"
        onConfirm={confirmProfile}
        onClose={() => setConfirmOpen(false)}
        loading={saving}
      />

      <ConfirmDialog
        open={regenerateOpen}
        title="重新生成能力画像"
        description="系统将基于最新能力记录生成一份新的待确认分析结果。现有画像会保留在历史记录中，不会被直接覆盖。"
        confirmLabel="开始生成"
        onConfirm={runGenerate}
        onClose={() => setRegenerateOpen(false)}
        loading={generating}
      />
    </div>
  )
}
