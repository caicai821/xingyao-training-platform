import type {
  AbilityAssessment,
  AbilityProfile,
  AbilityScores,
  SceneAsset,
  SceneTask,
  TrainingScript,
} from '@/types'
import { ABILITY_DIMENSIONS } from '@/lib/constants'
import { averageScore } from '@/lib/utils'

export function latestAssessmentFor(
  assessments: AbilityAssessment[],
  learnerId: string,
): AbilityAssessment | undefined {
  return assessments
    .filter((item) => item.learnerId === learnerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
}

export function latestProfileFor(
  profiles: AbilityProfile[],
  learnerId: string,
): AbilityProfile | undefined {
  return profiles
    .filter((item) => item.learnerId === learnerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
}

export function assessmentAverage(assessment?: AbilityAssessment) {
  if (!assessment) return 0
  return averageScore(ABILITY_DIMENSIONS.map((dimension) => assessment.scores[dimension.key].score))
}

export function radarData(scores: AbilityScores) {
  return ABILITY_DIMENSIONS.map((dimension) => ({
    label: dimension.shortName,
    value: scores[dimension.key].score,
  }))
}

export function tasksForScript(tasks: SceneTask[], scriptId: string) {
  return tasks.filter((task) => task.scriptId === scriptId)
}

export function assetsForScript(assets: SceneAsset[], scriptId: string) {
  return assets.filter((asset) => asset.scriptId === scriptId)
}

export function scriptProgressLabel(script: TrainingScript) {
  return `v${script.version}`
}

export function assessmentTrend(assessments: AbilityAssessment[], learnerId: string) {
  return assessments
    .filter((item) => item.learnerId === learnerId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-6)
}

export function latestTaskStatus(tasks: SceneTask[]) {
  if (!tasks.length) return null
  return [...tasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0]
}
