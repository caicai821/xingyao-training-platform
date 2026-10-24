import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { BrandMark } from '@/components/brand/BrandMark'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Alert } from '@/components/ui/feedback'
import { Button, IconButton } from '@/components/ui/Button'
import { X } from 'lucide-react'

export function AppLayout() {
  const { loading, initialized, error, refreshAll, updateSettings, settings } = useAppData()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  if (!initialized && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-atmosphere px-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative flex size-16 items-center justify-center">
            <span className="absolute inset-1 rounded-full bg-accent-200/45 blur-2xl animate-pulse-soft" />
            <BrandMark className="relative size-14" />
          </div>
          <p className="mt-4 text-sm font-medium text-ink-800">正在加载训练工作区</p>
          <p className="mt-1 text-xs text-ink-400">正在准备学员档案、能力画像与场景数据…</p>
          <div className="mt-5 h-1 w-44 overflow-hidden rounded-full bg-white/80">
            <div className="h-full w-1/2 animate-pulse-soft rounded-full bg-brand-500" />
          </div>
        </div>
      </div>
    )
  }

  if (!initialized && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-atmosphere px-6">
        <div className="w-full max-w-md rounded-panel border border-white/80 bg-white/90 p-7 text-center shadow-float backdrop-blur-xl">
          <div className="mx-auto flex size-12 items-center justify-center">
            <BrandMark className="size-11" glow />
          </div>
          <h1 className="mt-3 text-base font-semibold text-ink-900">无法加载工作区数据</h1>
          <p className="mt-2 text-xs leading-6 text-ink-500">{error}</p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button icon={<RefreshCw />} onClick={() => void refreshAll()} loading={loading}>
              重新加载
            </Button>
            <Button
              variant="outline"
              icon={<ShieldCheck />}
              onClick={() => updateSettings({ apiMode: 'mock' })}
            >
              切换到演示模式
            </Button>
          </div>
          <p className="mt-5 rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-5 text-ink-400">
            当前模式：{settings.apiMode === 'mock' ? '演示模式' : '真实 API 模式'}
            <br />
            服务地址：{settings.apiBaseUrl}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app-atmosphere">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] border-r border-line/70 bg-white/80 backdrop-blur-xl lg:block">
        <Sidebar pathname={location.pathname} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/25 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[288px] max-w-[86vw] border-r border-line/70 bg-white shadow-pop animate-slide-in">
            <IconButton
              label="关闭导航"
              className="absolute right-2 top-3 z-10"
              onClick={() => setMobileOpen(false)}
            >
              <X />
            </IconButton>
            <Sidebar pathname={location.pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-[256px]">
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        {loading && initialized && (
          <div className="h-0.5 w-full overflow-hidden bg-brand-50">
            <div className="h-full w-1/3 animate-pulse-soft rounded-full bg-brand-500" />
          </div>
        )}
        <main className="mx-auto w-full max-w-[1640px] px-4 py-5 sm:px-6 lg:px-8">
          {error && (
            <Alert
              tone="danger"
              title="数据刷新未完成"
              description={error}
              className="mb-5"
              action={
                <Button size="sm" variant="outline" onClick={() => void refreshAll()}>
                  重试
                </Button>
              }
            />
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
