import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Box,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  {
    key: 'learner',
    label: '学员档案',
    unit: '份',
    icon: Users,
    to: '/learners',
    tone: {
      icon: 'bg-brand-50 text-brand-600 ring-brand-100/70',
      sheen: 'from-brand-100/70',
    },
  },
  {
    key: 'profile',
    label: '能力画像',
    unit: '份',
    icon: Sparkles,
    to: '/profiles',
    tone: {
      icon: 'bg-accent-50 text-accent-600 ring-accent-100/70',
      sheen: 'from-accent-100/70',
    },
  },
  {
    key: 'goal',
    label: '训练目标',
    unit: '份',
    icon: Target,
    to: '/goals',
    tone: {
      icon: 'bg-warning-50 text-warning-500 ring-warning-100/70',
      sheen: 'from-warning-100/70',
    },
  },
  {
    key: 'script',
    label: '训练脚本',
    unit: '份',
    icon: FileText,
    to: '/scripts',
    tone: {
      icon: 'bg-violet-50 text-violet-600 ring-violet-100/70',
      sheen: 'from-violet-100/70',
    },
  },
  {
    key: 'task',
    label: '场景任务',
    unit: '个',
    icon: Box,
    to: '/scenes/tasks',
    tone: {
      icon: 'bg-success-50 text-success-600 ring-success-100/70',
      sheen: 'from-accent-100/60',
    },
  },
  {
    key: 'asset',
    label: '场景资产',
    unit: '个',
    icon: ImageIcon,
    to: '/assets',
    tone: {
      icon: 'bg-brand-50 text-brand-600 ring-brand-100/70',
      sheen: 'from-brand-100/60',
    },
  },
] as const

export function WorkflowChain({
  counts,
  className,
}: {
  counts?: Partial<Record<(typeof steps)[number]['key'], number>>
  className?: string
}) {
  return (
    <div
      className={cn(
        'scrollbar-none grid w-full min-w-0 grid-cols-2 gap-2 md:flex md:items-stretch md:gap-1 md:overflow-x-auto md:pb-1',
        className,
      )}
    >
      {steps.map((step, index) => {
        const Icon = step.icon
        const count = counts?.[step.key]
        return (
          <Fragment key={step.key}>
            <Link
              to={step.to}
              className="group relative flex min-w-0 items-center gap-2.5 overflow-hidden rounded-2xl border border-line/80 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(24,52,93,0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float md:min-w-[146px] md:flex-1"
            >
              <span
                className={cn(
                  'pointer-events-none absolute -bottom-8 -right-5 size-20 rotate-12 rounded-[26px] bg-gradient-to-br to-transparent opacity-70',
                  step.tone.sheen,
                )}
              />
              <span className="pointer-events-none absolute right-2.5 top-2 text-[8.5px] font-medium tracking-[0.14em] text-ink-300/80">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span
                className={cn(
                  'relative flex size-9 shrink-0 items-center justify-center rounded-[12px] ring-1',
                  step.tone.icon,
                )}
              >
                <Icon className="size-[16px]" strokeWidth={1.8} />
              </span>
              <span className="relative min-w-0">
                <span className="block truncate text-[12px] font-medium text-ink-500">
                  {step.label}
                </span>
                <span className="mt-0.5 flex items-baseline gap-1">
                  <span className="tnum text-[23px] font-semibold leading-6 text-ink-900">
                    {typeof count === 'number' ? count : '—'}
                  </span>
                  <span className="text-[10px] text-ink-400">{step.unit}</span>
                </span>
              </span>
            </Link>
            {index < steps.length - 1 && (
              <span
                className="hidden w-4 shrink-0 items-center justify-center md:flex"
                aria-hidden="true"
              >
                <ChevronRight className="size-3.5 text-ink-300/75" />
              </span>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

export interface TrailNode {
  label: string
  value?: string
  to?: string
}

export function AssociationTrail({
  nodes,
  className,
}: {
  nodes: TrailNode[]
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {nodes.map((node, index) => (
        <span key={`${node.label}-${index}`} className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg border border-line/80 bg-ink-50/70 px-2 py-1 text-[11px]">
            <span className="text-ink-400">{node.label}</span>
            {node.to ? (
              <Link to={node.to} className="font-medium text-brand-700 hover:underline">
                {node.value || '—'}
              </Link>
            ) : (
              <span className="font-medium text-ink-700">{node.value || '—'}</span>
            )}
          </span>
          {index < nodes.length - 1 && <ArrowRight className="size-3 text-ink-300" />}
        </span>
      ))}
    </div>
  )
}
