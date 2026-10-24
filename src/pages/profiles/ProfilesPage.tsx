import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, Sparkles, Users } from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  SearchInput,
  Select,
} from '@/components/ui'
import { ProfileStatusBadge } from '@/components/domain/StatusBadges'
import { assessmentAverage, latestAssessmentFor, latestProfileFor } from '@/lib/selectors'
import { formatDate } from '@/lib/utils'

type Filter = 'all' | 'confirmed' | 'unconfirmed' | 'none'

export default function ProfilesPage() {
  const navigate = useNavigate()
  const { learners, assessments, profiles } = useAppData()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const entries = useMemo(
    () =>
      learners.map((learner) => ({
        learner,
        assessment: latestAssessmentFor(assessments, learner.id),
        profile: latestProfileFor(profiles, learner.id),
      })),
    [assessments, learners, profiles],
  )

  const filtered = entries.filter(({ learner, profile }) => {
    const keyword = query.trim().toLowerCase()
    const matchesQuery =
      !keyword ||
      [learner.name, learner.code, learner.currentGoalText, ...learner.traits]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    const status = profile?.status ?? 'none'
    const matchesFilter = filter === 'all' || status === filter
    return matchesQuery && matchesFilter
  })

  const confirmedCount = entries.filter((entry) => entry.profile?.status === 'confirmed').length
  const pendingCount = entries.filter((entry) => entry.profile?.status === 'unconfirmed').length
  const noneCount = entries.filter((entry) => !entry.profile).length

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="能力画像"
        description="汇总学员的能力表现、已有优势与关注方向。所有分析结果均作为辅助参考，需由使用者核对确认。"
        actions={
          <Link to="/learners">
            <Button variant="outline" icon={<Users />}>
              前往学员档案
            </Button>
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '已确认画像', value: confirmedCount, hint: '可用于训练方案设计', tone: 'success' as const },
          { label: '待确认画像', value: pendingCount, hint: '需要核对分析内容', tone: 'warning' as const },
          { label: '未生成画像', value: noneCount, hint: '可基于能力记录生成', tone: 'neutral' as const },
          { label: '能力记录', value: assessments.length, hint: '累计观察记录次数', tone: 'brand' as const },
        ].map((item) => (
          <Card key={item.label} className="px-5 py-4">
            <p className="text-xs text-ink-400">{item.label}</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <p className="tnum text-2xl font-semibold text-ink-900">{item.value}</p>
              <span className="text-[10px] text-ink-300">{item.hint}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mb-5 flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="搜索学员姓名、编号或特点"
          className="w-full sm:max-w-xs"
        />
        <Select
          value={filter}
          onChange={(event) => setFilter(event.target.value as Filter)}
          className="w-full sm:w-36"
          aria-label="筛选画像状态"
        >
          <option value="all">全部状态</option>
          <option value="confirmed">已确认</option>
          <option value="unconfirmed">待确认</option>
          <option value="none">未生成</option>
        </Select>
        <p className="text-xs text-ink-400 sm:ml-auto">
          {filtered.length} 位学员
        </p>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Sparkles />}
            title="没有符合条件的画像"
            description="尝试调整搜索关键词或筛选状态。"
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('')
                  setFilter('all')
                }}
              >
                清除筛选
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ learner, assessment, profile }) => (
            <Card key={learner.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <Avatar name={learner.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/learners/${learner.id}`}
                      className="truncate text-[13px] font-semibold text-ink-900 hover:text-brand-700"
                    >
                      {learner.name}
                    </Link>
                    <ProfileStatusBadge status={profile?.status ?? 'none'} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-400">
                    {learner.code} · {learner.ageGroup}
                  </p>
                </div>
              </div>

              <div className="mt-3 min-h-[64px]">
                {profile ? (
                  <p className="line-clamp-2-safe text-xs leading-6 text-ink-500">{profile.summary}</p>
                ) : assessment ? (
                  <p className="text-xs leading-6 text-ink-400">
                    已有 {formatDate(assessment.createdAt)} 的能力记录，尚未生成画像分析。
                  </p>
                ) : (
                  <p className="text-xs leading-6 text-ink-400">
                    尚未录入能力信息。完成录入后即可生成能力画像。
                  </p>
                )}
              </div>

              {profile && profile.strengths.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.strengths.slice(0, 2).map((item) => (
                    <span
                      key={item}
                      className="max-w-full truncate rounded-md bg-success-50 px-2 py-0.5 text-[10px] text-success-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-[10px] text-ink-400">
                <span>
                  最近评估：
                  {assessment ? `${formatDate(assessment.createdAt)} · ${assessmentAverage(assessment).toFixed(1)}` : '—'}
                </span>
                {profile && <span>画像更新：{formatDate(profile.updatedAt)}</span>}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {profile ? (
                  <>
                    <Button
                      size="sm"
                      variant={profile.status === 'unconfirmed' ? 'primary' : 'outline'}
                      icon={<Sparkles />}
                      onClick={() => navigate(`/profiles/${learner.id}`)}
                    >
                      {profile.status === 'unconfirmed' ? '查看并确认' : '查看能力画像'}
                    </Button>
                    <Link to={`/scripts/new?learner=${learner.id}`}>
                      <Button size="sm" variant="secondary">
                        生成训练脚本
                      </Button>
                    </Link>
                  </>
                ) : assessment ? (
                  <Button
                    size="sm"
                    icon={<Sparkles />}
                    onClick={() => navigate(`/profiles/${learner.id}`)}
                  >
                    生成能力画像
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    icon={<ClipboardList />}
                    onClick={() => navigate(`/learners/${learner.id}/assessment`)}
                  >
                    录入能力信息
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
