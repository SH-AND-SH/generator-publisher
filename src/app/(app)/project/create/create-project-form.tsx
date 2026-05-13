'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createProject, analyzeVisualDNA, generateBrandVoice } from '@/lib/actions/project'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Upload, X, CheckCircle2, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SOCIAL_PLATFORMS } from '@/lib/constants'
import type { Database } from '@/types/database'

type PlatformEnum = Database['public']['Enums']['platform']

interface Workspace {
  id: string
  name: string
}

const AGE_OPTIONS = ['13', '18', '25', '35', '45', '55', '65', '80+']

const STEP_LABELS = ['Основы', 'Аудитория', 'Каналы']

export function CreateProjectForm({ workspaces }: { workspaces: Workspace[] }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [generatingVoice, setGeneratingVoice] = useState(false)

  // Step 1
  const [workspaceId] = useState(workspaces[0]?.id ?? '')
  const [name, setName] = useState('')
  const [appName, setAppName] = useState('')
  const [description, setDescription] = useState('')

  // Step 2
  const [ageFrom, setAgeFrom] = useState('18')
  const [ageTo, setAgeTo] = useState('35')
  const [genderM, setGenderM] = useState(true)
  const [genderF, setGenderF] = useState(true)
  const [interests, setInterests] = useState('')
  const [positioning, setPositioning] = useState('')
  const [uniqueValue, setUniqueValue] = useState('')

  // Step 3
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [visualDNA, setVisualDNA] = useState('')
  const [brandVoice, setBrandVoice] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformEnum[]>([])
  const [competitors, setCompetitors] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const genderLabel = [genderM && 'М', genderF && 'Ж'].filter(Boolean).join(', ') || 'не указан'

  function togglePlatform(id: PlatformEnum) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setUploadedFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  function removeFile(index: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleAnalyzeVisualDNA() {
    if (uploadedFiles.length === 0) return
    setAnalyzing(true)
    try {
      const formData = new FormData()
      uploadedFiles.forEach((f) => formData.append('files', f))
      const result = await analyzeVisualDNA(formData)
      if (result.error) toast.error(result.error)
      else setVisualDNA(result.result ?? '')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleGenerateBrandVoice() {
    setGeneratingVoice(true)
    try {
      const result = await generateBrandVoice({
        name,
        appName,
        description,
        ageRange: `${ageFrom}–${ageTo} лет`,
        gender: genderLabel,
        interests,
        positioning,
        uniqueValue,
      })
      if (result.error) toast.error(result.error)
      else setBrandVoice(result.result ?? '')
    } finally {
      setGeneratingVoice(false)
    }
  }

  async function handleSubmit() {
    if (!visualDNA.trim() || !brandVoice.trim()) {
      toast.error('Заполните Visual DNA и Brand Voice')
      return
    }
    setLoading(true)
    try {
      const result = await createProject({
        workspaceId,
        name,
        appName,
        description,
        ageFrom,
        ageTo,
        gender: genderLabel,
        interests,
        positioning,
        uniqueValue,
        visualDNA,
        brandVoice,
        selectedPlatforms,
        competitors,
      })
      if (result?.error) {
        toast.error(result.error)
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  const canGoNext = step === 0
    ? name.trim().length > 0
    : step === 1
    ? positioning.trim().length > 0
    : false

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Новый проект</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Настройте проект чтобы AI создавал контент в вашем стиле
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
              i < step ? 'bg-primary text-primary-foreground' :
              i === step ? 'bg-primary text-primary-foreground' :
              'bg-muted text-muted-foreground'
            )}>
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn(
              'text-sm',
              i === step ? 'font-medium' : 'text-muted-foreground'
            )}>{label}</span>
            {i < STEP_LABELS.length - 1 && (
              <div className={cn('h-px w-8 bg-border', i < step && 'bg-primary')} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Основы */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название проекта *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Мой проект"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="appName">Название приложения / продукта</Label>
            <Input
              id="appName"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="App Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание проекта</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Кратко опишите продукт и контент который вы создаёте…"
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Step 2 — Аудитория */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Age range */}
          <div className="space-y-2">
            <Label>Возраст аудитории</Label>
            <div className="flex items-center gap-3">
              <Select value={ageFrom} onValueChange={(v) => setAgeFrom(v ?? '18')}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGE_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-sm">—</span>
              <Select value={ageTo} onValueChange={(v) => setAgeTo(v ?? '35')}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGE_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">лет</span>
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label>Пол</Label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={genderM}
                  onChange={(e) => setGenderM(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">М</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={genderF}
                  onChange={(e) => setGenderF(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">Ж</span>
              </label>
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <Label htmlFor="interests">Увлечения / интересы</Label>
            <Input
              id="interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="технологии, путешествия, фитнес…"
            />
          </div>

          {/* Positioning */}
          <div className="space-y-2">
            <Label htmlFor="positioning">Позиционирование *</Label>
            <Textarea
              id="positioning"
              value={positioning}
              onChange={(e) => setPositioning(e.target.value)}
              placeholder="Как вы позиционируете продукт на рынке? Чем отличаетесь от конкурентов?"
              rows={3}
            />
          </div>

          {/* Unique value */}
          <div className="space-y-2">
            <Label htmlFor="uniqueValue">Уникальное ценностное предложение (УТП)</Label>
            <Textarea
              id="uniqueValue"
              value={uniqueValue}
              onChange={(e) => setUniqueValue(e.target.value)}
              placeholder="Главная ценность которую вы даёте пользователям…"
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Step 3 — Каналы */}
      {step === 2 && (
        <div className="space-y-6">
          {/* A. Visual DNA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Visual DNA</Label>
              {uploadedFiles.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyzeVisualDNA}
                  disabled={analyzing}
                  className="h-7 text-xs"
                >
                  {analyzing
                    ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Анализируем…</>
                    : <><Wand2 className="mr-1.5 h-3 w-3" />Анализировать визуальный стиль</>
                  }
                </Button>
              )}
            </div>

            {/* Drop zone */}
            <div
              className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-4 cursor-pointer hover:border-muted-foreground/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2 py-2">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Загрузите скриншоты приложения<br />
                  <span className="text-xs">PNG, JPG — можно несколько</span>
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Image previews */}
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="relative rounded overflow-hidden border aspect-video bg-muted">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5 hover:bg-background"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Textarea
              value={visualDNA}
              onChange={(e) => setVisualDNA(e.target.value)}
              placeholder="Визуальный стиль будет описан автоматически после анализа, или введите вручную…"
              rows={6}
            />
          </div>

          {/* B. Brand Voice */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Brand Voice</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateBrandVoice}
                disabled={generatingVoice}
                className="h-7 text-xs text-primary hover:text-primary"
              >
                {generatingVoice
                  ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Генерируем…</>
                  : <><Wand2 className="mr-1.5 h-3 w-3" />Создать</>
                }
              </Button>
            </div>
            <Textarea
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              placeholder="Голос бренда будет сгенерирован автоматически, или введите вручную…"
              rows={8}
            />
          </div>

          {/* C. Platforms */}
          <div className="space-y-3">
            <Label>Платформы</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SOCIAL_PLATFORMS.map((platform) => {
                const active = selectedPlatforms.includes(platform.id)
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      'flex items-center justify-between rounded-md border px-3 py-2.5 text-sm transition-colors text-left',
                      active
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border text-muted-foreground hover:border-muted-foreground'
                    )}
                  >
                    <span className="font-medium">{platform.name}</span>
                    {active && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
            {selectedPlatforms.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedPlatforms.map((id) => (
                  <Badge key={id} variant="secondary" className="text-xs">
                    {SOCIAL_PLATFORMS.find((p) => p.id === id)?.name ?? id}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* D. Competitors */}
          <div className="space-y-2">
            <Label htmlFor="competitors">Конкуренты</Label>
            <Textarea
              id="competitors"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="Введите URL конкурентов, по одному на строку&#10;https://competitor1.com&#10;https://competitor2.com"
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={step === 0 ? () => router.back() : () => setStep((s) => s - 1)}
          disabled={loading}
        >
          {step === 0 ? 'Отмена' : 'Назад'}
        </Button>

        {step < 2 ? (
          <Button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canGoNext}
          >
            Далее
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !visualDNA.trim() || !brandVoice.trim()}
          >
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Создаём…</>
              : 'Создать проект'
            }
          </Button>
        )}
      </div>
    </div>
  )
}
