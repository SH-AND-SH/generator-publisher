'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export interface BufferProfile {
  id: string
  service: string
  formatted_username: string
}

const SUPPORTED_BUFFER_SERVICES = ['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok']

export async function connectBuffer(payload: {
  workspaceId: string
  accessToken: string
}): Promise<{ profiles?: BufferProfile[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  let profiles: BufferProfile[]
  try {
    const res = await fetch(
      `https://api.bufferapp.com/1/profiles.json?access_token=${payload.accessToken}`
    )
    if (!res.ok) return { error: 'Неверный токен или нет доступа' }
    const data = await res.json() as Array<{
      id: string
      service: string
      formatted_username: string
    }>
    if (!Array.isArray(data)) return { error: 'Неверный токен или нет доступа' }
    profiles = data
      .filter((p) => SUPPORTED_BUFFER_SERVICES.includes(p.service))
      .map((p) => ({ id: p.id, service: p.service, formatted_username: p.formatted_username }))
  } catch {
    return { error: 'Не удалось подключиться к Buffer' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('integrations')
    .upsert(
      {
        workspace_id: payload.workspaceId,
        provider: 'buffer',
        credentials_encrypted: { access_token: payload.accessToken },
        metadata: { profiles } as unknown as import('@/types/database').Json,
        status: 'active',
      },
      { onConflict: 'workspace_id,provider' }
    )

  if (error) return { error: 'Ошибка сохранения интеграции: ' + error.message }
  return { profiles }
}

export async function disconnectBuffer(workspaceId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await createAdminClient()
    .from('integrations')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('provider', 'buffer')

  return { error: error?.message }
}

export async function connectTelegram(payload: {
  workspaceId: string
  botToken: string
  chatId: string
}): Promise<{ channelName?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  let channelName: string
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${payload.botToken}/getChat?chat_id=${payload.chatId}`
    )
    const data = await res.json() as { ok: boolean; result?: { title?: string } }
    if (!data.ok || !data.result) return { error: 'Не удалось подключиться. Проверьте токен и Chat ID' }
    channelName = data.result.title ?? payload.chatId
  } catch {
    return { error: 'Не удалось подключиться к Telegram' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('integrations')
    .upsert(
      {
        workspace_id: payload.workspaceId,
        provider: 'telegram',
        credentials_encrypted: { bot_token: payload.botToken },
        metadata: { channels: [{ chat_id: payload.chatId, name: channelName }] },
        status: 'active',
      },
      { onConflict: 'workspace_id,provider' }
    )

  if (error) return { error: 'Ошибка сохранения интеграции: ' + error.message }
  return { channelName }
}

export async function disconnectTelegram(workspaceId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await createAdminClient()
    .from('integrations')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('provider', 'telegram')

  return { error: error?.message }
}
