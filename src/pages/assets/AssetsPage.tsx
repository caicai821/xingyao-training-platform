import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Image as ImageIcon, LayoutGrid, List, Plus } from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
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
import { Badge, DemoBadge } from '@/components/ui/feedback'
import { SourceTypeBadge } from '@/components/domain/StatusBadges'
import { ScenePreview } from '@/components/domain/ScenePreview'
import { SOURCE_TYPE_LABELS, TASK_STATUS_LABELS } from '@/lib/constants'
import { cn, formatDate, relativeTime } from '@/lib/utils'
import type { SceneSourceType, SceneTaskStatus } from '@/types'

export default function AssetsPage() {
  const navigate = useNavigate()
  const { assets, learners, goals, tasks } = useAppData()
  const [query, setQuery] = useState('')
  const [learnerFilter, setLearnerFilter] = useState('all')
  const [goalFilter, setGoalFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | SceneSourceType>('all')
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | SceneTaskStatus>('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)

  const learnerMap = new Map(learners.map((learner) => [learner.id, learner]))
  const goalMap = new Map(goals.map((goal) => [goal.id, goal]))
  const pageSize = view === 'grid' ? 9 : 10

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const limit =
      dateFilter === '7' ? 7 * 24 * 3600 * 1000 : dateFilter === '30' ? 30 * 24 * 3600 * 1000 : null
    return assets
      .filter((asset) => (learnerFilter === 'all' ? true : asset.learnerId === learnerFilter))
      .filter((asset) => (goalFilter === 'all' ? true : asset.trainingGoalId === goalFilter))
      .filter((asset) => (sourceFilter === 'all' ? true : asset.sourceType === sourceFilter))
      .filter((asset) => {
        if (taskStatusFilter === 'all') return true
        const task = tasks.find((item) => item.id === asset.taskId)
        return task?.status === taskStatusFilter
      })
      .filter((asset) => (limit ? Date.now() - new Date(asset.createdAt).getTime() <= limit : true))
      .filter((asset) => {
        if (!keyword) return true
        return (
          asset.name.toLowerCase().includes(keyword) ||
          asset.sceneType.toLowerCase().includes(keyword) ||
          asset.description.toLowerCase().includes(keyword)
        )
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [assets, dateFilter, goalFilter, learnerFilter, query, sourceFilter, taskStatusFilter, tasks])

  const paged = rows.slice((page - 1) * pageSize, page * pageSize)

  const resetPage = () => setPage(1)
  const scriptAssets = assets.filter((asset) => asset.sourceType === 'script').length
  const recentAssets = assets.filter(
    (asset) => Date.now() - new Date(asset.createdAt).getTime() <= 30 * 24 * 3600 * 1000,
  ).length

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="场景资产库"
        description="统一管理已生成的 3D 场景，可查看关联脚本、原始输入与生成任务，并继续发起新的生成请求。"
        actions={
          <>
            <Link to="/scenes/tasks">
              <Button variant="outline">生成任务</Button>
            </Link>
            <Link to="/scenes">
              <Button icon={<Plus />}>创建场景</Button>
            </Link>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: '场景资产', value: assets.length, hint: '已完成生成的场景' },
          { label: '脚本关联资产', value: scriptAssets, hint: '由训练脚本生成' },
          { label: '近 30 天新增', value: recentAssets, hint: '最近生成并归入资产库' },
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
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value)
                resetPage()
              }}
              placeholder="搜索资产名称或类型"
              className="w-full xl:max-w-xs"
            />
            <div className="flex flex-wrap items-center gap-2">
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
                value={goalFilter}
                onChange={(event) => {
                  setGoalFilter(event.target.value)
                  resetPage()
                }}
                className="w-36"
                aria-label="按训练目标筛选"
              >
                <option value="all">全部目标</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
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
                value={taskStatusFilter}
                onChange={(event) => {
                  setTaskStatusFilter(event.target.value as 'all' | SceneTaskStatus)
                  resetPage()
                }}
                className="w-28"
                aria-label="按任务状态筛选"
              >
                <option value="all">任务状态</option>
                {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select
                value={dateFilter}
                onChange={(event) => {
                  setDateFilter(event.target.value)
                  resetPage()
                }}
                className="w-28"
                aria-label="按创建时间筛选"
              >
                <option value="all">全部时间</option>
                <option value="7">最近 7 天</option>
                <option value="30">最近 30 天</option>
              </Select>
            </div>
            <div className="flex items-center gap-1 xl:ml-auto">
              <span className="mr-2 text-xs text-ink-400">
                {rows.length} 个资产
              </span>
              <button
                type="button"
                onClick={() => {
                  setView('grid')
                  resetPage()
                }}
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-md transition',
                  view === 'grid' ? 'bg-brand-50 text-brand-600' : 'text-ink-400 hover:bg-ink-100',
                )}
                aria-label="卡片视图"
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('table')
                  resetPage()
                }}
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-md transition',
                  view === 'table' ? 'bg-brand-50 text-brand-600' : 'text-ink-400 hover:bg-ink-100',
                )}
                aria-label="表格视图"
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<ImageIcon />}
            title={assets.length === 0 ? '还没有场景资产' : '没有符合条件的场景资产'}
            description={
              assets.length === 0
                ? '完成一次场景生成任务后，结果会自动归入资产库。'
                : '尝试调整搜索关键词或筛选条件。'
            }
            action={
              assets.length === 0 ? (
                <Link to="/scenes">
                  <Button icon={<Plus />}>前往场景生成中心</Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('')
                    setLearnerFilter('all')
                    setGoalFilter('all')
                    setSourceFilter('all')
                    setTaskStatusFilter('all')
                    setDateFilter('all')
                  }}
                >
                  清除筛选
                </Button>
              )
            }
          />
        ) : view === 'grid' ? (
          <>
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {paged.map((asset) => {
                const learner = asset.learnerId ? learnerMap.get(asset.learnerId) : undefined
                const goal = asset.trainingGoalId ? goalMap.get(asset.trainingGoalId) : undefined
                const task = tasks.find((item) => item.id === asset.taskId)
                return (
                  <Link
                    key={asset.id}
                    to={`/assets/${asset.id}`}
                    className="group overflow-hidden rounded-xl border border-line bg-white transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
                  >
                    <div className="relative">
                      <ScenePreview
                        seed={asset.previewSeed}
                        sceneType={asset.sceneType}
                        showWatermark={false}
                        className="aspect-[16/10] w-full"
                      />
                      <span className="absolute left-2.5 top-2.5">
                        <DemoBadge />
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-[13px] font-medium text-ink-800">
                          {asset.name}
                        </h3>
                        <Badge tone="neutral">{asset.sceneType}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2-safe text-[11px] leading-5 text-ink-400">
                        {asset.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {asset.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-ink-50 px-1.5 py-0.5 text-[10px] text-ink-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[10px] text-ink-400">
                        <span className="truncate">
                          {learner ? learner.name : '未关联学员'}
                          {goal ? ` · ${goal.category}` : ''}
                        </span>
                        <span className="shrink-0">{relativeTime(asset.createdAt)}</span>
                      </div>
                      {task && (
                        <p className="mt-1 text-[10px] text-ink-300">
                          来源任务 {task.code} · {SOURCE_TYPE_LABELS[asset.sourceType]}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
            <Pagination page={page} pageSize={pageSize} total={rows.length} onChange={setPage} />
          </>
        ) : (
          <>
            <DataTable minWidth={1000}>
              <THead>
                <TH className="w-[280px]">场景资产</TH>
                <TH>场景类型</TH>
                <TH>关联学员</TH>
                <TH>训练目标</TH>
                <TH>输入来源</TH>
                <TH>生成时间</TH>
                <TH className="text-right">操作</TH>
              </THead>
              <TBody>
                {paged.map((asset) => {
                  const learner = asset.learnerId ? learnerMap.get(asset.learnerId) : undefined
                  const goal = asset.trainingGoalId ? goalMap.get(asset.trainingGoalId) : undefined
                  return (
                    <TR key={asset.id} onClick={() => navigate(`/assets/${asset.id}`)}>
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <ScenePreview
                            seed={asset.previewSeed}
                            sceneType={asset.sceneType}
                            showWatermark={false}
                            className="size-10 shrink-0 rounded-md"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-ink-800">{asset.name}</p>
                            <p className="text-[10px] text-ink-400">{asset.description.slice(0, 30)}</p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <Badge tone="neutral">{asset.sceneType}</Badge>
                      </TD>
                      <TD>{learner?.name ?? '—'}</TD>
                      <TD>
                        <p className="max-w-[200px] truncate text-xs text-ink-600">
                          {goal?.title ?? '—'}
                        </p>
                      </TD>
                      <TD>
                        <SourceTypeBadge sourceType={asset.sourceType} />
                      </TD>
                      <TD>{formatDate(asset.createdAt)}</TD>
                      <TD>
                        <div
                          className="flex justify-end"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Link
                            to={`/assets/${asset.id}`}
                            className="inline-flex h-8 items-center whitespace-nowrap rounded-md px-2 text-xs font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-700"
                          >
                            查看详情
                          </Link>
                        </div>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </DataTable>
            <Pagination page={page} pageSize={pageSize} total={rows.length} onChange={setPage} />
          </>
        )}
      </Card>
    </div>
  )
}
