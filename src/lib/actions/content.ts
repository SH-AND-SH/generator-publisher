'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import type { Database } from '@/types/database'

type PlatformEnum = Database['public']['Enums']['platform']

export interface ContentIdea {
  title: string
  description: string
  prompt: string
}

export interface VisualIdea {
  title: string
  description: string
  dallePrompt: string
}

interface ProjectCtx {
  projectName: string
  projectDescription: string
  audience: string
  positioning: string
  messagingRules: string
  toneOfVoice: string
  visualGuidelines: string
}

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

async function loadProjectCtx(
  projectId: string,
  admin: ReturnType<typeof createAdminClient>
): Promise<ProjectCtx | null> {
  const [{ data: project }, { data: profile }] = await Promise.all([
    admin.from('projects').select('name, description').eq('id', projectId).single(),
    admin.from('project_profiles')
      .select('audience, positioning, messaging_rules, tone_of_voice, visual_guidelines')
      .eq('project_id', projectId).single(),
  ])
  if (!project) return null
  return {
    projectName: project.name,
    projectDescription: project.description,
    audience: profile?.audience ?? '',
    positioning: profile?.positioning ?? '',
    messagingRules: profile?.messaging_rules ?? '',
    toneOfVoice: profile?.tone_of_voice ?? '',
    visualGuidelines: profile?.visual_guidelines ?? '',
  }
}

