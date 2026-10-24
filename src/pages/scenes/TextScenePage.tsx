import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Lightbulb,
  RotateCcw,
  Save,
  Send,
  Sparkles,
} from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { useToast } from '@/context/ToastContext'
import { errorMessage } from '@/hooks/useAsyncAction'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  SectionCard,
  Select,
  TagInput,
  Textarea,
} from '@/components/ui'
import { Alert, Badge, DemoBadge } from '@/components/ui/feedback'
import { ScenePreview } from '@/components/domain/ScenePreview'
import {
  COMPLEXITY_OPTIONS,
  SCENE_TYPES,
  SENSORY_OPTIONS,
  VISUAL_STYLE_OPTIONS,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { SceneComplexity, SceneGenerationInput } from '@/types'

const examplePrompt =
  '创建一个安静、布局简洁的幼儿园教室场景，空间中包含点心桌、书架、玩具收纳区和一名教师角色。场景用于练习向老师表达自己的需求，环境中尽量减少无关的视觉元素。'

interface TextSceneForm {
  sceneName: string
  scenePurpose: string
  theme: string
  prompt: string
  learnerId: string
  trainingGoalId: string
  scriptId: string
  sceneType: string
  complexity: SceneComplexity
  visualStyle: string[]
  sensoryPrefs: string[]
  keyElements: string[]
  avoidElements: string[]
  characters: string
}

export default function TextScenePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { learners, goals, scripts, services, refreshAll } = useAppData()
  const { toast } = useToast()

  const queryLearner = searchParams.get('learner') ?? ''
  const initialLearnerId = learners.some((learner) => learner.id === queryLearner)
    ? queryLearner
    : ''

  const initialForm: TextSceneForm = {
    sceneName: '',
    scenePurpose: '',
    theme: '',
    prompt: '',
    learnerId: initialLearnerId,
    trainingGoalId: '',
    scriptId: '',
    sceneType: '幼儿园教室',
    complexity: '简洁',
    visualStyle: ['自然柔和', '低饱和配色'],
    sensoryPrefs: ['减少视觉干扰', '柔和自然光'],
    keyElements: [],
    avoidElements: [],
    characters: '',
  }

  const [form, setForm] = useState<TextSceneForm>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<'draft' | 'submit' | null>(null)
  const [clearOpen, setClearOpen] = useState(false)

  const learnerGoals = useMemo(
    () => goals.filter((goal) => goal.learnerId === form.learnerId),
    [form.learnerId, goals],
  )
  const learnerScripts = useMemo(
    () => scripts.filter((script) => script.learnerId === form.learnerId),
    [form.learnerId, scripts],
  )
  const learner = learners.find((item) => item.id === form.learnerId)
  const goal = goals.find((item) => item.id === form.trainingGoalId)
  const script = scripts.find((item) => item.id === form.scriptId)

  const update = <K extends keyof TextSceneForm>(key: K, value: TextSceneForm[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    if (errors[key as string]) setErrors((previous) => ({ ...previous, [key]: '' }))
  }

  const changeLearner = (learnerId: string) => {
    setForm((previous) => ({
      ...previous,
      learnerId,
      trainingGoalId: '',
      scriptId: '',
    }))
  }

  const changeGoal = (goalId: string) => {
    setForm((previous) => {
      const nextScript = previous.scriptId
        ? scripts.find((item) => item.id === previous.scriptId)
        : undefined
      return {
        ...previous,
        trainingGoalId: goalId,
        scriptId: nextScript && nextScript.goalId !== goalId ? '' : previous.scriptId,
        scenePurpose:
          previous.scenePurpose ||
          (goalId ? goals.find((item) => item.id === goalId)?.title ?? '' : ''),
      }
    })
  }

  const changeScript = (scriptId: string) => {
    const target = scripts.find((item) => item.id === scriptId)
    if (!target) {
      update('scriptId', '')
      return
    }
    setForm((previous) => ({
      ...previous,
      scriptId,
      learnerId: target.learnerId,
      trainingGoalId: target.goalId,
      sceneName: previous.sceneName || `${target.name} · 场景`,
      scenePurpose: previous.scenePurpose || target.sceneConfig.theme,
      prompt: previous.prompt || target.scenarioSummary,
      sceneType: target.sceneConfig.sceneType,
      complexity: target.sceneConfig.complexity,
      visualStyle: previous.visualStyle.length ? previous.visualStyle : ['自然柔和'],
      sensoryPrefs: target.sceneConfig.environmentPrefs,
      keyElements: target.environmentElements.slice(0, 6),
      avoidElements: target.sceneConfig.avoidElements,
      characters: target.sceneConfig.sceneType.includes('家庭')
        ? '一名学员角色，可坐在沙发上。'
        : '一名教师角色，位于学员侧前方。',
    }))
  }

  const fillExample = () => {
    setForm((previous) => ({
      ...previous,
      sceneName: previous.sceneName || '安静的幼儿园教室',
      scenePurpose: previous.scenePurpose || '课堂需求表达练习',
      theme: previous.theme || '向老师表达自己的需求',
      prompt: examplePrompt,
      sceneType: '幼儿园教室',
      complexity: '简洁',
      visualStyle: ['自然柔和', '低饱和配色'],
      sensoryPrefs: ['减少视觉干扰', '柔和自然光'],
      keyElements: ['点心桌', '教师角色', '视觉提示卡'],
      avoidElements: ['拥挤的人群', '强对比装饰'],
      characters: '一名教师角色，位于学员侧前方约 1 米处。',
    }))
    setErrors({})
    toast({ tone: 'info', title: '示例内容已填入', description: '可继续根据实际需要调整。' })
  }

  const validate = (forSubmit: boolean) => {
    const nextErrors: Record<string, string> = {}
    if (!form.sceneName.trim()) nextErrors.sceneName = '请填写场景名称'
    if (forSubmit && !form.prompt.trim()) nextErrors.prompt = '请填写场景文字描述'
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
        sourceType: 'text',
        sceneName: form.sceneName.trim(),
        scenePurpose: form.scenePurpose.trim(),
        prompt: form.prompt.trim(),
        learnerId: form.learnerId || undefined,
        trainingGoalId: form.trainingGoalId || undefined,
        scriptId: form.scriptId || undefined,
        sceneConfig: {
          theme: form.theme.trim() || undefined,
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
        title: submit ? '场景任务已提交' : '场景配置草稿已保存',
        description: submit ? '可在任务详情中查看生成进度。' : '可在任务详情中提交生成。',
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
        title="通过文本描述创建场景"
        description="用自然语言描述期望的空间、角色与用途，并补充必要的场景参数。提交后可在任务详情中查看进度与结果。"
        breadcrumbs={[
          { label: '3D 场景生成', to: '/scenes' },
          { label: '文本描述创建' },
        ]}
        actions={
          <>
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
              提交生成
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <SectionCard
            title="场景描述"
            description="名称用于任务与资产识别，文字描述是生成服务的主要输入。"
            icon={<Sparkles />}
            actions={<DemoBadge label="模拟生成服务" />}
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="场景名称" required error={errors.sceneName}>
                  <Input
                    value={form.sceneName}
                    onChange={(event) => update('sceneName', event.target.value)}
                    placeholder="例如：安静的幼儿园教室"
                    maxLength={40}
                  />
                </Field>
                <Field label="场景用途">
                  <Input
                    value={form.scenePurpose}
                    onChange={(event) => update('scenePurpose', event.target.value)}
                    placeholder="例如：课堂需求表达练习"
                    maxLength={40}
                  />
                </Field>
              </div>
              <Field label="场景主题">
                <Input
                  value={form.theme}
                  onChange={(event) => update('theme', event.target.value)}
                  placeholder="例如：向老师表达需求"
                  maxLength={50}
                />
              </Field>
              <Field
                label="场景文字描述"
                required
                error={errors.prompt}
                right={
                  <span className="tnum text-[10px] text-ink-300">{form.prompt.length}/1200</span>
                }
                hint="建议包含空间类型、关键物品、角色、光线与需要避免的元素。"
              >
                <Textarea
                  value={form.prompt}
                  onChange={(event) => update('prompt', event.target.value)}
                  placeholder={examplePrompt}
                  maxLength={1200}
                  className="min-h-[150px]"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" icon={<Lightbulb />} onClick={fillExample}>
                  使用示例提示
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<RotateCcw />}
                  onClick={() => setClearOpen(true)}
                >
                  清空表单
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="场景配置"
            description="场景参数将作为结构化请求的一部分提交，实际字段以未来服务协议为准。"
          >
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
            <div className="mt-4 space-y-4">
              <Field label="视觉风格偏好">
                <TagInput
                  value={form.visualStyle}
                  onChange={(value) => update('visualStyle', value)}
                  placeholder="添加视觉风格"
                  suggestions={VISUAL_STYLE_OPTIONS}
                />
              </Field>
              <Field label="感官与环境偏好">
                <TagInput
                  value={form.sensoryPrefs}
                  onChange={(value) => update('sensoryPrefs', value)}
                  placeholder="例如：减少视觉干扰、柔和自然光"
                  suggestions={SENSORY_OPTIONS}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="关键环境元素">
                  <TagInput
                    value={form.keyElements}
                    onChange={(value) => update('keyElements', value)}
                    placeholder="例如：点心桌、教师角色"
                  />
                </Field>
                <Field label="需要避免的环境元素">
                  <TagInput
                    value={form.avoidElements}
                    onChange={(value) => update('avoidElements', value)}
                    placeholder="例如：拥挤的人群、强光"
                  />
                </Field>
              </div>
              <Field label="场景角色需求">
                <Textarea
                  value={form.characters}
                  onChange={(event) => update('characters', event.target.value)}
                  placeholder="例如：一名教师角色，位于学员侧前方约 1 米处，姿态放松。"
                  className="min-h-[80px]"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="关联信息"
            description="关联学员与训练目标后，生成结果会归入对应的训练记录。全部为可选项。"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="关联学员">
                <Select value={form.learnerId} onChange={(event) => changeLearner(event.target.value)}>
                  <option value="">不关联学员</option>
                  {learners.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}（{item.code}）
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="关联训练目标" hint={!form.learnerId ? '选择学员后可关联训练目标。' : undefined}>
                <Select
                  value={form.trainingGoalId}
                  onChange={(event) => changeGoal(event.target.value)}
                  disabled={!form.learnerId}
                >
                  <option value="">不关联训练目标</option>
                  {learnerGoals.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="关联训练脚本（可选）"
                hint={!form.learnerId ? '选择学员后可关联训练脚本。' : undefined}
                className="sm:col-span-2"
              >
                <Select
                  value={form.scriptId}
                  onChange={(event) => changeScript(event.target.value)}
                  disabled={!form.learnerId}
                >
                  <option value="">不关联训练脚本</option>
                  {learnerScripts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}（v{item.version}）
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {script && (
              <div className="mt-3 rounded-lg bg-ink-50/70 px-3 py-2 text-[11px] leading-5 text-ink-500">
                已根据脚本带入场景类型与环境元素，可在提交前继续调整。
              </div>
            )}
          </SectionCard>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-ink-400">
              提交前请确认场景名称与描述；保存草稿后可稍后继续。
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
                icon={<Send />}
                onClick={() => saveTask(true)}
                loading={busy === 'submit'}
                disabled={busy === 'draft'}
              >
                提交生成
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
              seed={`${form.sceneName}:${form.theme}:${form.prompt.slice(0, 40)}`}
              sceneType={form.sceneType}
              className="aspect-[8/5] w-full"
            />
            <div className="space-y-2.5 p-4 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">场景类型</span>
                <span className="text-ink-700">{form.sceneType}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">复杂程度</span>
                <span className="text-ink-700">{form.complexity}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">关联学员</span>
                <span className="text-ink-700">{learner?.name ?? '未关联'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">训练目标</span>
                <span className="max-w-[170px] truncate text-right text-ink-700">
                  {goal?.title ?? '未关联'}
                </span>
              </div>
            </div>
            <p className="border-t border-line bg-ink-50/50 px-4 py-2.5 text-[10px] leading-5 text-ink-400">
              预览根据当前配置生成示意画面，不代表真实场景生成结果。
            </p>
          </Card>

          <Alert
            tone="info"
            title="演示模式提示"
            description="当前场景生成由模拟服务完成，任务状态与结果预览均标注为演示数据。未来可通过服务层切换至真实 3D 场景生成接口。"
          />

          <Alert
            tone="warning"
            title="健康与安全边界"
            description="场景应避免出现可能引发不适的强光、突发噪音或拥挤元素。上传与生成内容仅用于支持训练，不应包含真实敏感个人信息。"
          />
        </div>
      </div>

      <ConfirmDialog
        open={clearOpen}
        title="清空场景配置"
        description="将清除已填写的场景名称、描述与场景参数，关联学员也会被重置。该操作无法撤销。"
        confirmLabel="清空"
        tone="danger"
        onConfirm={() => {
          setForm({ ...initialForm, sceneType: '幼儿园教室' })
          setErrors({})
          setClearOpen(false)
          toast({ tone: 'info', title: '场景配置已清空' })
        }}
        onClose={() => setClearOpen(false)}
      />
    </div>
  )
}
