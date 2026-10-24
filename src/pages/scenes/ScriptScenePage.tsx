import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Box,
  CheckCircle2,
  FileText,
  ListChecks,
  Save,
  Send,
} from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { useToast } from '@/context/ToastContext'
import { errorMessage } from '@/hooks/useAsyncAction'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  SearchInput,
  SectionCard,
  Select,
  TagInput,
  Textarea,
} from '@/components/ui'
import { Alert, Badge } from '@/components/ui/feedback'
import {
  GoalStatusBadge,
  ProfileStatusBadge,
  ScriptStatusBadge,
} from '@/components/domain/StatusBadges'
import { ScenePreview } from '@/components/domain/ScenePreview'
import {
  COMPLEXITY_OPTIONS,
  SCENE_TYPES,
  SENSORY_OPTIONS,
  VISUAL_STYLE_OPTIONS,
} from '@/lib/constants'
import { latestProfileFor } from '@/lib/selectors'
import { cn, formatDate } from '@/lib/utils'
import type { SceneComplexity, SceneGenerationInput, TrainingScript } from '@/types'

interface ScriptSceneForm {
  sceneName: string
  scenePurpose: string
  prompt: string
  sceneType: string
  complexity: SceneComplexity
  visualStyle: string[]
  sensoryPrefs: string[]
  keyElements: string[]
  avoidElements: string[]
  characters: string
}

