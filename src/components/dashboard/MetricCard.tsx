import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Sparkline, type SparklineTone } from '@/components/charts'
import { cn } from '@/lib/utils'

type MetricTone = 'brand' | 'mint' | 'amber' | 'teal'

const tones: Record<
  MetricTone,
  { tile: string; glow: string; spark: SparklineTone }
> = {
  brand: {
    tile: 'bg-brand-50 text-brand-600 ring-brand-100/70',
    glow: 'from-brand-100/45',
    spark: 'brand',
  },
  mint: {
    tile: 'bg-accent-50 text-accent-600 ring-accent-100/70',
    glow: 'from-accent-100/50',
    spark: 'mint',
  },
  amber: {
    tile: 'bg-warning-50 text-warning-500 ring-warning-100/70',
    glow: 'from-warning-100/55',
    spark: 'amber',
  },
  teal: {
    tile: 'bg-success-50 text-success-600 ring-success-100/70',
    glow: 'from-accent-100/45',
    spark: 'teal',
  },
}

export function MetricCard({
  label,
  value,
  unit,
  description,
  icon,
  tone,
  to,
  sparkValues,
  sparkLabel,
}: {
  label: string
  value: number
  unit: string
  description: string
  icon: ReactNode
  tone: MetricTone
  to: string
  sparkValues: number[]
  sparkLabel: string
}) {
  const palette = tones[tone]

  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-card border border-line/80 bg-white p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-200/90 hover:shadow-float"
    >
      <span
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br to-transparent opacity-80',
          palette.glow,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-[12px] ring-1 [&>svg]:size-[17px]',
              palette.tile,
            )}
          >
            {icon}
          </span>
          <p className="truncate text-[13px] font-medium text-ink-600">{label}</p>
        </div>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line/70 bg-white/80 text-ink-300 transition group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-600">
          <ChevronRight className="size-3.5" />
        </span>
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-2">
        <p className="flex shrink-0 items-baseline gap-1.5">
          <span className="tnum text-[30px] font-semibold leading-none tracking-[-0.03em] text-ink-900">
            {value}
          </span>
          <span className="text-[11.5px] font-medium text-ink-400">{unit}</span>
        </p>
        <Sparkline
          values={sparkValues}
          tone={palette.spark}
          ariaLabel={sparkLabel}
          className="h-8 w-[90px] shrink-0"
        />
      </div>

      <p className="relative mt-1.5 truncate text-[10.5px] leading-4 text-ink-500" title={description}>
        {description}
      </p>
    </Link>
  )
}