function buildPlatformPrompt(platform: string, ctx: ProjectCtx, userRequest?: string): string {
  const templates: Record<string, string> = {
    instagram: `Ты эксперт по контент-маркетингу для Instagram. Создай публикацию для проекта "[НАЗВАНИЕ ПРОЕКТА]".

КОНТЕКСТ ПРОЕКТА:
[ОПИСАНИЕ ПРОЕКТА]

АУДИТОРИЯ:
[АУДИТОРИЯ]

ПОЗИЦИОНИРОВАНИЕ:
[ПОЗИЦИОНИРОВАНИЕ]

УТП:
[УТП]

ГОЛОС И ТОН БРЕНДА:
[BRAND VOICE]

ЗАПРОС:
[ЗАПРОС ЮЗЕРА]

ТРЕБОВАНИЯ К ПУБЛИКАЦИИ:
— Объём: 100–300 слов
— Первые 1–2 строки останавливают скроллинг, провоцируют нажать "ещё"
— Структура: захватывающий хук → основная ценность → призыв к действию
— CTA в конце: вопрос аудитории, призыв сохранить или поделиться
— 3–7 тематических хэштегов через новую строку
— Эмодзи как разделители — умеренно
— Без клише: "в мире XXI века", "революционный", "уникальный"
— Язык прямой, конкретный, без воды

Верни только текст публикации, без пояснений.`,

    facebook: `Ты эксперт по контент-маркетингу для Facebook. Создай публикацию для проекта "[НАЗВАНИЕ ПРОЕКТА]".

КОНТЕКСТ ПРОЕКТА:
[ОПИСАНИЕ ПРОЕКТА]

АУДИТОРИЯ:
[АУДИТОРИЯ]

ПОЗИЦИОНИРОВАНИЕ:
[ПОЗИЦИОНИРОВАНИЕ]

УТП:
[УТП]

ГОЛОС И ТОН БРЕНДА:
[BRAND VOICE]

ЗАПРОС:
[ЗАПРОС ЮЗЕРА]

ТРЕБОВАНИЯ К ПУБЛИКАЦИИ:
— Объём: 150–400 слов
— Формат: история или личный опыт, прямое обращение к читателю
— Структура: ситуация/проблема → поворот → вывод/решение → CTA
— CTA: вопрос ("Как вы решаете это?"), реакция, репост, ссылка
— Эмодзи: 3–5 максимум, только для акцента
— 2–4 хэштега, только если органично
— Тон: человечный, как пост от реального человека, не рекламный
— Без штампов: "подписывайтесь", "ставьте лайки"

Верни только текст публикации, без пояснений.`,

    linkedin: `Ты эксперт по контент-маркетингу для LinkedIn. Создай профессиональную публикацию для проекта "[НАЗВАНИЕ ПРОЕКТА]".

КОНТЕКСТ ПРОЕКТА:
[ОПИСАНИЕ ПРОЕКТА]

АУДИТОРИЯ:
[АУДИТОРИЯ]

ПОЗИЦИОНИРОВАНИЕ:
[ПОЗИЦИОНИРОВАНИЕ]

УТП:
[УТП]

ГОЛОС И ТОН БРЕНДА:
[BRAND VOICE]

ЗАПРОС:
[ЗАПРОС ЮЗЕРА]

ТРЕБОВАНИЯ К ПУБЛИКАЦИИ:
— Объём: 150–600 слов
— Первое предложение: неожиданное утверждение или вопрос (без приветствий типа "Привет!")
— Структура: инсайт → доказательство/история → урок → CTA
— Короткие абзацы по 2–3 строки для удобства чтения
— Профессиональный авторитетный тон — как от эксперта
— CTA: мнение аудитории, вопрос для дискуссии
— Эмодзи: максимум 3–5, в начале абзаца или для акцента
— 3–5 профессиональных хэштегов в конце
— Конкретные числа и факты приоритетнее общих слов

Верни только текст публикации, без пояснений.`,

    twitter_x: `Ты эксперт по контент-маркетингу для Twitter/X. Создай публикацию для проекта "[НАЗВАНИЕ ПРОЕКТА]".

КОНТЕКСТ ПРОЕКТА:
[ОПИСАНИЕ ПРОЕКТА]

АУДИТОРИЯ:
[АУДИТОРИЯ]

ПОЗИЦИОНИРОВАНИЕ:
[ПОЗИЦИОНИРОВАНИЕ]

УТП:
[УТП]

ГОЛОС И ТОН БРЕНДА:
[BRAND VOICE]

ЗАПРОС:
[ЗАПРОС ЮЗЕРА]

ТРЕБОВАНИЯ К ПУБЛИКАЦИИ:
Выбери один формат:

ВАРИАНТ 1 — Одиночный твит:
— Строго до 280 символов
— Провокационная мысль или острый инсайт
— Финал: вопрос, неожиданный вывод или краткий CTA
— 1–2 хэштега (или ноль, если мешают)

ВАРИАНТ 2 — Тред (5–7 твитов):
— Первый твит: крючок — факт, вопрос, утверждение (до 280 симв)
— Твиты 2–5: раскрытие, одна мысль на твит (до 280 симв каждый)
— Последний: итог + CTA
— Нумерация: 1/, 2/, 3/...
— Разделять строкой "---"

Тон прямой, без корпоративных штампов.

Верни только текст (или тред), без пояснений.`,

    telegram: `Ты эксперт по контент-маркетингу для Telegram. Создай пост для проекта "[НАЗВАНИЕ ПРОЕКТА]".

КОНТЕКСТ ПРОЕКТА:
[ОПИСАНИЕ ПРОЕКТА]

АУДИТОРИЯ:
[АУДИТОРИЯ]

ПОЗИЦИОНИРОВАНИЕ:
[ПОЗИЦИОНИРОВАНИЕ]

УТП:
[УТП]

ГОЛОС И ТОН БРЕНДА:
[BRAND VOICE]

ЗАПРОС:
[ЗАПРОС ЮЗЕРА]

ТРЕБОВАНИЯ К ПУБЛИКАЦИИ:
— Объём: 100–500 слов
— Тон: разговорный, как письмо от умного друга или эксперта которому доверяют
— Структура: зацепка → суть → вывод/действие
— Форматирование Telegram: **жирный** для акцентов, _курсив_ для цитат
— CTA: вопрос, реакция эмодзи, ссылка
— 0–3 хэштега, только если органично
— Живой язык без корпоративного пафоса

Верни только текст поста, без пояснений.`,

    tiktok: `Ты эксперт по контент-маркетингу для TikTok. Создай сценарий видео и подпись для проекта "[НАЗВАНИЕ ПРОЕКТА]".

КОНТЕКСТ ПРОЕКТА:
[ОПИСАНИЕ ПРОЕКТА]

АУДИТОРИЯ:
[АУДИТОРИЯ]

ПОЗИЦИОНИРОВАНИЕ:
[ПОЗИЦИОНИРОВАНИЕ]

УТП:
[УТП]

ГОЛОС И ТОН БРЕНДА:
[BRAND VOICE]

ЗАПРОС:
[ЗАПРОС ЮЗЕРА]

ТРЕБОВАНИЯ К ПУБЛИКАЦИИ:
Создай два блока:

БЛОК 1 — СЦЕНАРИЙ ВИДЕО (15–60 секунд):
— [0–3 сек] Крючок: неожиданный вопрос, факт или утверждение
— [3–15 сек] Обещание: что зритель узнает/получит
— [15–50 сек] Раскрытие: 3–4 конкретных пункта
— [50–60 сек] CTA: что сделать дальше
— Короткие фразы — как говорят, не как пишут
— Визуальная ремарка: что показывать на экране (одна строка на секцию)

БЛОК 2 — ПОДПИСЬ:
— До 150 символов
— Усиливает крючок из видео или задаёт вопрос
— 3–5 хэштегов TikTok + 1–2 нишевых

Тон: энергичный, соответствующий Brand Voice.

Верни оба блока, без лишних пояснений.`,
  }

  const tpl = templates[platform] ?? templates.instagram
  let result = tpl
    .replace('[НАЗВАНИЕ ПРОЕКТА]', ctx.projectName)
    .replace('[ОПИСАНИЕ ПРОЕКТА]', ctx.projectDescription || '')
    .replace('[АУДИТОРИЯ]', ctx.audience || '')
    .replace('[ПОЗИЦИОНИРОВАНИЕ]', ctx.positioning || '')
    .replace('[УТП]', ctx.messagingRules || '')
    .replace('[BRAND VOICE]', ctx.toneOfVoice || '')
    .replace('[ЗАПРОС ЮЗЕРА]', userRequest || '')

  // remove empty-variable blocks
  result = result.replace(/^[A-ZА-Я\/ ]+:\n\s*\n/gm, '')
  return result.replace(/\n{3,}/g, '\n\n').trim()
}

