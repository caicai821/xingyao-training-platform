import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ClipboardList,
  History,
  Save,
  Sparkles,
  UserRound,
  Wand2,
} from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { useToast } from '@/context/ToastContext'
import { useAsyncAction, errorMessage } from '@/hooks/useAsyncAction'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Button,
  Card,
  EmptyState,
  Field,
  SectionCard,
  Textarea,
} from '@/components/ui'
import { Alert, Badge, ProgressBar } from '@/components/ui/feedback'
import {
  ABILITY_DIMENSIONS,
  SCORE_LABELS,
  SCORE_LEGEND,
} from '@/lib/constants'
import { assessmentAverage, latestAssessmentFor } from '@/lib/selectors'
import { averageScore, cn, formatDateTime } from '@/lib/utils'
import type { AbilityDimensionKey, AbilityScores, DimensionEntry } from '@/types'

interface DraftPayload {
  entries: Record<AbilityDimensionKey, DimensionEntry>
  generalNotes: string
  savedAt: string
}

function buildEntries(source?: AbilityScores): Record<AbilityDimensionKey, DimensionEntry> {
  const result = {} as Record<AbilityDimensionKey, DimensionEntry>
  for (const dimension of ABILITY_DIMENSIONS) {
    result[dimension.key] = source
      ? { ...source[dimension.key] }
      : { score: 0, description: '', strengths: '', concerns: '', observation: '' }
  }
  return result
}

