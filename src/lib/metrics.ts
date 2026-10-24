const DAY = 24 * 60 * 60 * 1000

function toTime(value?: string): number | null {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

function validTimes(values: (string | undefined)[]): number[] {
  return values.map(toTime).filter((value): value is number => value !== null)
}

export interface WeekOverWeek {
  total: number
  current: number
  previous: number
  delta: number
  growthPercent: number | null
}

/** Compares records created this week with the previous week. */
export function weekOverWeek(values: (string | undefined)[], now = Date.now()): WeekOverWeek {
  const times = validTimes(values)
  const currentStart = now - 7 * DAY
  const previousStart = now - 14 * DAY
  let current = 0
  let previous = 0
  for (const time of times) {
    if (time >= currentStart) current += 1
    else if (time >= previousStart) previous += 1
  }
  const total = times.length
  const delta = current - previous
  const base = total - current
  return {
    total,
    current,
    previous,
    delta,
    growthPercent: base > 0 ? Math.round((delta / base) * 100) : null,
  }
}

/** Cumulative count at the end of each weekly bucket. */
export function cumulativeSeries(
  values: (string | undefined)[],
  points = 8,
  stepDays = 7,
  now = Date.now(),
): number[] {
  const times = validTimes(values)
  return Array.from({ length: points }, (_, index) => {
    const end = now - (points - 1 - index) * stepDays * DAY
    return times.filter((time) => time <= end).length
  })
}

/** Non-cumulative daily counts for the recent window, including today. */
export function dailySeries(
  values: (string | undefined)[],
  days = 7,
  now = Date.now(),
): number[] {
  const times = validTimes(values)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const todayStart = today.getTime()
  return Array.from({ length: days }, (_, index) => {
    const start = todayStart - (days - 1 - index) * DAY
    const end = start + DAY
    return times.filter((time) => time >= start && time < end).length
  })
}

export function formatWeekDelta(summary: WeekOverWeek, unit: string): string {
  if (summary.delta === 0) return `较上周 持平 ｜ 暂无新增`
  const sign = summary.delta > 0 ? '+' : ''
  const growth =
    summary.growthPercent !== null && summary.growthPercent !== 0
      ? ` ｜ 增长 ${summary.growthPercent}%`
      : ''
  return `较上周 ${sign}${summary.delta} ${unit}${growth}`
}
