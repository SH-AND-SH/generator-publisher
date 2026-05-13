'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

// Buffer: our twitter_x → Buffer service 'twitter'
function toBufferService(platform: string): string {
  return platform === 'twitter_x' ? 'twitter' : platform
}

function getPublicImageUrl(admin: ReturnType<typeof createAdminClient>, storagePath: string): string {
  const { data: { publicUrl } } = admin.storage
    .from('image-assets')
    .getPublicUrl(storagePath)
  return publicUrl
}

export async function publishViaBuffer(payload: {
  publishJobId: string
  contentItemId: string
  projectId: string
  publishNow: boolean
}): Promise<{ success?: boolean; bufferPostId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = createAdminClient()

  // Load publish job
  const { data: job } = await admin
    .from('publish_jobs')
    .select('platform, scheduled_at')
    .eq('id', payload.publishJobId)
    .single()
  if (!job) return { error: 'Задача публикации не найдена' }

  // Load content item
  const { data: contentItem } = await admin
    .from('content_items')
    .select('final_text, cover_image_asset_id, project_id')
    .eq('id', payload.contentItemId)
    .single()
  if (!contentItem) return { error: 'Контент не найден' }

  // Load image URL if exists
  let imageUrl: string | undefined
  if (contentItem.cover_image_asset_id) {
    const { data: asset } = await admin
      .from('image_assets')
      .select('storage_path')
      .eq('id', contentItem.cover_image_asset_id)
      .single()
    if (asset) imageUrl = getPublicImageUrl(admin, asset.storage_path)
  }

  // Load workspace and Buffer integration
  const { data: project } = await admin
    .from('projects')
    .select('workspace_id')
    .eq('id', payload.projectId)
    .single()
  if (!project) return { error: 'Проект не найден' }

  const { data: integration } = await admin
    .from('integrations')
    .select('credentials_encrypted, metadata')
    .eq('workspace_id', project.workspace_id)
    .eq('provider', 'buffer')
    .single()
  if (!integration) return { error: 'Buffer не подключён. Перейдите в Настройки' }

  const creds = integration.credentials_encrypted as { access_token?: string } | null
  const accessToken = creds?.access_token
  if (!accessToken) return { error: 'Buffer токен не найден' }

  // Find matching Buffer profile
  const meta = integration.metadata as { profiles?: Array<{ id: string; service: string }> } | null
  const targetService = toBufferService(job.platform)
  const profile = meta?.profiles?.find((p) => p.service === targetService)
  if (!profile) return { error: `Аккаунт ${job.platform} не подключён в Buffer` }

  // Mark as processing
  await admin
    .from('publish_jobs')
    .update({ status: 'publishing' })
    .eq('id', payload.publishJobId)

  // Send to Buffer
  const body = new URLSearchParams({
    'profile_ids[]': profile.id,
    text: contentItem.final_text,
  })
  if (imageUrl) body.append('media[photo]', imageUrl)
  if (payload.publishNow) {
    body.append('now', 'true')
  } else if (job.scheduled_at) {
    body.append('scheduled_at', job.scheduled_at)
  }

  let bufferRes: Response
  try {
    bufferRes = await fetch('https://api.bufferapp.com/1/updates/create.json', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })
  } catch {
    await admin
      .from('publish_jobs')
      .update({ status: 'failed', error_message: 'Сетевая ошибка при обращении к Buffer' })
      .eq('id', payload.publishJobId)
    return { error: 'Сетевая ошибка при обращении к Buffer' }
  }

  const bufferData = await bufferRes.json() as {
    success?: boolean
    updates?: Array<{ id: string; status: string }>
    message?: string
    error?: string
  }

  if (!bufferRes.ok || !bufferData.success) {
    const errMsg = bufferData.message ?? bufferData.error ?? 'Ошибка Buffer API'
    await admin
      .from('publish_jobs')
      .update({ status: 'failed', error_message: errMsg })
      .eq('id', payload.publishJobId)
    return { error: errMsg }
  }

  const bufferPostId = bufferData.updates?.[0]?.id ?? ''
  const bufferStatus = bufferData.updates?.[0]?.status ?? ''
  const now = new Date().toISOString()

  await admin
    .from('publish_jobs')
    .update({ buffer_post_id: bufferPostId, buffer_status: bufferStatus, status: 'published' })
    .eq('id', payload.publishJobId)

  await admin
    .from('content_items')
    .update({ workflow_status: 'published', published_at: now })
    .eq('id', payload.contentItemId)

  return { success: true, bufferPostId }
}

