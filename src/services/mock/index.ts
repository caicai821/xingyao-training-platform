import type {
  AbilityAssessment,
  AbilityProfile,
  Activity,
  AppSettings,
  ImageReference,
  Learner,
  MockDatabase,
  SceneAsset,
  SceneTask,
  ScriptGenerationInput,
  ScriptStep,
  TrainingGoal,
  TrainingScript,
} from '@/types'
import { ABILITY_DIMENSIONS, SOURCE_TYPE_LABELS } from '@/lib/constants'
import { clamp, delay, hashString, truncate, uid } from '@/lib/utils'
import type { TrainingServices } from '../contracts'
import { getSettings, resetSettings, saveSettings } from '../settingsStore'
import { loadDb, resetDb, writeDb } from './store'

const clone = <T>(value: T): T => structuredClone(value)
const nowISO = () => new Date().toISOString()
const ACTIVITY_LIMIT = 80
const IMAGE_MAX_SIZE = 2 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const imagePreviewCache = new Map<string, string>()

const mockWait = (multiplier = 0.45) =>
  delay(Math.max(160, getSettings().simulateDelay * multiplier))

function addActivity(
  db: MockDatabase,
  input: { type: Activity['type']; title: string; detail: string; link?: string; at?: string },
) {
  db.activities.unshift({
    id: uid('activity'),
    at: input.at ?? nowISO(),
    type: input.type,
    title: input.title,
    detail: input.detail,
    link: input.link,
  })
  db.activities = db.activities.slice(0, ACTIVITY_LIMIT)
}

function nextCode(codes: string[], prefix: string) {
  const max = codes.reduce((current, code) => {
    const sequence = Number(code.split('-').pop())
    return Number.isFinite(sequence) ? Math.max(current, sequence) : current
  }, 0)
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}

function findLearner(db: MockDatabase, id: string): Learner {
  const learner = db.learners.find((item) => item.id === id)
  if (!learner) throw new Error('未找到对应的学员档案')
  return learner
}

function findGoal(db: MockDatabase, id: string): TrainingGoal | null {
  return db.goals.find((item) => item.id === id) ?? null
}

const dimensionRecommendations: Record<string, string> = {
  communication: '从 3–5 秒等待与简短句式提示开始，鼓励在熟悉情境中主动表达。',
  social: '先安排两人一组的结构化互动，再逐步增加同伴数量与轮次。',
  attention: '减少桌面与背景干扰，将任务拆分为 5–8 分钟的小段。',
  emotion: '在情绪出现后使用表情卡帮助命名，避免对情绪作对错评价。',
  adaptation: '活动变化前提前预告，并保留固定的过渡信号与缓冲时间。',
  dailyLiving: '使用视觉流程卡呈现步骤，并在完成后一起检查结果。',
  cognition: '将多步指令拆分为单步或两步，并配合具体图示说明。',
  learning: '优先使用视觉材料与动手活动，并与学员现有兴趣建立联系。',
}

function scoreSentence(score: number) {
  if (score >= 5) return '该维度当前表现稳定且主动，可作为训练中的优势资源。'
  if (score >= 4) return '该维度在多数情境中表现良好，可在此基础上逐步增加难度。'
  if (score >= 3) return '该维度在提示与结构化支持下基本可以完成。'
  if (score >= 2) return '该维度目前需要较多提示与支持。'
  return '该维度目前需要持续支持，建议拆分目标逐步练习。'
}

