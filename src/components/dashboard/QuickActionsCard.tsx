import { Link } from 'react-router-dom'
import {
  Box,
  ChevronRight,
  FileText,
  History,
  Image as ImageIcon,
  Target,
  UserPlus,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

const actions = [
  {
    label: '新增学员档案',
    to: '/learners/new',
    icon: UserPlus,
    tile: 'bg-brand-50 text-brand-600 ring-brand-100/60',
  },
  {
    label: '新建训练脚本',
    to: '/scripts/new',
    icon: FileText,
    tile: 'bg-accent-50 text-accent-600 ring-accent-100/60',
  },
  {
    label: '生成 3D 场景',
    to: '/scenes/text',
    icon: Box,
    tile: 'bg-brand-100 text-brand-700 ring-brand-200/70',
    highlight: true,
  },
  {
    label: '场景资产库',
    to: '/assets',
    icon: ImageIcon,
    tile: 'bg-violet-50 text-violet-600 ring-violet-100/60',
  },
  {
    label: '创建训练目标',
    to: '/goals/new',
    icon: Target,
    tile: 'bg-warning-50 text-warning-500 ring-warning-100/60',
  },
  {
    label: '查看任务记录',
    to: '/records',
    icon: History,
    tile: 'bg-success-50 text-success-600 ring-success-100/60',
  },
]

export function QuickActionsCard() {
  return (
    <Card className="relative flex h-full flex-col overflow-hidden p-4 sm:p-5">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-4 size-24 bg-dot-grid opacity-30 [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]"
      />
      <div className="relative flex items-start gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-brand-50 text-brand-600 ring-1 ring-brand-100/60">
          <Zap className="size-4" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight text-ink-900">快捷操作</h2>
          <p className="mt-0.5 text-[11px] leading-5 text-ink-400">
            常用功能入口，助您快速进入业务流程。
          </p>
        </div>
      </div>

      <div className="relative mt-3 grid flex-1 auto-rows-fr grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.to}
              to={action.to}
              className={cn(
                'group flex min-h-[50px] items-center gap-2.5 rounded-xl border px-3 py-2.5 transition duration-200 hover:-translate-y-0.5',
                action.highlight
                  ? 'border-brand-200/90 bg-gradient-to-br from-brand-50/90 to-white shadow-[0_10px_24px_-22px_rgba(53,106,230,0.55)] hover:border-brand-300'
                  : 'border-line/80 bg-white/80 hover:border-brand-200 hover:bg-brand-50/25',
              )}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-[10px] ring-1 [&>svg]:size-3.5',
                  action.tile,
                )}
              >
                <Icon strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1 whitespace-nowrap text-[11.5px] font-medium leading-4 text-ink-700 transition group-hover:text-ink-900">
                {action.label}
              </span>
              <ChevronRight className="size-3.5 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