// ─── Phase 3 actions ───────────────────────────────────────────────────────

export async function generateContentIdeas(payload: {
  projectId: string
  platform: string
  goal: string
}): Promise<{ ideas?: ContentIdea[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = createAdminClient()
  const ctx = await loadProjectCtx(payload.projectId, admin)
  if (!ctx) return { error: 'Проект не найден' }

  const prompt = `Ты контент-стратег. Предложи 3 уникальные идеи для публикации.

Платформа: ${payload.platform}
Цель: ${payload.goal}
Проект: ${ctx.projectName}, Продукт: ${ctx.projectDescription.slice(0, 200)}
Аудитория: ${ctx.audience}
Позиционирование: ${ctx.positioning}
Голос бренда: ${ctx.toneOfVoice.slice(0, 300)}

Верни JSON-массив из 3 объектов: [{ "title": "...", "description": "...", "prompt": "..." }]
Только JSON, без markdown-обёртки, без пояснений.`

  try {
    const anthropic = getAnthropic()
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const content = msg.content[0]
    if (content.type !== 'text') return { error: 'Неожиданный ответ от AI' }
    const ideas: ContentIdea[] = JSON.parse(content.text)
    return { ideas }
  } catch (e) {
    console.error('[generateContentIdeas]', e)
    return { error: 'Ошибка генерации идей' }
  }
}

export async function generateDraftContent(payload: {
  projectId: string
  platform: string
  ideaPrompt: string
  postIdea?: string
  userMessage?: string
}): Promise<{ draftVariantId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = createAdminClient()
  const ctx = await loadProjectCtx(payload.projectId, admin)
  if (!ctx) return { error: 'Проект не найден' }

  const userRequest = [payload.ideaPrompt, payload.userMessage].filter(Boolean).join('\n')
  const promptText = buildPlatformPrompt(payload.platform, ctx, userRequest)

  let generatedText: string
  try {
    const anthropic = getAnthropic()
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: promptText }],
    })
    const content = msg.content[0]
    if (content.type !== 'text') return { error: 'Неожиданный ответ от AI' }
    generatedText = content.text
  } catch (e) {
    console.error('[generateDraftContent] claude error', e)
    return { error: 'Ошибка генерации контента' }
  }

  // Create resource_bundle
  const { data: bundle, error: bundleErr } = await admin
    .from('resource_bundles')
    .insert({ project_id: payload.projectId, created_by: user.id })
    .select('id')
    .single()
  if (bundleErr || !bundle) return { error: 'Ошибка создания bundle: ' + bundleErr?.message }

  // Create draft_set
  const { data: draftSet, error: setErr } = await admin
    .from('draft_sets')
    .insert({
      bundle_id: bundle.id,
      project_id: payload.projectId,
      target_platform: payload.platform as PlatformEnum,
      target_format: 'post_image',
    })
    .select('id')
    .single()
  if (setErr || !draftSet) return { error: 'Ошибка создания draft_set: ' + setErr?.message }

  // Create draft_variant
  const { data: variant, error: varErr } = await admin
    .from('draft_variants')
    .insert({
      draft_set_id: draftSet.id,
      text_body: generatedText,
      post_idea: payload.postIdea ?? 'AI-generated',
      visual_idea: '',
      image_prompt: '',
      status: 'draft',
    })
    .select('id')
    .single()
  if (varErr || !variant) return { error: 'Ошибка сохранения черновика: ' + varErr?.message }

  return { draftVariantId: variant.id }
}

