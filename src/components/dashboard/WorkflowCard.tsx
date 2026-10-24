import { Badge } from '@/components/ui/feedback'
import { Card } from '@/components/ui'
import { WorkflowChain } from '@/components/domain/WorkflowChain'

export interface WorkflowCounts {
  learner: number
  profile: number
  goal: number
  script: number
  task: number
  asset: number
}

export function WorkflowCard({ counts }: { counts: WorkflowCounts }) {
  return (
    <Card className="relative overflow-hidden p-4">
      <span className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-brand-100/25 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[17px] font-semibold tracking-tight text-ink-900">训练业务流程</h2>
            <Badge tone="brand">一站式闭环</Badge>
          </div>
          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-ink-400">
            从学员档案到场景资产，完成 3D 场景辅助训练的完整流程。
          </p>
        </div>
        <div className="relative hidden shrink-0 pr-2 pt-1 sm:block">
          <p className="rotate-[-2deg] font-serif text-[13px] italic tracking-[0.02em] text-brand-600/90">
            让每一次训练都有价值
          </p>
          <svg
            viewBox="0 0 150 8"
            className="absolute -bottom-1.5 right-0 h-2 w-[132px] text-brand-300/70"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 5C33 1.5 92 1.5 147 4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      <WorkflowChain counts={counts} className="relative mt-4" />
    </Card>
  )
}
