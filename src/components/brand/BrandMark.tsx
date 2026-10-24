import brandLogo from '@/assets/brand-logo.webp'
import { cn } from '@/lib/utils'

export function BrandMark({
  className,
  glow = false,
}: {
  className?: string
  glow?: boolean
}) {
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      aria-hidden="true"
    >
      {glow && (
        <span className="pointer-events-none absolute inset-[6%] rounded-full bg-accent-300/30 blur-xl" />
      )}
      <img
        src={brandLogo}
        alt=""
        draggable={false}
        className="relative h-full w-full select-none object-contain drop-shadow-[0_6px_14px_rgba(22,43,77,0.18)]"
      />
    </span>
  )
}
