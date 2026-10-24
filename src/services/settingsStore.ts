import type { AppSettings } from '@/types'

const SETTINGS_KEY = 'qicheng_settings_v1'

const env = import.meta.env
const envTimeout = Number(env.VITE_REQUEST_TIMEOUT)

export const DEFAULT_SETTINGS: AppSettings = {
  apiMode: env.VITE_API_MODE === 'live' ? 'live' : 'mock',
  apiBaseUrl: env.VITE_API_BASE_URL || 'https://api.example.com/v1',
  uploadUrl: env.VITE_UPLOAD_URL || 'https://upload.example.com/v1/files',
  requestTimeout: Number.isFinite(envTimeout) && envTimeout > 0 ? envTimeout : 30000,
  simulateFailure: false,
  simulateDelay: 900,
  showDemoBadge: true,
}

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...patch }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  } catch {
    // Storage may be unavailable; settings remain limited to this session.
  }
  return next
}

export function resetSettings(): AppSettings {
  try {
    localStorage.removeItem(SETTINGS_KEY)
  } catch {
    // Ignore storage failures in demo mode.
  }
  return { ...DEFAULT_SETTINGS }
}
