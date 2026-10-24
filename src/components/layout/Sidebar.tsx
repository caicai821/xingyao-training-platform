import { NavLink, Link } from 'react-router-dom'
import {
  Box,
  ChevronRight,
  FileText,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  Settings,
  Sparkles,
  Target,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { BrandMark } from '@/components/brand/BrandMark'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  children?: { label: string; to: string }[]
}

interface NavSection {
  label: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    label: '概览',
    items: [{ label: '工作台', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: '学员与评估',
    items: [
      { label: '学员档案', to: '/learners', icon: Users },
      { label: '能力画像', to: '/profiles', icon: Sparkles },
    ],
  },
  {
    label: '训练与场景',
    items: [
      { label: '训练目标', to: '/goals', icon: Target },
      { label: '训练脚本', to: '/scripts', icon: FileText },
      {
        label: '3D 场景生成',
        to: '/scenes',
        icon: Box,
        children: [{ label: '生成任务', to: '/scenes/tasks' }],
      },
      { label: '场景资产库', to: '/assets', icon: ImageIcon },
    ],
  },
  {
    label: '记录与设置',
    items: [
      { label: '方案与任务记录', to: '/records', icon: History },
      { label: '系统设置', to: '/settings', icon: Settings },
    ],
  },
]

export function Sidebar({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string
  onNavigate?: () => void
  className?: string
}) {
  const { settings } = useAppData()

  const isActive = (to: string) =>
    to === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === to || pathname.startsWith(`${to}/`)

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,252,255,0.94)_100%)]',
        className,
      )}
    >
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className="flex h-[72px] shrink-0 items-center gap-3 border-b border-line/60 px-5"
      >
        <BrandMark className="size-12" glow />
        <span className="min-w-0">
          <span className="block text-[17px] font-semibold leading-6 tracking-[0.02em] text-ink-900">
            星耀童行
          </span>
          <span className="block text-[10px] leading-4 tracking-[0.02em] text-ink-400">
            3D 场景辅助训练系统
          </span>
        </span>
      </Link>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-4 last:mb-0">
            <p className="mb-1.5 px-3 text-[10px] font-medium tracking-[0.14em] text-ink-300">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.to)
                return (
                  <div key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onNavigate}
                      className={cn(
                        'group relative flex h-10 items-center gap-2.5 rounded-xl px-3 text-[13px] transition-all duration-200',
                        active
                          ? 'bg-gradient-to-r from-brand-100/85 via-brand-50/70 to-transparent font-medium text-brand-700 shadow-[inset_0_0_0_1px_rgba(53,106,230,0.06)]'
                          : 'text-ink-600 hover:bg-white/90 hover:text-ink-900 hover:shadow-[inset_0_0_0_1px_rgba(230,237,245,0.9)]',
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-brand-600" />
                      )}
                      <Icon
                        strokeWidth={1.8}
                        className={cn(
                          'size-[17px] shrink-0 transition-colors',
                          active ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-600',
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                    {item.children && active && (
                      <div className="mb-1 ml-[31px] mt-1 space-y-0.5 border-l border-line/80 pl-3">
                        {item.children.map((child) => {
                          const childActive = pathname === child.to
                          return (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              onClick={onNavigate}
                              className={cn(
                                'block rounded-lg px-2.5 py-1.5 text-[11.5px] transition',
                                childActive
                                  ? 'bg-brand-50/80 font-medium text-brand-700'
                                  : 'text-ink-500 hover:bg-white/80 hover:text-ink-700',
                              )}
                            >
                              {child.label}
                            </NavLink>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-line/60 p-3">
        <div className="sidebar-brand-panel relative overflow-hidden rounded-[18px] border border-white/80 bg-gradient-to-br from-brand-100/65 via-white to-accent-50/55 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <span className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-brand-200/35 blur-2xl" />
          <svg
            viewBox="0 0 220 56"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full text-brand-300/35"
            fill="none"
            aria-hidden="true"
          >
            <path d="M-8 45C26 18 54 18 82 35s55 16 88-5 42-20 70-8" stroke="currentColor" strokeWidth="1" />
            <path d="M-10 56C26 30 55 30 84 45s54 15 88-6 44-18 72-6" stroke="currentColor" strokeWidth="1" opacity=".6" />
            <circle cx="174" cy="18" r="1.5" fill="currentColor" />
            <circle cx="190" cy="28" r="1" fill="currentColor" />
            <circle cx="58" cy="22" r="1" fill="currentColor" />
          </svg>
          <div className="relative flex items-center gap-2.5">
            <BrandMark className="size-9 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium leading-4 text-ink-800">用 3D 让训练更真实</p>
              <p className="mt-0.5 text-[9.5px] tracking-[0.03em] text-ink-400">
                更高效 · 更有效 · 更有温度
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-line/70 bg-white/70 px-2.5 py-2">
          <span
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              settings.apiMode === 'mock' ? 'bg-warning-500' : 'bg-success-500',
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-ink-700">
              {settings.apiMode === 'mock' ? '演示服务运行中' : '已连接真实 API'}
            </p>
            <p className="truncate text-[9.5px] text-ink-400">
              {settings.apiMode === 'mock' ? '本地模拟数据' : '外部服务已配置'}
            </p>
          </div>
          <Link
            to="/settings"
            onClick={onNavigate}
            className="shrink-0 rounded-md px-1.5 py-1 text-[10px] font-medium text-brand-600 transition hover:bg-brand-50 hover:text-brand-700"
          >
            接口配置
          </Link>
        </div>

        <Link
          to="/settings"
          onClick={onNavigate}
          className="group flex items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-white/80"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600 ring-1 ring-violet-100">
            <UserRound className="size-[15px]" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11.5px] font-medium text-ink-800">星耀童行管理员</span>
            <span className="block truncate text-[10px] text-ink-400">系统管理员 · 演示环境</span>
          </span>
          <ChevronRight className="size-3.5 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
        </Link>
      </div>
    </div>
  )
}