function buildForm(script?: TrainingScript, goalTitle?: string): ScriptSceneForm {
  if (!script) {
    return {
      sceneName: '',
      scenePurpose: '',
      prompt: '',
      sceneType: '幼儿园教室',
      complexity: '适中',
      visualStyle: [],
      sensoryPrefs: [],
      keyElements: [],
      avoidElements: [],
      characters: '',
    }
  }
  return {
    sceneName: `${script.name} · 3D 场景`,
    scenePurpose: goalTitle || script.sceneConfig.theme,
    prompt: [
      `根据训练脚本“${script.name}”构建${script.sceneConfig.sceneType}场景。`,
      `训练主题：${script.sceneConfig.theme}`,
      `情境说明：${script.scenarioSummary}`,
      `关键环境元素：${script.environmentElements.join('、')}`,
      script.sceneConfig.avoidElements.length
        ? `需要避免：${script.sceneConfig.avoidElements.join('、')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
    sceneType: script.sceneConfig.sceneType,
    complexity: script.sceneConfig.complexity,
    visualStyle: ['自然柔和', '写实风格'],
    sensoryPrefs: [...script.sceneConfig.environmentPrefs],
    keyElements: [...script.environmentElements],
    avoidElements: [...script.sceneConfig.avoidElements],
    characters: '保留脚本中的教师与学员角色，位置与环境保持自然、简洁。',
  }
}

export default function ScriptScenePage() {
  const { scriptId } = useParams()
  const navigate = useNavigate()
  const { scripts, learners, goals, profiles, services, refreshAll } = useAppData()
  const { toast } = useToast()

  const [query, setQuery] = useState('')
  const [form, setForm] = useState<ScriptSceneForm>(() => buildForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<'draft' | 'submit' | null>(null)

  const script = scripts.find((item) => item.id === scriptId)
  const learner = script ? learners.find((item) => item.id === script.learnerId) : undefined
  const goal = script ? goals.find((item) => item.id === script.goalId) : undefined
  const profile = learner ? latestProfileFor(profiles, learner.id) : undefined

  useEffect(() => {
    if (script) {
      setForm(buildForm(script, goal?.title))
      setErrors({})
    }
  }, [script?.id, goal?.title])

  const confirmedScripts = useMemo(
    () => scripts.filter((item) => item.status === 'confirmed'),
    [scripts],
  )
  const pickerScripts = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return [...scripts]
      .sort((a, b) => {
        if (a.status === 'confirmed' && b.status !== 'confirmed') return -1
        if (b.status === 'confirmed' && a.status !== 'confirmed') return 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
      .filter((item) => {
        if (!keyword) return true
        const learnerName = learners.find((entry) => entry.id === item.learnerId)?.name ?? ''
        return [item.name, item.code, item.objective, learnerName]
          .some((value) => value.toLowerCase().includes(keyword))
      })
  }, [learners, query, scripts])

  const update = <K extends keyof ScriptSceneForm>(key: K, value: ScriptSceneForm[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    if (errors[key as string]) setErrors((previous) => ({ ...previous, [key]: '' }))
  }

  if (!scriptId) {
    return (
      <div className="animate-fade-up">
        <PageHeader
          title="从训练脚本创建场景"
          description="选择一份已确认的训练脚本，系统会自动带入训练目标、情境说明、关键环境元素与关联学员信息。"
          breadcrumbs={[
            { label: '3D 场景生成', to: '/scenes' },
            { label: '从训练脚本创建' },
          ]}
          actions={
            <Link to="/scripts">
              <Button variant="outline" icon={<FileText />}>
                训练脚本列表
              </Button>
            </Link>
          }
        />
        <Card>
          <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="搜索脚本名称、编号或学员"
              className="w-full sm:max-w-sm"
            />
            <p className="text-xs text-ink-400 sm:ml-auto">
              已确认脚本 <span className="font-medium text-ink-700">{confirmedScripts.length}</span> 份
            </p>
          </div>
          {pickerScripts.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title={query ? '没有符合条件的训练脚本' : '还没有训练脚本'}
              description={
                query
                  ? '尝试调整搜索关键词。'
                  : '请先生成并确认训练脚本，再从脚本创建对应 3D 场景。'
              }
              action={
                <Link to="/scripts/new">
                  <Button>生成训练脚本</Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-line">
              {pickerScripts.map((item) => {
                const itemLearner = learners.find((entry) => entry.id === item.learnerId)
                const itemGoal = goals.find((entry) => entry.id === item.goalId)
                const confirmed = item.status === 'confirmed'
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-medium text-ink-800">{item.name}</p>
                        <ScriptStatusBadge status={item.status} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        {item.code} · {itemLearner?.name ?? '未关联学员'} · {item.steps.length} 个步骤 ·
                        更新于 {formatDate(item.updatedAt)}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-ink-500">
                        {itemGoal?.title ?? item.objective}
                      </p>
                    </div>
                    {confirmed ? (
                      <Button
                        size="sm"
                        icon={<ArrowRight />}
                        onClick={() => navigate(`/scenes/script/${item.id}`)}
                      >
                        选择此脚本
                      </Button>
                    ) : (
                      <Link to={`/scripts/${item.id}`}>
                        <Button size="sm" variant="outline">
                          先确认脚本
                        </Button>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    )
  }

  if (!script) {
    return (
      <EmptyState
        icon={<FileText />}
        title="未找到该训练脚本"
        description="脚本可能已被移除，或链接地址不正确。"
        action={
          <Link to="/scenes/script">
            <Button variant="outline">重新选择脚本</Button>
          </Link>
        }
        className="rounded-card border border-line bg-white shadow-card"
      />
    )
  }

  if (script.status !== 'confirmed') {
    return (
      <div className="animate-fade-up">
        <PageHeader
          title="从训练脚本创建场景"
          description={script.name}
          breadcrumbs={[
            { label: '3D 场景生成', to: '/scenes' },
            { label: '从训练脚本创建', to: '/scenes/script' },
            { label: script.name },
          ]}
          actions={
            <Link to={`/scripts/${script.id}`}>
              <Button variant="outline">查看训练脚本</Button>
            </Link>
          }
        />
        <Alert
          tone="warning"
          title="该脚本尚未确认"
          description="只有确认后的训练脚本才能创建对应的 3D 场景任务。请先在脚本详情中检查内容并确认。"
          action={
            <Link to={`/scripts/${script.id}`}>
              <Button size="sm">去确认脚本</Button>
            </Link>
          }
        />
        <Card className="mt-5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <ScriptStatusBadge status={script.status} />
            <Badge tone="neutral">{script.code}</Badge>
            <Badge tone="neutral">v{script.version}</Badge>
          </div>
          <p className="mt-3 text-[13px] leading-7 text-ink-600">{script.scenarioSummary}</p>
        </Card>
      </div>
    )
  }

  const validate = (forSubmit: boolean) => {
    const nextErrors: Record<string, string> = {}
    if (!form.sceneName.trim()) nextErrors.sceneName = '请填写场景名称'
    if (forSubmit && !form.prompt.trim()) nextErrors.prompt = '请填写场景描述'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      toast({ tone: 'error', title: '请检查场景信息' })
      return false
    }
    return true
  }

  const saveTask = async (submit: boolean) => {
    if (!validate(submit)) return
    setBusy(submit ? 'submit' : 'draft')
    try {
      const payload: SceneGenerationInput = {
        sourceType: 'script',
        sceneName: form.sceneName.trim(),
        scenePurpose: form.scenePurpose.trim(),
        prompt: form.prompt.trim(),
        learnerId: script.learnerId,
        trainingGoalId: script.goalId,
        scriptId: script.id,
        sceneConfig: {
          theme: script.sceneConfig.theme,
          sceneType: form.sceneType,
          complexity: form.complexity,
          visualStyle: form.visualStyle,
          sensoryPrefs: form.sensoryPrefs,
          keyElements: form.keyElements,
          avoidElements: form.avoidElements,
          characters: form.characters,
        },
      }
      const task = await services.tasks.create(payload, { submit })
      await refreshAll(true)
      toast({
        title: submit ? '场景任务已提交' : '场景草稿已保存',
        description: submit ? '任务已关联训练脚本，可在详情中查看生成进度。' : '可在任务详情中提交生成。',
      })
      navigate(`/scenes/tasks/${task.id}`)
    } catch (cause) {
      toast({ tone: 'error', title: '提交失败', description: errorMessage(cause) })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="从训练脚本创建 3D 场景"
        description="系统已自动带入脚本名称、训练目标、情境描述与关键环境元素。可在提交前继续调整场景配置。"
        breadcrumbs={[
          { label: '3D 场景生成', to: '/scenes' },
          { label: '从训练脚本创建', to: '/scenes/script' },
          { label: script.name },
        ]}
        meta={<ScriptStatusBadge status={script.status} />}
        actions={
          <>
            <Link to={`/scripts/${script.id}`}>
              <Button variant="outline">查看训练脚本</Button>
            </Link>
            <Button
              variant="outline"
              icon={<Save />}
              onClick={() => saveTask(false)}
              loading={busy === 'draft'}
              disabled={busy === 'submit'}
            >
              保存草稿
            </Button>
            <Button
              icon={<Send />}
              onClick={() => saveTask(true)}
              loading={busy === 'submit'}
              disabled={busy === 'draft'}
            >
              生成对应场景
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                  <ListChecks className="size-4" />
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold text-ink-900">脚本自动带入信息</h2>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {script.code} · v{script.version} · 更新于 {formatDate(script.updatedAt)}
                  </p>
                </div>
              </div>
              <Badge tone="success">
                <CheckCircle2 className="size-3" />
                已确认脚本
              </Badge>
            </div>
            <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] text-ink-400">脚本名称</p>
                <p className="mt-0.5 text-xs font-medium text-ink-800">{script.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-ink-400">训练目标</p>
                <p className="mt-0.5 text-xs text-ink-700">{goal?.title ?? script.objective}</p>
              </div>
              <div>
                <p className="text-[10px] text-ink-400">关联学员</p>
                <p className="mt-0.5 text-xs text-ink-700">
                  {learner?.name ?? '未关联'} {learner ? `（${learner.code}）` : ''}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-ink-400">训练主题</p>
                <p className="mt-0.5 text-xs text-ink-700">{script.sceneConfig.theme}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] text-ink-400">情境说明</p>
                <p className="mt-0.5 text-xs leading-6 text-ink-600">{script.scenarioSummary}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] text-ink-400">关键环境元素</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {script.environmentElements.map((item) => (
                    <Badge key={item} tone="neutral">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-line bg-ink-50/40 p-3">
              <p className="text-[11px] font-medium text-ink-600">训练步骤（{script.steps.length} 个）</p>
              <ol className="mt-2 space-y-1.5">
                {script.steps.map((step, index) => (
                  <li key={step.id} className="flex gap-2 text-[11px] leading-5 text-ink-500">
                    <span className="tnum w-4 shrink-0 text-ink-400">{index + 1}.</span>
                    {step.title}
                  </li>
                ))}
              </ol>
            </div>
          </Card>

          <SectionCard title="场景描述与配置" description="可对自动带入的内容进行调整，修改不会影响原训练脚本。">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="场景名称" required error={errors.sceneName}>
                  <Input
                    value={form.sceneName}
                    onChange={(event) => update('sceneName', event.target.value)}
                    maxLength={40}
                  />
                </Field>
                <Field label="场景用途">
                  <Input
                    value={form.scenePurpose}
                    onChange={(event) => update('scenePurpose', event.target.value)}
                    maxLength={40}
                  />
                </Field>
              </div>
              <Field label="场景文字描述" required error={errors.prompt}>
                <Textarea
                  value={form.prompt}
                  onChange={(event) => update('prompt', event.target.value)}
                  className="min-h-[150px]"
                  maxLength={1400}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="场景类型">
                  <Select
                    value={form.sceneType}
                    onChange={(event) => update('sceneType', event.target.value)}
                  >
                    {SCENE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="环境复杂程度">
                  <div className="flex gap-2">
                    {COMPLEXITY_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => update('complexity', option as SceneComplexity)}
                        className={cn(
                          'flex-1 rounded-lg border px-2 py-2 text-xs transition',
                          form.complexity === option
                            ? 'border-brand-300 bg-brand-50 font-medium text-brand-700'
                            : 'border-line text-ink-500 hover:border-brand-200',
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="视觉风格偏好">
                <TagInput
                  value={form.visualStyle}
                  onChange={(value) => update('visualStyle', value)}
                  suggestions={VISUAL_STYLE_OPTIONS}
                  placeholder="添加视觉风格"
                />
              </Field>
              <Field label="感官与环境偏好">
                <TagInput
                  value={form.sensoryPrefs}
                  onChange={(value) => update('sensoryPrefs', value)}
                  suggestions={SENSORY_OPTIONS}
                  placeholder="添加环境偏好"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="关键环境元素">
                  <TagInput
                    value={form.keyElements}
                    onChange={(value) => update('keyElements', value)}
                  />
                </Field>
                <Field label="需要避免的环境元素">
                  <TagInput
                    value={form.avoidElements}
                    onChange={(value) => update('avoidElements', value)}
                  />
                </Field>
              </div>
              <Field label="场景角色需求">
                <Textarea
                  value={form.characters}
                  onChange={(event) => update('characters', event.target.value)}
                  className="min-h-[76px]"
                />
              </Field>
            </div>
          </SectionCard>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-ink-400">
              提交后将创建关联该脚本的场景生成任务，并自动进入任务详情。
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                icon={<Save />}
                onClick={() => saveTask(false)}
                loading={busy === 'draft'}
                disabled={busy === 'submit'}
              >
                保存草稿
              </Button>
              <Button
                icon={<Box />}
                onClick={() => saveTask(true)}
                loading={busy === 'submit'}
                disabled={busy === 'draft'}
              >
                生成对应场景
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-xs font-medium text-ink-700">场景预览</p>
              <Badge tone="neutral" className="border-dashed">
                示意预览
              </Badge>
            </div>
            <ScenePreview
              seed={`${script.id}:${form.sceneName}`}
              sceneType={form.sceneType}
              className="aspect-[8/5] w-full"
            />
            <div className="space-y-2.5 p-4 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">关联学员</span>
                <span className="text-ink-700">{learner?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">能力画像</span>
                <ProfileStatusBadge status={profile?.status ?? 'none'} />
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">训练目标</span>
                <span className="max-w-[170px] truncate text-right text-ink-700">
                  {goal?.title ?? '—'}
                </span>
              </div>
              {goal && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink-400">目标状态</span>
                  <GoalStatusBadge status={goal.status} />
                </div>
              )}
            </div>
            <p className="border-t border-line bg-ink-50/50 px-4 py-2.5 text-[10px] leading-5 text-ink-400">
              预览根据脚本配置生成，不代表真实场景生成结果。
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              {learner && <Avatar name={learner.name} size="md" />}
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink-800">
                  {learner ? `${learner.name} · ${learner.code}` : '未关联学员'}
                </p>
                <p className="mt-0.5 text-[10px] text-ink-400">
                  {goal?.category ?? '未关联训练目标'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/scripts/${script.id}`}>
                <Button size="sm" variant="outline">
                  查看脚本
                </Button>
              </Link>
              {learner && (
                <Link to={`/profiles/${learner.id}`}>
                  <Button size="sm" variant="ghost">
                    能力画像
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          <Alert
            tone="info"
            title="脚本与场景的关联"
            description="该任务会保存训练脚本 ID、训练目标 ID 与学员 ID，生成结果也会与脚本记录关联，便于后续追踪。"
          />
        </div>
      </div>
    </div>
  )
}
