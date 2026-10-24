import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Box,
  FileText,
  Image as ImageIcon,
  ListChecks,
  Sparkles,
} from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, EmptyState, SectionCard } from '@/components/ui'
import { Alert, Badge, DemoBadge, ProgressBar } from '@/components/ui/feedback'
import { TaskStatusBadge } from '@/components/domain/StatusBadges'
import { ScenePreview } from '@/components/domain/ScenePreview'
import { relativeTime } from '@/lib/utils'

const methods = [
  {
    key: 'text',
    badge: '方式 A',
    title: '通过文本描述创建',
    description: '用自然语言描述空间布局、角色与用途，适合快速构建训练情境。',
    points: ['填写场景用途与配置', '支持示例提示与草稿', '可关联学员与训练目标'],
    to: '/scenes/text',
    icon: FileText,
    sceneType: '幼儿园教室',
    seed: 'scene-entry-text',
  },
  {
    key: 'image',
    badge: '方式 B',
    title: '通过上传图像创建',
    description: '上传参考图片并补充说明，图像解析由外部场景服务完成。',
    points: ['支持 JPG / PNG / WebP', '上传前进行格式与大小校验', '可更换或删除参考图'],
    to: '/scenes/image',
    icon: ImageIcon,
    sceneType: '家庭客厅',
    seed: 'scene-entry-image',
  },
  {
    key: 'script',
    badge: '方式 C',
    title: '从训练脚本创建',
    description: '将已确认的训练脚本转换为结构化场景请求，保持业务关联。',
    points: ['自动带入脚本与情境', '保留训练步骤上下文', '生成结果与脚本互相关联'],
    to: '/scenes/script',
    icon: ListChecks,
    sceneType: '活动游戏区',
    seed: 'scene-entry-script',
  },
] as const

