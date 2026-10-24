import type {
  AbilityAssessment,
  AbilityProfile,
  AbilityProfileInput,
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

export interface LearnerService {
  list(): Promise<Learner[]>
  get(id: string): Promise<Learner | null>
  create(input: LearnerInput): Promise<Learner>
  update(id: string, input: Partial<LearnerInput>): Promise<Learner>
}

export interface AssessmentService {
  listByLearner(learnerId: string): Promise<AbilityAssessment[]>
  list(): Promise<AbilityAssessment[]>
  save(input: {
    learnerId: string
    scores: AbilityScores
    generalNotes: string
    author?: string
  }): Promise<AbilityAssessment>
}

export interface AbilityProfileService {
  list(): Promise<AbilityProfile[]>
  listByLearner(learnerId: string): Promise<AbilityProfile[]>
  generate(input: AbilityProfileInput): Promise<AbilityProfile>
  update(
    id: string,
    patch: Pick<
      AbilityProfile,
      'summary' | 'strengths' | 'developmentAreas' | 'recommendations' | 'dimensionInsights' | 'observationSnapshot'
    >,
  ): Promise<AbilityProfile>
  confirm(id: string): Promise<AbilityProfile>
}

export interface TrainingGoalService {
  list(): Promise<TrainingGoal[]>
  get(id: string): Promise<TrainingGoal | null>
  create(input: TrainingGoalInput): Promise<TrainingGoal>
  update(id: string, input: Partial<TrainingGoalInput>): Promise<TrainingGoal>
}

export interface TrainingScriptService {
  list(): Promise<TrainingScript[]>
  get(id: string): Promise<TrainingScript | null>
  generate(input: ScriptGenerationInput): Promise<TrainingScript>
  update(id: string, patch: Partial<TrainingScript>, versionNote?: string): Promise<TrainingScript>
  confirm(id: string): Promise<TrainingScript>
  regenerate(id: string, overrides?: Partial<SceneConfigInput>): Promise<TrainingScript>
  duplicate(id: string): Promise<TrainingScript>
}

export type SceneConfigInput = {
  theme?: string
  sceneType?: string
  complexity?: TrainingScript['sceneConfig']['complexity']
  stepCount?: number
  duration?: number
  promptStyle?: string
  environmentPrefs?: string[]
  avoidElements?: string[]
}

export interface SceneTaskService {
  list(): Promise<SceneTask[]>
  get(id: string): Promise<SceneTask | null>
  create(input: SceneGenerationInput, options: SceneTaskSubmitOptions): Promise<SceneTask>
  submit(id: string): Promise<SceneTask>
  retry(id: string): Promise<SceneTask>
  sync(): Promise<void>
}

export interface SceneAssetService {
  list(): Promise<SceneAsset[]>
  get(id: string): Promise<SceneAsset | null>
  update(
    id: string,
    patch: Partial<Pick<SceneAsset, 'name' | 'description' | 'tags' | 'note'>>,
  ): Promise<SceneAsset>
}

export interface ActivityService {
  list(): Promise<Activity[]>
}

export interface UploadService {
  uploadImage(file: File, onProgress?: (progress: number) => void): Promise<ImageReference>
}

export interface TrainingServices {
  learners: LearnerService
  assessments: AssessmentService
  profiles: AbilityProfileService
  goals: TrainingGoalService
  scripts: TrainingScriptService
  tasks: SceneTaskService
  assets: SceneAssetService
  activities: ActivityService
  uploads: UploadService
  settings: {
    get(): AppSettings
    save(patch: Partial<AppSettings>): AppSettings
    reset(): AppSettings
    resetDemoData(): Promise<void>
  }
}
