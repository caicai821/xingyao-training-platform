import {
  useEffect,
  useMemo,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, IconButton } from './Button'
import { Input } from './form'

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-card border border-line bg-surface shadow-card', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  icon,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  icon?: ReactNode
}) {
  return (
    <Card className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/80 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-brand-50 text-brand-600 [&>svg]:size-4">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-ink-900">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs leading-5 text-ink-400">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div className={cn('p-5 sm:p-6', contentClassName)}>{children}</div>
    </Card>
  )
}

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const tones = [
    'bg-brand-50 text-brand-700',
    'bg-accent-50 text-accent-700',
    'bg-warning-50 text-warning-600',
    'bg-violet-50 text-violet-600',
    'bg-brand-100 text-brand-800',
    'bg-ink-50 text-ink-600',
  ]
  const sizes = {
    xs: 'size-6 text-[10px]',
    sm: 'size-8 text-xs',
    md: 'size-10 text-[13px]',
    lg: 'size-14 text-base',
    xl: 'size-[72px] text-xl',
  }
  const hash = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const tone = tones[hash % tones.length]
  const initials = /^[\u4e00-\u9fa5]/.test(name) ? name.slice(-2) : name.slice(0, 2).toUpperCase()
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide',
        sizes[size],
        tone,
        className,
      )}
      title={name}
    >
      {initials}
    </span>
  )
}

export interface TabItem {
  key: string
  label: string
  count?: number
  icon?: ReactNode
}

export function Tabs({
  items,
  value,
  onChange,
  variant = 'underline',
  className,
}: {
  items: TabItem[]
  value: string
  onChange: (key: string) => void
  variant?: 'underline' | 'pill'
  className?: string
}) {
  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-ink-100 p-1',
          className,
        )}
        role="tablist"
      >
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={value === item.key}
            onClick={() => onChange(item.key)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-[13px] transition',
              value === item.key
                ? 'bg-white font-medium text-ink-900 shadow-sm'
                : 'text-ink-500 hover:text-ink-700',
            )}
          >
            {item.icon}
            {item.label}
            {typeof item.count === 'number' && (
              <span className="text-[11px] text-ink-400">{item.count}</span>
            )}
          </button>
        ))}
      </div>
    )
  }
  return (
    <div className={cn('flex w-full gap-5 overflow-x-auto border-b border-line', className)} role="tablist">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={value === item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            'relative flex shrink-0 items-center gap-1.5 pb-3 text-[13px] transition-colors',
            value === item.key
              ? 'font-medium text-brand-700'
              : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {item.icon}
          {item.label}
          {typeof item.count === 'number' && (
            <span
              className={cn(
                'rounded-full px-1.5 text-[11px] leading-5',
                value === item.key ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-500',
              )}
            >
              {item.count}
            </span>
          )}
          {value === item.key && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />
          )}
        </button>
      ))}
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = '搜索',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      leading={<Search />}
      trailing={
        value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="pointer-events-auto rounded p-0.5 text-ink-400 hover:text-ink-700"
            aria-label="清空搜索"
          >
            <X className="size-3.5" />
          </button>
        ) : null
      }
      className={className}
    />
  )
}

export function DataTable({
  children,
  minWidth = 760,
  className,
}: {
  children: ReactNode
  minWidth?: number
  className?: string
}) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left" style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-ink-50/70">
      <tr className="border-y border-line">{children}</tr>
    </thead>
  )
}

