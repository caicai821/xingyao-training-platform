import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Box,
  CheckCircle2,
  Copy,
  History,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
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
  IconButton,
  InfoGrid,
  Input,
  Modal,
  SectionCard,
  TagInput,
  Textarea,
} from '@/components/ui'
import { Alert, Badge, DemoBadge } from '@/components/ui/feedback'
import {
  GoalStatusBadge,
  ProfileStatusBadge,
  ScriptStatusBadge,
  TaskStatusBadge,
} from '@/components/domain/StatusBadges'
import { latestProfileFor, tasksForScript, assetsForScript } from '@/lib/selectors'
import { formatDate, formatDateTime, relativeTime, uid } from '@/lib/utils'
import type { ScriptStep, TrainingScript } from '@/types'

export default function ScriptDetailPage() {
  const { id } = useParams()
  const {
    scripts,
    learners,
    goals,
    profiles,
    tasks,
    assets,
    services,
    refreshAll,
  } = useAppData()
  const { toast } = useToast()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<TrainingScript | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const script = scripts.find((item) => item.id === id)

  if (!script) {
    return (
      <EmptyState
        icon={<History />}
        title="未找到该训练脚本"
        description="脚本可能已被移除，或链接地址不正确。"
        action={
          <Link to="/scripts">
            <Button variant="outline">返回训练脚本列表</Button>
          </Link>
        }
        className="rounded-card border border-line bg-white shadow-card"
      />
    )
  }

  const learner = learners.find((item) => item.id === script.learnerId)
  const goal = goals.find((item) => item.id === script.goalId)
  const learnerProfile = learner ? latestProfileFor(profiles, learner.id) : undefined
  const relatedTasks = tasksForScript(tasks, script.id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const relatedAssets = assetsForScript(assets, script.id)
  const dirty = Boolean(editing && form && JSON.stringify(form) !== JSON.stringify(script))

  const startEditing = () => {
    setForm(structuredClone(script))
    setEditing(true)
  }

  const cancelEditing = () => {
    setForm(null)
    setEditing(false)
  }

  const updateForm = (patch: Partial<TrainingScript>) => {
    setForm((previous) => (previous ? { ...previous, ...patch } : previous))
  }

  const updateStep = (index: number, patch: Partial<ScriptStep>) => {
    setForm((previous) =>
      previous
        ? {
            ...previous,
            steps: previous.steps.map((step, stepIndex) =>
              stepIndex === index ? { ...step, ...patch } : step,
            ),
          }
        : previous,
    )
  }

  const addStep = () => {
    const nextStep: ScriptStep = {
      id: uid('step'),
      title: `步骤 ${(form?.steps.length ?? 0) + 1}`,
      trigger: '',
      prompt: '',
      expectedBehavior: '',
      completion: '',
      observationPoints: [],
    }
    setForm((previous) =>
      previous ? { ...previous, steps: [...previous.steps, nextStep] } : previous,
    )
  }

  const removeStep = (index: number) => {
    setForm((previous) =>
      previous ? { ...previous, steps: previous.steps.filter((_, stepIndex) => stepIndex !== index) } : previous,
    )
  }

  const saveChanges = async () => {
    if (!form) return
    if (!form.name.trim()) {
      toast({ tone: 'error', title: '请填写脚本名称' })
      return
    }
    setSaving(true)
    try {
      const status = script.status === 'confirmed' ? 'generated' : script.status
      await services.scripts.update(script.id, {
        name: form.name.trim(),
        objective: form.objective,
        scenarioSummary: form.scenarioSummary,
        preparation: form.preparation,
        environmentElements: form.environmentElements,
        steps: form.steps,
        sceneAdaptation: form.sceneAdaptation,
        cautions: form.cautions,
        status,
      })
      await refreshAll(true)
      setEditing(false)
      setForm(null)
      toast({
        title: '训练脚本已保存',
        description:
          script.status === 'confirmed'
            ? '脚本内容已修改，状态已恢复为待确认，请重新确认后使用。'
            : '内容已更新，可继续编辑或确认脚本。',
      })
    } catch (cause) {
      toast({ tone: 'error', title: '保存失败', description: errorMessage(cause) })
    } finally {
      setSaving(false)
    }
  }

  const confirmScript = async () => {
    setConfirming(true)
    try {
      await services.scripts.confirm(script.id)
      await refreshAll(true)
      setConfirmOpen(false)
      toast({ title: '训练脚本已确认', description: '现在可以创建对应的 3D 场景任务。' })
    } catch (cause) {
      toast({ tone: 'error', title: '确认失败', description: errorMessage(cause) })
    } finally {
      setConfirming(false)
    }
  }

  const regenerateScript = async () => {
    setRegenerating(true)
    try {
      await services.scripts.regenerate(script.id)
      await refreshAll(true)
      setRegenerateOpen(false)
      setEditing(false)
      setForm(null)
      toast({
        title: '训练脚本已重新生成',
        description: '当前内容已更新，旧版本已保存到历史版本中。',
      })
    } catch (cause) {
      toast({ tone: 'error', title: '重新生成失败', description: errorMessage(cause) })
    } finally {
      setRegenerating(false)
    }
  }

  const copyScript = async () => {
    const content = [
      script.name,
      `学员：${learner?.name ?? '—'}`,
      `训练目标：${goal?.title ?? '—'}`,
      '',
      `训练目标说明：${script.objective}`,
      `情境说明：${script.scenarioSummary}`,
      '',
      `训练准备：${script.preparation.join('；')}`,
      `环境元素：${script.environmentElements.join('、')}`,
      '',
      '训练步骤：',
      ...script.steps.map((step, index) =>
        [
          `${index + 1}. ${step.title}`,
          `触发条件：${step.trigger}`,
          `引导语：${step.prompt}`,
          `预期行为：${step.expectedBehavior}`,
          `完成条件：${step.completion}`,
          `观察要点：${step.observationPoints.join('、')}`,
        ].join('\n'),
      ),
      '',
      `场景适配说明：${script.sceneAdaptation}`,
      `特别注意事项：${script.cautions.join('；')}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(content)
      toast({ title: '脚本内容已复制到剪贴板' })
    } catch {
      toast({ tone: 'error', title: '复制失败', description: '当前浏览器未授予剪贴板权限。' })
    }
  }

  const displaySteps = editing && form ? form.steps : script.steps

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={script.name}
        description={`${script.code} · ${learner?.name ?? '未关联学员'} · 更新于 ${relativeTime(
          script.updatedAt,
        )}`}
        breadcrumbs={[
          { label: '训练脚本', to: '/scripts' },
          { label: script.name },
        ]}
        meta={
          <>
            <ScriptStatusBadge status={script.status} />
            <Badge tone="neutral">v{script.version}</Badge>
            {script.isDemo && <DemoBadge label="演示脚本" />}
            {editing && (
              <Badge tone={dirty ? 'warning' : 'neutral'} dot>
                {dirty ? '有未保存更改' : '尚未修改'}
              </Badge>
            )}
          </>
        }
        actions={
          editing ? (
            <>
              <Button variant="outline" onClick={cancelEditing} disabled={saving}>
                取消编辑
              </Button>
              <Button icon={<Save />} onClick={saveChanges} loading={saving} disabled={!dirty}>
                保存更改
              </Button>
            </>
          ) : (
            <>
              <IconButton label="复制脚本" variant="outline" onClick={copyScript}>
                <Copy />
              </IconButton>
              <IconButton
                label="历史版本"
                variant="outline"
                onClick={() => setHistoryOpen(true)}
              >
                <History />
              </IconButton>
              <Button variant="outline" icon={<Pencil />} onClick={startEditing}>
                编辑内容
              </Button>
              <Button
                variant="outline"
                icon={<RefreshCw />}
                onClick={() => setRegenerateOpen(true)}
              >
                重新生成
              </Button>
              {script.status === 'confirmed' ? (
                <Link to={`/scenes/script/${script.id}`}>
                  <Button icon={<Box />}>生成对应 3D 场景</Button>
                </Link>
              ) : (
                <Button icon={<CheckCircle2 />} onClick={() => setConfirmOpen(true)}>
                  确认脚本
                </Button>
              )}
            </>
          )
        }
      />

      {!editing && (
        <>
          {script.status === 'confirmed' ? (
            <Alert
              tone="success"
              title="脚本已确认"
              description="可将该脚本转换为结构化场景请求，生成对应的 3D 场景任务。"
              className="mb-5"
              action={
                <Link to={`/scenes/script/${script.id}`}>
                  <Button size="sm" variant="outline" icon={<Box />}>
                    创建场景
                  </Button>
                </Link>
              }
            />
          ) : (
            <Alert
              tone="warning"
              title="脚本尚未确认"
              description="请检查脚本内容并确认。确认后才能创建关联的 3D 场景任务。"
              className="mb-5"
              action={
                <Button size="sm" variant="outline" onClick={() => setConfirmOpen(true)}>
                  确认脚本
                </Button>
              }
            />
          )}
        </>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card className="p-5 sm:p-6">
            {editing && form ? (
              <div className="space-y-4">
                <Field label="脚本名称" required>
                  <Input
                    value={form.name}
                    onChange={(event) => updateForm({ name: event.target.value })}
                  />
                </Field>
                <Field label="训练目标说明">
                  <Textarea
                    value={form.objective}
                    onChange={(event) => updateForm({ objective: event.target.value })}
                  />
                </Field>
                <Field label="情境说明">
                  <Textarea
                    value={form.scenarioSummary}
                    onChange={(event) => updateForm({ scenarioSummary: event.target.value })}
                  />
                </Field>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-[11px] font-medium text-ink-400">训练目标</p>
                  <p className="mt-1 text-[13px] leading-7 text-ink-700">{script.objective}</p>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] font-medium text-ink-400">情境说明</p>
                  <p className="mt-1 text-[13px] leading-7 text-ink-600">{script.scenarioSummary}</p>
                </div>
              </>
            )}
            <div className="mt-5 border-t border-line pt-4">
              <InfoGrid
                columns={3}
                items={[
                  {
                    label: '关联学员',
                    value: learner ? (
                      <Link
                        to={`/learners/${learner.id}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {learner.name}（{learner.code}）
                      </Link>
                    ) : (
                      '—'
                    ),
                  },
                  {
                    label: '关联训练目标',
                    value: goal ? (
                      <span className="flex flex-wrap items-center gap-1.5">
                        {goal.title}
                        <GoalStatusBadge status={goal.status} />
                      </span>
                    ) : (
                      '—'
                    ),
                  },
                  { label: '脚本编号', value: script.code },
                  { label: '当前版本', value: `v${script.version}` },
                  { label: '创建时间', value: formatDateTime(script.createdAt) },
                  { label: '最近更新', value: formatDateTime(script.updatedAt) },
                ]}
              />
            </div>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <SectionCard title="训练准备">
              {editing && form ? (
                <TagInput
                  value={form.preparation}
                  onChange={(value) => updateForm({ preparation: value })}
                  placeholder="添加训练准备事项"
                />
              ) : script.preparation.length ? (
                <ol className="space-y-2">
                  {script.preparation.map((item, index) => (
                    <li key={item} className="flex gap-2.5 text-xs leading-5 text-ink-600">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-medium text-brand-700">
                        {index + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-ink-300">未填写</p>
              )}
            </SectionCard>
            <SectionCard title="环境元素">
              {editing && form ? (
                <TagInput
                  value={form.environmentElements}
                  onChange={(value) => updateForm({ environmentElements: value })}
                  placeholder="添加环境元素"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {script.environmentElements.length ? (
                    script.environmentElements.map((item) => (
                      <Badge key={item} tone="neutral">
                        {item}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-ink-300">未填写</p>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="训练步骤"
            description={`共 ${displaySteps.length} 个步骤，包含触发条件、引导语、预期行为与完成条件。`}
            actions={
              editing ? (
                <Button size="sm" variant="outline" icon={<Plus />} onClick={addStep}>
                  添加步骤
                </Button>
              ) : (
                <Badge tone="brand">当前 v{script.version}</Badge>
              )
            }
            contentClassName="p-5 sm:p-6"
          >
            <div>
              {displaySteps.map((step, index) => (
                <div key={step.id} className="relative flex gap-4">
                  <div className="flex shrink-0 flex-col items-center">
                    <span className="flex size-7 items-center justify-center rounded-full bg-brand-600 text-[11px] font-medium text-white">
                      {index + 1}
                    </span>
                    {index < displaySteps.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-5 last:pb-0">
                    <div className="rounded-xl border border-line bg-white">
                      <div className="flex items-center justify-between gap-3 border-b border-line/80 px-4 py-3">
                        {editing && form ? (
                          <Input
                            value={step.title}
                            onChange={(event) => updateStep(index, { title: event.target.value })}
                            className="h-8 text-[13px]"
                          />
                        ) : (
                          <h3 className="text-[13px] font-medium text-ink-800">{step.title}</h3>
                        )}
                        {editing && form && (
                          <IconButton
                            label="删除步骤"
                            size="sm"
                            onClick={() => removeStep(index)}
                            disabled={form.steps.length <= 1}
                            className="text-danger-500 hover:bg-danger-50 hover:text-danger-600"
                          >
                            <Trash2 />
                          </IconButton>
                        )}
                      </div>
                      {editing && form ? (
                        <div className="space-y-3 p-4">
                          <Field label="触发条件">
                            <Input
                              value={step.trigger}
                              onChange={(event) => updateStep(index, { trigger: event.target.value })}
                              placeholder="何时进入该步骤"
                            />
                          </Field>
                          <Field label="引导语或提示语">
                            <Textarea
                              value={step.prompt}
                              onChange={(event) => updateStep(index, { prompt: event.target.value })}
                              className="min-h-[64px]"
                            />
                          </Field>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="预期行为">
                              <Textarea
                                value={step.expectedBehavior}
                                onChange={(event) =>
                                  updateStep(index, { expectedBehavior: event.target.value })
                                }
                                className="min-h-[64px]"
                              />
                            </Field>
                            <Field label="完成条件">
                              <Textarea
                                value={step.completion}
                                onChange={(event) => updateStep(index, { completion: event.target.value })}
                                className="min-h-[64px]"
                              />
                            </Field>
                          </div>
                          <Field label="观察要点">
                            <TagInput
                              value={step.observationPoints}
                              onChange={(value) => updateStep(index, { observationPoints: value })}
                              placeholder="添加观察要点"
                            />
                          </Field>
                        </div>
                      ) : (
                        <div className="p-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="text-[10px] text-ink-400">触发条件</p>
                              <p className="mt-0.5 text-xs leading-5 text-ink-600">
                                {step.trigger || '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-ink-400">完成条件</p>
                              <p className="mt-0.5 text-xs leading-5 text-ink-600">
                                {step.completion || '—'}
                              </p>
                            </div>
                          </div>
                          {step.prompt && (
                            <div className="mt-3 rounded-lg border-l-2 border-brand-300 bg-brand-50/40 px-3 py-2 text-xs leading-6 text-ink-700">
                              {step.prompt}
                            </div>
                          )}
                          <div className="mt-3">
                            <p className="text-[10px] text-ink-400">预期行为</p>
                            <p className="mt-0.5 text-xs leading-5 text-ink-600">
                              {step.expectedBehavior || '—'}
                            </p>
                          </div>
                          {step.observationPoints.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {step.observationPoints.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-md bg-ink-50 px-2 py-0.5 text-[10px] text-ink-500"
                                >
                                  观察：{item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="grid gap-5 md:grid-cols-2">
            <SectionCard title="场景适配说明">
              {editing && form ? (
                <Textarea
                  value={form.sceneAdaptation}
                  onChange={(event) => updateForm({ sceneAdaptation: event.target.value })}
                  className="min-h-[110px]"
                />
              ) : (
                <p className="text-xs leading-6 text-ink-600">{script.sceneAdaptation || '未填写'}</p>
              )}
            </SectionCard>
            <SectionCard title="特别注意事项">
              {editing && form ? (
                <TagInput
                  value={form.cautions}
                  onChange={(value) => updateForm({ cautions: value })}
                  placeholder="添加注意事项"
                />
              ) : script.cautions.length ? (
                <ul className="space-y-2">
                  {script.cautions.map((item) => (
                    <li key={item} className="flex gap-2 text-xs leading-5 text-ink-600">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-warning-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-ink-300">未填写</p>
              )}
            </SectionCard>
          </div>
        </div>

        <div className="space-y-5">
          {learner && (
            <Card className="p-5">
              <p className="text-xs font-medium text-ink-700">关联学员与目标</p>
              <div className="mt-3 flex items-start gap-3">
                <Avatar name={learner.name} size="md" />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/learners/${learner.id}`}
                    className="text-sm font-semibold text-ink-900 hover:text-brand-700"
                  >
                    {learner.name}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-ink-400">
                    {learner.code} · {learner.ageGroup}
                  </p>
                  <div className="mt-1.5">
                    <ProfileStatusBadge status={learnerProfile?.status ?? 'none'} />
                  </div>
                </div>
              </div>
              {goal && (
                <div className="mt-4 rounded-lg border border-line bg-ink-50/50 p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-ink-400">训练目标</span>
                    <GoalStatusBadge status={goal.status} />
                  </div>
                  <p className="mt-1 text-xs font-medium leading-5 text-ink-700">{goal.title}</p>
                  {goal.targetDate && (
                    <p className="mt-1 text-[10px] text-ink-400">目标日期 {formatDate(goal.targetDate)}</p>
                  )}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/profiles/${learner.id}`}>
                  <Button size="sm" variant="outline">
                    查看能力画像
                  </Button>
                </Link>
                <Link to={`/learners/${learner.id}`}>
                  <Button size="sm" variant="ghost">
                    学员档案
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          <SectionCard title="场景生成配置">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              {[
                ['场景类型', script.sceneConfig.sceneType],
                ['复杂程度', script.sceneConfig.complexity],
                ['步骤数量', `${script.sceneConfig.stepCount} 个`],
                ['训练时长', `${script.sceneConfig.duration} 分钟`],
                ['提示方式', script.sceneConfig.promptStyle],
                ['训练主题', script.sceneConfig.theme],
              ].map(([label, value]) => (
                <div key={label} className={label === '训练主题' ? 'col-span-2' : ''}>
                  <dt className="text-[10px] text-ink-400">{label}</dt>
                  <dd className="mt-0.5 leading-5 text-ink-700">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-[10px] text-ink-400">环境偏好</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {script.sceneConfig.environmentPrefs.length ? (
                  script.sceneConfig.environmentPrefs.map((item) => (
                    <Badge key={item} tone="neutral">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[11px] text-ink-300">未设置</span>
                )}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-[10px] text-ink-400">需要避免</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {script.sceneConfig.avoidElements.length ? (
                  script.sceneConfig.avoidElements.map((item) => (
                    <Badge key={item} tone="warning">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[11px] text-ink-300">未设置</span>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="关联场景任务"
            actions={<span className="text-[10px] text-ink-400">{relatedTasks.length} 个任务</span>}
            contentClassName="p-0"
          >
            {relatedTasks.length === 0 ? (
              <div className="px-5 py-5 text-center">
                <p className="text-xs text-ink-400">还没有关联场景任务</p>
                {script.status === 'confirmed' && (
                  <Link to={`/scenes/script/${script.id}`}>
                    <Button size="sm" variant="outline" className="mt-2">
                      创建对应场景
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              relatedTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/scenes/tasks/${task.id}`}
                  className="flex items-center gap-2 border-b border-line/70 px-5 py-3 last:border-0 hover:bg-ink-50/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-ink-700">{task.sceneName}</span>
                    <span className="block text-[10px] text-ink-400">{task.code}</span>
                  </span>
                  <TaskStatusBadge status={task.status} />
                </Link>
              ))
            )}
            {relatedAssets.length > 0 && (
              <Link
                to="/assets"
                className="flex items-center justify-between border-t border-line bg-ink-50/40 px-5 py-2.5 text-[11px] text-ink-500 hover:text-brand-700"
              >
                <span>关联场景资产</span>
                <span className="tnum font-medium text-ink-700">{relatedAssets.length} 个</span>
              </Link>
            )}
          </SectionCard>

          <Alert
            tone="info"
            title="演示脚本说明"
            description="当前脚本由模拟生成服务创建，用于演示完整的产品流程。接入真实生成服务后，训练步骤与提示语可由外部服务返回。"
          />
        </div>
      </div>

      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="历史版本"
        description={`${script.name} · 共 ${script.history.length} 个版本`}
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setHistoryOpen(false)}>
            关闭
          </Button>
        }
      >
        <div className="space-y-3">
          {[...script.history]
            .sort((a, b) => b.version - a.version)
            .map((version) => (
              <div key={version.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">v{version.version}</Badge>
                    {version.version === script.version && <Badge tone="success">当前版本</Badge>}
                    <p className="text-xs font-medium text-ink-800">{version.name}</p>
                  </div>
                  <span className="text-[10px] text-ink-400">{formatDateTime(version.savedAt)}</span>
                </div>
                {version.note && (
                  <p className="mt-2 rounded-md bg-ink-50 px-2.5 py-1.5 text-[11px] text-ink-500">
                    版本说明：{version.note}
                  </p>
                )}
                <p className="mt-2 line-clamp-2-safe text-[11px] leading-5 text-ink-400">
                  {version.objective}
                </p>
                <p className="mt-1 text-[10px] text-ink-300">
                  {version.steps.length ? `包含 ${version.steps.length} 个步骤快照` : '未保存步骤快照'}
                </p>
              </div>
            ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="确认训练脚本"
        description="确认后脚本状态将变为“已确认”，并可用于创建对应的 3D 场景任务。"
        confirmLabel="确认脚本"
        onConfirm={confirmScript}
        onClose={() => setConfirmOpen(false)}
        loading={confirming}
      />

      <ConfirmDialog
        open={regenerateOpen}
        title="重新生成训练脚本"
        description="将基于当前训练目标与场景配置重新生成脚本内容。当前版本会自动保存到历史版本中。"
        confirmLabel="重新生成"
        tone="danger"
        onConfirm={regenerateScript}
        onClose={() => setRegenerateOpen(false)}
        loading={regenerating}
      />
    </div>
  )
}