// ─── Phase 4 actions ───────────────────────────────────────────────────────

export async function getDraftVariant(draftVariantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: variant } = await admin
    .from('draft_variants')
    .select('*, draft_sets!inner(project_id, target_platform)')
    .eq('id', draftVariantId)
    .single()
  return variant
}

export async function regenerateDraftText(payload: {
  draftVariantId: string
  projectId: string
}): Promise<{ text?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = createAdminClient()
  const { data: variant } = await admin
    .from('draft_variants')
    .select('post_idea, draft_sets!inner(target_platform)')
    .eq('id', payload.draftVariantId)
    .single()
  if (!variant) return { error: 'Черновик не найден' }

  const ctx = await loadProjectCtx(payload.projectId, admin)
  if (!ctx) return { error: 'Проект не найден' }

  const draftSets = variant.draft_sets as { target_platform: string }
  const platform = draftSets.target_platform
  const promptText = buildPlatformPrompt(platform, ctx, variant.post_idea)

  try {
    const anthropic = getAnthropic()
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: promptText }],
    })
    const content = msg.content[0]
    if (content.type !== 'text') return { error: 'Неожиданный ответ от AI' }

    await admin
      .from('draft_variants')
      .update({ text_body: content.text })
      .eq('id', payload.draftVariantId)

    return { text: content.text }
  } catch (e) {
    console.error('[regenerateDraftText]', e)
    return { error: 'Ошибка перегенерации' }
  }
}

export async function editDraftWithInstruction(payload: {
  draftVariantId: string
  currentText: string
  instruction: string
}): Promise<{ text?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const prompt = `Ты редактор контента. Измени текст публикации согласно инструкции.
Сохрани общий смысл и тон. Верни только изменённый текст, без пояснений.

Текущий текст:
${payload.currentText}

Инструкция: ${payload.instruction}`

  try {
    const anthropic = getAnthropic()
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    const content = msg.content[0]
    if (content.type !== 'text') return { error: 'Неожиданный ответ от AI' }

    await createAdminClient()
      .from('draft_variants')
      .update({ text_body: content.text })
      .eq('id', payload.draftVariantId)

    return { text: content.text }
  } catch (e) {
    console.error('[editDraftWithInstruction]', e)
    return { error: 'Ошибка редактирования' }
  }
}