function buildProfile(
  learner: Learner,
  assessment: AbilityAssessment,
  extraNotes?: string,
): AbilityProfile {
  const entries = ABILITY_DIMENSIONS.map((dimension) => ({
    ...dimension,
    entry: assessment.scores[dimension.key],
  }))
  const strongest = [...entries].sort((a, b) => b.entry.score - a.entry.score).slice(0, 2)
  const focus = [...entries].sort((a, b) => a.entry.score - b.entry.score).slice(0, 2)

  const summary = `从本次能力信息与补充观察看，${learner.name}在${strongest[0].name}、${strongest[1].name}方面表现相对稳定，${focus[0].name}、${focus[1].name}仍有进一步练习空间。${
    learner.traits.length ? `结合“${learner.traits.slice(0, 2).join('、')}”等个人特点，` : ''
  }建议先从结构清晰、干扰较少的情境开始练习，并将本结果作为辅助参考，经使用者确认后再用于训练方案。`

  const strengths = Array.from(
    new Set([
      ...strongest.map((item) => item.entry.strengths).filter(Boolean),
      learner.interests.length ? `对${learner.interests.slice(0, 2).join('、')}等活动有兴趣，可作为练习切入点` : '',
    ]),
  )
    .filter(Boolean)
    .slice(0, 4)

  const developmentAreas = Array.from(
    new Set(focus.map((item) => item.entry.concerns).filter(Boolean)),
  ).slice(0, 4)

  const recommendations = Array.from(
    new Set([
      ...focus.map((item) => dimensionRecommendations[item.key]),
      learner.promptPreference ? `提示方式建议：${learner.promptPreference}` : '',
      '记录每次练习中的提示次数与回应方式，按周回顾变化。',
    ]),
  )
    .filter(Boolean)
    .slice(0, 5)

  const dimensionInsights = {} as AbilityProfile['dimensionInsights']
  for (const item of entries) {
    dimensionInsights[item.key] = `${scoreSentence(item.entry.score)}${item.entry.description}`
  }

  return {
    id: uid('profile'),
    learnerId: learner.id,
    assessmentId: assessment.id,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    status: 'unconfirmed',
    summary,
    strengths,
    developmentAreas,
    recommendations,
    dimensionInsights,
    observationSnapshot:
      extraNotes?.trim() ||
      assessment.generalNotes ||
      '本次分析基于能力信息录入记录生成，可作为进一步观察的参考。',
    generatedBy: 'mock',
    isDemo: true,
  }
}

const sceneTypeElements: Record<string, string[]> = {
  幼儿园教室: ['活动桌', '教师角色', '视觉提示卡', '收纳架'],
  小学课堂: ['独立课桌', '黑板', '流程卡', '材料托盘'],
  家庭客厅: ['沙发', '茶几', '情绪表情卡', '柔和照明'],
  活动游戏区: ['圆形地垫', '软球', '轮次图卡', '同伴角色'],
  社区超市: ['货架', '收银台', '购物篮', '店员角色'],
  户外公园: ['长椅', '树木', '步道', '开阔草地'],
  安静休息区: ['柔软座椅', '绿植', '书架', '柔和照明'],
}

const practiceTitles = ['引导练习', '等待与提示', '回应与强化', '情境迁移']

function buildScriptContent(
  input: ScriptGenerationInput,
  learner: Learner,
  sceneConfig: TrainingScript['sceneConfig'],
): Pick<
  TrainingScript,
  'name' | 'objective' | 'scenarioSummary' | 'preparation' | 'environmentElements' | 'steps' | 'sceneAdaptation' | 'cautions'
