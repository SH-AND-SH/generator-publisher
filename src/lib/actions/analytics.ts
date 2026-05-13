'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export interface PostMetrics {
  impressions?: number
  reach?: number
  clicks?: number
  likes?: number
  comments?: number
  shares?: number
  saves?: number
}

export async function fetchBufferPostAnalytics(payload: {
  bufferPostId: string
  workspaceId: string
}): Promise<{ metrics?: PostMetrics; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = createAdminClient()
  const { data: integration } = await admin
    .from('integrations')
    .select('credentials_encrypted')
    .eq('workspace_id', payload.workspaceId)
    .eq('provider', 'buffer')
    .single()
  if (!integration) return { error: 'Buffer не подключён' }

  const creds = integration.credentials_encrypted as { access_token?: string } | null
  const accessToken = creds?.access_token
  if (!accessToken) return { error: 'Buffer токен не найден' }

  try {
    const res = await fetch(
      `https://api.bufferapp.com/1/updates/${payload.bufferPostId}.json?access_token=${accessToken}`
    )
    if (!res.ok) return { error: 'Не удалось загрузить аналитику' }
    const data = await res.json() as {
      statistics?: {
        impressions?: number
        reach?: number
        clicks?: number
        likes?: number
        comments?: number
        shares?: number
        saves?: number
      }
    }
    const s = data.statistics ?? {}
    const metrics: PostMetrics = {}
    if (s.impressions != null) metrics.impressions = s.impressions
    if (s.reach != null) metrics.reach = s.reach
    if (s.clicks != null) metrics.clicks = s.clicks
    if (s.likes != null) metrics.likes = s.likes
    if (s.comments != null) metrics.comments = s.comments
    if (s.shares != null) metrics.shares = s.shares
    if (s.saves != null) metrics.saves = s.saves
    return { metrics }
  } catch {
    return { error: 'Ошибка загрузки аналитики' }
  }
}
