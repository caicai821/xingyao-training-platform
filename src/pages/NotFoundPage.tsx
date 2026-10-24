import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <Compass className="size-5" />
      </span>
      <p className="tnum mt-5 text-3xl font-semibold text-ink-900">404</p>
      <h1 className="mt-1 text-base font-semibold text-ink-800">页面不存在</h1>
      <p className="mt-2 max-w-sm text-xs leading-6 text-ink-400">
        链接可能已失效，或该页面尚未在当前原型中提供。
      </p>
      <Link to="/dashboard" className="mt-5">
        <Button>返回工作台</Button>
      </Link>
    </div>
  )
}
