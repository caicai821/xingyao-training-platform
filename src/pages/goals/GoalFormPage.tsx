import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FileText, Save, Sparkles, Target, UserRound } from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { useToast } from '@/context/ToastContext'
import { useAsyncAction, errorMessage } from '@/hooks/useAsyncAction'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Button,
  Card,
  Field,
  Input,
  SectionCard,
  Select,
  Textarea,
} from '@/components/ui'
import { Alert, Badge } from '@/components/ui/feedback'
import { ProfileStatusBadge } from '@/components/domain/StatusBadges'
import {
  ABILITY_DIMENSIONS,
  GOAL_CATEGORIES,
  GOAL_PRIORITY_LABELS,
  GOAL_STATUS_LABELS,
} from '@/lib/constants'
import { assessmentAverage, latestAssessmentFor, latestProfileFor } from '@/lib/selectors'
import { cn, formatDate } from '@/lib/utils'
import type { AbilityDimensionKey, GoalPriority, GoalStatus, TrainingGoalInput } from '@/types'

const examples = [
  {
    title: '提高主动表达需求的能力',
    category: '沟通表达',
    description: '在熟悉情境中使用短句向成人表达自己的需求，减少等待与提示时间。',
    dimensions: ['communication', 'attention', 'learning'] as AbilityDimensionKey[],
  },
  {
    title: '练习识别和表达基本情绪',
    category: '情绪表达',
    description: '在日常生活与角色情境中识别开心、紧张、生气等感受，并尝试用词语表达。',
    dimensions: ['emotion', 'communication', 'learning'] as AbilityDimensionKey[],
  },
  {
    title: '练习理解简单指令',
    category: '认知理解',
    description: '在具体材料支持下理解并执行单步或两步指令。',
    dimensions: ['cognition', 'attention'] as AbilityDimensionKey[],
  },
  {
    title: '练习轮流等待',
    category: '社交互动',
    description: '在小组活动中等待轮次，并使用语言或手势表达参与意愿。',
    dimensions: ['social', 'emotion', 'attention'] as AbilityDimensionKey[],
  },
  {
    title: '练习日常任务的执行顺序',
    category: '生活技能',
    description: '借助视觉流程卡，按顺序完成准备、操作与整理的日常流程。',
    dimensions: ['dailyLiving', 'cognition', 'attention'] as AbilityDimensionKey[],
  },
  {
    title: '练习对环境变化作出适当回应',
    category: '环境适应',
    description: '在提前告知的前提下，面对流程或场地变化时表达感受并提出需要。',
    dimensions: ['adaptation', 'emotion', 'communication'] as AbilityDimensionKey[],
  },
]

