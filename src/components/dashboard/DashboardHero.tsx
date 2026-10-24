import { useNavigate } from 'react-router-dom'
import { Box, UserPlus } from 'lucide-react'
import heroGlacier from '@/assets/hero-glacier.webp'
import { Button } from '@/components/ui/Button'
import { todayLabel } from '@/lib/utils'

export function DashboardHero() {
  const navigate = useNavigate()

  return (
    <section className="relative isolate overflow-hidden rounded-panel border border-white/80 bg-[linear-gradient(110deg,#ffffff_0%,#f8fbff_56%,#edf6ff_100%)] px-6 py-5 shadow-card sm:px-8 lg:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-full overflow-hidden sm:w-[72%]"
      >
        <img
          src={heroGlacier}
          alt=""
          loading="eager"
          decoding="async"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
          className="h-full w-full object-cover object-[center_46%] opacity-35 [mask-image:linear-gradient(to_right,transparent_0%,black_34%,black_100%)] sm:opacity-95 sm:[mask-image:linear-gradient(to_right,transparent_0%,black_30%,black_100%)]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_74%_48%,rgba(77,141,255,0.10),transparent_56%)]" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[62%] bg-gradient-to-r from-white via-white/88 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/45 to-transparent"
      />
      <span className="pointer-events-none absolute right-[26%] top-7 size-2 rounded-full bg-brand-300/45 blur-[2px]" />
      <span className="pointer-events-none absolute right-[14%] top-[62%] size-1.5 rounded-full bg-accent-300/50 blur-[1px]" />

      <div className="relative z-10 max-w-[660px]">
        <h1 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink-900 sm:text-[34px]">
          工作台
        </h1>
        <div className="mt-2 flex flex-col gap-1 text-[12.5px] leading-5 text-ink-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5">
          <span className="inline-flex items-center gap-2 text-ink-400">
            <span className="size-1.5 rounded-full bg-accent-400" />
            {todayLabel()}
          </span>
          <span className="hidden h-3 w-px bg-ink-200 sm:block" aria-hidden="true" />
          <span>星耀童行 3D 场景辅助训练系统，让训练更真实、更高效。</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Button size="sm" className="h-9 px-3.5" icon={<Box />} onClick={() => navigate('/scenes/text')}>
            创建 3D 场景
          </Button>
          <Button
            size="sm"
            className="h-9 px-3.5"
            variant="outline"
            icon={<UserPlus />}
            onClick={() => navigate('/learners/new')}
          >
            新增学员
          </Button>
        </div>
      </div>
    </section>
  )
}
