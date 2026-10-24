import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn, parseTags } from '@/lib/utils'

interface FieldProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
  right?: ReactNode
}

export function Field({ label, hint, error, required, children, className, right }: FieldProps) {
  const generatedId = useId()
  const childId = isValidElement(children)
    ? ((children.props as { id?: string }).id ?? undefined)
    : undefined
  const id = childId ?? generatedId
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        'aria-invalid': Boolean(error),
      })
    : children

  return (
    <div className={cn('min-w-0', className)}>
      {(label || right) && (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          {label && (
            <label htmlFor={id} className="text-[13px] font-medium text-ink-700">
              {label}
              {required && <span className="ml-0.5 text-danger-500">*</span>}
            </label>
          )}
          {right}
        </div>
      )}
      {control}
      {error ? (
        <p className="mt-1.5 text-xs text-danger-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-5 text-ink-400">{hint}</p>
      ) : null}
    </div>
  )
}

const baseControl =
  'w-full rounded-lg border border-line-strong bg-white text-sm text-ink-800 placeholder:text-ink-300 transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400 aria-[invalid=true]:border-danger-300 aria-[invalid=true]:focus:ring-danger-500/10'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leading?: ReactNode
  trailing?: ReactNode
}

export function Input({ className, leading, trailing, ...props }: InputProps) {
  if (!leading && !trailing) {
    return <input className={cn(baseControl, 'h-10 px-3.5', className)} {...props} />
  }
  return (
    <div className="relative">
      {leading && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-400 [&>svg]:size-4">
          {leading}
        </span>
      )}
      <input
        className={cn(
          baseControl,
          'h-10',
          leading ? 'pl-9' : 'pl-3.5',
          trailing ? 'pr-9' : 'pr-3.5',
          className,
        )}
        {...props}
      />
      {trailing && (
        <span className="absolute inset-y-0 right-3 flex items-center text-ink-400 [&>svg]:size-4">
          {trailing}
        </span>
      )}
    </div>
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(baseControl, 'min-h-[96px] resize-y px-3.5 py-2.5 leading-6', className)}
      {...props}
    />
  )
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(baseControl, 'h-10 appearance-none pl-3.5 pr-9', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
    </div>
  )
}

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  suggestions?: string[]
  id?: string
  ariaInvalid?: boolean
}

export function TagInput({
  value,
  onChange,
  placeholder = '输入后按回车添加',
  suggestions = [],
  id,
  ariaInvalid,
}: TagInputProps) {
  const [draft, setDraft] = useState('')

  const addTags = (raw: string) => {
    const additions = parseTags(raw).filter((item) => !value.includes(item))
    if (additions.length) onChange([...value, ...additions])
    setDraft('')
  }

  const removeTag = (tag: string) => onChange(value.filter((item) => item !== tag))

  return (
    <div>
      <div
        className={cn(
          'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-line-strong bg-white px-2.5 py-1.5 transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10',
          ariaInvalid && 'border-danger-300',
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-ink-100 py-0.5 pl-2 pr-1 text-xs text-ink-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded p-0.5 text-ink-400 hover:bg-white hover:text-ink-700"
              aria-label={`移除 ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',' || event.key === '，') {
              event.preventDefault()
              addTags(draft)
            } else if (event.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={() => draft.trim() && addTags(draft)}
          placeholder={value.length ? '' : placeholder}
          className="h-6 min-w-[96px] flex-1 border-0 bg-transparent px-1 text-sm text-ink-800 outline-none placeholder:text-ink-300"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions
            .filter((item) => !value.includes(item))
            .slice(0, 10)
            .map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onChange([...value, item])}
                className="rounded-full border border-line bg-ink-50 px-2.5 py-1 text-[11px] text-ink-500 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                + {item}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start justify-between gap-6',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-[13px] font-medium text-ink-700">{label}</span>}
          {description && (
            <span className="mt-0.5 block text-xs leading-5 text-ink-400">{description}</span>
          )}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15',
          checked ? 'bg-brand-600' : 'bg-ink-200',
        )}
      >
        <span
          className={cn(
            'inline-block size-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </label>
  )
}
