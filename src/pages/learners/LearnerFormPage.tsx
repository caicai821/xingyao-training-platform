import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ClipboardList, MessageSquareText, Tags, UserRound } from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { useToast } from '@/context/ToastContext'
import { useAsyncAction, errorMessage } from '@/hooks/useAsyncAction'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  SectionCard,
  Select,
  TagInput,
  Textarea,
} from '@/components/ui'
import { Alert, Badge } from '@/components/ui/feedback'
import { LearnerStatusBadge } from '@/components/domain/StatusBadges'
import {
  AGE_GROUPS,
  INTEREST_SUGGESTIONS,
  LEARNER_STATUS_LABELS,
  TRAIT_SUGGESTIONS,
} from '@/lib/constants'
import type { Learner, LearnerInput, LearnerStatus } from '@/types'

const emptyForm: LearnerInput = {
  name: '',
  nickname: '',
  ageGroup: '6-8 岁',
  status: 'active',
  traits: [],
  interests: [],
  communicationStyle: '',
  promptPreference: '',
  environmentNotes: '',
  currentGoalText: '',
  notes: '',
}

function learnerToInput(learner: Learner): LearnerInput {
  return {
    name: learner.name,
    nickname: learner.nickname ?? '',
    ageGroup: learner.ageGroup,
    status: learner.status,
    traits: [...learner.traits],
    interests: [...learner.interests],
    communicationStyle: learner.communicationStyle,
    promptPreference: learner.promptPreference,
    environmentNotes: learner.environmentNotes,
    currentGoalText: learner.currentGoalText,
    notes: learner.notes,
  }
}

