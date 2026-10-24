import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Search,
  Sparkles,
  Target,
  UserRound,
  Wand2,
} from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { useToast } from '@/context/ToastContext'
import { errorMessage } from '@/hooks/useAsyncAction'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Button,
  Card,
  Field,
  Input,
  SectionCard,
  Select,
  Stepper,
  TagInput,
  Textarea,
} from '@/components/ui'
import { Alert, Badge, DemoBadge, ProgressBar } from '@/components/ui/feedback'
import { GoalStatusBadge, ProfileStatusBadge } from '@/components/domain/StatusBadges'
import {
  ABILITY_DIMENSIONS,
  COMPLEXITY_OPTIONS,
  GOAL_CATEGORIES,
  PROMPT_STYLES,
  SCENE_TYPES,
  SENSORY_OPTIONS,
} from '@/lib/constants'
import {
  assessmentAverage,
  latestAssessmentFor,
  latestProfileFor,
} from '@/lib/selectors'
import { cn, formatDate } from '@/lib/utils'
import type { SceneComplexity, ScriptSceneConfig } from '@/types'

const steps = [
  { title: '选择学员', description: '关联档案与能力画像' },
  { title: '设置训练目标', description: '选择或自定义方向' },
  { title: '配置训练情境', description: '场景、步骤与提示' },
  { title: '生成训练脚本', description: '预览并生成结构化内容' },
]

const stageLabels = ['解析训练目标与情境配置', '生成结构化训练步骤', '整理观察要点与注意事项']

