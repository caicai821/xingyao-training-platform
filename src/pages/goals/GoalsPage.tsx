import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarDays, FileText, Pencil, Plus, Target } from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { useToast } from '@/context/ToastContext'
import { errorMessage, useAsyncAction } from '@/hooks/useAsyncAction'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  Field,
  Input,
  Modal,
  Pagination,
  SearchInput,
  Select,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Textarea,
} from '@/components/ui'
import { Badge } from '@/components/ui/feedback'
import {
  GoalStatusBadge,
  PriorityBadge,
  ScriptStatusBadge,
} from '@/components/domain/StatusBadges'
import {
  ABILITY_DIMENSIONS,
  GOAL_CATEGORIES,
  GOAL_PRIORITY_LABELS,
  GOAL_STATUS_LABELS,
} from '@/lib/constants'
import { cn, formatDate, relativeTime } from '@/lib/utils'
import type {
  GoalPriority,
  GoalStatus,
  TrainingGoal,
  TrainingGoalInput,
} from '@/types'

const PAGE_SIZE = 8

export default function GoalsPage() {
  const [searchParams] = useSearchParams()
  const { goals, learners, scripts, services, refreshAll } = useAppData()
  const { toast } = useToast()
  const { pending, run } = useAsyncAction()

  const learnerMap = new Map(learners.map((learner) => [learner.id, learner]))
  const [query, setQuery] = useState('')
  const [learnerFilter, setLearnerFilter] = useState(searchParams.get('learner') ?? 'all')
  const [statusFilter, setStatusFilter] = useState<'all' | GoalStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<TrainingGoalInput | null>(null)

  const detailGoal = goals.find((goal) => goal.id === detailId)
  const editGoal = goals.find((goal) => goal.id === editId)
  const detailLearner = detailGoal ? learnerMap.get(detailGoal.learnerId) : undefined
  const detailScripts = detailGoal
    ? scripts.filter((script) => script.goalId === detailGoal.id)
    : []

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return goals
      .filter((goal) => (learnerFilter === 'all' ? true : goal.learnerId === learnerFilter))
      .filter((goal) => (statusFilter === 'all' ? true : goal.status === statusFilter))
      .filter((goal) => (categoryFilter === 'all' ? true : goal.category === categoryFilter))
      .filter((goal) => {
        if (!keyword) return true
        return (
          goal.title.toLowerCase().includes(keyword) ||
          goal.description.toLowerCase().includes(keyword)
        )
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [categoryFilter, goals, learnerFilter, query, statusFilter])

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetPage = () => setPage(1)

  const startEdit = (goal: TrainingGoal) => {
    setDetailId(null)
    setEditId(goal.id)
    setEditForm({
      learnerId: goal.learnerId,
      title: goal.title,
      category: goal.category,
      description: goal.description,
      successCriteria: goal.successCriteria,
      relatedDimensions: [...goal.relatedDimensions],
      priority: goal.priority,
      status: goal.status,
      targetDate: goal.targetDate ?? '',
    })
  }

  const saveEdit = async () => {
    if (!editGoal || !editForm) return
    if (!editForm.title.trim()) {
      toast({ tone: 'error', title: '请填写目标名称' })
      return
    }
    await run(async () => {
      try {
        await services.goals.update(editGoal.id, {
          ...editForm,
          targetDate: editForm.targetDate || undefined,
        })
        await refreshAll(true)
        setEditId(null)
        setEditForm(null)
        toast({ title: '训练目标已更新' })
      } catch (cause) {
        toast({ tone: 'error', title: '更新失败', description: errorMessage(cause) })
      }
    })
  }

  const counts = {
    total: goals.length,
    inProgress: goals.filter((goal) => goal.status === 'in_progress').length,
    planning: goals.filter((goal) => goal.status === 'planning').length,
    completed: goals.filter((goal) => goal.status === 'completed').length,
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="训练目标"
        description="将能力画像中的关注方向转化为可观察、可练习的训练目标，并与学员档案保持关联。"
        actions={
          <Link to={`/goals/new${learnerFilter !== 'all' ? `?learner=${learnerFilter}` : ''}`}>
            <Button icon={<Plus />}>新建训练目标</Button>
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '全部目标', value: counts.total, hint: '关联学员的训练方向' },
          { label: '进行中', value: counts.inProgress, hint: '正在推进的目标' },
          { label: '规划中', value: counts.planning, hint: '等待开始练习' },
          { label: '已完成', value: counts.completed, hint: '阶段目标已达成' },
        ].map((item) => (
          <Card key={item.label} className="px-5 py-4">
            <p className="text-xs text-ink-400">{item.label}</p>
            <p className="tnum mt-1 text-2xl font-semibold text-ink-900">{item.value}</p>
            <p className="mt-0.5 text-[10px] text-ink-300">{item.hint}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:px-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value)
                resetPage()
              }}
              placeholder="搜索目标名称或描述"
              className="w-full lg:max-w-xs"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={learnerFilter}
                onChange={(event) => {
                  setLearnerFilter(event.target.value)
                  resetPage()
                }}
                className="w-36"
                aria-label="按学员筛选"
              >
                <option value="all">全部学员</option>
                {learners.map((learner) => (
                  <option key={learner.id} value={learner.id}>
                    {learner.name}
                  </option>
                ))}
              </Select>
              <Select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as 'all' | GoalStatus)
                  resetPage()
                }}
                className="w-32"
                aria-label="按状态筛选"
              >
                <option value="all">全部状态</option>
                {Object.entries(GOAL_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value)
                  resetPage()
                }}
                className="w-32"
                aria-label="按分类筛选"
              >
                <option value="all">全部分类</option>
                {GOAL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
            <p className="text-xs text-ink-400 lg:ml-auto">
              共 <span className="font-medium text-ink-700">{rows.length}</span> 个目标
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Target />}
            title="没有符合条件的训练目标"
            description={
              goals.length === 0
                ? '从学员能力画像出发，创建第一个可观察的训练目标。'
                : '尝试调整搜索关键词或筛选条件。'
            }
            action={
              goals.length === 0 ? (
                <Link to="/goals/new">
                  <Button icon={<Plus />}>新建训练目标</Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('')
                    setLearnerFilter('all')
                    setStatusFilter('all')
                    setCategoryFilter('all')
                  }}
                >
                  清除筛选
                </Button>
              )
            }
          />
        ) : (
          <>
            <DataTable minWidth={1120}>
              <THead>
                <TH className="w-[300px]">训练目标</TH>
                <TH>关联学员</TH>
                <TH>优先级</TH>
                <TH>状态</TH>
                <TH>关联脚本</TH>
                <TH>目标日期</TH>
                <TH className="w-[160px] text-right">操作</TH>
              </THead>
              <TBody>
                {paged.map((goal) => {
                  const learner = learnerMap.get(goal.learnerId)
                  const relatedScripts = scripts.filter((script) => script.goalId === goal.id)
                  return (
                    <TR key={goal.id} onClick={() => setDetailId(goal.id)}>
                      <TD>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-ink-800">{goal.title}</p>
                          <Badge tone="neutral">{goal.category}</Badge>
                        </div>
                        <p className="mt-0.5 line-clamp-1 max-w-[290px] text-[11px] text-ink-400">
                          {goal.description || '未填写目标描述'}
                        </p>
                      </TD>
                      <TD className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-ink-700">{learner?.name ?? '—'}</span>
                          <span className="text-[10px] text-ink-300">{learner?.code}</span>
                        </div>
                      </TD>
                      <TD className="whitespace-nowrap">
                        <PriorityBadge priority={goal.priority} />
                      </TD>
                      <TD className="whitespace-nowrap">
                        <GoalStatusBadge status={goal.status} />
                      </TD>
                      <TD className="whitespace-nowrap">
                        {relatedScripts.length > 0 ? (
                          <span className="text-xs text-ink-600">{relatedScripts.length} 份</span>
                        ) : (
                          <span className="text-xs text-ink-300">—</span>
                        )}
                      </TD>
                      <TD className="whitespace-nowrap">
                        {goal.targetDate ? (
                          <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                            <CalendarDays className="size-3.5 text-ink-300" />
                            {formatDate(goal.targetDate)}
                          </span>
                        ) : (
                          <span className="text-ink-300">—</span>
                        )}
                      </TD>
                      <TD>
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Link
                            to={`/scripts/new?learner=${goal.learnerId}&goal=${goal.id}`}
                            className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs text-ink-500 transition hover:bg-brand-50 hover:text-brand-700"
                          >
                            <FileText className="size-3.5" />
                            生成脚本
                          </Link>
                          <button
                            type="button"
                            onClick={() => startEdit(goal)}
                            className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs font-medium text-brand-600 transition hover:bg-brand-50 hover:text-brand-700"
                          >
                            <Pencil className="size-3.5" />
                            编辑
                          </button>
                        </div>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </DataTable>
            <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} onChange={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={Boolean(detailGoal)}
        onClose={() => setDetailId(null)}
        title={detailGoal?.title ?? '训练目标'}
        description={
          detailGoal
            ? `${detailLearner?.name ?? '未关联学员'} · ${detailGoal.category} · 更新于 ${relativeTime(detailGoal.updatedAt)}`
            : undefined
        }
        size="lg"
        footer={
          detailGoal ? (
            <>
              <Button variant="outline" onClick={() => setDetailId(null)}>
                关闭
              </Button>
              <Button variant="outline" icon={<Pencil />} onClick={() => startEdit(detailGoal)}>
                编辑目标
              </Button>
              <Link to={`/scripts/new?learner=${detailGoal.learnerId}&goal=${detailGoal.id}`}>
                <Button icon={<FileText />}>生成训练脚本</Button>
              </Link>
            </>
          ) : undefined
        }
      >
        {detailGoal && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <GoalStatusBadge status={detailGoal.status} />
              <PriorityBadge priority={detailGoal.priority} />
              <Badge tone="neutral">{detailGoal.category}</Badge>
              {detailGoal.targetDate && (
                <Badge tone="brand">
                  <CalendarDays className="size-3" />
                  目标日期 {formatDate(detailGoal.targetDate)}
                </Badge>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-ink-700">目标描述</p>
              <p className="mt-1.5 rounded-lg bg-ink-50/70 px-3.5 py-3 text-xs leading-6 text-ink-600">
                {detailGoal.description || '未填写目标描述'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-700">成功标准</p>
              <p className="mt-1.5 rounded-lg bg-ink-50/70 px-3.5 py-3 text-xs leading-6 text-ink-600">
                {detailGoal.successCriteria || '未填写成功标准'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-700">相关能力维度</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {detailGoal.relatedDimensions.length ? (
                  detailGoal.relatedDimensions.map((key) => (
                    <Badge key={key} tone="brand">
                      {ABILITY_DIMENSIONS.find((dimension) => dimension.key === key)?.name ?? key}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-ink-300">未选择</span>
                )}
              </div>
            </div>
            <div className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] text-ink-400">关联学员</p>
                {detailLearner ? (
                  <Link
                    to={`/learners/${detailLearner.id}`}
                    className="mt-1 inline-flex text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    {detailLearner.name}（{detailLearner.code}）
                  </Link>
                ) : (
                  <p className="mt-1 text-xs text-ink-400">—</p>
                )}
              </div>
              <div>
                <p className="text-[10px] text-ink-400">创建与更新时间</p>
                <p className="mt-1 text-xs text-ink-700">
                  {formatDate(detailGoal.createdAt)} / {formatDate(detailGoal.updatedAt)}
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-ink-700">关联训练脚本</p>
                <span className="text-[10px] text-ink-400">{detailScripts.length} 份</span>
              </div>
              {detailScripts.length === 0 ? (
                <p className="mt-2 rounded-lg bg-ink-50/70 px-3 py-3 text-xs text-ink-400">
                  还没有关联脚本，可使用此目标生成结构化训练脚本。
                </p>
              ) : (
                <div className="mt-2 overflow-hidden rounded-lg border border-line">
                  {detailScripts.map((script) => (
                    <Link
                      key={script.id}
                      to={`/scripts/${script.id}`}
                      className="flex items-center gap-3 border-b border-line/70 px-3.5 py-2.5 last:border-0 hover:bg-ink-50/60"
                    >
                      <FileText className="size-3.5 text-ink-400" />
                      <span className="min-w-0 flex-1 truncate text-xs text-ink-700">
                        {script.name}
                      </span>
                      <ScriptStatusBadge status={script.status} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(editGoal && editForm)}
        onClose={() => {
          setEditId(null)
          setEditForm(null)
        }}
        title="编辑训练目标"
        description={editGoal ? `正在编辑：${editGoal.title}` : undefined}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setEditId(null)
                setEditForm(null)
              }}
            >
              取消
            </Button>
            <Button onClick={saveEdit} loading={pending}>
              保存更改
            </Button>
          </>
        }
      >
        {editForm && (
          <div className="space-y-4">
            <Field label="关联学员" required>
              <Select
                value={editForm.learnerId}
                onChange={(event) =>
                  setEditForm((previous) =>
                    previous ? { ...previous, learnerId: event.target.value } : previous,
                  )
                }
              >
                {learners.map((learner) => (
                  <option key={learner.id} value={learner.id}>
                    {learner.name}（{learner.code}）
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="目标名称" required>
              <Input
                value={editForm.title}
                onChange={(event) =>
                  setEditForm((previous) =>
                    previous ? { ...previous, title: event.target.value } : previous,
                  )
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="分类">
                <Select
                  value={editForm.category}
                  onChange={(event) =>
                    setEditForm((previous) =>
                      previous ? { ...previous, category: event.target.value } : previous,
                    )
                  }
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
                  value={editForm.priority}
                  onChange={(event) =>
                    setEditForm((previous) =>
                      previous
                        ? { ...previous, priority: event.target.value as GoalPriority }
                        : previous,
                    )
                  }
                >
                  {Object.entries(GOAL_PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="状态">
                <Select
                  value={editForm.status}
                  onChange={(event) =>
                    setEditForm((previous) =>
                      previous ? { ...previous, status: event.target.value as GoalStatus } : previous,
                    )
                  }
                >
                  {Object.entries(GOAL_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="目标日期">
                <Input
                  type="date"
                  value={editForm.targetDate ?? ''}
                  onChange={(event) =>
                    setEditForm((previous) =>
                      previous ? { ...previous, targetDate: event.target.value } : previous,
                    )
                  }
                />
              </Field>
            </div>
            <Field label="目标描述">
              <Textarea
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((previous) =>
                    previous ? { ...previous, description: event.target.value } : previous,
                  )
                }
              />
            </Field>
            <Field label="成功标准">
              <Textarea
                value={editForm.successCriteria}
                onChange={(event) =>
                  setEditForm((previous) =>
                    previous ? { ...previous, successCriteria: event.target.value } : previous,
                  )
                }
                className="min-h-[80px]"
              />
            </Field>
            <Field label="相关能力维度">
              <div className="flex flex-wrap gap-2">
                {ABILITY_DIMENSIONS.map((dimension) => {
                  const selected = editForm.relatedDimensions.includes(dimension.key)
                  return (
                    <button
                      key={dimension.key}
                      type="button"
                      onClick={() =>
                        setEditForm((previous) =>
                          previous
                            ? {
                                ...previous,
                                relatedDimensions: selected
                                  ? previous.relatedDimensions.filter((key) => key !== dimension.key)
                                  : [...previous.relatedDimensions, dimension.key],
                              }
                            : previous,
                        )
                      }
                      className={cn(
                        'rounded-lg border px-2.5 py-1.5 text-[11px] transition',
                        selected
                          ? 'border-brand-300 bg-brand-50 text-brand-700'
                          : 'border-line text-ink-500 hover:border-brand-200',
                      )}
                    >
                      {dimension.shortName}
                    </button>
                  )
                })}
              </div>
            </Field>
            <p className="text-[11px] text-ink-400">
              创建于 {editGoal ? formatDate(editGoal.createdAt) : '—'}，修改后更新时间为当前时间。
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
