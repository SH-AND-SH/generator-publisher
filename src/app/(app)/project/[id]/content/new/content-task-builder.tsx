'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, ChevronLeft, CheckCircle2, Zap, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SOCIAL_PLATFORMS } from '@/lib/constants'
import { generateContentIdeas, generateDraftContent } from '@/lib/actions/content'
import type { ContentIdea } from '@/lib/actions/content'

const GOALS = [
  { id: 'reach', label: 'Охват' },
  { id: 'engagement', label: 'Вовлечённость' },
  { id: 'traffic', label: 'Трафик' },
  { id: 'sales', label: 'Продажи' },
]

const QUICK_PROMPTS = [
  'Покажи как продукт решает главную проблему пользователя',
  'История успеха клиента или кейс',
  'Закулисье — как устроена работа изнутри',
  'Полезный совет или лайфхак по теме',
  'Ответ на частый вопрос аудитории',
  'Анонс новой функции или обновления',
  'Сравнение: до и после использования продукта',
  'Провокационный вопрос для обсуждения',
]

interface Props {
  projectId: string
  projectName: string
}

export function ContentTaskBuilder({ projectId, projectName }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'guided' | 'ai'>('guided')

  // Guided mode state
  const [guidedPlatform, setGuidedPlatform] = useState('')
  const [guidedGoal, setGuidedGoal] = useState('')
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null)
  const [loadingIdeas, setLoadingIdeas] = useState(false)

  // AI mode state
  const [aiPlatform, setAiPlatform] = useState('')
  const [aiContext, setAiContext] = useState('')

  const [generating, setGenerating] = useState(false)

  async function handleGenerateIdeas() {
    if (!guidedPlatform || !guidedGoal) return
    setLoadingIdeas(true)
    setIdeas([])
    setSelectedIdea(null)
    try {
      const result = await generateContentIdeas({
        projectId,
        platform: guidedPlatform,
        goal: GOALS.find((g) => g.id === guidedGoal)?.label ?? guidedGoal,
      })
      if (result.error) toast.error(result.error)
      else setIdeas(result.ideas ?? [])
    } finally {
      setLoadingIdeas(false)
    }
  }

  async function handleGuidedGenerate() {
    if (!selectedIdea) return
    setGenerating(true)
    try {
      const result = await generateDraftContent({
        projectId,
        platform: guidedPlatform,
        ideaPrompt: selectedIdea.prompt,
        postIdea: selectedIdea.title,
      })
      if (result.error) { toast.error(result.error); return }
      router.push(`/project/${projectId}/content/${result.draftVariantId}/edit`)
    } finally {
      setGenerating(false)
    }
  }

  async function handleAiGenerate(prompt?: string) {
    if (!aiPlatform) { toast.error('Выберите платформу'); return }
    setGenerating(true)
    try {
      const result = await generateDraftContent({
        projectId,
        platform: aiPlatform,
        ideaPrompt: prompt ?? aiContext,
        userMessage: prompt ? aiContext : undefined,
        postIdea: 'AI-generated',
      })
      if (result.error) { toast.error(result.error); return }
      router.push(`/project/${projectId}/content/${result.draftVariantId}`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/project/${projectId}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Создать контент</h1>
          <p className="text-sm text-muted-foreground">{projectName}</p>
        </div>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Guided mode */}
        <Card
          className={cn(
            'cursor-pointer transition-all',
            mode === 'guided' ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-80'
          )}
          onClick={() => setMode('guided')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Пошаговое создание
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Выберите платформу, цель и идею — AI создаст контент под ваш запрос
            </p>
          </CardContent>
        </Card>

        {/* AI mode */}
        <Card
          className={cn(
            'cursor-pointer transition-all',
            mode === 'ai' ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-80'
          )}
          onClick={() => setMode('ai')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              AI Генератор
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Опишите что нужно — AI сгенерирует пост и изображение сразу
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Guided mode content */}
      {mode === 'guided' && (
        <div className="space-y-6">
          {/* Step 1: Platform */}
          <div className="space-y-3">
            <p className="text-sm font-medium">1. Платформа</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SOCIAL_PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setGuidedPlatform(p.id); setIdeas([]); setSelectedIdea(null) }}
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm text-left transition-colors',
                    guidedPlatform === p.id
                      ? 'border-primary bg-primary/5 font-medium'
                      : 'border-border text-muted-foreground hover:border-muted-foreground'
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Goal */}
          {guidedPlatform && (
            <div className="space-y-3">
              <p className="text-sm font-medium">2. Цель публикации</p>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => { setGuidedGoal(g.id); setIdeas([]); setSelectedIdea(null) }}
                    className={cn(
                      'rounded-full border px-4 py-1.5 text-sm transition-colors',
                      guidedGoal === g.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:border-muted-foreground'
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Ideas */}
          {guidedPlatform && guidedGoal && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">3. Идея публикации</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateIdeas}
                  disabled={loadingIdeas}
                  className="h-7 text-xs"
                >
                  {loadingIdeas
                    ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Генерируем…</>
                    : 'Сгенерировать 3 идеи'
                  }
                </Button>
              </div>

              {ideas.length > 0 && (
                <div className="space-y-2">
                  {ideas.map((idea, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedIdea(idea)}
                      className={cn(
                        'rounded-lg border p-3 cursor-pointer transition-all',
                        selectedIdea === idea
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{idea.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{idea.description}</p>
                        </div>
                        {selectedIdea === idea && (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {ideas.length === 0 && !loadingIdeas && (
                <p className="text-xs text-muted-foreground py-2">
                  Нажмите "Сгенерировать 3 идеи" чтобы получить варианты
                </p>
              )}
            </div>
          )}

          {/* Step 4: Generate */}
          {selectedIdea && (
            <div className="pt-2">
              <Button
                onClick={handleGuidedGenerate}
                disabled={generating}
                className="w-full sm:w-auto"
              >
                {generating
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Создаём контент…</>
                  : 'Создать контент'
                }
              </Button>
            </div>
          )}
        </div>
      )}

      {/* AI mode content */}
      {mode === 'ai' && (
        <div className="space-y-6">
          {/* Platform */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Платформа</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SOCIAL_PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setAiPlatform(p.id)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm text-left transition-colors',
                    aiPlatform === p.id
                      ? 'border-primary bg-primary/5 font-medium'
                      : 'border-border text-muted-foreground hover:border-muted-foreground'
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Context */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Дополнительная информация (необязательно)</p>
            <Textarea
              value={aiContext}
              onChange={(e) => setAiContext(e.target.value)}
              placeholder="Опишите что именно хотите в этом посте…"
              rows={3}
            />
          </div>

          {/* Quick prompts */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Быстрые промпты</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAiGenerate(prompt)}
                  disabled={generating || !aiPlatform}
                  className="rounded-md border border-border px-3 py-2 text-xs text-left text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>
            {!aiPlatform && (
              <p className="text-xs text-muted-foreground">Сначала выберите платформу</p>
            )}
          </div>

          {/* Generate button */}
          <Button
            onClick={() => handleAiGenerate()}
            disabled={generating || !aiPlatform}
            className="w-full sm:w-auto"
          >
            {generating
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Создаём контент…</>
              : 'Создать контент'
            }
          </Button>
        </div>
      )}
    </div>
  )
}