export default function SceneCenterPage() {
  const { tasks, assets, scripts, learners, goals, settings } = useAppData()
  const learnerMap = new Map(learners.map((learner) => [learner.id, learner]))

  const activeTasks = tasks.filter((task) =>
    ['pending', 'queued', 'generating'].includes(task.status),
  )
  const succeeded = tasks.filter((task) => task.status === 'succeeded')
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
  const confirmedScripts = scripts.filter((script) => script.status === 'confirmed')

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="3D 场景生成"
        description="选择文本、图像或训练脚本作为输入，配置场景参数并提交生成任务。当前阶段聚焦生成前配置、任务状态与结果展示。"
        actions={
          <>
            <Link to="/assets">
              <Button variant="outline" icon={<ImageIcon />}>
                场景资产库
              </Button>
            </Link>
            <Link to="/scenes/tasks">
              <Button icon={<Box />}>生成任务列表</Button>
            </Link>
          </>
        }
      />

      <Alert
        tone={settings.apiMode === 'mock' ? 'info' : 'success'}
        title={settings.apiMode === 'mock' ? '当前为演示模式' : '当前已连接真实 API'}
        description={
          settings.apiMode === 'mock'
            ? '场景任务状态与结果由模拟服务驱动，所有预览均明确标注为演示数据，不伪装为实时生成结果。'
            : '任务请求将发送至已配置的场景生成服务，请在系统设置中确认接口参数。'
        }
        className="mb-5"
        action={<DemoBadge label={settings.apiMode === 'mock' ? '模拟场景服务' : '外部服务'} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {methods.map((method) => {
          const Icon = method.icon
          return (
            <Link
              key={method.key}
              to={method.to}
              className="group flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop/50"
            >
              <div className="relative h-40 overflow-hidden">
                <ScenePreview
                  seed={method.seed}
                  sceneType={method.sceneType}
                  showWatermark={false}
                  className="h-full w-full transition duration-500 group-hover:scale-[1.02]"
                />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-ink-600 backdrop-blur">
                  <Icon className="size-3" />
                  {method.badge}
                </span>
                <span className="absolute bottom-2 right-3 rounded bg-white/80 px-1.5 py-0.5 text-[9px] text-ink-500 backdrop-blur">
                  流程示意图
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-[15px] font-semibold text-ink-900">{method.title}</h2>
                <p className="mt-1.5 text-xs leading-6 text-ink-400">{method.description}</p>
                <ul className="mt-3 space-y-1.5">
                  {method.points.map((point) => (
                    <li key={point} className="flex gap-2 text-[11px] leading-5 text-ink-500">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-brand-400" />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between pt-5 text-xs font-medium text-brand-600">
                  开始创建
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard
            title="最近场景任务"
            description="生成中的任务会自动刷新进度，状态由任务数据驱动。"
            actions={
              <Link
                to="/scenes/tasks"
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                全部任务
              </Link>
            }
            contentClassName="p-0"
          >
            {recentTasks.length === 0 ? (
              <EmptyState
                compact
                icon={<Box />}
                title="还没有场景任务"
                description="选择上方任一方式，创建第一个 3D 场景生成任务。"
              />
            ) : (
              recentTasks.map((task) => {
                const learner = task.learnerId ? learnerMap.get(task.learnerId) : null
                const goal = task.trainingGoalId
                  ? goals.find((item) => item.id === task.trainingGoalId)
                  : null
                const active = ['pending', 'queued', 'generating'].includes(task.status)
                return (
                  <Link
                    key={task.id}
                    to={`/scenes/tasks/${task.id}`}
                    className="flex items-start gap-3 border-b border-line/70 px-5 py-3.5 transition last:border-0 hover:bg-ink-50/60 sm:px-6"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Box className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-ink-800">
                          {task.sceneName}
                        </span>
                        <TaskStatusBadge status={task.status} />
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-400">
                        <span>{task.code}</span>
                        {learner && <span>· {learner.name}</span>}
                        {goal && <span>· {goal.title}</span>}
                        <span>· {relativeTime(task.createdAt)}</span>
                      </span>
                      {active && (
                        <span className="mt-2 flex items-center gap-2">
                          <ProgressBar value={task.progress} size="sm" animated className="max-w-[220px]" />
                          <span className="tnum text-[10px] text-ink-400">{task.progress}%</span>
                        </span>
                      )}
                    </span>
                  </Link>
                )
              })
            )}
          </SectionCard>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Sparkles className="size-3.5" />
              </span>
              <p className="text-[13px] font-semibold text-ink-900">任务概览</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: '待处理任务', value: activeTasks.length },
                { label: '已成功生成', value: succeeded.length },
                { label: '场景资产', value: assets.length },
                { label: '可关联脚本', value: confirmedScripts.length },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-line bg-ink-50/40 px-3 py-2.5">
                  <p className="text-[10px] text-ink-400">{item.label}</p>
                  <p className="tnum mt-0.5 text-lg font-semibold text-ink-900">{item.value}</p>
                </div>
              ))}
            </div>
            {activeTasks.length > 0 && (
              <div className="mt-3">
                <Badge tone="brand" dot>
                  {activeTasks.length} 个任务进行中，页面会自动刷新
                </Badge>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="text-[13px] font-semibold text-ink-900">生成流程</p>
            <ol className="mt-3 space-y-3">
              {[
                '选择内容来源（文本、图像或训练脚本）',
                '补充场景用途与关联信息',
                '调整场景配置并提交生成任务',
                '在任务详情中查看进度与结果',
                '将完成的场景归入资产库管理',
              ].map((item, index) => (
                <li key={item} className="flex gap-2.5 text-[11px] leading-5 text-ink-500">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[9px] font-medium text-brand-700">
                    {index + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </Card>

          <Alert
            tone="info"
            title="关于场景能力的边界"
            description="当前阶段不实现 3D 场景内部交互、人物动作控制与场景编辑。页面只负责生成前配置、任务提交、状态查询与结果引用展示。"
          />
        </div>
      </div>
    </div>
  )
}
