import type {
  AbilityDimensionKey,
  GoalPriority,
  GoalStatus,
  LearnerStatus,
  ProfileStatus,
  SceneTaskStatus,
  SceneSourceType,
  ScriptStatus,
} from '@/types'

export interface AbilityDimensionMeta {
  key: AbilityDimensionKey
  name: string
  shortName: string
  description: string
  observationHint: string
}

export const ABILITY_DIMENSIONS: AbilityDimensionMeta[] = [
  {
    key: 'communication',
    name: '语言与沟通能力',
    shortName: '语言沟通',
    description: '理解日常语言、表达需求与参与对话的表现。',
    observationHint: '例如：能主动用短句表达需求，或需要提示后才回应。',
  },
  {
    key: 'social',
    name: '社交互动能力',
    shortName: '社交互动',
    description: '发起互动、轮流等待、合作与回应他人的表现。',
    observationHint: '例如：能在小组活动中等待轮次，或更倾向独立活动。',
  },
  {
    key: 'attention',
    name: '注意力与任务参与度',
    shortName: '注意力',
    description: '维持注意、完成任务与回应指令的持续时间。',
    observationHint: '例如：能持续完成 5 分钟任务，或在过程中需要多次提醒。',
  },
  {
    key: 'emotion',
    name: '情绪识别与表达',
    shortName: '情绪表达',
    description: '识别自己与他人情绪，并以适当方式表达感受。',
    observationHint: '例如：能用词语说出“我有点着急”，或通过行为表达情绪。',
  },
  {
    key: 'adaptation',
    name: '环境适应能力',
    shortName: '环境适应',
    description: '面对环境变化、陌生场景与活动过渡时的适应表现。',
    observationHint: '例如：活动切换前需要预告，或能较快进入新环境。',
  },
  {
    key: 'dailyLiving',
    name: '日常生活技能',
    shortName: '生活技能',
    description: '自理行为、日常流程与任务顺序的执行情况。',
    observationHint: '例如：能按顺序完成整理物品的步骤，或需要逐步提示。',
  },
  {
    key: 'cognition',
    name: '认知与指令理解能力',
    shortName: '认知理解',
    description: '理解概念、执行多步指令与解决日常问题的表现。',
    observationHint: '例如：能理解包含两个步骤的指令，或需要一次一步的提示。',
  },
  {
    key: 'learning',
    name: '学习方式与兴趣偏好',
    shortName: '学习参与',
    description: '学习动机、偏好的信息通道与兴趣迁移能力。',
    observationHint: '例如：通过视觉材料参与度更高，或更愿意动手操作。',
  },
]

export const SCORE_LABELS: Record<number, string> = {
  1: '需要持续支持',
  2: '需要较多提示',
  3: '在提示下可以完成',
  4: '多数情境稳定',
  5: '表现稳定且主动',
}

export const SCORE_LEGEND =
  '1–5 级为项目自定义观察评分，仅用于记录当前能力表现，不构成标准化评估或诊断结论。'

export const AGE_GROUPS = ['3-5 岁', '4-6 岁', '6-8 岁', '9-11 岁', '12-14 岁', '15 岁以上', '未说明']

export const TRAIT_SUGGESTIONS = [
  '喜欢绘画',
  '对声音敏感',
  '表达意愿逐步提升',
  '需要较长准备时间',
  '喜欢结构化任务',
  '对新鲜事物好奇',
  '等待轮流较困难',
  '对环境变化敏感',
  '乐于助人',
  '专注时间较短',
  '喜欢动手操作',
  '对颜色和材质敏感',
]

export const INTEREST_SUGGESTIONS = [
  '绘本',
  '积木',
  '音乐',
  '拼图',
  '自然科学',
  '地图',
  '球类游戏',
  '恐龙',
  '交通工具',
  '写作',
  '手工艺',
  '角色扮演',
  '烹饪',
  '宠物',
  '乐高',
  '陶艺',
  '植物',
]