> {
  const stepCount = clamp(sceneConfig.stepCount, 2, 8)
  const { goalTitle } = input
  const { sceneType, theme, complexity, duration, promptStyle, environmentPrefs, avoidElements } = sceneConfig
  const steps: ScriptStep[] = []

  for (let index = 0; index < stepCount; index += 1) {
    const isFirst = index === 0
    const isLast = index === stepCount - 1
    const title = isFirst ? '进入情境' : isLast ? '回顾与结束' : practiceTitles[(index - 1) % practiceTitles.length]

    const promptByStyle: Record<string, string> = {
      视觉提示卡: `出示第 ${index + 1} 步提示卡，并指向当前需要关注的位置。`,
      示范引导: `教师先完成一次示范，再邀请${learner.nickname || learner.name}尝试。`,
      情境化语言: `“现在我们在${theme}里，接下来可以试着${goalTitle}。”`,
      等待与提示结合: `等待 3–5 秒，如未回应，再用简短语句提示：“${goalTitle}”。`,
      口头提示: `“${learner.nickname || learner.name}，我们试着${goalTitle}，一次做一步。”`,
    }

    const observationPool =
      input.observationPoints.length > 0
        ? input.observationPoints
        : ['参与度与停留时间', '需要的提示次数', '回应时的情绪状态']

    let trigger = isFirst ? '学员进入场景并安定下来后' : '上一步完成或得到提示后'
    let prompt = isFirst
      ? `“${learner.nickname || learner.name}，我们今天在这个场景里练习${goalTitle}。先看看周围有什么。”`
      : promptByStyle[promptStyle] ?? promptByStyle['口头提示']
    let expectedBehavior = isFirst
      ? '学员观察场景并保持停留，愿意跟随引导'
      : input.expectedBehavior || '学员在提示下完成当前步骤，并保持情绪平稳'
    let completion = isLast
      ? '完成一次简单回顾，能够指出自己完成的步骤'
      : input.completionStandard || '完成当前步骤，并在 5 秒内回应提示'
    let observationPoints = [
      observationPool[index % observationPool.length],
      index === 0 ? '进入场景的表现' : '提示次数与回应方式',
    ]

    if (title === '引导练习' && !isFirst) {
      trigger = '学员进入情境并安定后'
      expectedBehavior =
        input.expectedBehavior || `在提示下尝试${goalTitle}，出现可观察的目标行为`
      completion = input.completionStandard || '完成一次目标行为的尝试'
      observationPoints = [
        observationPool[index % observationPool.length],
        '目标行为出现的次数',
      ]
    } else if (title === '等待与提示') {
      trigger = '学员出现尝试动作或表达意愿后'
      prompt = `等待 3–5 秒，观察${learner.nickname || learner.name}的反应；如未回应，再用简短语句提示当前步骤。`
      expectedBehavior = '在等待时间内保持当前活动，并在提示后开始下一步'
      completion = '完成一次 3–5 秒的等待并回应提示'
      observationPoints = ['等待时长', '提示次数与回应方式']
    } else if (title === '回应与强化') {
      trigger = '学员完成一次尝试后'
      prompt = `“你刚才完成了这一步，我们一起看看做到了哪里。要不要再试一次？”`
      expectedBehavior = '接受反馈，并愿意再次尝试当前步骤'
      completion = '完成一次重复练习，情绪保持平稳'
      observationPoints = ['接受反馈的表现', '重复练习的主动性']
    } else if (title === '情境迁移') {
      trigger = '基本步骤完成后'
      prompt = `在场景中稍作调整，再次邀请${learner.nickname || learner.name}练习${goalTitle}。`
      expectedBehavior = '在新的位置或材料条件下重复目标行为'
      completion = '在新情境中完成一次目标行为'
      observationPoints = ['新情境中的迁移表现', '需要的提示次数']
    } else if (title === '回顾与结束') {
      trigger = '完成前一步练习后'
      prompt = `“${learner.nickname || learner.name}，今天我们练习了${goalTitle}。你觉得自己做到了哪一步？”`
      expectedBehavior = '与教师一起回顾流程，指出至少一个完成的步骤'
      completion = '完成一次简单回顾并指出完成的步骤'
      observationPoints = ['回顾时的参与度', '能否指出完成的步骤']
    }

    steps.push({
      id: uid('step'),
      title,
      trigger,
      prompt,
      expectedBehavior,
      completion,
      observationPoints,
    })
  }

  const environmentElements = sceneTypeElements[sceneType] ?? ['活动桌', '提示卡', '教师角色']
  const prefsText = environmentPrefs.length ? environmentPrefs.join('、') : '简洁清晰的空间布局'
  const avoidText = avoidElements.length ? `避免出现${avoidElements.join('、')}。` : '避免无关装饰与突发噪音。'

  return {
    name: `${goalTitle} · ${sceneType}情境`,
    objective: `在${sceneType}情境中，围绕“${goalTitle}”完成 ${stepCount} 个连续步骤的练习。`,
    scenarioSummary: `以“${theme}”为主题布置${sceneType}，复杂程度为“${complexity}”，空间保持${prefsText}，重点支持“${goalTitle}”的练习。`,
    preparation: [
      `提前向学员展示本次流程与训练目标：${goalTitle}`,
      '检查场景中的关键对象、提示材料与角色位置',
      `预留约 ${duration} 分钟训练时间，并安排结束后的过渡时间`,
    ],
    environmentElements,
    steps,
    sceneAdaptation: `${sceneType}内保持${prefsText}，主要对象围绕训练步骤布置。${avoidText}建议训练时长控制在 ${duration} 分钟左右。`,
    cautions: [
      avoidElements.length ? `避免出现${avoidElements.join('、')}等干扰元素` : '避免无关装饰与突发噪音',
      '当学员出现明显不适或持续回避时，暂停练习并给予缓冲时间',
      '提示语保持简短，一次只呈现一个步骤',
    ],
  }
}