export default function LearnerFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { learners, services, refreshAll } = useAppData()
  const { toast } = useToast()
  const { pending, run } = useAsyncAction()

  const existing = useMemo(() => learners.find((learner) => learner.id === id), [id, learners])
  const [form, setForm] = useState<LearnerInput>(() =>
    existing ? learnerToInput(existing) : { ...emptyForm },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (existing) setForm(learnerToInput(existing))
    else if (!id) setForm({ ...emptyForm })
    setErrors({})
  }, [existing, id])

  const update = <K extends keyof LearnerInput>(key: K, value: LearnerInput[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    if (errors[key as string]) {
      setErrors((previous) => ({ ...previous, [key]: '' }))
    }
  }

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = '请填写学员姓名或匿名编号'
    if (!form.ageGroup) nextErrors.ageGroup = '请选择年龄段'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      toast({ tone: 'error', title: '请检查必填信息', description: '带 * 的字段需要补充完整。' })
      return
    }

    await run(async () => {
      try {
        if (existing) {
          await services.learners.update(existing.id, form)
          await refreshAll(true)
          toast({ title: '学员档案已更新' })
          navigate(`/learners/${existing.id}`)
        } else {
          const created = await services.learners.create(form)
          await refreshAll(true)
          toast({ title: '学员档案已创建', description: `档案编号 ${created.code}` })
          navigate(`/learners/${created.id}`)
        }
      } catch (cause) {
        toast({ tone: 'error', title: '保存失败', description: errorMessage(cause) })
      }
    })
  }

  if (id && !existing) {
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

  const isEditing = Boolean(existing)

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={isEditing ? '编辑学员档案' : '新增学员档案'}
        description={
          isEditing
            ? `正在编辑 ${existing?.name} 的档案信息（${existing?.code}）。`
            : '填写学员的基本信息与支持方式，保存后可继续录入能力信息。'
        }
        breadcrumbs={[
          { label: '学员档案', to: '/learners' },
          ...(isEditing ? [{ label: existing!.name, to: `/learners/${existing!.id}` }] : []),
          { label: isEditing ? '编辑' : '新增' },
        ]}
        actions={
          <>
            <Link to={isEditing ? `/learners/${id}` : '/learners'}>
              <Button variant="outline">取消</Button>
            </Link>
            <Button onClick={handleSave} loading={pending}>
              保存档案
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <SectionCard
            title="基本信息"
            description="姓名可以使用化名或匿名编号，避免录入非必要个人信息。"
            icon={<UserRound />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="姓名或匿名编号" required error={errors.name}>
                <Input
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder="例如：林小满 / 学员 A"
                  maxLength={30}
                />
              </Field>
              <Field label="昵称" hint="用于日常称呼，可留空。">
                <Input
                  value={form.nickname}
                  onChange={(event) => update('nickname', event.target.value)}
                  placeholder="例如：小满"
                  maxLength={20}
                />
              </Field>
              <Field label="年龄段" required error={errors.ageGroup}>
                <Select
                  value={form.ageGroup}
                  onChange={(event) => update('ageGroup', event.target.value)}
                >
                  {AGE_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="档案状态">
                <Select
                  value={form.status}
                  onChange={(event) => update('status', event.target.value as LearnerStatus)}
                >
                  {Object.entries(LEARNER_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="个性化特点与兴趣"
            description="这些信息会作为能力画像分析与训练情境设计的参考。"
            icon={<Tags />}
          >
            <div className="space-y-5">
              <Field
                label="个性化特点"
                hint="输入后按回车添加，可点击下方建议项快速补充。"
              >
                <TagInput
                  value={form.traits}
                  onChange={(value) => update('traits', value)}
                  placeholder="例如：对声音敏感、喜欢绘画"
                  suggestions={TRAIT_SUGGESTIONS}
                />
              </Field>
              <Field label="兴趣偏好">
                <TagInput
                  value={form.interests}
                  onChange={(value) => update('interests', value)}
                  placeholder="例如：绘本、积木、音乐"
                  suggestions={INTEREST_SUGGESTIONS}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="沟通与支持策略"
            description="记录日常观察中的沟通方式与有效提示策略，帮助训练脚本更贴近实际。"
            icon={<MessageSquareText />}
          >
            <div className="space-y-4">
              <Field label="沟通方式及表达特点">
                <Textarea
                  value={form.communicationStyle}
                  onChange={(event) => update('communicationStyle', event.target.value)}
                  placeholder="例如：能用短句表达基本需求，在熟悉环境中更主动。"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="适合的提示方式">
                  <Textarea
                    value={form.promptPreference}
                    onChange={(event) => update('promptPreference', event.target.value)}
                    placeholder="例如：先叫名字，等待 3 秒，再用简短语句提示。"
                    className="min-h-[88px]"
                  />
                </Field>
                <Field label="需要关注的环境因素">
                  <Textarea
                    value={form.environmentNotes}
                    onChange={(event) => update('environmentNotes', event.target.value)}
                    placeholder="例如：避免突然的噪音和强光，座位尽量固定。"
                    className="min-h-[88px]"
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="训练目标与备注"
            description="当前目标会显示在档案概览中，后续可由训练目标模块统一管理。"
            icon={<ClipboardList />}
          >
            <div className="space-y-4">
              <Field label="当前训练目标">
                <Input
                  value={form.currentGoalText}
                  onChange={(event) => update('currentGoalText', event.target.value)}
                  placeholder="例如：在课堂中主动向老师表达需求"
                />
              </Field>
              <Field label="备注信息" hint="仅记录与训练支持相关的必要信息。">
                <Textarea
                  value={form.notes}
                  onChange={(event) => update('notes', event.target.value)}
                  placeholder="补充说明、家庭反馈或后续计划等"
                />
              </Field>
            </div>
          </SectionCard>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link to={isEditing ? `/learners/${id}` : '/learners'}>
              <Button variant="outline">取消</Button>
            </Link>
            <Button onClick={handleSave} loading={pending}>
              保存档案
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Avatar name={form.name || '新学员'} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {form.name || '新学员'}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-400">
                  {existing ? existing.code : '保存后自动生成档案编号'}
                </p>
                <div className="mt-1.5">
                  <LearnerStatusBadge status={form.status} />
                </div>
              </div>
            </div>
            <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400">年龄段</dt>
                <dd className="text-ink-700">{form.ageGroup}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400">特点数量</dt>
                <dd className="text-ink-700">{form.traits.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400">兴趣数量</dt>
                <dd className="text-ink-700">{form.interests.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400">当前目标</dt>
                <dd className="max-w-[160px] truncate text-right text-ink-700">
                  {form.currentGoalText || '未填写'}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {form.traits.slice(0, 4).map((trait) => (
                <Badge key={trait} tone="neutral">
                  {trait}
                </Badge>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={handleSave} loading={pending}>
              保存档案
            </Button>
          </Card>

          <Alert
            tone="info"
            title="信息最小化原则"
            description="原型中的姓名、记录与案例均为虚构演示数据。实际使用时应仅收集支持训练所需的必要信息，并限制访问范围。"
          />
        </div>
      </div>
    </div>
  )
}