export default function AssessmentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { learners, assessments, services, refreshAll } = useAppData()
  const { toast } = useToast()
  const { pending, run } = useAsyncAction()

  const learner = learners.find((item) => item.id === id)
  const latestAssessment = useMemo(
    () => (id ? latestAssessmentFor(assessments, id) : undefined),
    [assessments, id],
  )

  const [entries, setEntries] = useState<Record<AbilityDimensionKey, DimensionEntry>>(() =>
    buildEntries(latestAssessment?.scores),
  )
  const [generalNotes, setGeneralNotes] = useState('')
  const [activeKey, setActiveKey] = useState<AbilityDimensionKey>('communication')
  const [draftLoadedAt, setDraftLoadedAt] = useState<string | null>(null)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const draftKey = `qicheng_assessment_draft_${id ?? 'unknown'}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as DraftPayload
      if (parsed?.entries) {
        setEntries({ ...buildEntries(), ...parsed.entries })
        setGeneralNotes(parsed.generalNotes ?? '')
        setDraftLoadedAt(parsed.savedAt)
      }
    } catch {
      localStorage.removeItem(draftKey)
    }
  }, [draftKey])

  if (!learner) {
    return (
      <EmptyState
        icon={<UserRound />}
        title="未找到该学员档案"
        action={
          <Link to="/learners">
            <Button variant="outline">返回学员列表</Button>
          </Link>
        }
        className="rounded-card border border-line bg-white shadow-card"
      />
    )
  }

  const activeDimension = ABILITY_DIMENSIONS.find((dimension) => dimension.key === activeKey)!
  const activeEntry = entries[activeKey]
  const scoredCount = ABILITY_DIMENSIONS.filter((dimension) => entries[dimension.key].score > 0).length
  const scoredValues = ABILITY_DIMENSIONS.map((dimension) => entries[dimension.key].score).filter(
    (score) => score > 0,
  )
  const currentAverage = averageScore(scoredValues)

  const updateEntry = (key: AbilityDimensionKey, patch: Partial<DimensionEntry>) => {
    setEntries((previous) => ({ ...previous, [key]: { ...previous[key], ...patch } }))
    setDraftSavedAt(null)
  }

  const validate = () => {
    const missing = ABILITY_DIMENSIONS.filter((dimension) => entries[dimension.key].score < 1)
    if (missing.length) {
      setActiveKey(missing[0].key)
      toast({
        tone: 'error',
        title: '还有能力维度未评分',
        description: `请为“${missing[0].name}”等 ${missing.length} 个维度选择当前表现评分。`,
      })
      return false
    }
    return true
  }

  const saveDraft = () => {
    try {
      const payload: DraftPayload = { entries, generalNotes, savedAt: new Date().toISOString() }
      localStorage.setItem(draftKey, JSON.stringify(payload))
      setDraftSavedAt(payload.savedAt)
      setDraftLoadedAt(null)
      toast({ tone: 'info', title: '草稿已保存在本地', description: '完成后可继续提交并生成能力画像。' })
    } catch {
      toast({ tone: 'error', title: '草稿保存失败', description: '浏览器存储空间可能不足。' })
    }
  }

  const submit = async () => {
    if (!validate()) return
    await run(async () => {
      try {
        await services.assessments.save({
          learnerId: learner.id,
          scores: entries,
          generalNotes,
          author: '演示账号 · 训练指导',
        })
        localStorage.removeItem(draftKey)
        await refreshAll(true)
        toast({
          title: '能力信息已保存',
          description: '可继续生成能力画像分析，并由使用者核对确认。',
        })
        navigate(`/profiles/${learner.id}?fresh=1`)
      } catch (cause) {
        toast({ tone: 'error', title: '保存失败', description: errorMessage(cause) })
      }
    })
  }

  const switchDimension = (key: AbilityDimensionKey) => setActiveKey(key)

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`${learner.name} · 能力信息录入`}
        description="根据日常观察与任务表现记录当前能力表现。评分用于记录观察，不构成标准化评估或诊断结论。"
        breadcrumbs={[
          { label: '学员档案', to: '/learners' },
          { label: learner.name, to: `/learners/${learner.id}` },
          { label: '能力信息录入' },
        ]}
        actions={
          <>
            <Link to={`/learners/${learner.id}`}>
              <Button variant="outline">取消</Button>
            </Link>
            <Button variant="outline" icon={<Save />} onClick={saveDraft}>
              保存草稿
            </Button>
            <Button icon={<Sparkles />} onClick={submit} loading={pending}>
              保存并生成画像
            </Button>
          </>
        }
      />

      <Alert
        tone="info"
        title="评分说明"
        description={SCORE_LEGEND}
        className="mb-5"
        action={<Badge tone="brand">1–5 级观察评分</Badge>}
      />

      {latestAssessment && (
        <Alert
          tone="warning"
          title="已带入最近一次能力记录"
          description={`基于 ${formatDateTime(latestAssessment.createdAt)} 的记录预填。本次保存会新增一条记录，不会覆盖历史数据。`}
          className="mb-5"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEntries(buildEntries(latestAssessment.scores))
                toast({ tone: 'info', title: '已重新带入最近记录' })
              }}
            >
              重置为最近记录
            </Button>
          }
        />
      )}

      <div className="grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-2">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-[11px] font-medium text-ink-400">能力维度</p>
              <span className="tnum text-[11px] text-ink-400">{scoredCount}/8</span>
            </div>
            <div className="space-y-0.5">
              {ABILITY_DIMENSIONS.map((dimension, index) => {
                const score = entries[dimension.key].score
                const active = dimension.key === activeKey
                return (
                  <button
                    key={dimension.key}
                    type="button"
                    onClick={() => switchDimension(dimension.key)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition',
                      active ? 'bg-brand-50' : 'hover:bg-ink-50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px]',
                        active
                          ? 'bg-brand-600 text-white'
                          : score > 0
                            ? 'bg-accent-50 text-accent-700'
                            : 'bg-ink-100 text-ink-400',
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-xs',
                          active ? 'font-medium text-brand-700' : 'text-ink-600',
                        )}
                      >
                        {dimension.shortName}
                      </span>
                      <span className="block text-[10px] text-ink-300">
                        {score > 0 ? `${score} 分 · ${SCORE_LABELS[score]}` : '未评分'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-medium text-ink-700">本次录入进度</p>
              <span className="tnum text-xs text-ink-400">{scoredCount}/8</span>
            </div>
            <ProgressBar value={(scoredCount / 8) * 100} className="mt-2" />
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="tnum text-lg font-semibold text-ink-900">
                {currentAverage ? currentAverage.toFixed(1) : '—'}
              </span>
              <span className="text-[11px] text-ink-400">当前综合评分（已评分维度）</span>
            </div>
            {(draftSavedAt || draftLoadedAt) && (
              <p className="mt-2 rounded-md bg-ink-50 px-2 py-1.5 text-[10px] leading-4 text-ink-400">
                {draftLoadedAt && !draftSavedAt
                  ? `已恢复本地草稿：${formatDateTime(draftLoadedAt)}`
                  : `草稿已保存：${formatDateTime(draftSavedAt ?? undefined)}`}
              </p>
            )}
            <div className="mt-3 space-y-2">
              <Button className="w-full" size="sm" icon={<Sparkles />} onClick={submit} loading={pending}>
                保存并生成画像
              </Button>
              <Button className="w-full" size="sm" variant="outline" icon={<Save />} onClick={saveDraft}>
                保存草稿
              </Button>
            </div>
          </Card>

          {latestAssessment && (
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <History className="size-3.5 text-ink-400" />
                <p className="text-xs font-medium text-ink-700">最近能力记录</p>
              </div>
              <div className="mt-2.5 space-y-1.5">
                {assessments
                  .filter((item) => item.learnerId === learner.id)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 3)
                  .map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between rounded-md bg-ink-50/70 px-2 py-1.5"
                    >
                      <span className="text-[10px] text-ink-500">
                        {formatDateTime(assessment.createdAt).slice(0, 10)}
                      </span>
                      <span className="tnum text-[10px] font-medium text-ink-700">
                        {assessmentAverage(assessment).toFixed(1)}
                      </span>
                    </div>
                  ))}
              </div>
              <Link
                to={`/profiles/${learner.id}`}
                className="mt-2.5 inline-flex text-[11px] font-medium text-brand-600 hover:text-brand-700"
              >
                查看能力画像
              </Link>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <SectionCard
            title={
              <span className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-medium text-white">
                  {ABILITY_DIMENSIONS.findIndex((dimension) => dimension.key === activeKey) + 1}
                </span>
                {activeDimension.name}
              </span>
            }
            description={activeDimension.description}
            icon={<ClipboardList />}
          >
            <div className="mb-5 rounded-xl border border-line bg-ink-50/40 p-3">
              <p className="mb-2 text-[11px] font-medium text-ink-600">当前表现评分</p>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((score) => {
                  const selected = activeEntry.score === score
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => updateEntry(activeKey, { score })}
                      className={cn(
                        'rounded-lg border px-1.5 py-2.5 text-center transition',
                        selected
                          ? 'border-brand-500 bg-white shadow-sm ring-2 ring-brand-500/10'
                          : 'border-line bg-white hover:border-brand-200 hover:bg-brand-50/30',
                      )}
                    >
                      <span
                        className={cn(
                          'block text-base font-semibold',
                          selected ? 'text-brand-700' : 'text-ink-700',
                        )}
                      >
                        {score}
                      </span>
                      <span className="mt-0.5 block text-[9px] leading-3 text-ink-400">
                        {SCORE_LABELS[score]}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-[10px] text-ink-400">{activeDimension.observationHint}</p>
            </div>

            <div className="space-y-4">
              <Field
                label="具体表现描述"
                hint="描述该能力在哪些情境中表现如何，建议包含具体例子。"
              >
                <Textarea
                  value={activeEntry.description}
                  onChange={(event) => updateEntry(activeKey, { description: event.target.value })}
                  placeholder="例如：能在熟悉情境中使用短句表达需求，集体活动时需要提示。"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="已有优势">
                  <Textarea
                    value={activeEntry.strengths}
                    onChange={(event) => updateEntry(activeKey, { strengths: event.target.value })}
                    placeholder="记录当前做得较好的方面"
                    className="min-h-[88px]"
                  />
                </Field>
                <Field label="需要关注的方面">
                  <Textarea
                    value={activeEntry.concerns}
                    onChange={(event) => updateEntry(activeKey, { concerns: event.target.value })}
                    placeholder="记录需要支持或进一步观察的方面"
                    className="min-h-[88px]"
                  />
                </Field>
              </div>
              <Field label="典型观察记录" hint="可选填一次具体、可描述的行为观察。">
                <Textarea
                  value={activeEntry.observation}
                  onChange={(event) => updateEntry(activeKey, { observation: event.target.value })}
                  placeholder="例如：点心想添水时，等待 3 秒后主动举手并说出需求。"
                  className="min-h-[80px]"
                />
              </Field>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const index = ABILITY_DIMENSIONS.findIndex((dimension) => dimension.key === activeKey)
                  const previous =
                    ABILITY_DIMENSIONS[(index - 1 + ABILITY_DIMENSIONS.length) % ABILITY_DIMENSIONS.length]
                  switchDimension(previous.key)
                }}
              >
                上一维度
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const index = ABILITY_DIMENSIONS.findIndex((dimension) => dimension.key === activeKey)
                  const next = ABILITY_DIMENSIONS[(index + 1) % ABILITY_DIMENSIONS.length]
                  switchDimension(next.key)
                }}
              >
                下一维度
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            title="本次记录备注"
            description="可记录本次观察的总体背景、信息来源或需要后续跟进的事项。"
          >
            <Field label="总体观察备注">
              <Textarea
                value={generalNotes}
                onChange={(event) => {
                  setGeneralNotes(event.target.value)
                  setDraftSavedAt(null)
                }}
                placeholder="例如：结合近两周课堂观察与家长反馈整理，重点观察课堂主动表达。"
              />
            </Field>
            <p className="mt-3 text-[11px] leading-5 text-ink-400">
              记录人：演示账号 · 训练指导。所有示例学员与记录均为虚构数据。
            </p>
          </SectionCard>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-ink-400">
              {scoredCount < 8
                ? `还有 ${8 - scoredCount} 个维度未评分，完成后可保存并生成画像。`
                : '全部维度已完成评分，可以保存本次能力信息。'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" icon={<Save />} onClick={saveDraft}>
                保存草稿
              </Button>
              <Button icon={<Wand2 />} onClick={submit} loading={pending}>
                保存并生成画像
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
