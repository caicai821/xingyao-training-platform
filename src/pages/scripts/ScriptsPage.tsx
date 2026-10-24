import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
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
import { Badge } from '@/components/ui/feedback'
import { ScriptStatusBadge } from '@/components/domain/StatusBadges'
import { SCRIPT_STATUS_LABELS } from '@/lib/constants'
import { relativeTime } from '@/lib/utils'
import type { ScriptStatus } from '@/types'

const PAGE_SIZE = 8

export default function ScriptsPage() {
  const navigate = useNavigate()
  const { scripts, learners, goals, tasks } = useAppData()
  const [query, setQuery] = useState('')
  const [learnerFilter, setLearnerFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ScriptStatus>('all')
  const [page, setPage] = useState(1)

  const learnerMap = new Map(learners.map((learner) => [learner.id, learner]))
  const goalMap = new Map(goals.map((goal) => [goal.id, goal]))

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return scripts
      .filter((script) => (learnerFilter === 'all' ? true : script.learnerId === learnerFilter))
      .filter((script) => (statusFilter === 'all' ? true : script.status === statusFilter))
      .filter((script) => {
        if (!keyword) return true
        return (
          script.name.toLowerCase().includes(keyword) ||
          script.code.toLowerCase().includes(keyword) ||
          script.objective.toLowerCase().includes(keyword)
        )
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [learnerFilter, query, scripts, statusFilter])

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = {
    total: scripts.length,
    confirmed: scripts.filter((script) => script.status === 'confirmed').length,
    generated: scripts.filter((script) => script.status === 'generated').length,
    draft: scripts.filter((script) => script.status === 'draft').length,
  }

  const resetPage = () => setPage(1)

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="训练脚本"
        description="结合学员能力画像与训练目标，生成结构化、可编辑、可确认的训练脚本，并转换为场景生成输入。"
        actions={
          <Link to="/scripts/new">
            <Button icon={<Plus />}>生成训练脚本</Button>
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '全部脚本', value: counts.total, hint: '含草稿与历史版本脚本' },
          { label: '已确认', value: counts.confirmed, hint: '可创建关联 3D 场景' },
          { label: '待确认', value: counts.generated, hint: '需要检查脚本内容' },
          { label: '草稿', value: counts.draft, hint: '尚未完成的脚本' },
        ].map((item) => (
          <Card key={item.label} className="px-5 py-4">
            <p className="text-xs text-ink-400">{item.label}</p>
            <p className="tnum mt-1 text-2xl font-semibold text-ink-900">{item.value}</p>
            <p className="mt-0.5 text-[10px] text-ink-300">{item.hint}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:px-5 lg:flex-row lg:items-center">
          <SearchInput
            value={query}
            onChange={(value) => {
              setQuery(value)
              resetPage()
            }}
            placeholder="搜索脚本名称或编号"
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
                setStatusFilter(event.target.value as 'all' | ScriptStatus)
                resetPage()
              }}
              className="w-32"
              aria-label="按状态筛选"
            >
              <option value="all">全部状态</option>
              {Object.entries(SCRIPT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-ink-400 lg:ml-auto">
            共 <span className="font-medium text-ink-700">{rows.length}</span> 份脚本
          </p>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title="没有符合条件的训练脚本"
            description={
              scripts.length === 0
                ? '通过四步向导选择学员、设置目标与情境，生成第一份结构化训练脚本。'
                : '尝试调整搜索关键词或筛选条件。'
            }
            action={
              scripts.length === 0 ? (
                <Link to="/scripts/new">
                  <Button icon={<Plus />}>生成训练脚本</Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('')
                    setLearnerFilter('all')
                    setStatusFilter('all')
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
                <TH className="w-[320px]">脚本名称</TH>
                <TH>关联学员</TH>
                <TH className="w-[220px]">训练目标</TH>
                <TH>版本</TH>
                <TH>状态</TH>
                <TH>关联场景</TH>
                <TH>更新时间</TH>
                <TH className="w-[130px] text-right">操作</TH>
              </THead>
              <TBody>
                {paged.map((script) => {
                  const learner = learnerMap.get(script.learnerId)
                  const goal = goalMap.get(script.goalId)
                  const relatedTasks = tasks.filter((task) => task.scriptId === script.id)
                  return (
                    <TR key={script.id} onClick={() => navigate(`/scripts/${script.id}`)}>
                      <TD>
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                            <FileText className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-ink-800">
                              {script.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-ink-400">
                              {script.code} · {script.steps.length} 个步骤
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD className="whitespace-nowrap">
                        <span className="text-ink-700">{learner?.name ?? '—'}</span>
                        <p className="text-[10px] text-ink-300">{learner?.code}</p>
                      </TD>
                      <TD>
                        <p className="max-w-[210px] truncate text-xs text-ink-600">
                          {goal?.title ?? '—'}
                        </p>
                      </TD>
                      <TD>
                        <Badge tone="neutral">v{script.version}</Badge>
                      </TD>
                      <TD>
                        <ScriptStatusBadge status={script.status} />
                      </TD>
                      <TD className="whitespace-nowrap">
                        {relatedTasks.length ? (
                          <span className="text-xs text-ink-600">{relatedTasks.length} 个</span>
                        ) : (
                          <span className="text-xs text-ink-300">—</span>
                        )}
                      </TD>
                      <TD className="whitespace-nowrap">
                        <span className="text-xs text-ink-400">{relativeTime(script.updatedAt)}</span>
                      </TD>
                      <TD>
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {script.status === 'confirmed' ? (
                            <Link
                              to={`/scenes/script/${script.id}`}
                              className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs text-ink-500 transition hover:bg-brand-50 hover:text-brand-700"
                            >
                              创建场景
                            </Link>
                          ) : (
                            <span className="px-2 text-[10px] text-ink-300">待确认</span>
                          )}
                          <Link
                            to={`/scripts/${script.id}`}
                            className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-md px-2 text-xs font-medium text-brand-600 transition hover:bg-brand-50 hover:text-brand-700"
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
            <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} onChange={setPage} />
          </>
        )}
      </Card>
    </div>
  )
}
