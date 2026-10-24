import { useCallback, useState } from 'react'

export function useAsyncAction() {
  const [pending, setPending] = useState(false)

  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    setPending(true)
    try {
      return await action()
    } finally {
      setPending(false)
    }
  }, [])

  return { pending, run }
}

export function errorMessage(cause: unknown, fallback = '操作未完成，请稍后重试') {
  if (cause instanceof Error && cause.message) return cause.message
  if (typeof cause === 'string' && cause) return cause
  return fallback
}
