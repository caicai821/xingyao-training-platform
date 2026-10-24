import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Sparkles, Users } from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
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
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/feedback'
import { LearnerStatusBadge, ProfileStatusBadge } from '@/components/domain/StatusBadges'
import { assessmentAverage, latestAssessmentFor, latestProfileFor } from '@/lib/selectors'
import { formatDate, relativeTime } from '@/lib/utils'
import type { LearnerStatus } from '@/types'

const PAGE_SIZE = 8

export default function LearnersPage() {
  const navigate = useNavigate()
  const { learners, assessments, profiles } = useAppData()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | LearnerStatus>('all')
  const [sort, setSort] = useState<'updated' | 'assessment' | 'name'>('updated')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [query, status, sort])

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const filtered = learners
      .filter((learner) => (status === 'all' ? true : learner.status === status))
      .filter((learner) => {
        if (!keyword) return true
        return [learner.name, learner.nickname, learner.code, learner.currentGoalText, ...learner.traits]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword))
      })
      .map((learner) => ({
        learner,
        assessment: latestAssessmentFor(assessments, learner.id),
        profile: latestProfileFor(profiles, learner.id),
      }))

    return filtered.sort((a, b) => {
      if (sort === 'name') return a.learner.name.localeCompare(b.learner.name, 'zh-CN')
      if (sort === 'assessment') {
        return (
          new Date(b.assessment?.createdAt ?? 0).getTime() -
          new Date(a.assessment?.createdAt ?? 0).getTime()
        )
      }
      return new Date(b.learner.updatedAt).getTime() - new Date(a.learner.updatedAt).getTime()
    })
  }, [assessments, learners, profiles, query, sort, status])

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const activeCount = learners.filter((learner) => learner.status === 'active').length
  const pendingProfiles = learners.filter(
    (learner) => latestProfileFor(profiles, learner.id)?.status === 'unconfirmed',
  ).length

  const hasFilters = Boolean(query || status !== 'all')

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="学员档案"
        description="集中管理学员的基本信息、个性化特点与训练支持方式，所有字段遵循最小必要原则。"
        actions={
          <Button icon={<Plus />} onClick={() => navigate('/learners/new')}>
            新增学员
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: '学员档案', value: learners.length, hint: '累计建立档案', tone: 'brand' as const },
          { label: '在训学员', value: activeCount, hint: '当前状态为在训', tone: 'success' as const },
          { label: '待确认画像', value: pendingProfiles, hint: '需要核对的分析结果', tone: 'warning' as const },
        ].map((item) => (
          <Card key={item.label} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs text-ink-400">{item.label}</p>
              <p className="tnum mt-1 text-xl font-semibold text-ink-900">{item.value}</p>
              <p className="mt-0.5 text-[11px] text-ink-300">{item.hint}</p>
            </div>
            <Badge tone={item.tone} dot>
              {item.label === '学员档案' ? '档案' : item.label === '在训学员' ? '在训' : '待处理'}
            </Badge>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 lg:flex-row lg:items-center sm:px-5">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="搜索姓名、编号或特点"
            className="w-full lg:max-w-xs"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as 'all' | LearnerStatus)}
              className="w-32"
              aria-label="筛选学员状态"
            >
              <option value="all">全部状态</option>
              <option value="active">在训</option>
              <option value="paused">暂缓</option>
              <option value="archived">已归档</option>
            </Select>
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
              className="w-36"
              aria-label="排序方式"
            >
              <option value="updated">最近更新</option>
              <option value="assessment">最近评估</option>
              <option value="name">姓名排序</option>
            </Select>
          </div>
          <p className="text-xs text-ink-400 lg:ml-auto">
            共 <span className="font-medium text-ink-700">{rows.length}</span> 位学员
          </p>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title={hasFilters ? '没有符合条件的学员' : '还没有学员档案'}
            description={
              hasFilters
                ? '尝试调整搜索关键词或筛选条件。'
                : '建立学员档案是训练业务链路的起点，创建后即可录入能力信息。'
            }
            action={
              hasFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('')
                    setStatus('all')
                  }}
                >
                  清除筛选
                </Button>
              ) : (
                <Button icon={<Plus />} onClick={() => navigate('/learners/new')}>
                  新增学员
                </Button>
              )
            }
          />
        ) : (
          <>
            <DataTable minWidth={1120}>
              <THead>
                <TH className="w-[220px]">学员</TH>
                <TH>年龄段</TH>
                <TH className="w-[220px]">个性化特点</TH>
                <TH className="w-[200px]">当前训练目标</TH>
                <TH>最近评估</TH>
                <TH>能力画像</TH>
                <TH>状态</TH>
                <TH className="w-[132px] text-right">操作</TH>
              </THead>
              <TBody>
                {paged.map(({ learner, assessment, profile }) => (
                  <TR
                    key={learner.id}
                    onClick={() => navigate(`/learners/${learner.id}`)}
                  >
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={learner.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-ink-800">
                            {learner.name}
                            {learner.nickname && (
                              <span className="ml-1.5 text-[11px] font-normal text-ink-400">
                                {learner.nickname}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-ink-400">{learner.code}</p>
                        </div>
                      </div>
                    </TD>
                    <TD className="whitespace-nowrap">{learner.ageGroup}</TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        {learner.traits.slice(0, 2).map((trait) => (
                          <span
                            key={trait}
                            className="rounded-md bg-ink-50 px-1.5 py-0.5 text-[11px] text-ink-500"
                          >
                            {trait}
                          </span>
                        ))}
                        {learner.traits.length > 2 && (
                          <span className="rounded-md bg-ink-50 px-1.5 py-0.5 text-[11px] text-ink-400">
                            +{learner.traits.length - 2}
                          </span>
                        )}
                      </div>
                    </TD>
                    <TD>
                      <p className="max-w-[190px] truncate" title={learner.currentGoalText}>
                        {learner.currentGoalText || '—'}
                      </p>
                    </TD>
                    <TD>
                      {assessment ? (
                        <div className="whitespace-nowrap">
                          <p className="text-ink-600">{formatDate(assessment.createdAt)}</p>
                          <p className="text-[11px] text-ink-400">
                            综合 {assessmentAverage(assessment).toFixed(1)} / 5
                          </p>
                        </div>
                      ) : (
                        <span className="text-ink-300">尚未评估</span>
                      )}
                    </TD>
                    <TD>
                      <ProfileStatusBadge status={profile?.status ?? 'none'} />
                    </TD>
                    <TD>
                      <LearnerStatusBadge status={learner.status} />
                    </TD>
                    <TD>
                      <div
                        className="flex items-center justify-end gap-1 whitespace-nowrap"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Link
                          to={`/profiles/${learner.id}`}
                          className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs text-ink-500 transition hover:bg-brand-50 hover:text-brand-700"
                          title="查看能力画像"
                        >
                          <Sparkles className="size-3.5" />
                          画像
                        </Link>
                        <Link
                          to={`/learners/${learner.id}`}
                          className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-md px-2 text-xs font-medium text-brand-600 transition hover:bg-brand-50 hover:text-brand-700"
                        >
                          查看
                        </Link>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </DataTable>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={rows.length}
              onChange={setPage}
            />
          </>
        )}
      </Card>

      <p className="mt-3 text-[11px] text-ink-300">
        档案更新时间：
        {learners.length
          ? `最近一次为 ${relativeTime(
              learners
                .map((learner) => learner.updatedAt)
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0],
            )}`
          : '—'}
      </p>
    </div>
  )
}
