import type { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, Sparkles } from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger'

const badgeTones: Record<Tone, string> = {
  neutral: 'border-ink-200/70 bg-ink-100/70 text-ink-600',
  brand: 'border-brand-100 bg-brand-50 text-brand-700',
  accent: 'border-accent-100 bg-accent-50 text-accent-700',
  success: 'border-success-100 bg-success-50 text-success-600',
  warning: 'border-warning-100 bg-warning-50 text-warning-600',
  danger: 'border-danger-100 bg-danger-50 text-danger-500',
}

const dotTones: Record<Tone, string> = {
  neutral: 'bg-ink-400',
  brand: 'bg-brand-500',
  accent: 'bg-accent-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
}

export function Badge({
  tone = 'neutral',
  dot = false,
  className,
  children,
}: {
  tone?: Tone
  dot?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5',
        badgeTones[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dotTones[tone])} />}
      {children}
    </span>
  )
}

export function DemoBadge({ label = '演示数据' }: { label?: string }) {
  const { settings } = useAppData()
  if (!settings.showDemoBadge) return null
  return (
    <Badge tone="neutral" className="border-dashed">
      <Sparkles className="size-3" />
      {label}
    </Badge>
  )
}

export function ProgressBar({
  value,
  tone = 'brand',
  size = 'md',
  animated = false,
  className,
}: {
  value: number
  tone?: 'brand' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}) {
  const tones = {
    brand: 'bg-brand-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
  }
  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' }
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-ink-100', heights[size], className)}>
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700 ease-out',
          tones[tone],
          animated && 'animate-pulse-soft',
        )}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export function Alert({
  tone = 'info',
  title,
  description,
  action,
  className,
}: {
  tone?: 'info' | 'success' | 'warning' | 'danger'
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  const styles = {
    info: 'border-brand-100 bg-brand-50/70 text-brand-700',
    success: 'border-success-100 bg-success-50/70 text-success-600',
    warning: 'border-warning-100 bg-warning-50/80 text-warning-600',
    danger: 'border-danger-100 bg-danger-50/80 text-danger-500',
  }
  const icons = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: AlertCircle }
  const Icon = icons[tone]
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3.5', styles[tone], className)}>
      <Icon className="mt-0.5 size-[18px] shrink-0" />
      <div className="min-w-0 flex-1 text-ink-700">
        <p className="text-[13px] font-medium">{title}</p>
        {description && (
          <div className="mt-1 text-xs leading-5 text-ink-500">{description}</div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-4 py-10' : 'px-6 py-16',
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 [&>svg]:size-5">
        {icon ?? <Info className="size-5" />}
      </div>
      <p className="mt-4 text-sm font-medium text-ink-800">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs leading-6 text-ink-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-ink-100', className)} />
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-ink-400">
      <Loader2 className="size-4 animate-spin text-brand-500" />
      {label}
    </div>
  )
}