export function TH({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <th
      className={cn(
        'whitespace-nowrap px-4 py-3 text-left text-[11px] font-medium tracking-wide text-ink-400',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="bg-white">{children}</tbody>
}

export function TR({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: (event: MouseEvent<HTMLTableRowElement>) => void
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b border-line/70 transition-colors last:border-b-0',
        onClick && 'cursor-pointer hover:bg-brand-50/40',
        className,
      )}
    >
      {children}
    </tr>
  )
}

export function TD({
  children,
  className,
  colSpan,
}: {
  children?: ReactNode
  className?: string
  colSpan?: number
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn('px-4 py-3.5 align-middle text-[13px] text-ink-600', className)}
    >
      {children}
    </td>
  )
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
  className,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
  className?: string
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pages = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
    const end = Math.min(totalPages, start + 4)
    const list: number[] = []
    for (let index = start; index <= end; index += 1) list.push(index)
    return list
  }, [page, totalPages])

  if (total === 0) return null
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3',
        className,
      )}
    >
      <p className="text-xs text-ink-400">
        共 <span className="tnum font-medium text-ink-600">{total}</span> 条记录
      </p>
      <div className="flex items-center gap-1">
        <IconButton
          label="上一页"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft />
        </IconButton>
        {pages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={cn(
              'size-8 rounded-lg text-xs transition',
              item === page
                ? 'bg-brand-600 font-medium text-white'
                : 'text-ink-500 hover:bg-ink-100',
            )}
          >
            {item}
          </button>
        ))}
        <IconButton
          label="下一页"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight />
        </IconButton>
      </div>
    </div>
  )
}

export function Stepper({
  steps,
  current,
  className,
}: {
  steps: { title: string; description?: string }[]
  current: number
  className?: string
}) {
  return (
    <div className={cn('flex w-full items-start', className)}>
      {steps.map((item, index) => {
        const done = index < current
        const active = index === current
        return (
          <div key={item.title} className="flex min-w-0 flex-1 items-start last:flex-none">
            <div className="flex min-w-0 flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition',
                  done
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : active
                      ? 'border-brand-500 bg-white text-brand-700 ring-4 ring-brand-500/10'
                      : 'border-line-strong bg-white text-ink-400',
                )}
              >
                {done ? <Check className="size-4" /> : index + 1}
              </div>
              <div className="mt-2 min-w-0 sm:ml-2.5 sm:mt-1">
                <p
                  className={cn(
                    'text-xs font-medium leading-5 sm:text-[13px]',
                    active ? 'text-ink-900' : done ? 'text-ink-700' : 'text-ink-400',
                  )}
                >
                  {item.title}
                </p>
                {item.description && (
                  <p className="mt-0.5 hidden text-[11px] leading-4 text-ink-400 sm:block">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="mx-2 mt-4 h-px flex-1 bg-line sm:mx-4">
                <div
                  className={cn('h-px bg-brand-500 transition-all', done ? 'w-full' : 'w-0')}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function InfoGrid({
  items,
  columns = 3,
  className,
}: {
  items: { label: string; value: ReactNode; icon?: ReactNode }[]
  columns?: 2 | 3 | 4
  className?: string
}) {
  const grid = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }
  return (
    <dl className={cn('grid grid-cols-1 gap-x-8 gap-y-5', grid[columns], className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="flex items-center gap-1.5 text-[11px] text-ink-400">
            {item.icon && <span className="[&>svg]:size-3.5">{item.icon}</span>}
            {item.label}
          </dt>
          <dd className="mt-1 break-words text-[13px] leading-6 text-ink-800">
            {item.value || <span className="text-ink-300">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null
  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink-950/35 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-pop animate-fade-up sm:rounded-2xl',
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            {description && (
              <p className="mt-1 text-xs leading-5 text-ink-400">{description}</p>
            )}
          </div>
          <IconButton label="关闭" size="sm" onClick={onClose} className="-mr-1 -mt-1">
            <X />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-ink-50/50 px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  tone = 'primary',
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="rounded-lg bg-ink-50 px-4 py-3 text-xs leading-6 text-ink-500">
        请确认该操作。确认后将立即生效，并可在相关记录中查看结果。
      </div>
    </Modal>
  )
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-ink-950/30 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-pop animate-slide-in-right',
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            {description && (
              <p className="mt-1 text-xs leading-5 text-ink-400">{description}</p>
            )}
          </div>
          <IconButton label="关闭" size="sm" onClick={onClose} className="-mr-1 -mt-1">
            <X />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-ink-50/50 px-5 py-3.5">
            {footer}
          </div>
        )}
      </aside>
    </div>,
    document.body,
  )
}
