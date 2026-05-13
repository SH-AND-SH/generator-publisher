import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ArrowRight } from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { SOCIAL_PLATFORMS } from '@/lib/constants'
import type { Database } from '@/types/database'

type PlatformEnum = Database['public']['Enums']['platform']

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const admin = createAdminClient()

  const { data: project } = await admin
    .from('projects')
    .select('name')
    .eq('id', id)
    .single()
  if (!project) notFound()

  const { data: items } = await admin
    .from('content_items')
    .select(`
      id, published_at,
      publish_jobs ( platform, buffer_post_id )
    `)
    .eq('project_id', id)
    .eq('workflow_status', 'published')
    .order('published_at', { ascending: false })
    .limit(100)

  const { data: recentItems } = await admin
    .from('content_items')
    .select(`
      id, title_or_label, final_text, published_at,
      image_assets ( storage_path ),
      publish_jobs ( platform )
    `)
    .eq('project_id', id)
    .eq('workflow_status', 'published')
    .order('published_at', { ascending: false })
    .limit(5)

  // Platform counts
  const platformCounts: Record<string, number> = {}
  for (const item of items ?? []) {
    const jobs = item.publish_jobs as Array<{ platform: PlatformEnum }> ?? []
    for (const job of jobs) {
      platformCounts[job.platform] = (platformCounts[job.platform] ?? 0) + 1
    }
  }
  const maxPlatformCount = Math.max(...Object.values(platformCounts), 1)

  // Weekly activity (last 8 weeks)
  const weeklyCounts: Record<string, number> = {}
  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const weekDate = new Date(now)
    weekDate.setDate(weekDate.getDate() - i * 7)
    const weekKey = getWeekStart(weekDate)
    weeklyCounts[weekKey] = 0
  }
  for (const item of items ?? []) {
    if (!item.published_at) continue
    const weekKey = getWeekStart(new Date(item.published_at))
    if (weekKey in weeklyCounts) {
      weeklyCounts[weekKey] = (weeklyCounts[weekKey] ?? 0) + 1
    }
  }
  const weekEntries = Object.entries(weeklyCounts).sort(([a], [b]) => a.localeCompare(b))
  const maxWeekCount = Math.max(...Object.values(weeklyCounts), 1)

  const totalPublished = items?.length ?? 0

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/project/${id}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Аналитика</h1>
          <p className="text-sm text-muted-foreground">{project.name} · {totalPublished} публикаций</p>
        </div>
      </div>

      {/* Block 1: Platform activity */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="text-sm font-medium">Активность по платформам</h2>
        {Object.keys(platformCounts).length === 0 ? (
          <p className="text-xs text-muted-foreground">Нет данных</p>
        ) : (
          <div className="space-y-2">
            {SOCIAL_PLATFORMS
              .filter((p) => platformCounts[p.id])
              .sort((a, b) => (platformCounts[b.id] ?? 0) - (platformCounts[a.id] ?? 0))
              .map((p) => {
                const count = platformCounts[p.id] ?? 0
                const pct = Math.round((count / maxPlatformCount) * 100)
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-xs w-24 shrink-0">{p.name}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                )
              })
            }
          </div>
        )}
      </div>

      {/* Block 2: Weekly activity */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="text-sm font-medium">Активность по неделям (8 нед.)</h2>
        <div className="flex items-end gap-1 h-20">
          {weekEntries.map(([weekKey, count]) => {
            const pct = Math.round((count / maxWeekCount) * 100)
            const date = new Date(weekKey)
            const label = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
            return (
              <div key={weekKey} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: 64 }}>
                  <div
                    className="w-full bg-primary/70 rounded-t transition-all"
                    style={{ height: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                    title={`${label}: ${count}`}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground hidden sm:block">{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Block 3: Recent 5 posts */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Последние публикации</h2>
          <Link
            href={`/project/${id}/publications`}
            className="text-xs text-primary flex items-center gap-1 hover:underline"
          >
            Все публикации <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {!recentItems?.length ? (
          <p className="text-xs text-muted-foreground">Нет публикаций</p>
        ) : (
          <div className="space-y-2">
            {recentItems.map((item) => {
              const jobs = item.publish_jobs as Array<{ platform: PlatformEnum }> ?? []
              const platforms = jobs.map((j) =>
                SOCIAL_PLATFORMS.find((p) => p.id === j.platform)?.name ?? j.platform
              ).join(', ')
              return (
                <div key={item.id} className="flex items-start justify-between gap-2 text-sm py-1">
                  <div className="min-w-0">
                    <p className="truncate">{item.title_or_label || item.final_text.slice(0, 60)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {platforms}
                      {item.published_at && ` · ${new Date(item.published_at).toLocaleDateString('ru-RU')}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