export const PROMPT_STYLES = [
  '口头提示',
  '视觉提示卡',
  '示范引导',
  '情境化语言',
  '等待与提示结合',
]

export const GOAL_CATEGORIES = [
  '沟通表达',
  '社交互动',
  '注意力',
  '情绪表达',
  '环境适应',
  '生活技能',
  '认知理解',
  '学习参与',
]

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  planning: '规划中',
  in_progress: '进行中',
  completed: '已完成',
  archived: '已归档',
}

export const GOAL_PRIORITY_LABELS: Record<GoalPriority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
}

export const LEARNER_STATUS_LABELS: Record<LearnerStatus, string> = {
  active: '在训',
  paused: '暂缓',
  archived: '已归档',
}

export const SCRIPT_STATUS_LABELS: Record<ScriptStatus, string> = {
  draft: '草稿',
  generated: '待确认',
  confirmed: '已确认',
  archived: '已归档',
}

export const PROFILE_STATUS_LABELS: Record<ProfileStatus, string> = {
  unconfirmed: '待确认',
  confirmed: '已确认',
}

export const TASK_STATUS_LABELS: Record<SceneTaskStatus, string> = {
  draft: '草稿',
  pending: '待提交',
  queued: '排队中',
  generating: '生成中',
  succeeded: '生成成功',
  failed: '生成失败',
}

export const TASK_STATUS_TONE: Record<SceneTaskStatus, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  pending: 'warning',
  queued: 'brand',
  generating: 'brand',
  succeeded: 'success',
  failed: 'danger',
}

export const SOURCE_TYPE_LABELS: Record<SceneSourceType, string> = {
  text: '文本描述',
  image: '图像上传',
  script: '训练脚本',
}

export const SCENE_TYPES = [
  '幼儿园教室',
  '小学课堂',
  '家庭客厅',
  '活动游戏区',
  '社区超市',
  '户外公园',
  '安静休息区',
  '其他自定义',
]

export const COMPLEXITY_OPTIONS = ['简洁', '适中', '丰富'] as const

export const VISUAL_STYLE_OPTIONS = [
  '自然柔和',
  '简洁明快',
  '温暖居家',
  '低饱和配色',
  '写实风格',
  '轻插画风格',
]

export const SENSORY_OPTIONS = [
  '减少视觉干扰',
  '柔和自然光',
  '安静无噪音',
  '色彩对比适中',
  '空间动线清晰',
]

export const AVATAR_TONES = [
  { bg: '#e8f0ff', fg: '#2c5cd1' },
  { bg: '#e6f7f4', fg: '#138379' },
  { bg: '#fdf1e3', fg: '#b26c05' },
  { bg: '#f3ecfe', fg: '#7546b8' },
  { bg: '#fdeef0', fg: '#c2425c' },
  { bg: '#e9f3f9', fg: '#276b8c' },
]

export const WORKFLOW_STEPS = [
  { key: 'learner', label: '学员档案', description: '建立个人档案与观察记录' },
  { key: 'profile', label: '能力画像', description: '汇总能力表现与关注方向' },
  { key: 'goal', label: '训练目标', description: '明确本阶段想练习的方向' },
  { key: 'script', label: '训练脚本', description: '生成结构化训练步骤' },
  { key: 'task', label: '场景任务', description: '转换为 3D 场景生成请求' },
  { key: 'asset', label: '场景资产', description: '管理生成结果与关联记录' },
] as const

export const SCRIPT_STATUS_TONE: Record<ScriptStatus, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  generated: 'warning',
  confirmed: 'success',
  archived: 'neutral',
}

export const GOAL_STATUS_TONE: Record<GoalStatus, 'neutral' | 'brand' | 'success' | 'warning'> = {
  planning: 'neutral',
  in_progress: 'brand',
  completed: 'success',
  archived: 'neutral',
}

export const LEARNER_STATUS_TONE: Record<LearnerStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  paused: 'warning',
  archived: 'neutral',
}
