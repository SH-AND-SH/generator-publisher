'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Database } from '@/types/database'

type PlatformEnum = Database['public']['Enums']['platform']

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function analyzeVisualDNA(
  formData: FormData
): Promise<{ result?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const files = formData.getAll('files') as File[]
  if (files.length === 0) return { error: 'Нет файлов для анализа' }

  const imageContents: Anthropic.ImageBlockParam[] = []
  for (const file of files) {
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mediaType = (file.type || 'image/jpeg') as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'
    imageContents.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: base64 },
    })
  }

  try {
    const anthropic = getAnthropic()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: `Ты дизайн-аналитик. Изучи эти скриншоты приложения и опиши визуальный стиль бренда.

Напиши 2–3 абзаца связного текста без заголовков и списков. Охвати:
цветовую палитру и акценты, типографику и стиль текста, стиль иконок и иллюстраций,
структуру экранов и использование пространства, общее визуальное впечатление и характер.

Этот текст будет использоваться AI-агентом как визуальный ориентир при создании контента.
Пиши конкретно — не "современный дизайн", а что именно это означает визуально.`,
          },
        ],
      }],
    })
    const content = message.content[0]
    if (content.type !== 'text') return { error: 'Неожиданный ответ от AI' }
    return { result: content.text }
  } catch (e) {
    console.error('[analyzeVisualDNA]', e)
    return { error: 'Ошибка AI-анализа. Проверьте ANTHROPIC_API_KEY.' }
  }
}

export async function generateBrandVoice(context: {
  name: string
  appName: string
  description: string
  ageRange: string
  gender: string
  interests: string
  positioning: string
  uniqueValue: string
}): Promise<{ result?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const prompt = `Ты эксперт по бренд-стратегии. Создай описание Brand Voice — 3 абзаца связного текста.

Этот текст используется AI-агентом как ориентир при создании контента.
Он должен чётко передавать характер бренда.

Раскрой: как звучит бренд и какой у него характер, какие ценности стоят за каждым словом,
какую эмоцию чувствует читатель, какие слова/темы бренд использует и каких избегает,
как бренд относится к своей аудитории.

Без заголовков, без списков, без формальностей — только живой текст.

Информация:
Проект: ${context.name}
Продукт: ${context.appName}
Описание: ${context.description}
Аудитория: ${context.ageRange}, пол: ${context.gender}, интересы: ${context.interests}
Позиционирование: ${context.positioning}
УТП: ${context.uniqueValue}`

  try {
    const anthropic = getAnthropic()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const content = message.content[0]
    if (content.type !== 'text') return { error: 'Неожиданный ответ от AI' }
    return { result: content.text }
  } catch (e) {
    console.error('[generateBrandVoice]', e)
    return { error: 'Ошибка AI-генерации. Проверьте ANTHROPIC_API_KEY.' }
  }
}

interface CreateProjectPayload {
  workspaceId: string
  name: string
  appName: string
  description: string
  ageFrom: string
  ageTo: string
  gender: string
  interests: string
  positioning: string
  uniqueValue: string
  visualDNA: string
  brandVoice: string
  selectedPlatforms: PlatformEnum[]
  competitors: string
}

export async function createProject(payload: CreateProjectPayload) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { name, appName, description, ageFrom, ageTo, gender, interests,
    positioning, uniqueValue, visualDNA, brandVoice, selectedPlatforms, competitors } = payload

  if (!name?.trim()) return { error: 'Название проекта обязательно' }

  const audience = `${ageFrom}–${ageTo} лет, пол: ${gender}, интересы: ${interests}`
  const fullDescription = appName.trim()
    ? `Название продукта: ${appName.trim()}\n\n${description.trim()}`
    : description.trim()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('projects')
    .insert({
      workspace_id: payload.workspaceId,
      name: name.trim(),
      description: fullDescription || name.trim(),
      category: 'Other',
      audience_summary: audience.slice(0, 200),
      positioning_summary: positioning.slice(0, 200),
      tone_summary: brandVoice.slice(0, 200),
      visual_direction_notes: visualDNA.slice(0, 200),
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createProject] insert error:', error.code, error.message)
    return { error: error.message }
  }

  // Trigger init_project_context auto-creates project_profiles — UPDATE, not INSERT
  const competitorList = competitors
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  const { error: profileError } = await admin
    .from('project_profiles')
    .update({
      audience,
      positioning,
      tone_of_voice: brandVoice,
      visual_guidelines: visualDNA,
      active_platforms: selectedPlatforms,
      competitor_list: competitorList,
      messaging_rules: uniqueValue,
    })
    .eq('project_id', data.id)

  if (profileError) {
    console.error('[createProject] profile update error:', profileError.code, profileError.message)
  }

  revalidatePath('/dashboard')
  redirect(`/project/${data.id}`)
}