export default function ScriptWizardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { learners, assessments, profiles, goals, services, refreshAll } = useAppData()
  const { toast } = useToast()

  const queryGoalId = searchParams.get('goal') ?? ''
  const queryGoal = goals.find((goal) => goal.id === queryGoalId)
  const queryLearnerId = searchParams.get('learner') ?? ''
  const initialLearnerId = learners.some((learner) => learner.id === queryLearnerId)
    ? queryLearnerId
    : queryGoal?.learnerId ?? ''
  const initialGoal =
    queryGoal && queryGoal.learnerId === initialLearnerId ? queryGoal : undefined
  const initialStep = initialLearnerId ? (initialGoal ? 2 : 1) : 0

  const [step, setStep] = useState(initialStep)
  const [learnerId, setLearnerId] = useState(initialLearnerId)
  const [learnerSearch, setLearnerSearch] = useState('')
  const [goalMode, setGoalMode] = useState<'existing' | 'custom'>('existing')
  const [goalId, setGoalId] = useState(initialGoal?.id ?? '')
  const [customGoalTitle, setCustomGoalTitle] = useState('')
  const [customGoalCategory, setCustomGoalCategory] = useState('沟通表达')
  const [customGoalDescription, setCustomGoalDescription] = useState('')
  const [config, setConfig] = useState<ScriptSceneConfig>({
    theme: initialGoal?.title ?? '',
    sceneType: '幼儿园教室',
    complexity: '适中',
    stepCount: 4,
    duration: 15,
    promptStyle: '口头提示',
    environmentPrefs: ['减少视觉干扰'],
    avoidElements: [],
  })
  const [expectedBehavior, setExpectedBehavior] = useState('')
  const [completionStandard, setCompletionStandard] = useState('')
  const [observationPoints, setObservationPoints] = useState<string[]>([])
  const [extraNotes, setExtraNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [genStage, setGenStage] = useState(0)

  const learner = learners.find((item) => item.id === learnerId)
  const learnerProfile = learner ? latestProfileFor(profiles, learner.id) : undefined
  const learnerAssessment = learner ? latestAssessmentFor(assessments, learner.id) : undefined
  const learnerGoals = useMemo(
    () => goals.filter((goal) => goal.learnerId === learnerId),
    [goals, learnerId],
  )
  const selectedGoal = learnerGoals.find((goal) => goal.id === goalId)
  const effectiveGoalTitle = goalMode === 'custom' ? customGoalTitle : selectedGoal?.title ?? ''

  useEffect(() => {
    if (!generating) {
      setGenStage(0)
      return
    }
    const timer = window.setInterval(() => {
      setGenStage((previous) => Math.min(previous + 1, stageLabels.length - 1))
    }, 900)
    return () => window.clearInterval(timer)
  }, [generating])

  const chooseLearner = (id: string) => {
    setLearnerId(id)
    setGoalId('')
    setErrors({})
  }

  const goNext = () => {
    setErrors({})
    if (step === 0) {
      if (!learnerId) {
        setErrors({ learnerId: '请选择一位学员' })
        return
      }
      setStep(1)
      return
    }
    if (step === 1) {
      if (goalMode === 'existing' && !goalId) {
        setErrors({ goalId: '请选择一个训练目标，或切换为自定义目标' })
        return
      }
      if (goalMode === 'custom' && !customGoalTitle.trim()) {
        setErrors({ customGoalTitle: '请填写自定义训练目标名称' })
        return
      }
      if (!config.theme.trim()) {
        setConfig((previous) => ({ ...previous, theme: effectiveGoalTitle }))
      }
      setStep(2)
      return
    }
    if (step === 2) {
      const nextErrors: Record<string, string> = {}
      if (!config.theme.trim()) nextErrors.theme = '请填写训练主题'
      if (!config.sceneType) nextErrors.sceneType = '请选择场景类型'
      if (config.stepCount < 2 || config.stepCount > 8) nextErrors.stepCount = '步骤数量需在 2–8 之间'
      if (config.duration < 5 || config.duration > 60) nextErrors.duration = '建议训练时长在 5–60 分钟'
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length) return
      setStep(3)
    }
  }

  const generate = async () => {
    if (!learner) return
    setGenerating(true)
    try {
      let activeGoalId = goalId
      let goalTitle = selectedGoal?.title ?? ''
      if (goalMode === 'custom') {
        const createdGoal = await services.goals.create({
          learnerId: learner.id,
          title: customGoalTitle.trim(),
          category: customGoalCategory,
          description: customGoalDescription,
          successCriteria: '',
          relatedDimensions: [],
          priority: 'medium',
          status: 'planning',
          targetDate: '',
        })
        activeGoalId = createdGoal.id
        goalTitle = createdGoal.title
      }
      const script = await services.scripts.generate({
        learnerId: learner.id,
        goalId: activeGoalId,
        goalTitle,
        sceneConfig: config,
        expectedBehavior,
        completionStandard,
        observationPoints,
        extraNotes,
      })
      await refreshAll(true)
      toast({
        title: '训练脚本已生成',
        description: '已进入脚本详情，可继续编辑、确认或生成对应 3D 场景。',
      })
      navigate(`/scripts/${script.id}`)
    } catch (cause) {
      toast({ tone: 'error', title: '生成失败', description: errorMessage(cause) })
      setGenerating(false)
    }
  }

  const filteredLearners = learners.filter((item) => {
    const keyword = learnerSearch.trim().toLowerCase()
    if (!keyword) return true
    return [item.name, item.code, item.currentGoalText, ...item.traits]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword))
  })

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="生成训练脚本"
        description="按步骤选择学员、明确训练目标与情境配置，生成可编辑的结构化训练脚本。"
        breadcrumbs={[
          { label: '训练脚本', to: '/scripts' },
          { label: '生成脚本' },
        ]}
        actions={
          <Link to="/scripts">
            <Button variant="outline">退出向导</Button>
          </Link>
        }
      />

      <Card className="mb-5 px-4 py-4 sm:px-6">
        <Stepper steps={steps} current={step} />
      </Card>

      <Card className="p-5 sm:p-6">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[15px] font-semibold text-ink-900">第一步：选择学员</h2>
              <p className="mt-1 text-xs text-ink-400">
                训练脚本将关联学员档案，并使用其能力画像与提示偏好作为生成参考。
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <Input
                  value={learnerSearch}
                  onChange={(event) => setLearnerSearch(event.target.value)}
                  placeholder="搜索学员姓名、编号或特点"
                  leading={<Search />}
                />
                {errors.learnerId && (
                  <p className="mt-2 text-xs text-danger-500">{errors.learnerId}</p>
                )}
                <div className="mt-3 grid max-h-[500px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {filteredLearners.map((item) => {
                    const profile = latestProfileFor(profiles, item.id)
                    const selected = item.id === learnerId
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => chooseLearner(item.id)}
                        className={cn(
                          'flex items-start gap-2.5 rounded-xl border p-3 text-left transition',
                          selected
                            ? 'border-brand-300 bg-brand-50/50 ring-2 ring-brand-500/10'
                            : 'border-line bg-white hover:border-brand-200 hover:bg-brand-50/20',
                        )}
                      >
                        <Avatar name={item.name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-medium text-ink-900">{item.name}</span>
                            {selected && <Check className="size-3.5 text-brand-600" />}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-ink-400">
                            {item.code} · {item.ageGroup}
                          </span>
                          <span className="mt-1 block truncate text-[10px] text-ink-500">
                            {item.currentGoalText || '尚未设置训练目标'}
                          </span>
                          <span className="mt-1.5 inline-flex">
                            <ProfileStatusBadge status={profile?.status ?? 'none'} />
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="rounded-xl border border-line bg-ink-50/40 p-4">
                {learner ? (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={learner.name} size="md" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-ink-900">{learner.name}</p>
                        <p className="text-[10px] text-ink-400">{learner.code}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-[10px] text-ink-400">能力画像</p>
                        <div className="mt-1">
                          <ProfileStatusBadge status={learnerProfile?.status ?? 'none'} />
                        </div>
                      </div>
                      {learnerAssessment && (
                        <div>
                          <p className="text-[10px] text-ink-400">最近评估</p>
                          <p className="mt-0.5 text-xs text-ink-700">
                            {formatDate(learnerAssessment.createdAt)} · 综合{' '}
                            {assessmentAverage(learnerAssessment).toFixed(1)} / 5
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-ink-400">提示方式偏好</p>
                        <p className="mt-0.5 text-[11px] leading-5 text-ink-600">
                          {learner.promptPreference || '未填写'}
                        </p>
                      </div>
                      {learnerProfile && (
                        <div>
                          <p className="text-[10px] text-ink-400">已有优势</p>
                          <div className="mt-1 space-y-1">
                            {learnerProfile.strengths.slice(0, 2).map((item) => (
                              <p key={item} className="text-[11px] leading-4 text-ink-600">
                                · {item}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      <Link
                        to={`/profiles/${learner.id}`}
                        className="inline-flex text-[11px] font-medium text-brand-600 hover:text-brand-700"
                      >
                        查看完整能力画像
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
                    <UserRound className="size-5 text-ink-300" />
                    <p className="mt-2 text-xs text-ink-400">请选择一位学员</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[15px] font-semibold text-ink-900">第二步：设置训练目标</h2>
              <p className="mt-1 text-xs text-ink-400">
                {learner ? `为 ${learner.name} 选择已有目标，或根据实际需要自定义。` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setGoalMode('existing')
                  setErrors({})
                }}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs transition',
                  goalMode === 'existing'
                    ? 'border-brand-300 bg-brand-50 font-medium text-brand-700'
                    : 'border-line text-ink-500 hover:border-brand-200',
                )}
              >
                选择已有目标（{learnerGoals.length}）
              </button>
              <button
                type="button"
                onClick={() => {
                  setGoalMode('custom')
                  setErrors({})
                }}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs transition',
                  goalMode === 'custom'
                    ? 'border-brand-300 bg-brand-50 font-medium text-brand-700'
                    : 'border-line text-ink-500 hover:border-brand-200',
                )}
              >
                自定义训练目标
              </button>
            </div>

            {goalMode === 'existing' ? (
              learnerGoals.length === 0 ? (
                <Alert
                  tone="info"
                  title="该学员还没有训练目标"
                  description="可以先创建训练目标，或直接切换到自定义目标继续生成脚本。"
                  action={
                    <Button size="sm" variant="outline" onClick={() => setGoalMode('custom')}>
                      自定义目标
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-2.5 md:grid-cols-2">
                  {learnerGoals.map((goal) => {
                    const selected = goal.id === goalId
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => {
                          setGoalId(goal.id)
                          setErrors({})
                        }}
                        className={cn(
                          'rounded-xl border p-4 text-left transition',
                          selected
                            ? 'border-brand-300 bg-brand-50/50 ring-2 ring-brand-500/10'
                            : 'border-line bg-white hover:border-brand-200',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-medium text-ink-800">{goal.title}</p>
                          {selected && <Check className="size-4 shrink-0 text-brand-600" />}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <GoalStatusBadge status={goal.status} />
                          <Badge tone="neutral">{goal.category}</Badge>
                          {goal.targetDate && (
                            <span className="text-[10px] text-ink-300">目标日期 {goal.targetDate}</span>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2-safe text-[11px] leading-5 text-ink-400">
                          {goal.description || '未填写描述'}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )
            ) : (
              <div className="max-w-2xl space-y-4">
                <Field label="自定义目标名称" required error={errors.customGoalTitle}>
                  <Input
                    value={customGoalTitle}
                    onChange={(event) => {
                      setCustomGoalTitle(event.target.value)
                      setErrors((previous) => ({ ...previous, customGoalTitle: '' }))
                    }}
                    placeholder="例如：练习在小组活动中主动邀请同伴"
                    maxLength={60}
                  />
                </Field>
                <Field label="目标分类">
                  <Select
                    value={customGoalCategory}
                    onChange={(event) => setCustomGoalCategory(event.target.value)}
                  >
                    {GOAL_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="目标描述" hint="生成脚本时将作为情境设计参考。">
                  <Textarea
                    value={customGoalDescription}
                    onChange={(event) => setCustomGoalDescription(event.target.value)}
                    placeholder="描述希望练习的情境、目标表现与需要关注的地方。"
                  />
                </Field>
                <Alert
                  tone="info"
                  title="提示"
                  description="自定义目标会在生成脚本时一并保存到学员的训练目标中，便于后续追踪。"
                />
              </div>
            )}
            {errors.goalId && <p className="text-xs text-danger-500">{errors.goalId}</p>}

            {selectedGoal && (
              <div className="rounded-xl border border-line bg-ink-50/40 p-4">
                <p className="text-[11px] font-medium text-ink-600">关联能力维度</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedGoal.relatedDimensions.length ? (
                    selectedGoal.relatedDimensions.map((key) => (
                      <Badge key={key} tone="brand">
                        {ABILITY_DIMENSIONS.find((dimension) => dimension.key === key)?.name ?? key}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[11px] text-ink-400">该目标尚未标记相关能力维度</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[15px] font-semibold text-ink-900">第三步：配置训练情境</h2>
              <p className="mt-1 text-xs text-ink-400">
                设置训练主题、场景与步骤数量。生成后仍可在脚本详情页中编辑。
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="训练主题" required error={errors.theme}>
                <Input
                  value={config.theme}
                  onChange={(event) => {
                    setConfig((previous) => ({ ...previous, theme: event.target.value }))
                    setErrors((previous) => ({ ...previous, theme: '' }))
                  }}
                  placeholder="例如：课堂点心时间的需求表达"
                />
              </Field>
              <Field label="场景类型" required error={errors.sceneType}>
                <Select
                  value={config.sceneType}
                  onChange={(event) =>
                    setConfig((previous) => ({ ...previous, sceneType: event.target.value }))
                  }
                >
                  {SCENE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="场景复杂程度">
                <div className="flex gap-2">
                  {COMPLEXITY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        setConfig((previous) => ({
                          ...previous,
                          complexity: option as SceneComplexity,
                        }))
                      }
                      className={cn(
                        'flex-1 rounded-lg border px-2 py-2 text-xs transition',
                        config.complexity === option
                          ? 'border-brand-300 bg-brand-50 font-medium text-brand-700'
                          : 'border-line text-ink-500 hover:border-brand-200',
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="训练步骤数量" error={errors.stepCount} hint="建议 3–6 个连续步骤。">
                <Select
                  value={config.stepCount}
                  onChange={(event) =>
                    setConfig((previous) => ({ ...previous, stepCount: Number(event.target.value) }))
                  }
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((count) => (
                    <option key={count} value={count}>
                      {count} 个步骤
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="建议训练时长（分钟）" error={errors.duration}>
                <Input
                  type="number"
                  min={5}
                  max={60}
                  value={config.duration}
                  onChange={(event) =>
                    setConfig((previous) => ({ ...previous, duration: Number(event.target.value) }))
                  }
                />
              </Field>
              <Field label="提示方式">
                <Select
                  value={config.promptStyle}
                  onChange={(event) =>
                    setConfig((previous) => ({ ...previous, promptStyle: event.target.value }))
                  }
                >
                  {PROMPT_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="预期行为" hint="描述每一步希望看到的具体表现。">
                <Textarea
                  value={expectedBehavior}
                  onChange={(event) => setExpectedBehavior(event.target.value)}
                  placeholder="例如：学员能在提示后使用短句表达需求。"
                />
              </Field>
              <Field label="完成条件" hint="描述如何判断当前步骤完成。">
                <Textarea
                  value={completionStandard}
                  onChange={(event) => setCompletionStandard(event.target.value)}
                  placeholder="例如：说出需求或使用提示卡，并保持情绪平稳。"
                />
              </Field>
            </div>
            <Field label="需要记录的观察要点">
              <TagInput
                value={observationPoints}
                onChange={setObservationPoints}
                placeholder="例如：主动表达次数、等待时长"
                suggestions={['主动表达次数', '等待时的表现', '需要的提示次数', '情绪变化', '完成步骤的顺序']}
              />
            </Field>
            <Field label="环境偏好">
              <TagInput
                value={config.environmentPrefs}
                onChange={(value) => setConfig((previous) => ({ ...previous, environmentPrefs: value }))}
                placeholder="例如：减少视觉干扰、安静无噪音"
                suggestions={SENSORY_OPTIONS}
              />
            </Field>
            <Field label="需要避免的环境元素">
              <TagInput
                value={config.avoidElements}
                onChange={(value) => setConfig((previous) => ({ ...previous, avoidElements: value }))}
                placeholder="例如：拥挤的人群、突然的提示音"
                suggestions={['拥挤的人群', '强光', '突然的提示音', '背景电视声', '过多玩具', '强对比装饰']}
              />
            </Field>
            <Field label="补充说明（可选）">
              <Textarea
                value={extraNotes}
                onChange={(event) => setExtraNotes(event.target.value)}
                placeholder="例如：本阶段先从一对一情境开始，逐步增加同伴数量。"
                className="min-h-[80px]"
              />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[15px] font-semibold text-ink-900">第四步：生成训练脚本</h2>
              <p className="mt-1 text-xs text-ink-400">
                确认以下信息后生成结构化训练脚本。当前使用模拟生成服务，生成后可编辑与确认。
              </p>
            </div>

            {generating ? (
              <div className="rounded-xl border border-line bg-ink-50/30 p-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 animate-pulse-soft text-brand-600" />
                  <p className="text-sm font-medium text-ink-800">正在生成训练脚本…</p>
                  <DemoBadge label="模拟服务" />
                </div>
                <ProgressBar value={((genStage + 1) / stageLabels.length) * 100} className="mt-4" animated />
                <div className="mt-4 space-y-2">
                  {stageLabels.map((label, index) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <span
                        className={cn(
                          'flex size-4 items-center justify-center rounded-full',
                          index < genStage
                            ? 'bg-success-500 text-white'
                            : index === genStage
                              ? 'bg-brand-50 text-brand-600 ring-2 ring-brand-500/20'
                              : 'bg-ink-100 text-ink-300',
                        )}
                      >
                        {index < genStage ? <Check className="size-2.5" /> : index + 1}
                      </span>
                      <span className={index <= genStage ? 'text-ink-600' : 'text-ink-300'}>{label}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[11px] text-ink-400">
                  生成过程会模拟等待状态，完成后自动进入脚本详情页。
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-line p-4">
                    <p className="text-[11px] font-medium text-ink-500">关联学员</p>
                    {learner && (
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar name={learner.name} size="sm" />
                        <div>
                          <p className="text-xs font-medium text-ink-800">{learner.name}</p>
                          <p className="text-[10px] text-ink-400">{learner.code}</p>
                        </div>
                      </div>
                    )}
                    {learnerProfile && (
                      <div className="mt-2">
                        <ProfileStatusBadge status={learnerProfile.status} />
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-line p-4 md:col-span-2">
                    <p className="text-[11px] font-medium text-ink-500">训练目标</p>
                    <p className="mt-1.5 text-xs font-medium text-ink-800">
                      {effectiveGoalTitle || '—'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge tone="neutral">
                        {goalMode === 'custom' ? customGoalCategory : selectedGoal?.category ?? '—'}
                      </Badge>
                      {goalMode === 'custom' ? (
                        <Badge tone="warning">自定义目标</Badge>
                      ) : selectedGoal ? (
                        <GoalStatusBadge status={selectedGoal.status} />
                      ) : null}
                    </div>
                    {goalMode === 'custom' && customGoalDescription && (
                      <p className="mt-2 text-[11px] leading-5 text-ink-400">{customGoalDescription}</p>
                    )}
                  </div>
                </div>

                <SectionCard
                  title="训练情境配置"
                  description="以下配置将作为脚本生成与后续场景创建的依据。"
                  icon={<Target />}
                >
                  <div className="grid gap-x-8 gap-y-4 text-xs sm:grid-cols-2">
                    {[
                      ['训练主题', config.theme],
                      ['场景类型', config.sceneType],
                      ['复杂程度', config.complexity],
                      ['步骤数量', `${config.stepCount} 个步骤`],
                      ['建议时长', `${config.duration} 分钟`],
                      ['提示方式', config.promptStyle],
                      ['预期行为', expectedBehavior || '未填写'],
                      ['完成条件', completionStandard || '未填写'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-[10px] text-ink-400">{label}</p>
                        <p className="mt-0.5 leading-5 text-ink-700">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] text-ink-400">环境偏好</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {config.environmentPrefs.length ? (
                          config.environmentPrefs.map((item) => (
                            <Badge key={item} tone="neutral">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[11px] text-ink-300">未设置</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-400">需要避免</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {config.avoidElements.length ? (
                          config.avoidElements.map((item) => (
                            <Badge key={item} tone="warning">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[11px] text-ink-300">未设置</span>
                        )}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <Alert
                  tone="info"
                  title="生成说明"
                  description="当前阶段使用模拟生成服务，生成结果会明确标注为演示内容。未来接入真实服务后，仅需替换服务层，不需要修改页面交互。"
                />
              </>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <Button
            variant="ghost"
            disabled={generating}
            onClick={() => {
              if (step === 0) navigate('/scripts')
              else setStep((previous) => previous - 1)
            }}
            icon={step > 0 ? <ArrowLeft /> : undefined}
          >
            {step === 0 ? '取消' : '上一步'}
          </Button>
          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button onClick={goNext} iconRight={<ArrowRight />}>
                下一步
              </Button>
            ) : (
              <Button
                onClick={generate}
                loading={generating}
                icon={<Wand2 />}
                disabled={!learner || !effectiveGoalTitle}
              >
                生成训练脚本
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
