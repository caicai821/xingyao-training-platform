import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Box, Plus, RefreshCw } from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  Pagination,
  SearchInput,
  Select,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui'
import { Badge, ProgressBar } from '@/components/ui/feedback'
import { SourceTypeBadge, TaskStatusBadge } from '@/components/domain/StatusBadges'
import {
  SOURCE_TYPE_LABELS,
  TASK_STATUS_LABELS,
} from '@/lib/constants'
import { relativeTime } from '@/lib/utils'
import type { SceneSourceType, SceneTaskStatus } from '@/types'

const PAGE_SIZE = 10

export default function TasksPage() {
  const navigate = useNavigate()
  const { tasks, learners, refreshTasks } = useAppData()
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SceneTaskStatus>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | SceneSourceType>('all')
  const [learnerFilter, setLearnerFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  const learnerMap = new Map(learners.map((learner) => [learner.id, learner]))

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const dateLimit =
      dateFilter === '7'
        ? 7 * 24 * 3600 * 1000
        : dateFilter === '30'
          ? 30 * 24 * 3600 * 1000
          : null
    return tasks
      .filter((task) => (statusFilter === 'all' ? true : task.status === statusFilter))
      .filter((task) => (sourceFilter === 'all' ? true : task.sourceType === sourceFilter))
      .filter((task) => (learnerFilter === 'all' ? true : task.learnerId === learnerFilter))
      .filter((task) => {
        if (!dateLimit) return true
        return Date.now() - new Date(task.createdAt).getTime() <= dateLimit
      })
      .filter((task) => {
        if (!keyword) return true
        return (
          task.sceneName.toLowerCase().includes(keyword) ||
          task.code.toLowerCase().includes(keyword) ||
          task.prompt.toLowerCase().includes(keyword)
        )
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [dateFilter, learnerFilter, query, sourceFilter, statusFilter, tasks])

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = {
    total: tasks.length,
    active: tasks.filter((task) => ['pending', 'queued', 'generating'].includes(task.status)).length,
    succeeded: tasks.filter((task) => task.status === 'succeeded').length,
    failed: tasks.filter((task) => task.status === 'failed').length,
    draft: tasks.filter((task) => task.status === 'draft').length,
  }

  const resetPage = () => setPage(1)

  const refresh = async () => {
    setRefreshing(true)
    await refreshTasks()
    window.setTimeout(() => setRefreshing(false), 500)
    toast({ tone: 'info', title: '任务状态已刷新' })
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="场景生成任务"
        description="跟踪所有场景生成任务的状态、进度与结果。进行中的任务会自动刷新，状态由任务数据驱动。"
        actions={
          <>
            <Button
              variant="outline"
              icon={<RefreshCw />}
              onClick={refresh}
              loading={refreshing}
            >
              刷新状态
            </Button>
            <Link to="/scenes/text">
              <Button icon={<Plus />}>创建场景任务</Button>
            </Link>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: '全部任务', value: counts.total, hint: '含草稿与历史任务' },
          { label: '进行中', value: counts.active, hint: '排队或生成中' },
          { label: '生成成功', value: counts.succeeded, hint: '结果已返回' },
          { label: '生成失败', value: counts.failed, hint: '可重新提交' },
          { label: '草稿', value: counts.draft, hint: '尚未提交生成' },
        ].map((item) => (
          <Card key={item.label} className="px-4 py-3.5">
            <p className="text-[11px] text-ink-400">{item.label}</p>
            <p className="tnum mt-0.5 text-xl font-semibold text-ink-900">{item.value}</p>
            <p className="text-[10px] text-ink-300">{item.hint}</p>
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
              placeholder="搜索场景名称或任务编号"
              className="w-full lg:max-w-xs"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as 'all' | SceneTaskStatus)
                  resetPage()
                }}
                className="w-28"
                aria-label="按任务状态筛选"
              >
                <option value="all">全部状态</option>
                {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select
                value={sourceFilter}
                onChange={(event) => {
                  setSourceFilter(event.target.value as 'all' | SceneSourceType)
                  resetPage()
                }}
                className="w-28"
                aria-label="按来源筛选"
              >
                <option value="all">全部来源</option>
                {Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select
                value={learnerFilter}
                onChange={(event) => {
                  setLearnerFilter(event.target.value)
                  resetPage()
                }}
                className="w-32"
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
                value={dateFilter}
                onChange={(event) => {
                  setDateFilter(event.target.value)
                  resetPage()
                }}
                className="w-32"
                aria-label="按创建时间筛选"
              >
                <option value="all">全部时间</option>
                <option value="7">最近 7 天</option>
                <option value="30">最近 30 天</option>
              </Select>
            </div>
            <p className="text-xs text-ink-400 lg:ml-auto">
              共 <span className="font-medium text-ink-700">{rows.length}</span> 个任务
            </p>
          </div>
          {counts.active > 0 && (
            <div className="flex items-center gap-2">
              <Badge tone="brand" dot>
                {counts.active} 个任务正在处理，列表每 1.6 秒自动刷新
              </Badge>
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Box />}
            title="没有符合条件的场景任务"
            description={
              tasks.length === 0
                ? '可以通过文本描述、图像上传或训练脚本创建第一个 3D 场景任务。'
                : '尝试调整搜索关键词或筛选条件。'
            }
            action={
              tasks.length === 0 ? (
                <Link to="/scenes">
                  <Button icon={<Plus />}>前往场景生成中心</Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('')
                    setStatusFilter('all')
                    setSourceFilter('all')
                    setLearnerFilter('all')
                    setDateFilter('all')
                  }}
                >
                  清除筛选
                </Button>
              )
            }
          />
        ) : (
          <>
            <DataTable minWidth={1080}>
              <THead>
                <TH className="w-[280px]">场景任务</TH>
                <TH>输入来源</TH>
                <TH>场景类型</TH>
                <TH>关联学员</TH>
                <TH>状态</TH>
                <TH className="w-[150px]">进度</TH>
                <TH>创建时间</TH>
                <TH className="w-[130px] text-right">操作</TH>
              </THead>
              <TBody>
                {paged.map((task) => {
                  const learner = task.learnerId ? learnerMap.get(task.learnerId) : null
                  const active = ['pending', 'queued', 'generating'].includes(task.status)
                  return (
                    <TR key={task.id} onClick={() => navigate(`/scenes/tasks/${task.id}`)}>
                      <TD>
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                            <Box className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-ink-800">
                              {task.sceneName}
                            </p>
                            <p className="mt-0.5 text-[11px] text-ink-400">{task.code}</p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <SourceTypeBadge sourceType={task.sourceType} />
                      </TD>
                      <TD>
                        <span className="text-xs text-ink-600">{task.sceneConfig.sceneType}</span>
                      </TD>
                      <TD>
                        <span className="text-xs text-ink-600">{learner?.name ?? '—'}</span>
                      </TD>
                      <TD>
                        <TaskStatusBadge status={task.status} />
                      </TD>
                      <TD>
                        {active ? (
                          <div className="flex items-center gap-2">
                            <ProgressBar value={task.progress} size="sm" animated className="w-16" />
                            <span className="tnum text-[11px] text-ink-500">{task.progress}%</span>
                          </div>
                        ) : task.status === 'succeeded' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-success-600">
                            <span className="size-1.5 rounded-full bg-success-500" />
                            已完成
                          </span>
                        ) : task.status === 'failed' ? (
                          <span className="text-[11px] text-danger-500">已停止</span>
                        ) : (
                          <span className="text-[11px] text-ink-300">—</span>
                        )}
                      </TD>
                      <TD>
                        <span className="text-xs text-ink-400">{relativeTime(task.createdAt)}</span>
                      </TD>
                      <TD>
                        <div
                          className="flex items-center justify-end whitespace-nowrap"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {task.status === 'succeeded' && (
                            <Link
                              to={`/scenes/tasks/${task.id}/result`}
                              className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-md px-2 text-xs text-ink-500 transition hover:bg-brand-50 hover:text-brand-700"
                            >
                              查看结果
                            </Link>
                          )}
                          <Link
                            to={`/scenes/tasks/${task.id}`}
                            className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-md px-2 text-xs font-medium text-brand-600 transition hover:bg-brand-50 hover:text-brand-700"
                          >
                            详情
                          </Link>
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
    </div>
  )
}