export async function generateVisualIdeas(payload: {
  draftVariantId: string
  draftText: string
  projectId: string
}): Promise<{ ideas?: VisualIdea[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = createAdminClient()
  const ctx = await loadProjectCtx(payload.projectId, admin)

  const prompt = `Ты арт-директор. Предложи 3 концепции изображения для поста.

Текст поста:
${payload.draftText}

Визуальный стиль бренда: ${ctx?.visualGuidelines ?? ''}

Верни JSON-массив из 3 объектов:
[{ "title": "...", "description": "...", "dallePrompt": "...english prompt for DALL-E..." }]
Только JSON, без markdown-обёртки.`

  try {
    const anthropic = getAnthropic()
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const content = msg.content[0]
    if (content.type !== 'text') return { error: 'Неожиданный ответ от AI' }
    const ideas: VisualIdea[] = JSON.parse(content.text)
    return { ideas }
  } catch (e) {
    console.error('[generateVisualIdeas]', e)
    return { error: 'Ошибка генерации визуальных идей' }
  }
}

export async function saveDraftVariant(payload: {
  draftVariantId: string
  textBody: string
  visualIdea?: string
  imagePrompt?: string
  status?: Database['public']['Enums']['draft_status']
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await createAdminClient()
    .from('draft_variants')
    .update({
      text_body: payload.textBody,
      ...(payload.visualIdea !== undefined && { visual_idea: payload.visualIdea }),
      ...(payload.imagePrompt !== undefined && { image_prompt: payload.imagePrompt }),
      ...(payload.status !== undefined && { status: payload.status }),
    })
    .eq('id', payload.draftVariantId)

  return { error: error?.message }
}

export async function deleteDraftContent(payload: {
  draftVariantId: string
  projectId: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = createAdminClient()

  const { data: variant } = await admin
    .from('draft_variants')
    .select('draft_set_id')
    .eq('id', payload.draftVariantId)
    .single()
  if (!variant) return {}

  const { data: draftSet } = await admin
    .from('draft_sets')
    .select('bundle_id')
    .eq('id', variant.draft_set_id)
    .single()

  await admin.from('draft_variants').delete().eq('id', payload.draftVariantId)
  await admin.from('draft_sets').delete().eq('id', variant.draft_set_id)
  if (draftSet) {
    await admin.from('resource_bundles').delete().eq('id', draftSet.bundle_id)
  }

  return {}
}

// ─── Phase 5 actions ───────────────────────────────────────────────────────

export async function generateImage(payload: {
  draftVariantId: string
  projectId: string
}): Promise<{ imageUrl?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = createAdminClient()

  const { data: variant } = await admin
    .from('draft_variants')
    .select('image_prompt, preview_hints')
    .eq('id', payload.draftVariantId)
    .single()
  if (!variant) return { error: 'Черновик не найден' }
  if (!variant.image_prompt) return { error: 'Промпт для изображения не задан' }

  const ctx = await loadProjectCtx(payload.projectId, admin)
  const styleHint = ctx?.visualGuidelines ? ctx.visualGuidelines.slice(0, 200) : ''
  const fullPrompt = styleHint
    ? `${variant.image_prompt}. Visual style: ${styleHint}`
    : variant.image_prompt

  try {
    const openai = getOpenAI()
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    })
    const items = response.data ?? []
    const imageUrl = items[0]?.url
    if (!imageUrl) return { error: 'DALL-E не вернул изображение' }

    // Download and upload to Supabase Storage
    const imgResponse = await fetch(imageUrl)
    const imgBuffer = await imgResponse.arrayBuffer()
    const storagePath = `${payload.projectId}/${payload.draftVariantId}/${Date.now()}.png`

    const { error: uploadErr } = await admin.storage
      .from('image-assets')
      .upload(storagePath, imgBuffer, { contentType: 'image/png', upsert: true })
    if (uploadErr) return { error: 'Ошибка загрузки в Storage: ' + uploadErr.message }

    const { data: { publicUrl } } = admin.storage
      .from('image-assets')
      .getPublicUrl(storagePath)

    // Store URL in preview_hints for use before approve
    await admin
      .from('draft_variants')
      .update({
        preview_hints: {
          generatedImageUrl: publicUrl,
          storagePath,
          promptUsed: fullPrompt,
          generatedAt: new Date().toISOString(),
        },
      })
      .eq('id', payload.draftVariantId)

    return { imageUrl: publicUrl }
  } catch (e) {
    console.error('[generateImage]', e)
    return { error: 'Ошибка генерации изображения' }
  }
}

export async function regenerateImageWithInstruction(payload: {
  draftVariantId: string
  originalPrompt: string
  instruction: string
  projectId: string
}): Promise<{ imageUrl?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const modifyPrompt = `Ты арт-директор. Модифицируй промпт для изображения согласно инструкции.
Верни только новый промпт на английском, без объяснений.

Оригинальный промпт: ${payload.originalPrompt}
Инструкция: ${payload.instruction}`

  try {
    const anthropic = getAnthropic()
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: modifyPrompt }],
    })
    const content = msg.content[0]
    if (content.type !== 'text') return { error: 'Неожиданный ответ от AI' }
    // Update the stored prompt so generateImage picks up the new version
    await createAdminClient()
      .from('draft_variants')
      .update({ image_prompt: content.text })
      .eq('id', payload.draftVariantId)
  } catch {
    return { error: 'Ошибка модификации промпта' }
  }

  return generateImage({ draftVariantId: payload.draftVariantId, projectId: payload.projectId })
}

