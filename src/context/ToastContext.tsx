import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn, uid } from '@/lib/utils'

type ToastTone = 'success' | 'error' | 'info' | 'warning'

interface ToastInput {
  title: string
  description?: string
  tone?: ToastTone
}

interface ToastItem extends ToastInput {
  id: string
  tone: ToastTone
}

interface ToastContextValue {
  toast: (input: ToastInput) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneStyles: Record<ToastTone, string> = {
  success: 'border-success-100 bg-white text-ink-900',
  error: 'border-danger-100 bg-white text-ink-900',
  info: 'border-brand-100 bg-white text-ink-900',
  warning: 'border-warning-100 bg-white text-ink-900',
}

const iconStyles: Record<ToastTone, string> = {
  success: 'text-success-500',
  error: 'text-danger-500',
  info: 'text-brand-500',
  warning: 'text-warning-500',
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((previous) => previous.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = uid('toast')
      const item: ToastItem = { ...input, id, tone: input.tone ?? 'success' }
      setItems((previous) => [...previous, item].slice(-4))
      window.setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[72px] z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {items.map((item) => {
          const Icon = icons[item.tone]
          return (
            <div
              key={item.id}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-pop animate-fade-up',
                toneStyles[item.tone],
              )}
              role="status"
            >
              <Icon className={cn('mt-0.5 size-[18px] shrink-0', iconStyles[item.tone])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-[13px] leading-5 text-ink-500">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-600"
                aria-label="关闭提示"
              >
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
