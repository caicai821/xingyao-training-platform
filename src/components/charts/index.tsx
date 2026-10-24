import { useId } from 'react'
import { cn } from '@/lib/utils'

export interface RadarPoint {
  label: string
  value: number
}

export function RadarChart({
  data,
  className,
}: {
  data: RadarPoint[]
  className?: string
}) {
  const centerX = 220
  const centerY = 172
  const radius = 104
  const total = Math.max(data.length, 3)
  const angle = (index: number) => (Math.PI * 2 * index) / total - Math.PI / 2
  const point = (index: number, ratio: number) => {
    const safeRatio = Math.max(0.05, Math.min(1, ratio))
    return {
      x: centerX + Math.cos(angle(index)) * radius * safeRatio,
      y: centerY + Math.sin(angle(index)) * radius * safeRatio,
    }
  }
  const polygon = (ratio: number) =>
    data.map((_, index) => {
      const current = point(index, ratio)
      return `${current.x},${current.y}`
    }).join(' ')

  const dataPolygon = data
    .map((item, index) => {
      const current = point(index, item.value / 5)
      return `${current.x},${current.y}`
    })
    .join(' ')

  return (
    <svg
      viewBox="0 0 440 330"
      className={cn('h-auto w-full', className)}
      role="img"
      aria-label="能力维度雷达图"
    >
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <polygon
          key={ratio}
          points={polygon(ratio)}
          fill={ratio === 1 ? 'var(--color-ink-50)' : 'none'}
          fillOpacity={ratio === 1 ? 0.68 : 1}
          stroke="var(--color-line)"
          strokeWidth="1"
        />
      ))}
      {data.map((_, index) => {
        const current = point(index, 1)
        return (
          <line
            key={`axis-${index}`}
            x1={centerX}
            y1={centerY}
            x2={current.x}
            y2={current.y}
            stroke="var(--color-line)"
            strokeWidth="1"
          />
        )
      })}
      {data.length > 1 && (
        <polygon
          points={dataPolygon}
          fill="var(--color-brand-500)"
          fillOpacity="0.13"
          stroke="var(--color-brand-500)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      {data.map((item, index) => {
        const current = point(index, item.value / 5)
        return (
          <circle
            key={`dot-${item.label}`}
            cx={current.x}
            cy={current.y}
            r="3.6"
            fill="var(--color-surface)"
            stroke="var(--color-brand-500)"
            strokeWidth="2"
          />
        )
      })}
      {data.map((item, index) => {
        const labelPoint = point(index, 1.28)
        const anchor =
          Math.abs(labelPoint.x - centerX) < 10
            ? 'middle'
            : labelPoint.x > centerX
              ? 'start'
              : 'end'
        return (
          <g key={`label-${item.label}`}>
            <text
              x={labelPoint.x}
              y={labelPoint.y - 2}
              textAnchor={anchor}
              fontSize="11"
              fill="var(--color-ink-500)"
            >
              {item.label}
            </text>
            <text
              x={labelPoint.x}
              y={labelPoint.y + 12}
              textAnchor={anchor}
              fontSize="10.5"
              fontWeight="600"
              fill="var(--color-brand-700)"
            >
              {item.value.toFixed(1)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export interface TrendPoint {
  label: string
  value: number
}

export function TrendChart({
  points,
  className,
}: {
  points: TrendPoint[]
  className?: string
}) {
  if (points.length < 2) return null
  const width = 560
  const height = 190
  const padding = { top: 26, right: 24, bottom: 34, left: 32 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const x = (index: number) => padding.left + (index * innerWidth) / (points.length - 1)
  const y = (value: number) => padding.top + ((5 - value) / 4) * innerHeight
  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ')
  const area = `${padding.left},${y(1)} ${line} ${padding.left + innerWidth},${y(1)}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('h-auto w-full', className)}
      role="img"
      aria-label="历史综合能力评分趋势"
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <g key={value}>
          <line
            x1={padding.left}
            y1={y(value)}
            x2={padding.left + innerWidth}
            y2={y(value)}
            stroke="var(--color-ink-100)"
            strokeWidth="1"
          />
          <text
            x={padding.left - 10}
            y={y(value) + 3.5}
            textAnchor="end"
            fontSize="9"
            fill="var(--color-ink-300)"
          >
            {value}
          </text>
        </g>
      ))}
      <polygon points={area} fill="var(--color-brand-500)" fillOpacity="0.07" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--color-brand-500)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle
            cx={x(index)}
            cy={y(point.value)}
            r="4"
            fill="var(--color-surface)"
            stroke="var(--color-brand-500)"
            strokeWidth="2"
          />
          <text
            x={x(index)}
            y={y(point.value) - 11}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="var(--color-brand-700)"
          >
            {point.value.toFixed(1)}
          </text>
          <text
            x={x(index)}
            y={height - 12}
            textAnchor="middle"
            fontSize="10"
            fill="var(--color-ink-400)"
          >
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function ScoreBars({
  items,
  className,
}: {
  items: { label: string; value: number; detail?: string }[]
  className?: string
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-4">
            <p className="text-[13px] text-ink-700">{item.label}</p>
            <p className="tnum text-[13px] font-semibold text-ink-900">
              {item.value.toFixed(1)}
              <span className="ml-0.5 text-[11px] font-normal text-ink-300">/ 5</span>
            </p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((step) => (
              <span
                key={step}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  step <= Math.round(item.value) ? 'bg-brand-500' : 'bg-ink-100',
                )}
              />
            ))}
          </div>
          {item.detail && <p className="mt-1.5 text-[11px] leading-5 text-ink-400">{item.detail}</p>}
        </div>
      ))}
    </div>
  )
}

export type SparklineTone = 'brand' | 'mint' | 'amber' | 'violet' | 'teal'

const sparkTones: Record<SparklineTone, { stroke: string; fill: string }> = {
  brand: { stroke: 'var(--color-brand-500)', fill: 'var(--color-brand-400)' },
  mint: { stroke: 'var(--color-accent-500)', fill: 'var(--color-accent-400)' },
  amber: { stroke: 'var(--color-warning-500)', fill: 'var(--color-warning-500)' },
  violet: { stroke: 'var(--color-violet-500)', fill: 'var(--color-violet-400)' },
  teal: { stroke: 'var(--color-success-500)', fill: 'var(--color-accent-400)' },
}

interface SparkPoint {
  x: number
  y: number
}

function smoothPath(points: SparkPoint[]) {
  if (!points.length) return ''
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const beforePrevious = points[index - 2] ?? previous
    const next = points[index + 1] ?? point
    const control1X = previous.x + (point.x - beforePrevious.x) / 6
    const control1Y = previous.y + (point.y - beforePrevious.y) / 6
    const control2X = point.x - (next.x - previous.x) / 6
    const control2Y = point.y - (next.y - previous.y) / 6
    return `${path} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${point.x} ${point.y}`
  }, '')
}

export function Sparkline({
  values,
  tone = 'brand',
  className,
  ariaLabel = '趋势',
}: {
  values: number[]
  tone?: SparklineTone
  className?: string
  ariaLabel?: string
}) {
  const rawId = useId()
  const gradientId = `spark-${rawId.replace(/:/g, '')}`
  const data = values.length >= 2 ? values : [0, 0]
  const width = 132
  const height = 46
  const paddingX = 3
  const paddingY = 6
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min
  const flat = range < 0.0001
  const points = data.map((value, index) => ({
    x: paddingX + (index * (width - paddingX * 2)) / (data.length - 1),
    y: flat
      ? height * 0.56
      : height - paddingY - ((value - min) / range) * (height - paddingY * 2),
  }))
  const line = smoothPath(points)
  const area = `${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
  const colors = sparkTones[tone]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('overflow-visible', className)}
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.fill} stopOpacity="0.26" />
          <stop offset="1" stopColor={colors.fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      {!flat && <path d={area} fill={`url(#${gradientId})`} className="sparkline-area" />}
      <path
        d={line}
        fill="none"
        stroke={colors.stroke}
        strokeWidth={flat ? 1.4 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={flat ? '4 5' : undefined}
        opacity={flat ? 0.5 : 1}
        pathLength={flat ? undefined : 1}
        vectorEffect="non-scaling-stroke"
        className={flat ? undefined : 'sparkline-path'}
      />
    </svg>
  )
}