export default function GoalFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { learners, assessments, profiles, services, refreshAll } = useAppData()
  const { toast } = useToast()
  const { pending, run } = useAsyncAction()

  const queryLearner = searchParams.get('learner') ?? ''
  const learnerId = learners.some((learner) => learner.id === queryLearner) ? queryLearner : ''

  const [form, setForm] = useState<TrainingGoalInput>({
    learnerId,
    title: '',
    category: '沟通表达',
    description: '',
    successCriteria: '',
    relatedDimensions: [],
    priority: 'medium',
    status: 'planning',
    targetDate: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedLearner = useMemo(
    () => learners.find((learner) => learner.id === form.learnerId),
    [form.learnerId, learners],
  )
  const selectedProfile = selectedLearner
    ? latestProfileFor(profiles, selectedLearner.id)
    : undefined
  const selectedAssessment = selectedLearner
    ? latestAssessmentFor(assessments, selectedLearner.id)
    : undefined

  const update = <K extends keyof TrainingGoalInput>(key: K, value: TrainingGoalInput[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    if (errors[key as string]) setErrors((previous) => ({ ...previous, [key]: '' }))
  }

  const toggleDimension = (key: AbilityDimensionKey) => {
    setForm((previous) => ({
      ...previous,
      relatedDimensions: previous.relatedDimensions.includes(key)
        ? previous.relatedDimensions.filter((item) => item !== key)
        : [...previous.relatedDimensions, key],
    }))
  }

  const save = async (toScript: boolean) => {
    const nextErrors: Record<string, string> = {}
    if (!form.learnerId) nextErrors.learnerId = '请选择关联学员'
    if (!form.title.trim()) nextErrors.title = '请填写训练目标名称'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      toast({ tone: 'error', title: '请检查必填信息' })
      return
    }

    await run(async () => {
      try {
        const goal = await services.goals.create({
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          successCriteria: form.successCriteria.trim(),
          targetDate: form.targetDate || undefined,
        })
        await refreshAll(true)
        toast({ title: '训练目标已创建', description: goal.title })
        navigate(
          toScript
            ? `/scripts/new?learner=${goal.learnerId}&goal=${goal.id}`
            : `/goals?learner=${goal.learnerId}`,
        )
      } catch (cause) {
        toast({ tone: 'error', title: '创建失败', description: errorMessage(cause) })
      }
    })
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="新建训练目标"
        description="明确本阶段希望练习的方向。目标会关联学员档案，并可作为训练脚本生成的输入。"
        breadcrumbs={[
          { label: '训练目标', to: '/goals' },
          { label: '新建目标' },
        ]}
        actions={
          <>
            <Link to="/goals">
              <Button variant="outline">取消</Button>
            </Link>
            <Button variant="outline" icon={<FileText />} onClick={() => save(true)} loading={pending}>
              保存并生成脚本
            </Button>
            <Button icon={<Save />} onClick={() => save(false)} loading={pending}>
              保存目标
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <SectionCard
            title="关联学员与目标"
            description="选择目标对应的学员，并填写清晰的训练方向。"
            icon={<Target />}
          >
            <div className="space-y-4">
              <Field label="关联学员" required error={errors.learnerId}>
                <Select
                  value={form.learnerId}
                  onChange={(event) => update('learnerId', event.target.value)}
                >
                  <option value="">请选择学员档案</option>
                  {learners.map((learner) => (
                    <option key={learner.id} value={learner.id}>
                      {learner.name}（{learner.code}）
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="目标名称" required error={errors.title}>
                <Input
                  value={form.title}
                  onChange={(event) => update('title', event.target.value)}
                  placeholder="例如：在课堂中主动向老师表达需求"
                  maxLength={60}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="目标分类">
                  <Select
                    value={form.category}
                    onChange={(event) => update('category', event.target.value)}
                  >
                    {GOAL_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="优先级">
                  <Select
                    value={form.priority}
                    onChange={(event) => update('priority', event.target.value as GoalPriority)}
                  >
                    {Object.entries(GOAL_PRIORITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="目标状态">
                  <Select
                    value={form.status}
                    onChange={(event) => update('status', event.target.value as GoalStatus)}
                  >
                    {Object.entries(GOAL_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="目标日期" hint="可选，用于后续进度跟踪。">
                  <Input
                    type="date"
                    value={form.targetDate ?? ''}
                    onChange={(event) => update('targetDate', event.target.value)}
                  />
                </Field>
              </div>
              <Field label="目标描述" hint="描述希望在哪些情境中练习，以及希望达到的表现。">
                <Textarea
                  value={form.description}
                  onChange={(event) => update('description', event.target.value)}
                  placeholder="例如：在点心、取用材料等熟悉情境中，使用短句向老师表达自己的需求。"
                />
              </Field>
              <Field label="成功标准" hint="可用可观察的行为描述完成标准。">
                <Textarea
                  value={form.successCriteria}
                  onChange={(event) => update('successCriteria', event.target.value)}
                  placeholder="例如：连续两周，每天至少 2 次在等待 5 秒内主动使用短句表达需求。"
                  className="min-h-[80px]"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="相关能力维度"
            description="选择与该目标最相关的维度，便于生成训练脚本时参考。"
            icon={<Sparkles />}
          >
            <div className="flex flex-wrap gap-2">
              {ABILITY_DIMENSIONS.map((dimension) => {
                const selected = form.relatedDimensions.includes(dimension.key)
                return (
                  <button
                    key={dimension.key}
                    type="button"
                    onClick={() => toggleDimension(dimension.key)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-xs transition',
                      selected
                        ? 'border-brand-300 bg-brand-50 font-medium text-brand-700'
                        : 'border-line bg-white text-ink-500 hover:border-brand-200 hover:bg-brand-50/30',
                    )}
                  >
                    {dimension.name}
                  </button>
                )
              })}
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-[11px] font-medium text-ink-500">常用目标示例</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example.title}
                    type="button"
                    onClick={() => {
                      setForm((previous) => ({
                        ...previous,
                        title: example.title,
                        category: example.category,
                        description: previous.description || example.description,
                        relatedDimensions: example.dimensions,
                      }))
                      setErrors((previous) => ({ ...previous, title: '' }))
                    }}
                    className="rounded-full border border-line bg-ink-50 px-3 py-1.5 text-[11px] text-ink-500 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {example.title}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link to="/goals">
              <Button variant="outline">取消</Button>
            </Link>
            <Button variant="outline" icon={<FileText />} onClick={() => save(true)} loading={pending}>
              保存并生成脚本
            </Button>
            <Button icon={<Save />} onClick={() => save(false)} loading={pending}>
              保存目标
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <p className="text-xs font-medium text-ink-700">关联学员概览</p>
            {selectedLearner ? (
              <>
                <div className="mt-3 flex items-start gap-3">
                  <Avatar name={selectedLearner.name} size="md" />
                  <div className="min-w-0">
                    <Link
                      to={`/learners/${selectedLearner.id}`}
                      className="text-sm font-semibold text-ink-900 hover:text-brand-700"
                    >
                      {selectedLearner.name}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-ink-400">
                      {selectedLearner.code} · {selectedLearner.ageGroup}
                    </p>
                    <div className="mt-1.5">
                      <ProfileStatusBadge status={selectedProfile?.status ?? 'none'} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-3 border-t border-line pt-4 text-xs">
                  <div>
                    <p className="text-[10px] text-ink-400">当前训练目标</p>
                    <p className="mt-0.5 leading-5 text-ink-700">
                      {selectedLearner.currentGoalText || '尚未设置'}
                    </p>
                  </div>
                  {selectedAssessment && (
                    <div>
                      <p className="text-[10px] text-ink-400">最近能力评估</p>
                      <p className="mt-0.5 leading-5 text-ink-700">
                        {formatDate(selectedAssessment.createdAt)} · 综合{' '}
                        {assessmentAverage(selectedAssessment).toFixed(1)} / 5
                      </p>
                    </div>
                  )}
                  {selectedProfile && (
                    <div>
                      <p className="text-[10px] text-ink-400">画像关注方向</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {selectedProfile.developmentAreas.slice(0, 2).map((item) => (
                          <Badge key={item} tone="warning">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Link
                  to={`/profiles/${selectedLearner.id}`}
                  className="mt-4 inline-flex text-[11px] font-medium text-brand-600 hover:text-brand-700"
                >
                  查看完整能力画像
                </Link>
              </>
            ) : (
              <div className="mt-6 flex flex-col items-center py-6 text-center">
                <span className="flex size-10 items-center justify-center rounded-xl bg-ink-50 text-ink-400">
                  <UserRound className="size-4" />
                </span>
                <p className="mt-3 text-xs text-ink-400">选择学员后，这里会展示能力画像摘要。</p>
              </div>
            )}
          </Card>

          <Alert
            tone="info"
            title="关于训练目标"
            description="训练目标应与学员当前能力特点相匹配，建议一次聚焦 1–2 个可观察的方向，并在训练脚本中拆分为具体步骤。"
          />
        </div>
      </div>
    </div>
  )
}