export async function approveContent(payload: {
  draftVariantId: string
  projectId: string
  finalText: string
}): Promise<{ contentItemId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = createAdminClient()

  const { data: variant } = await admin
    .from('draft_variants')
    .select('post_idea, image_prompt, preview_hints')
    .eq('id', payload.draftVariantId)
    .single()
  if (!variant) return { error: 'Черновик не найден' }

  const hints = variant.preview_hints as { storagePath?: string } | null

  // Update draft status
  await admin
    .from('draft_variants')
    .update({ status: 'selected', selected_at: new Date().toISOString(), text_body: payload.finalText })
    .eq('id', payload.draftVariantId)

  const now = new Date().toISOString()

  // Create content_item
  const { data: contentItem, error: ciErr } = await admin
    .from('content_items')
    .insert({
      project_id: payload.projectId,
      title_or_label: payload.finalText.slice(0, 60),
      final_text: payload.finalText,
      final_post_idea: variant.post_idea,
      final_image_prompt: variant.image_prompt,
      source_draft_variant_id: payload.draftVariantId,
      approved_text_at: now,
      approved_prompt_at: now,
      workflow_status: 'in_review',
    })
    .select('id')
    .single()

  if (ciErr || !contentItem) return { error: 'Ошибка создания контента: ' + ciErr?.message }

  // Create image_asset if image was generated
  if (hints?.storagePath) {
    const { data: imageAsset } = await admin
      .from('image_assets')
      .insert({
        content_item_id: contentItem.id,
        storage_path: hints.storagePath,
        generation_state: 'ready',
      })
      .select('id')
      .single()

    if (imageAsset) {
      await admin
        .from('content_items')
        .update({ cover_image_asset_id: imageAsset.id })
        .eq('id', contentItem.id)
    }
  }

  return { contentItemId: contentItem.id }
}

// ─── Phase 6 actions ───────────────────────────────────────────────────────

export async function scheduleContent(payload: {
  contentItemId: string
  projectId: string
  platform: string
  scheduledAt: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = createAdminClient()

  const { data: project } = await admin
    .from('projects')
    .select('workspace_id')
    .eq('id', payload.projectId)
    .single()
  if (!project) return { error: 'Проект не найден' }

  await admin.from('calendar_entries').insert({
    content_item_id: payload.contentItemId,
    workspace_id: project.workspace_id,
    target_platform: payload.platform as PlatformEnum,
    scheduled_for: payload.scheduledAt,
    status: 'scheduled',
  })

  await admin
    .from('content_items')
    .update({ workflow_status: 'scheduled', scheduled_at: payload.scheduledAt })
    .eq('id', payload.contentItemId)

  await admin.from('publish_jobs').insert({
    content_item_id: payload.contentItemId,
    platform: payload.platform as PlatformEnum,
    status: 'pending',
  })

  revalidatePath(`/project/${payload.projectId}`)
  redirect(`/project/${payload.projectId}`)
}

export async function publishNow(payload: {
  contentItemId: string
  projectId: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  await createAdminClient()
    .from('content_items')
    .update({ workflow_status: 'published', published_at: new Date().toISOString() })
    .eq('id', payload.contentItemId)

  revalidatePath(`/project/${payload.projectId}`)
  redirect(`/project/${payload.projectId}`)
}
