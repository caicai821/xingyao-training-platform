import type { AppSettings } from '@/types'
import { apiServices } from './api'
import type { TrainingServices } from './contracts'
import { mockServices } from './mock'
import { getSettings } from './settingsStore'

export type { TrainingServices } from './contracts'
export { DEFAULT_SETTINGS, getSettings, saveSettings } from './settingsStore'

export function createServices(settings: AppSettings = getSettings()): TrainingServices {
  return settings.apiMode === 'live' ? apiServices : mockServices
}
