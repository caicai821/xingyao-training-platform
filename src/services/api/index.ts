import type {
  AbilityAssessment,
  AbilityProfile,
  AbilityScores,
  Activity,
  AppSettings,
  ImageReference,
  Learner,
  LearnerInput,
  SceneAsset,
  SceneGenerationInput,
  SceneTask,
  SceneTaskSubmitOptions,
  ScriptGenerationInput,
  TrainingGoal,
  TrainingGoalInput,
  TrainingScript,
} from '@/types'
import type { SceneConfigInput, TrainingServices } from '../contracts'
import { getSettings, resetSettings, saveSettings } from '../settingsStore'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const settings = getSettings()
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), settings.requestTimeout)
  try {
    const response = await fetch(`${settings.apiBaseUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    })
    if (!response.ok) {
      let message = `请求失败（HTTP ${response.status}）`
      try {
        const body = (await response.json()) as { message?: string }
        if (body?.message) message = body.message
      } catch {
        // Keep the HTTP status message when the response body is not JSON.
      }
      throw new Error(message)
    }
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('请求超时，请检查服务地址或稍后重试')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(body),
})

const encode = encodeURIComponent

export const apiServices: TrainingServices = {
  learners: {
    list: () => request<Learner[]>('/learners'),
    get: (id) => request<Learner | null>(`/learners/${encode(id)}`),
    create: (input: LearnerInput) => request<Learner>('/learners', json(input)),
    update: (id, input) =>
      request<Learner>(`/learners/${encode(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
  },
  assessments: {
    list: () => request<AbilityAssessment[]>('/assessments'),
    listByLearner: (learnerId) =>
      request<AbilityAssessment[]>(`/learners/${encode(learnerId)}/assessments`),
    save: (input: { learnerId: string; scores: AbilityScores; generalNotes: string; author?: string }) =>
      request<AbilityAssessment>(
        `/learners/${encode(input.learnerId)}/assessments`,
        json({
          scores: input.scores,
          generalNotes: input.generalNotes,
          author: input.author,
        }),
      ),
  },
  profiles: {
    list: () => request<AbilityProfile[]>('/ability-profiles'),
    listByLearner: (learnerId) =>
      request<AbilityProfile[]>(`/learners/${encode(learnerId)}/ability-profiles`),
    generate: (input) =>
      request<AbilityProfile>(
        `/learners/${encode(input.learnerId)}/ability-profile/generate`,
        json({ assessmentId: input.assessmentId, extraNotes: input.extraNotes }),
      ),
    update: (id, patch) =>
      request<AbilityProfile>(`/ability-profiles/${encode(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    confirm: (id) =>
      request<AbilityProfile>(`/ability-profiles/${encode(id)}/confirm`, { method: 'POST' }),
  },
  goals: {
    list: () => request<TrainingGoal[]>('/training-goals'),
    get: (id) => request<TrainingGoal | null>(`/training-goals/${encode(id)}`),
    create: (input: TrainingGoalInput) =>
      request<TrainingGoal>('/training-goals', json(input)),
    update: (id, input) =>
      request<TrainingGoal>(`/training-goals/${encode(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
  },
  scripts: {
    list: () => request<TrainingScript[]>('/training-scripts'),
    get: (id) => request<TrainingScript | null>(`/training-scripts/${encode(id)}`),
    generate: (input: ScriptGenerationInput) =>
      request<TrainingScript>('/training-scripts/generate', json(input)),
    update: (id, patch, versionNote) =>
      request<TrainingScript>(
        `/training-scripts/${encode(id)}${versionNote ? `?versionNote=${encode(versionNote)}` : ''}`,
        {
          method: 'PATCH',
          body: JSON.stringify(patch),
        },
      ),
    confirm: (id) =>
      request<TrainingScript>(`/training-scripts/${encode(id)}/confirm`, { method: 'POST' }),
    regenerate: (id, overrides?: Partial<SceneConfigInput>) =>
      request<TrainingScript>(
        `/training-scripts/${encode(id)}/regenerate`,
        json(overrides ?? {}),
      ),
    duplicate: (id) =>
      request<TrainingScript>(`/training-scripts/${encode(id)}/duplicate`, { method: 'POST' }),
  },
  tasks: {
    list: () => request<SceneTask[]>('/scene-tasks'),
    get: (id) => request<SceneTask | null>(`/scene-tasks/${encode(id)}`),
    create: (input: SceneGenerationInput, _options: SceneTaskSubmitOptions) =>
      request<SceneTask>('/scene-tasks', json(input)),
    submit: (id) =>
      request<SceneTask>(`/scene-tasks/${encode(id)}/submit`, { method: 'POST' }),
    retry: (id) =>
      request<SceneTask>(`/scene-tasks/${encode(id)}/retry`, { method: 'POST' }),
    sync: async () => {
      await request<SceneTask[]>('/scene-tasks')
    },
  },
  assets: {
    list: () => request<SceneAsset[]>('/scene-assets'),
    get: (id) => request<SceneAsset | null>(`/scene-assets/${encode(id)}`),
    update: (id, patch) =>
      request<SceneAsset>(`/scene-assets/${encode(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
  },
  activities: {
    list: () => request<Activity[]>('/activities'),
  },
  uploads: {
    async uploadImage(file, onProgress) {
      onProgress?.(10)
      const settings = getSettings()
      const form = new FormData()
      form.append('file', file)
      const response = await fetch(settings.uploadUrl, {
        method: 'POST',
        body: form,
      })
      if (!response.ok) throw new Error(`图片上传失败（HTTP ${response.status}）`)
      const payload = (await response.json()) as Partial<ImageReference> & { url?: string }
      onProgress?.(100)
      return {
        id: payload.id ?? `img_${Date.now()}`,
        name: payload.name ?? file.name,
        size: payload.size ?? file.size,
        type: payload.type ?? file.type,
        previewUrl: payload.previewUrl ?? payload.url,
      }
    },
  },
  settings: {
    get(): AppSettings {
      return getSettings()
    },
    save(patch) {
      return saveSettings(patch)
    },
    reset() {
      return resetSettings()
    },
    async resetDemoData() {
      throw new Error('演示数据重置仅在演示模式下可用')
    },
  },
}