function prepareImageRefs(refs: ImageReference[] = []): ImageReference[] {
  return refs.map((ref) => {
    if (ref.previewUrl && ref.previewUrl.length > 180_000) {
      imagePreviewCache.set(ref.id, ref.previewUrl)
      return { ...ref, previewUrl: undefined }
    }
    return { ...ref }
  })
}

function hydrateTask(task: SceneTask): SceneTask {
  const hydrated = clone(task)
  hydrated.imageReferences = hydrated.imageReferences.map((ref) => ({
    ...ref,
    previewUrl: ref.previewUrl || imagePreviewCache.get(ref.id),
  }))
  return hydrated
}

function createAssetForTask(db: MockDatabase, task: SceneTask): SceneAsset {
  const existing = db.assets.find((asset) => asset.taskId === task.id)
  if (existing) {
    existing.updatedAt = nowISO()
    task.assetId = existing.id
    return existing
  }
  const asset: SceneAsset = {
    id: uid('asset'),
    taskId: task.id,
    name: task.sceneName,
    sceneType: task.sceneConfig.sceneType,
    description: task.scenePurpose || truncate(task.prompt, 90),
    learnerId: task.learnerId,
    trainingGoalId: task.trainingGoalId,
    scriptId: task.scriptId,
    sourceType: task.sourceType,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    tags: [task.sceneConfig.sceneType, SOURCE_TYPE_LABELS[task.sourceType], '演示场景'],
    previewSeed: `${task.id}:${task.sceneName}:${hashString(task.prompt)}`,
    isDemo: true,
    note: '演示模式生成的场景资产，可在接入真实服务后替换。',
  }
  db.assets.unshift(asset)
  task.assetId = asset.id
  addActivity(db, {
    type: 'asset',
    title: '场景资产已生成',
    detail: `${asset.name} · ${asset.sceneType}`,
    link: `/assets/${asset.id}`,
  })
  return asset
}

function syncTasks(db: MockDatabase) {
  const activeStatuses = new Set(['pending', 'queued', 'generating'])
  let changed = false
  const now = Date.now()

  for (const task of db.tasks) {
    if (!activeStatuses.has(task.status)) continue
    const submittedAt = new Date(task.submittedAt ?? task.createdAt).getTime()
    const elapsed = now - submittedAt
    let status = task.status
    let progress = task.progress

    if (elapsed < 1400) {
      status = 'pending'
      progress = 2
    } else if (elapsed < 3600) {
      status = 'queued'
      progress = 8
    } else if (elapsed < 9000) {
      status = 'generating'
      progress = Math.round(12 + ((elapsed - 3600) / 5400) * 76)
    } else if (task.willFail) {
      status = 'failed'
      progress = 62
      task.error = {
        code: 'SCENE_SERVICE_UNAVAILABLE',
        message: '场景生成服务暂时不可用，请稍后重试。演示模式下可点击“重新生成”体验重试流程。',
      }
      task.completedAt = nowISO()
      task.willFail = false
      addActivity(db, {
        type: 'task',
        title: '场景任务失败',
        detail: task.sceneName,
        link: `/scenes/tasks/${task.id}`,
      })
    } else {
      status = 'succeeded'
      progress = 100
      task.completedAt = nowISO()
      task.result = {
        previewSeed: `${task.id}:${task.sceneName}:${hashString(task.prompt)}`,
        resolution: '2048 × 1280',
        notes: '演示模式生成结果，用于展示任务完成后的结果区域，不代表真实渲染输出。',
        isDemo: true,
      }
      createAssetForTask(db, task)
      addActivity(db, {
        type: 'task',
        title: '场景任务生成成功',
        detail: task.sceneName,
        link: `/scenes/tasks/${task.id}`,
      })
    }

    if (task.status !== status || task.progress !== progress) {
      task.status = status
      task.progress = progress
      task.updatedAt = nowISO()
      changed = true
    }
  }

  if (changed) writeDb(db)
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('图片读取失败，请重新选择文件'))
    reader.readAsDataURL(file)
  })
}

