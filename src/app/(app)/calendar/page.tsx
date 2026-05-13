import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { CalendarView } from './calendar-view'
import type { CalendarEntry } from './calendar-view'
import type { Database } from '@/types/database'

type PlatformEnum = Database['public']['Enums']['platform']

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; week?: string; view?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const admin = createAdminClient()
  const { data: workspace } = await admin
    .from('workspaces')
    .select('id')
    .eq('owner_user_id', user.id)
    .single()
  if (!workspace) redirect('/dashboard')

  // Determine which month/week to show
  const view = sp.view === 'week' ? 'week' : 'month'
  const monthStr = sp.month ?? new Date().toISOString().slice(0, 7)
  const [year, month] = monthStr.split('-').map(Number)

  const startOfMonth = new Date(year, month - 1, 1).toISOString()
  const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString()

  const { data: rawEntries } = await admin
    .from('calendar_entries')
    .select(`
      id, scheduled_for, target_platform, status,
      content_items (
        id, title_or_label,
        image_assets ( storage_path ),
        projects ( id, name )
      )
    `)
    .eq('workspace_id', workspace.id)
    .gte('scheduled_for', startOfMonth)
    .lte('scheduled_for', endOfMonth)
    .order('scheduled_for')

  const entries: CalendarEntry[] = (rawEntries ?? []).map((e) => {
    const ci = e.content_items as {
      id: string
      title_or_label: string
      image_assets: { storage_path: string } | null
      projects: { id: string; name: string } | null
    } | null

    let imageUrl: string | null = null
    if (ci?.image_assets?.storage_path) {
      const { data: { publicUrl } } = admin.storage
        .from('image-assets')
        .getPublicUrl(ci.image_assets.storage_path)
      imageUrl = publicUrl
    }

    return {
      id: e.id,
      scheduledFor: e.scheduled_for,
      platform: e.target_platform as PlatformEnum,
      status: e.status,
      contentId: ci?.id ?? '',
      title: ci?.title_or_label ?? '',
      imageUrl,
      projectId: ci?.projects?.id ?? '',
      projectName: ci?.projects?.name ?? '',
    }
  })

  return (
    <CalendarView
      entries={entries}
      currentMonth={monthStr}
      initialView={view}
    />
  )
}
