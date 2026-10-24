import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'soft'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm shadow-brand-600/15 hover:bg-brand-700 focus-visible:ring-brand-500/20',
  secondary:
    'border border-brand-100 bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-500/15',
  outline:
    'border border-line-strong bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50 focus-visible:ring-brand-500/15',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-800 focus-visible:ring-brand-500/15',
  danger:
    'bg-danger-500 text-white shadow-sm shadow-danger-500/15 hover:bg-danger-600 focus-visible:ring-danger-500/20',
  soft: 'bg-ink-100 text-ink-700 hover:bg-ink-200 focus-visible:ring-brand-500/15',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-11 gap-2 rounded-[10px] px-5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        icon && <span className="flex shrink-0 items-center [&>svg]:size-4">{icon}</span>
      )}
      {children}
      {iconRight && !loading && (
        <span className="flex shrink-0 items-center [&>svg]:size-4">{iconRight}</span>
      )}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: 'sm' | 'md'
  variant?: 'ghost' | 'outline'
}

export function IconButton({
  label,
  size = 'md',
  variant = 'ghost',
  className,
  children,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg text-ink-500 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15 disabled:pointer-events-none disabled:opacity-40 [&>svg]:size-4',
        size === 'sm' ? 'size-8' : 'size-9',
        variant === 'ghost' ? 'hover:bg-ink-100 hover:text-ink-700' : 'border border-line-strong bg-white hover:bg-ink-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