export const mockServices: TrainingServices = {
  learners: {
    async list() {
      await mockWait()
      return clone(loadDb().learners).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
    },
    async get(id) {
      await mockWait(0.2)
      const learner = loadDb().learners.find((item) => item.id === id)
      return learner ? clone(learner) : null
    },
    async create(input) {
      await mockWait()
      const db = loadDb()
      const timestamp = nowISO()
      const learner: Learner = {
        ...input,
        id: uid('learner'),
        code: nextCode(
          db.learners.map((item) => item.code),
          'XS-2026',
        ),
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      db.learners.unshift(learner)
      addActivity(db, {
        type: 'learner',
        title: '学员档案已创建',
        detail: `${learner.name} · ${learner.code}`,
        link: `/learners/${learner.id}`,
      })
      writeDb(db)
      return clone(learner)
    },
    async update(id, input) {
      await mockWait()
      const db = loadDb()
      const learner = findLearner(db, id)
      Object.assign(learner, input, { updatedAt: nowISO() })
      addActivity(db, {
        type: 'learner',
        title: '学员档案已更新',
        detail: learner.name,
        link: `/learners/${learner.id}`,
      })
      writeDb(db)
      return clone(learner)
    },
  },

  assessments: {
    async list() {
      await mockWait()
      return clone(loadDb().assessments).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    },
    async listByLearner(learnerId) {
      await mockWait(0.25)
      return clone(
        loadDb()
          .assessments.filter((item) => item.learnerId === learnerId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      )
    },
    async save(input) {
      await mockWait(0.8)
      const db = loadDb()
      const learner = findLearner(db, input.learnerId)
      const assessment: AbilityAssessment = {
        id: uid('assess'),
        learnerId: input.learnerId,
        createdAt: nowISO(),
        author: input.author || '演示账号 · 训练指导',
        scores: input.scores,
        generalNotes: input.generalNotes,
      }
      db.assessments.unshift(assessment)
      learner.lastAssessmentAt = assessment.createdAt
      learner.updatedAt = assessment.createdAt
      addActivity(db, {
        type: 'assessment',
        title: '能力信息已保存',
        detail: `${learner.name} · 新增一次能力记录`,
        link: `/learners/${learner.id}`,
      })
      writeDb(db)
      return clone(assessment)
    },
  },

  profiles: {
    async list() {
      await mockWait()
      return clone(loadDb().profiles).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    },
    async listByLearner(learnerId) {
      await mockWait(0.2)
      return clone(
        loadDb()
          .profiles.filter((item) => item.learnerId === learnerId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      )
    },
    async generate(input) {
      await mockWait(2.2)
      const db = loadDb()
      const learner = findLearner(db, input.learnerId)
      const assessment = db.assessments.find((item) => item.id === input.assessmentId)
      if (!assessment) throw new Error('请先完成本次能力信息录入')
      const profile = buildProfile(learner, assessment, input.extraNotes)
      db.profiles.unshift(profile)
      addActivity(db, {
        type: 'profile',
        title: '能力画像已生成',
        detail: `${learner.name} · 待确认`,
        link: `/profiles/${learner.id}`,
      })
      writeDb(db)
      return clone(profile)
    },
    async update(id, patch) {
      await mockWait()
      const db = loadDb()
      const profile = db.profiles.find((item) => item.id === id)
      if (!profile) throw new Error('未找到对应的能力画像')
      Object.assign(profile, patch, { updatedAt: nowISO(), status: 'unconfirmed' })
      writeDb(db)
      return clone(profile)
    },
    async confirm(id) {
      await mockWait()
      const db = loadDb()
      const profile = db.profiles.find((item) => item.id === id)
      if (!profile) throw new Error('未找到对应的能力画像')
      profile.status = 'confirmed'
      profile.updatedAt = nowISO()
      const learner = db.learners.find((item) => item.id === profile.learnerId)
      addActivity(db, {
        type: 'profile',
        title: '能力画像已确认',
        detail: learner ? learner.name : '学员',
        link: `/profiles/${profile.learnerId}`,
      })
      writeDb(db)
      return clone(profile)
    },
  },

  goals: {
    async list() {
      await mockWait()
      return clone(loadDb().goals).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
    },
    async get(id) {
      await mockWait(0.2)
      const goal = loadDb().goals.find((item) => item.id === id)
      return goal ? clone(goal) : null
    },
    async create(input) {
      await mockWait()
      const db = loadDb()
      const learner = findLearner(db, input.learnerId)
      const timestamp = nowISO()
      const goal: TrainingGoal = {
        ...input,
        id: uid('goal'),
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      db.goals.unshift(goal)
      const learnerRecord = db.learners.find((item) => item.id === goal.learnerId)
      if (learnerRecord) {
        learnerRecord.currentGoalText = goal.title
        learnerRecord.updatedAt = timestamp
      }
      addActivity(db, {
        type: 'goal',
        title: '训练目标已创建',
        detail: `${learner.name} · ${goal.title}`,
        link: `/goals?learner=${learner.id}`,
      })
      writeDb(db)
      return clone(goal)
    },
    async update(id, input) {
      await mockWait()
      const db = loadDb()
      const goal = db.goals.find((item) => item.id === id)
      if (!goal) throw new Error('未找到对应的训练目标')
      Object.assign(goal, input, { updatedAt: nowISO() })
      writeDb(db)
      return clone(goal)
    },
  },

  scripts: {
    async list() {
      await mockWait()
      return clone(loadDb().scripts).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
    },
    async get(id) {
      await mockWait(0.2)
      const script = loadDb().scripts.find((item) => item.id === id)
      return script ? clone(script) : null
    },
    async generate(input) {
      await mockWait(2.2)
      const db = loadDb()
      const learner = findLearner(db, input.learnerId)
      const content = buildScriptContent(input, learner, input.sceneConfig)
      const timestamp = nowISO()
      const script: TrainingScript = {
        id: uid('script'),
        code: nextCode(
          db.scripts.map((item) => item.code),
          'JB-2026',
        ),
        learnerId: input.learnerId,
        goalId: input.goalId,
        status: 'generated',
        version: 1,
        sceneConfig: input.sceneConfig,
        createdAt: timestamp,
        updatedAt: timestamp,
        history: [
          {
            id: uid('version'),
            version: 1,
            savedAt: timestamp,
            name: content.name,
            objective: content.objective,
            scenarioSummary: content.scenarioSummary,
            steps: clone(content.steps),
            note: '首次生成',
          },
        ],
        generatedBy: 'mock',
        isDemo: true,
        ...content,
      }
      db.scripts.unshift(script)
      addActivity(db, {
        type: 'script',
        title: '训练脚本已生成',
        detail: `${learner.name} · ${script.name}`,
        link: `/scripts/${script.id}`,
      })
      writeDb(db)
      return clone(script)
    },
    async update(id, patch, versionNote) {
      await mockWait()
      const db = loadDb()
      const script = db.scripts.find((item) => item.id === id)
      if (!script) throw new Error('未找到对应的训练脚本')
      if (versionNote) {
        script.history.push({
          id: uid('version'),
          version: script.version,
          savedAt: script.updatedAt,
          name: script.name,
          objective: script.objective,
          scenarioSummary: script.scenarioSummary,
          steps: clone(script.steps),
          note: versionNote,
        })
        script.version += 1
      }
      Object.assign(script, patch, { updatedAt: nowISO() })
      writeDb(db)
      return clone(script)
    },
    async confirm(id) {
      await mockWait()
      const db = loadDb()
      const script = db.scripts.find((item) => item.id === id)
      if (!script) throw new Error('未找到对应的训练脚本')
      script.status = 'confirmed'
      script.updatedAt = nowISO()
      const learner = db.learners.find((item) => item.id === script.learnerId)
      addActivity(db, {
        type: 'script',
        title: '训练脚本已确认',
        detail: `${learner ? learner.name : '学员'} · ${script.name}`,
        link: `/scripts/${script.id}`,
      })
      writeDb(db)
      return clone(script)
    },
    async regenerate(id, overrides) {
      await mockWait(2.2)
      const db = loadDb()
      const script = db.scripts.find((item) => item.id === id)
      if (!script) throw new Error('未找到对应的训练脚本')
      const learner = findLearner(db, script.learnerId)
      const goal = findGoal(db, script.goalId)
      const mergedConfig = { ...script.sceneConfig, ...overrides }
      const input: ScriptGenerationInput = {
        learnerId: script.learnerId,
        goalId: script.goalId,
        goalTitle: goal?.title || script.objective,
        sceneConfig: mergedConfig,
        expectedBehavior: goal?.successCriteria || '',
        completionStandard: '',
        observationPoints: [],
      }
      const content = buildScriptContent(input, learner, mergedConfig)
      script.history.push({
        id: uid('version'),
        version: script.version,
        savedAt: script.updatedAt,
        name: script.name,
        objective: script.objective,
        scenarioSummary: script.scenarioSummary,
        steps: clone(script.steps),
        note: '重新生成前自动保存',
      })
      Object.assign(script, content, {
        sceneConfig: mergedConfig,
        version: script.version + 1,
        status: 'generated',
        updatedAt: nowISO(),
        generatedBy: 'mock',
        isDemo: true,
      })
      addActivity(db, {
        type: 'script',
        title: '训练脚本已重新生成',
        detail: `${learner.name} · ${script.name}`,
        link: `/scripts/${script.id}`,
      })
      writeDb(db)
      return clone(script)
    },
    async duplicate(id) {
      await mockWait()
      const db = loadDb()
      const source = db.scripts.find((item) => item.id === id)
      if (!source) throw new Error('未找到对应的训练脚本')
      const timestamp = nowISO()
      const copy: TrainingScript = {
        ...clone(source),
        id: uid('script'),
        code: nextCode(
          db.scripts.map((item) => item.code),
          'JB-2026',
        ),
        name: `${source.name}（副本）`,
        status: 'draft',
        version: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        history: [
          {
            id: uid('version'),
            version: 1,
            savedAt: timestamp,
            name: `${source.name}（副本）`,
            objective: source.objective,
            scenarioSummary: source.scenarioSummary,
            steps: clone(source.steps),
            note: '从已有脚本复制',
          },
        ],
      }
      db.scripts.unshift(copy)
      writeDb(db)
      return clone(copy)
    },
  },

  tasks: {
    async list() {
      await mockWait(0.25)
      const db = loadDb()
      syncTasks(db)
      return clone(db.tasks)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(hydrateTask)
    },
    async get(id) {
      await mockWait(0.15)
      const db = loadDb()
      syncTasks(db)
      const task = db.tasks.find((item) => item.id === id)
      return task ? hydrateTask(task) : null
    },
    async create(input, options) {
      await mockWait(0.7)
      const db = loadDb()
      const timestamp = nowISO()
      const submitted = options.submit
      const settings = getSettings()
      const willFail = submitted && settings.simulateFailure
      const sceneConfig = { ...input.sceneConfig }
      const task: SceneTask = {
        id: uid('task'),
        code: nextCode(
          db.tasks.map((item) => item.code),
          'RW-2026',
        ),
        sourceType: input.sourceType,
        sceneName: input.sceneName,
        scenePurpose: input.scenePurpose,
        prompt: input.prompt,
        learnerId: input.learnerId,
        trainingGoalId: input.trainingGoalId,
        scriptId: input.scriptId,
        imageReferences: prepareImageRefs(input.imageReferences),
        sceneConfig,
        status: submitted ? 'pending' : 'draft',
        progress: submitted ? 2 : 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        submittedAt: submitted ? timestamp : undefined,
        isDemo: true,
        willFail,
      }
      db.tasks.unshift(task)
      addActivity(db, {
        type: 'task',
        title: submitted ? '场景任务已提交' : '场景任务草稿已保存',
        detail: task.sceneName,
        link: `/scenes/tasks/${task.id}`,
      })
      writeDb(db)
      return hydrateTask(task)
    },
    async submit(id) {
      await mockWait(0.5)
      const db = loadDb()
      const task = db.tasks.find((item) => item.id === id)
      if (!task) throw new Error('未找到对应的场景任务')
      const willFail = getSettings().simulateFailure
      const timestamp = nowISO()
      task.status = 'pending'
      task.progress = 2
      task.submittedAt = timestamp
      task.updatedAt = timestamp
      task.error = undefined
      task.result = undefined
      task.willFail = willFail
      addActivity(db, {
        type: 'task',
        title: '场景任务已提交',
        detail: task.sceneName,
        link: `/scenes/tasks/${task.id}`,
      })
      writeDb(db)
      return hydrateTask(task)
    },
    async retry(id) {
      await mockWait(0.5)
      const db = loadDb()
      const task = db.tasks.find((item) => item.id === id)
      if (!task) throw new Error('未找到对应的场景任务')
      const timestamp = nowISO()
      task.status = 'pending'
      task.progress = 2
      task.submittedAt = timestamp
      task.updatedAt = timestamp
      task.completedAt = undefined
      task.error = undefined
      task.result = undefined
      task.assetId = undefined
      task.willFail = false
      addActivity(db, {
        type: 'task',
        title: '场景任务已重新提交',
        detail: task.sceneName,
        link: `/scenes/tasks/${task.id}`,
      })
      writeDb(db)
      return hydrateTask(task)
    },
    async sync() {
      await mockWait(0.1)
      syncTasks(loadDb())
    },
  },

  assets: {
    async list() {
      await mockWait()
      return clone(loadDb().assets).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    },
    async get(id) {
      await mockWait(0.2)
      const asset = loadDb().assets.find((item) => item.id === id)
      return asset ? clone(asset) : null
    },
    async update(id, patch) {
      await mockWait()
      const db = loadDb()
      const asset = db.assets.find((item) => item.id === id)
      if (!asset) throw new Error('未找到对应的场景资产')
      Object.assign(asset, patch, { updatedAt: nowISO() })
      writeDb(db)
      return clone(asset)
    },
  },

  activities: {
    async list() {
      await mockWait(0.2)
      return clone(loadDb().activities).sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
      )
    },
  },

  uploads: {
    async uploadImage(file, onProgress) {
      if (!IMAGE_TYPES.includes(file.type)) {
        throw new Error('仅支持 JPG、PNG 或 WebP 格式的图片')
      }
      if (file.size > IMAGE_MAX_SIZE) {
        throw new Error('图片大小不能超过 2 MB')
      }
      onProgress?.(18)
      const previewUrl = await readFileAsDataUrl(file)
      onProgress?.(62)
      await mockWait(1.4)
      onProgress?.(100)
      const reference: ImageReference = {
        id: uid('img'),
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
      }
      imagePreviewCache.set(reference.id, previewUrl)
      return reference
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
      await mockWait(0.8)
      resetDb()
      resetSettings()
      imagePreviewCache.clear()
    },
  },
}
