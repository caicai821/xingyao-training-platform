import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  to?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  meta,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  meta?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="面包屑" className="mb-2.5 flex flex-wrap items-center gap-1 text-[11px] text-ink-400">
          {breadcrumbs.map((item, index) => (
            <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
              {index > 0 && <ChevronRight className="size-3 text-ink-300" />}
              {item.to ? (
                <Link to={item.to} className="transition hover:text-brand-600">
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink-500">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-page font-semibold tracking-tight text-ink-900">
              {title}
            </h1>
            {meta}
          </div>
          {description && (
            <p className="mt-1 max-w-3xl text-[13.5px] leading-6 text-ink-500">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