export async function publishViaTelegram(payload: {
  publishJobId: string
  contentItemId: string
  projectId: string
}): Promise<{ success?: boolean; messageId?: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = createAdminClient()

  // Load content item
  const { data: contentItem } = await admin
    .from('content_items')
    .select('final_text, cover_image_asset_id, project_id')
    .eq('id', payload.contentItemId)
    .single()
  if (!contentItem) return { error: 'Контент не найден' }

  // Load image URL if exists
  let imageUrl: string | undefined
  if (contentItem.cover_image_asset_id) {
    const { data: asset } = await admin
      .from('image_assets')
      .select('storage_path')
      .eq('id', contentItem.cover_image_asset_id)
      .single()
    if (asset) imageUrl = getPublicImageUrl(admin, asset.storage_path)
  }

  // Load workspace and Telegram integration
  const { data: project } = await admin
    .from('projects')
    .select('workspace_id')
    .eq('id', payload.projectId)
    .single()
  if (!project) return { error: 'Проект не найден' }

  const { data: integration } = await admin
    .from('integrations')
    .select('credentials_encrypted, metadata')
    .eq('workspace_id', project.workspace_id)
    .eq('provider', 'telegram')
    .single()
  if (!integration) return { error: 'Telegram не подключён. Перейдите в Настройки' }

  const creds = integration.credentials_encrypted as { bot_token?: string } | null
  const botToken = creds?.bot_token
  if (!botToken) return { error: 'Telegram токен не найден' }

  const meta = integration.metadata as { channels?: Array<{ chat_id: string }> } | null
  const chatId = meta?.channels?.[0]?.chat_id
  if (!chatId) return { error: 'Telegram Chat ID не найден' }

  // Mark as processing
  await admin
    .from('publish_jobs')
    .update({ status: 'publishing' })
    .eq('id', payload.publishJobId)

  // Telegram caption limit: 1024 chars
  const text = contentItem.final_text.length > 1024
    ? contentItem.final_text.slice(0, 1021) + '...'
    : contentItem.final_text

  const tgUrl = imageUrl
    ? `https://api.telegram.org/bot${botToken}/sendPhoto`
    : `https://api.telegram.org/bot${botToken}/sendMessage`

  const tgBody = imageUrl
    ? { chat_id: chatId, photo: imageUrl, caption: text, parse_mode: 'HTML' }
    : { chat_id: chatId, text, parse_mode: 'HTML' }

  let tgRes: Response
  try {
    tgRes = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tgBody),
    })
  } catch {
    await admin
      .from('publish_jobs')
      .update({ status: 'failed', error_message: 'Сетевая ошибка при обращении к Telegram' })
      .eq('id', payload.publishJobId)
    return { error: 'Сетевая ошибка при обращении к Telegram' }
  }

  const tgData = await tgRes.json() as {
    ok: boolean
    result?: { message_id: number }
    description?: string
  }

  if (!tgData.ok || !tgData.result) {
    const errMsg = tgData.description ?? 'Ошибка Telegram API'
    await admin
      .from('publish_jobs')
      .update({ status: 'failed', error_message: errMsg })
      .eq('id', payload.publishJobId)
    return { error: errMsg }
  }

  const messageId = tgData.result.message_id
  const now = new Date().toISOString()

  await admin
    .from('publish_jobs')
    .update({ telegram_message_id: String(messageId), status: 'published' })
    .eq('id', payload.publishJobId)

  await admin
    .from('content_items')
    .update({ workflow_status: 'published', published_at: now })
    .eq('id', payload.contentItemId)

  return { success: true, messageId }
}

export async function retryPublishJob(payload: {
  publishJobId: string
  contentItemId: string
  projectId: string
  platform: string
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  await createAdminClient()
    .from('publish_jobs')
    .update({ status: 'pending', error_message: null })
    .eq('id', payload.publishJobId)

  return publishContent({ ...payload, publishNow: true })
}

export async function publishContent(payload: {
  publishJobId: string
  contentItemId: string
  projectId: string
  platform: string
  publishNow: boolean
}): Promise<{ success?: boolean; error?: string }> {
  if (payload.platform === 'telegram') {
    return publishViaTelegram(payload)
  }
  return publishViaBuffer(payload)
}
