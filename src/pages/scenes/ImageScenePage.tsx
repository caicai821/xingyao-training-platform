import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileImage,
  Image as ImageIcon,
  Save,
  Send,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { useAppData } from '@/context/AppDataContext'
import { useToast } from '@/context/ToastContext'
import { errorMessage } from '@/hooks/useAsyncAction'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Button,
  Card,
  Field,
  Input,
  SectionCard,
  Select,
  TagInput,
  Textarea,
} from '@/components/ui'
import { Alert, Badge, ProgressBar } from '@/components/ui/feedback'
import {
  COMPLEXITY_OPTIONS,
  SCENE_TYPES,
  SENSORY_OPTIONS,
} from '@/lib/constants'
import { cn, formatFileSize } from '@/lib/utils'
import type { ImageReference, SceneComplexity, SceneGenerationInput } from '@/types'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024

interface ImageSceneForm {
  sceneName: string
  scenePurpose: string
  theme: string
  prompt: string
  learnerId: string
  trainingGoalId: string
  scriptId: string
  sceneType: string
  complexity: SceneComplexity
  sensoryPrefs: string[]
  keyElements: string[]
  avoidElements: string[]
  characters: string
}

export default function ImageScenePage() {
  const navigate = useNavigate()
  const { learners, goals, scripts, services, refreshAll } = useAppData()
  const { toast } = useToast()

  const [form, setForm] = useState<ImageSceneForm>({
    sceneName: '',
    scenePurpose: '',
    theme: '',
    prompt: '',
    learnerId: '',
    trainingGoalId: '',
    scriptId: '',
    sceneType: '安静休息区',
    complexity: '简洁',
    sensoryPrefs: ['柔和自然光', '安静无噪音'],
    keyElements: [],
    avoidElements: [],
    characters: '',
  })
  const [image, setImage] = useState<ImageReference | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<'draft' | 'submit' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const learnerGoals = useMemo(
    () => goals.filter((goal) => goal.learnerId === form.learnerId),
    [form.learnerId, goals],
  )
  const learnerScripts = useMemo(
    () => scripts.filter((script) => script.learnerId === form.learnerId),
    [form.learnerId, scripts],
  )
  const learner = learners.find((item) => item.id === form.learnerId)
  const goal = goals.find((item) => item.id === form.trainingGoalId)

  const update = <K extends keyof ImageSceneForm>(key: K, value: ImageSceneForm[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    if (errors[key as string]) setErrors((previous) => ({ ...previous, [key]: '' }))
  }

  const handleFile = async (file: File) => {
    setUploadError(null)
    if (!ACCEPTED.includes(file.type)) {
      setUploadError('仅支持 JPG、PNG 或 WebP 格式的图片')
      return
    }
    if (file.size > MAX_SIZE) {
      setUploadError('图片大小不能超过 2 MB，请先压缩后再上传')
      return
    }
    setUploading(true)
    setUploadProgress(0)
    try {
      const reference = await services.uploads.uploadImage(file, (progress) =>
        setUploadProgress(progress),
      )
      setImage(reference)
      toast({ title: '图片上传完成', description: reference.name })
    } catch (cause) {
      setUploadError(errorMessage(cause, '图片上传失败，请重新选择'))
      toast({ tone: 'error', title: '图片上传失败', description: errorMessage(cause) })
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setImage(null)
    setUploadProgress(0)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = (forSubmit: boolean) => {
    const nextErrors: Record<string, string> = {}
    if (!form.sceneName.trim()) nextErrors.sceneName = '请填写场景名称'
    if (forSubmit && !image) nextErrors.image = '请先上传一张参考图片'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      toast({ tone: 'error', title: '请检查场景信息' })
      return false
    }
    return true
  }

  const saveTask = async (submit: boolean) => {
    if (uploading) {
      toast({ tone: 'error', title: '图片仍在上传中', description: '请等待上传完成后再提交。' })
      return
    }
    if (!validate(submit)) return
    setBusy(submit ? 'submit' : 'draft')
    try {
      const payload: SceneGenerationInput = {
        sourceType: 'image',
        sceneName: form.sceneName.trim(),
        scenePurpose: form.scenePurpose.trim(),
        prompt: form.prompt.trim(),
        learnerId: form.learnerId || undefined,
        trainingGoalId: form.trainingGoalId || undefined,
        scriptId: form.scriptId || undefined,
        imageReferences: image ? [image] : [],
        sceneConfig: {
          theme: form.theme.trim() || undefined,
          sceneType: form.sceneType,
          complexity: form.complexity,
          visualStyle: ['自然柔和'],
          sensoryPrefs: form.sensoryPrefs,
          keyElements: form.keyElements,
          avoidElements: form.avoidElements,
          characters: form.characters,
        },
      }
      const task = await services.tasks.create(payload, { submit })
      await refreshAll(true)
      toast({
        title: submit ? '图像场景任务已提交' : '场景草稿已保存',
        description: submit ? '图像解析与场景构建由外部服务完成。' : '可在任务详情中补充图片后提交。',
      })
      navigate(`/scenes/tasks/${task.id}`)
    } catch (cause) {
      toast({ tone: 'error', title: '提交失败', description: errorMessage(cause) })
    } finally {
      setBusy(null)
    }
  }

  const changeLearner = (learnerId: string) => {
    setForm((previous) => ({
      ...previous,
      learnerId,
      trainingGoalId: '',
      scriptId: '',
    }))
  }

  const changeScript = (scriptId: string) => {
    const target = scripts.find((item) => item.id === scriptId)
    if (!target) {
      update('scriptId', '')
      return
    }
    setForm((previous) => ({
      ...previous,
      scriptId,
      learnerId: target.learnerId,
      trainingGoalId: target.goalId,
      scenePurpose: previous.scenePurpose || target.sceneConfig.theme,
      sceneType: target.sceneConfig.sceneType,
      complexity: target.sceneConfig.complexity,
      sensoryPrefs: target.sceneConfig.environmentPrefs,
      keyElements: target.environmentElements.slice(0, 6),
      avoidElements: target.sceneConfig.avoidElements,
    }))
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="通过上传图像创建场景"
        description="上传一张参考图片，并补充场景用途与配置。图片解析及场景构建由外部服务负责，当前页面完成上传、引用管理与任务提交。"
        breadcrumbs={[
          { label: '3D 场景生成', to: '/scenes' },
          { label: '图像上传创建' },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              icon={<Save />}
              onClick={() => saveTask(false)}
              loading={busy === 'draft'}
              disabled={busy === 'submit' || uploading}
            >
              保存草稿
            </Button>
            <Button
              icon={<Send />}
              onClick={() => saveTask(true)}
              loading={busy === 'submit'}
              disabled={busy === 'draft' || uploading}
            >
              提交生成
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <SectionCard
            title="参考图片"
            description="支持 JPG、PNG、WebP 格式，单张大小不超过 2 MB。"
            icon={<FileImage />}
            actions={<Badge tone={image ? 'success' : 'neutral'}>{image ? '已上传' : '待上传'}</Badge>}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED.join(',')}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleFile(file)
                event.target.value = ''
              }}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if ((event.key === 'Enter' || event.key === ' ') && !uploading) {
                  event.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDragOver={(event) => {
                event.preventDefault()
                if (!uploading) setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragActive(false)
                if (uploading) return
                const file = event.dataTransfer.files?.[0]
                if (file) void handleFile(file)
              }}
              className={cn(
                'relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed px-6 text-center transition',
                dragActive
                  ? 'border-brand-400 bg-brand-50/60'
                  : errors.image
                    ? 'border-danger-300 bg-danger-50/30'
                    : 'border-line-strong bg-ink-50/40 hover:border-brand-300 hover:bg-brand-50/30',
              )}
            >
              {image?.previewUrl ? (
                <>
                  <img
                    src={image.previewUrl}
                    alt="上传的参考图片预览"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-white/90 px-3 py-2 backdrop-blur">
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-medium text-ink-700">
                        {image.name}
                      </span>
                      <span className="block text-[10px] text-ink-400">
                        {formatFileSize(image.size)} · {image.type.replace('image/', '').toUpperCase()}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation()
                          fileInputRef.current?.click()
                        }}
                      >
                        更换
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Trash2 />}
                        onClick={(event) => {
                          event.stopPropagation()
                          removeImage()
                        }}
                      >
                        删除
                      </Button>
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-sm">
                    <UploadCloud className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-ink-700">点击选择文件或拖拽图片到此处</p>
                  <p className="mt-1 text-xs text-ink-400">JPG / PNG / WebP · 最大 2 MB</p>
                  <p className="mt-3 text-[10px] text-ink-300">
                    图片仅用于本次场景生成请求，不会在演示数据中写入真实文件内容。
                  </p>
                </>
              )}
              {uploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm">
                  <p className="text-xs font-medium text-ink-700">正在上传图片…</p>
                  <ProgressBar value={uploadProgress} className="mt-3 max-w-[220px]" />
                  <p className="tnum mt-1.5 text-[10px] text-ink-400">{uploadProgress}%</p>
                </div>
              )}
            </div>
            {errors.image && <p className="mt-2 text-xs text-danger-500">{errors.image}</p>}
            {uploadError && <p className="mt-2 text-xs text-danger-500">{uploadError}</p>}
            <p className="mt-3 text-[11px] leading-5 text-ink-400">
              图像内容解析、场景构建与结果生成由外部服务负责；当前仅实现前端格式与大小校验、上传状态及引用管理。
            </p>
          </SectionCard>

          <SectionCard title="场景补充信息" description="补充有助于理解图片用途与场景重点的信息。">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="场景名称" required error={errors.sceneName}>
                  <Input
                    value={form.sceneName}
                    onChange={(event) => update('sceneName', event.target.value)}
                    placeholder="例如：安静休息区参考场景"
                    maxLength={40}
                  />
                </Field>
                <Field label="场景用途">
                  <Input
                    value={form.scenePurpose}
                    onChange={(event) => update('scenePurpose', event.target.value)}
                    placeholder="例如：环境适应练习"
                    maxLength={40}
                  />
                </Field>
              </div>
              <Field label="补充文字描述" hint="描述图片中希望保留的空间关系、关键对象与需要调整的部分。">
                <Textarea
                  value={form.prompt}
                  onChange={(event) => update('prompt', event.target.value)}
                  placeholder="例如：参考上传图片的空间布局，生成一个安静、光线柔和的休息区。"
                  maxLength={1000}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="场景类型">
                  <Select
                    value={form.sceneType}
                    onChange={(event) => update('sceneType', event.target.value)}
                  >
                    {SCENE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="环境复杂程度">
                  <div className="flex gap-2">
                    {COMPLEXITY_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => update('complexity', option as SceneComplexity)}
                        className={cn(
                          'flex-1 rounded-lg border px-2 py-2 text-xs transition',
                          form.complexity === option
                            ? 'border-brand-300 bg-brand-50 font-medium text-brand-700'
                            : 'border-line text-ink-500 hover:border-brand-200',
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="感官与环境偏好">
                <TagInput
                  value={form.sensoryPrefs}
                  onChange={(value) => update('sensoryPrefs', value)}
                  placeholder="例如：柔和自然光、安静无噪音"
                  suggestions={SENSORY_OPTIONS}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="关键环境元素">
                  <TagInput
                    value={form.keyElements}
                    onChange={(value) => update('keyElements', value)}
                    placeholder="例如：柔软座椅、绿植"
                  />
                </Field>
                <Field label="需要避免的环境元素">
                  <TagInput
                    value={form.avoidElements}
                    onChange={(value) => update('avoidElements', value)}
                    placeholder="例如：强光、拥挤的人群"
                  />
                </Field>
              </div>
              <Field label="场景角色需求">
                <Textarea
                  value={form.characters}
                  onChange={(event) => update('characters', event.target.value)}
                  placeholder="例如：无角色，保持空间安静；或一名教师角色位于侧前方。"
                  className="min-h-[76px]"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="关联信息" description="将生成任务与学员训练记录关联，全部为可选项。">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="关联学员">
                <Select value={form.learnerId} onChange={(event) => changeLearner(event.target.value)}>
                  <option value="">不关联学员</option>
                  {learners.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}（{item.code}）
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="关联训练目标">
                <Select
                  value={form.trainingGoalId}
                  onChange={(event) => update('trainingGoalId', event.target.value)}
                  disabled={!form.learnerId}
                >
                  <option value="">不关联训练目标</option>
                  {learnerGoals.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="关联训练脚本（可选）" className="sm:col-span-2">
                <Select
                  value={form.scriptId}
                  onChange={(event) => changeScript(event.target.value)}
                  disabled={!form.learnerId}
                >
                  <option value="">不关联训练脚本</option>
                  {learnerScripts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}（v{item.version}）
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </SectionCard>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-ink-400">
              {image ? '图片已上传，可提交生成任务。' : '提交生成前需要先上传一张参考图片。'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                icon={<Save />}
                onClick={() => saveTask(false)}
                loading={busy === 'draft'}
                disabled={busy === 'submit' || uploading}
              >
                保存草稿
              </Button>
              <Button
                icon={<Send />}
                onClick={() => saveTask(true)}
                loading={busy === 'submit'}
                disabled={busy === 'draft' || uploading}
              >
                提交生成
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-xs font-medium text-ink-700">上传预览</p>
              <Badge tone={image ? 'success' : 'neutral'}>
                {image ? '已就绪' : '待上传'}
              </Badge>
            </div>
            {image?.previewUrl ? (
              <img
                src={image.previewUrl}
                alt="参考图片"
                className="aspect-[4/3] w-full bg-ink-50 object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center bg-ink-50/60 text-center">
                <ImageIcon className="size-8 text-ink-300" />
                <p className="mt-2 text-xs text-ink-400">尚未上传参考图片</p>
                <p className="mt-1 text-[10px] text-ink-300">支持 JPG / PNG / WebP，最大 2 MB</p>
              </div>
            )}
            <div className="space-y-2 p-4 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">关联学员</span>
                <span className="text-ink-700">{learner?.name ?? '未关联'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">训练目标</span>
                <span className="max-w-[170px] truncate text-right text-ink-700">
                  {goal?.title ?? '未关联'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">场景类型</span>
                <span className="text-ink-700">{form.sceneType}</span>
              </div>
            </div>
            <p className="border-t border-line bg-ink-50/50 px-4 py-2.5 text-[10px] leading-5 text-ink-400">
              上传预览仅显示所选图片，生成结果需等待外部服务解析后返回。
            </p>
          </Card>

          <Alert
            tone="info"
            title="图像上传说明"
            description="上传前会校验文件格式与大小。上传完成后，系统保存文件引用并将该引用提交给场景生成服务，不会把图片内容嵌入普通 JSON 请求。"
          />

          <Alert
            tone="warning"
            title="隐私提示"
            description="请勿上传包含真实身份信息或敏感内容的照片。原型中的图片与任务均为演示数据。"
          />
        </div>
      </div>
    </div>
  )
}
