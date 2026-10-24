import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  FileText,
  History,
  Link2,
} from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Button,
  Card,
  DataTable,
  Drawer,
  EmptyState,
  Pagination,
  SearchInput,
  Select,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Tabs,
} from '@/components/ui'
import { Alert, Badge } from '@/components/ui/feedback'
import {
  ScriptStatusBadge,
  SourceTypeBadge,
  TaskStatusBadge,
} from '@/components/domain/StatusBadges'
import { AssociationTrail } from '@/components/domain/WorkflowChain'
import { latestProfileFor, latestTaskStatus } from '@/lib/selectors'
import {
  SCRIPT_STATUS_LABELS,
  TASK_STATUS_LABELS,
} from '@/lib/constants'
import { formatDate, relativeTime } from '@/lib/utils'
import type { SceneTaskStatus, ScriptStatus } from '@/types'

const PAGE_SIZE = 8

export default function RecordsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { scripts, tasks, assets, learners, goals, profiles } = useAppData()

  const [tab, setTab] = useState('scripts')
  const [query, setQuery] = useState('')
  const [learnerFilter, setLearnerFilter] = useState(searchParams.get('learner') ?? 'all')
  const [goalFilter, setGoalFilter] = useState(searchParams.get('goal') ?? 'all')
  const [scriptStatus, setScriptStatus] = useState<'all' | ScriptStatus>('all')
  const [taskStatus, setTaskStatus] = useState<'all' | SceneTaskStatus>('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [drawerScriptId, setDrawerScriptId] = useState<string | null>(null)

  const learnerMap = new Map(learners.map((learner) => [learner.id, learner]))
  const goalMap = new Map(goals.map((goal) => [goal.id, goal]))
  const scriptMap = new Map(scripts.map((script) => [script.id, script]))

  const dateLimit =
    dateFilter === '7' ? 7 * 24 * 3600 * 1000 : dateFilter === '30' ? 30 * 24 * 3600 * 1000 : null
  const inDateRange = (value: string) =>
    !dateLimit || Date.now() - new Date(value).getTime() <= dateLimit

  const scriptRows = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return scripts
      .filter((script) => (learnerFilter === 'all' ? true : script.learnerId === learnerFilter))
      .filter((script) => (goalFilter === 'all' ? true : script.goalId === goalFilter))
      .filter((script) => (scriptStatus === 'all' ? true : script.status === scriptStatus))
      .filter((script) => inDateRange(script.updatedAt))
      .filter((script) => {
        if (taskStatus === 'all') return true
        return tasks.some((task) => task.scriptId === script.id && task.status === taskStatus)
      })
      .filter((script) => {
        if (!keyword) return true
        return (
          script.name.toLowerCase().includes(keyword) ||
          script.code.toLowerCase().includes(keyword) ||
          script.objective.toLowerCase().includes(keyword)
        )
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, goalFilter, learnerFilter, query, scriptStatus, scripts, taskStatus, tasks])

  const taskRows = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return tasks
      .filter((task) => (learnerFilter === 'all' ? true : task.learnerId === learnerFilter))
      .filter((task) => (goalFilter === 'all' ? true : task.trainingGoalId === goalFilter))
      .filter((task) => (taskStatus === 'all' ? true : task.status === taskStatus))
      .filter((task) => {
        if (scriptStatus === 'all') return true
        const script = task.scriptId ? scriptMap.get(task.scriptId) : undefined
        return script?.status === scriptStatus
      })
      .filter((task) => inDateRange(task.createdAt))
      .filter((task) => {
        if (!keyword) return true
        return (
          task.sceneName.toLowerCase().includes(keyword) ||
          task.code.toLowerCase().includes(keyword) ||
          task.prompt.toLowerCase().includes(keyword)
        )
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dateFilter,
    goalFilter,
    learnerFilter,
    query,
    scriptMap,
    scriptStatus,
    taskStatus,
    tasks,
  ])

  const activeRows = tab === 'scripts' ? scriptRows : taskRows
  const pagedScripts = scriptRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pagedTasks = taskRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const drawerScript = drawerScriptId ? scriptMap.get(drawerScriptId) : undefined
  const drawerLearner = drawerScript ? learnerMap.get(drawerScript.learnerId) : undefined
  const drawerGoal = drawerScript ? goalMap.get(drawerScript.goalId) : undefined
  const drawerProfile = drawerScript
    ? latestProfileFor(profiles, drawerScript.learnerId)
    : undefined
  const drawerTasks = drawerScript
    ? tasks
        .filter((task) => task.scriptId === drawerScript.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : []
  const drawerAssets = drawerScript
    ? assets.filter((asset) => asset.scriptId === drawerScript.id)
    : []
  const drawerLatestTask = latestTaskStatus(drawerTasks)

  const resetPage = () => setPage(1)
  const resetFilters = () => {
    setQuery('')
    setLearnerFilter('all')
    setGoalFilter('all')
    setScriptStatus('all')
    setTaskStatus('all')
    setDateFilter('all')
    setPage(1)
  }

  const hasFilters =
    Boolean(query) ||
    learnerFilter !== 'all' ||
    goalFilter !== 'all' ||
    scriptStatus !== 'all' ||
    taskStatus !== 'all' ||
    dateFilter !== 'all'

  const filteredGoals = goals.filter(
    (goal) => learnerFilter === 'all' || goal.learnerId === learnerFilter,
  )

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="方案与任务记录"
        description="统一追踪训练方案、训练脚本与场景生成任务，查看学员档案到场景资产的完整关联链路。"
        actions={
          <Link to="/scripts/new">
            <Button icon={<FileText />}>生成新方案</Button>
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '训练脚本', value: scripts.length, hint: '含不同版本状态' },
          { label: '已确认方案', value: scripts.filter((script) => script.status === 'confirmed').length, hint: '可创建关联场景' },
          { label: '场景任务', value: tasks.length, hint: '包含草稿与历史任务' },
          { label: '场景资产', value: assets.length, hint: '生成结果已归档' },
        ].map((item) => (
          <Card key={item.label} className="px-5 py-4">
            <p className="text-xs text-ink-400">{item.label}</p>
            <p className="tnum mt-1 text-2xl font-semibold text-ink-900">{item.value}</p>
            <p className="mt-0.5 text-[10px] text-ink-300">{item.hint}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="border-b border-line px-4 py-3.5 sm:px-5">
          <Tabs
            items={[
              { key: 'scripts', label: '训练方案记录', count: scriptRows.length },
              { key: 'tasks', label: '场景任务记录', count: taskRows.length },
            ]}
            value={tab}
            onChange={(value) => {
              setTab(value)
              resetPage()
            }}
          />
          <div className="mt-3 flex flex-col gap-2 xl:flex-row xl:items-center">
            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value)
                resetPage()
              }}
              placeholder={tab === 'scripts' ? '搜索脚本或训练目标' : '搜索场景或任务编号'}
              className="w-full xl:max-w-xs"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={learnerFilter}
                onChange={(event) => {
                  setLearnerFilter(event.target.value)
                  setGoalFilter('all')
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
                {filteredGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </Select>
              <Select
                value={scriptStatus}
                onChange={(event) => {
                  setScriptStatus(event.target.value as 'all' | ScriptStatus)
                  resetPage()
                }}
                className="w-28"
                aria-label="按脚本状态筛选"
              >
                <option value="all">脚本状态</option>
                {Object.entries(SCRIPT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select
                value={taskStatus}
                onChange={(event) => {
                  setTaskStatus(event.target.value as 'all' | SceneTaskStatus)
                  resetPage()
                }}
                className="w-28"
                aria-label="按场景生成状态筛选"
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
                aria-label="按时间筛选"
              >
                <option value="all">全部时间</option>
                <option value="7">最近 7 天</option>
                <option value="30">最近 30 天</option>
              </Select>
            </div>
            <p className="text-xs text-ink-400 xl:ml-auto">
              共 <span className="font-medium text-ink-700">{activeRows.length}</span> 条记录
            </p>
          </div>
        </div>

        {activeRows.length === 0 ? (
          <EmptyState
            icon={<History />}
            title={hasFilters ? '没有符合条件的记录' : '还没有相关记录'}
            description={
              hasFilters
                ? '尝试调整搜索关键词或筛选条件。'
                : '生成训练脚本或创建场景任务后，记录会汇总在此处。'
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={resetFilters}>
                  清除筛选
                </Button>
              ) : (
                <Link to="/scripts/new">
                  <Button icon={<FileText />}>生成训练方案</Button>
                </Link>
              )
            }
          />
        ) : tab === 'scripts' ? (
          <>
            <DataTable minWidth={1120}>
              <THead>
                <TH className="w-[300px]">训练方案 / 脚本</TH>
                <TH>学员</TH>
                <TH className="w-[190px]">训练目标</TH>
                <TH>脚本状态</TH>
                <TH>关联任务</TH>
                <TH>场景资产</TH>
                <TH>更新时间</TH>
                <TH className="text-right">操作</TH>
              </THead>
              <TBody>
                {pagedScripts.map((script) => {
                  const learner = learnerMap.get(script.learnerId)
                  const goal = goalMap.get(script.goalId)
                  const relatedTasks = tasks.filter((task) => task.scriptId === script.id)
                  const latestTask = latestTaskStatus(relatedTasks)
                  const relatedAssets = assets.filter((asset) => asset.scriptId === script.id)
                  return (
                    <TR key={script.id} onClick={() => setDrawerScriptId(script.id)}>
                      <TD>
                        <p className="text-[13px] font-medium text-ink-800">{script.name}</p>
                        <p className="mt-0.5 text-[11px] text-ink-400">
                          {script.code} · v{script.version} · {script.steps.length} 个步骤
                        </p>
                      </TD>
                      <TD>{learner?.name ?? '—'}</TD>
                      <TD>
                        <p className="max-w-[180px] truncate text-xs text-ink-600">
                          {goal?.title ?? '—'}
                        </p>
                      </TD>
                      <TD>
                        <ScriptStatusBadge status={script.status} />
                      </TD>
                      <TD>
                        {relatedTasks.length ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-ink-600">{relatedTasks.length} 个</span>
                            {latestTask && <TaskStatusBadge status={latestTask.status} />}
                          </div>
                        ) : (
                          <span className="text-xs text-ink-300">—</span>
                        )}
                      </TD>
                      <TD>
                        {relatedAssets.length ? (
                          <span className="text-xs text-ink-600">{relatedAssets.length} 个</span>
                        ) : (
                          <span className="text-xs text-ink-300">—</span>
                        )}
                      </TD>
                      <TD>
                        <span className="text-xs text-ink-400">{relativeTime(script.updatedAt)}</span>
                      </TD>
                      <TD>
                        <div
                          className="flex justify-end"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setDrawerScriptId(script.id)}
                            className="inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-700"
                          >
                            <Link2 className="size-3.5" />
                            关联链路
                          </button>
                        </div>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </DataTable>
            <Pagination page={page} pageSize={PAGE_SIZE} total={activeRows.length} onChange={setPage} />
          </>
        ) : (
          <>
            <DataTable minWidth={1100}>
              <THead>
                <TH className="w-[270px]">场景任务</TH>
                <TH>输入来源</TH>
                <TH>关联学员</TH>
                <TH className="w-[180px]">训练目标</TH>
                <TH className="w-[190px]">关联脚本</TH>
                <TH>任务状态</TH>
                <TH>创建时间</TH>
                <TH className="text-right">操作</TH>
              </THead>
              <TBody>
                {pagedTasks.map((task) => {
                  const learner = task.learnerId ? learnerMap.get(task.learnerId) : undefined
                  const goal = task.trainingGoalId ? goalMap.get(task.trainingGoalId) : undefined
                  const script = task.scriptId ? scriptMap.get(task.scriptId) : undefined
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
                            <p className="mt-0.5 text-[11px] text-ink-400">
                              {task.code} · {task.sceneConfig.sceneType}
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <SourceTypeBadge sourceType={task.sourceType} />
                      </TD>
                      <TD>{learner?.name ?? '—'}</TD>
                      <TD>
                        <p className="max-w-[170px] truncate text-xs text-ink-600">
                          {goal?.title ?? '—'}
                        </p>
                      </TD>
                      <TD>
                        <p className="max-w-[180px] truncate text-xs text-ink-600">
                          {script?.name ?? '—'}
                        </p>
                      </TD>
                      <TD>
                        <TaskStatusBadge status={task.status} />
                      </TD>
                      <TD>
                        <span className="text-xs text-ink-400">{relativeTime(task.createdAt)}</span>
                      </TD>
                      <TD>
                        <div
                          className="flex justify-end"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Link
                            to={`/scenes/tasks/${task.id}`}
                            className="inline-flex h-8 items-center whitespace-nowrap rounded-md px-2 text-xs font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-700"
                          >
                            查看
                          </Link>
                        </div>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </DataTable>
            <Pagination page={page} pageSize={PAGE_SIZE} total={activeRows.length} onChange={setPage} />
          </>
        )}
      </Card>

      <Drawer
        open={Boolean(drawerScript)}
        onClose={() => setDrawerScriptId(null)}
        title={drawerScript?.name ?? '关联链路'}
        description={
          drawerScript
            ? `${drawerScript.code} · ${drawerLearner?.name ?? '未关联学员'}`
            : undefined
        }
        size="lg"
        footer={
          drawerScript ? (
            <>
              <Button variant="outline" onClick={() => setDrawerScriptId(null)}>
                关闭
              </Button>
              <Link to={`/scripts/${drawerScript.id}`}>
                <Button variant="outline">查看脚本</Button>
              </Link>
              {drawerScript.status === 'confirmed' && (
                <Link to={`/scenes/script/${drawerScript.id}`}>
                  <Button icon={<Box />}>生成对应场景</Button>
                </Link>
              )}
            </>
          ) : undefined
        }
      >
        {drawerScript && (
          <div className="space-y-5">
            <Alert
              tone="info"
              title="关联链路"
              description="学员档案 → 能力画像 → 训练目标 → 训练脚本 → 场景生成任务 → 场景资产。"
            />
            <AssociationTrail
              nodes={[
                {
                  label: '学员',
                  value: drawerLearner?.name,
                  to: drawerLearner ? `/learners/${drawerLearner.id}` : undefined,
                },
                {
                  label: '能力画像',
                  value: drawerProfile
                    ? drawerProfile.status === 'confirmed'
                      ? '已确认'
                      : '待确认'
                    : '未生成',
                  to: drawerLearner ? `/profiles/${drawerLearner.id}` : undefined,
                },
                {
                  label: '训练目标',
                  value: drawerGoal?.title,
                  to: drawerLearner ? `/goals?learner=${drawerLearner.id}` : undefined,
                },
                { label: '训练脚本', value: drawerScript.name },
                {
                  label: '场景任务',
                  value: drawerLatestTask?.code,
                  to: drawerLatestTask ? `/scenes/tasks/${drawerLatestTask.id}` : undefined,
                },
                {
                  label: '场景资产',
                  value: drawerAssets[0]?.name,
                  to: drawerAssets[0] ? `/assets/${drawerAssets[0].id}` : undefined,
                },
              ]}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-line p-3">
                <p className="text-[10px] text-ink-400">脚本状态</p>
                <div className="mt-1">
                  <ScriptStatusBadge status={drawerScript.status} />
                </div>
              </div>
              <div className="rounded-lg border border-line p-3">
                <p className="text-[10px] text-ink-400">版本 / 步骤</p>
                <p className="mt-1 text-xs text-ink-700">
                  v{drawerScript.version} · {drawerScript.steps.length} 个步骤
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-ink-700">训练目标说明</p>
              <p className="mt-1.5 text-xs leading-6 text-ink-500">{drawerScript.objective}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-700">情境说明</p>
              <p className="mt-1.5 text-xs leading-6 text-ink-500">{drawerScript.scenarioSummary}</p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-ink-700">关联场景任务</p>
                <Badge tone="neutral">{drawerTasks.length} 个</Badge>
              </div>
              {drawerTasks.length === 0 ? (
                <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2.5 text-[11px] text-ink-400">
                  还没有关联场景任务。
                </p>
              ) : (
                <div className="mt-2 overflow-hidden rounded-lg border border-line">
                  {drawerTasks.map((task) => (
                    <Link
                      key={task.id}
                      to={`/scenes/tasks/${task.id}`}
                      className="flex items-center gap-2 border-b border-line/70 px-3.5 py-2.5 last:border-0 hover:bg-ink-50/60"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs text-ink-700">{task.sceneName}</span>
                        <span className="block text-[10px] text-ink-400">
                          {task.code} · {formatDate(task.createdAt)}
                        </span>
                      </span>
                      <TaskStatusBadge status={task.status} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-ink-700">关联场景资产</p>
                <Badge tone="neutral">{drawerAssets.length} 个</Badge>
              </div>
              {drawerAssets.length === 0 ? (
                <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2.5 text-[11px] text-ink-400">
                  该脚本尚未生成场景资产。
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {drawerAssets.map((asset) => (
                    <Link
                      key={asset.id}
                      to={`/assets/${asset.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-line px-3.5 py-2.5 hover:bg-ink-50/60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs text-ink-700">{asset.name}</span>
                        <span className="block text-[10px] text-ink-400">{asset.sceneType}</span>
                      </span>
                      <span className="text-[10px] text-brand-600">查看</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
