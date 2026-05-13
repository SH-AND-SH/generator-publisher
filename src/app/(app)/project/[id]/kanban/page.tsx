import { redirect, notFound } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { KanbanBoard } from './kanban-board'
import type { KanbanItem } from './kanban-board'
import type { Database } from '@/types/database'

type PlatformEnum = Database['public']['Enums']['platform']

export default async function KanbanPage({
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
      id, title_or_label, final_text, workflow_status, scheduled_at, published_at,
      image_assets ( storage_path ),
      publish_jobs ( platform )
    `)
    .eq('project_id', id)
    .order('updated_at', { ascending: false })

  const kanbanItems: KanbanItem[] = (items ?? []).map((item) => {
    const asset = item.image_assets as { storage_path: string } | null
    let imageUrl: string | null = null
    if (asset?.storage_path) {
      const { data: { publicUrl } } = admin.storage
        .from('image-assets')
        .getPublicUrl(asset.storage_path)
      imageUrl = publicUrl
    }
    const jobs = item.publish_jobs as Array<{ platform: PlatformEnum }> ?? []
    const platforms = [...new Set(jobs.map((j) => j.platform))]

    return {
      id: item.id,
      title: item.title_or_label || item.final_text.slice(0, 60),
      workflowStatus: item.workflow_status,
      scheduledAt: item.scheduled_at,
      publishedAt: item.published_at,
      imageUrl,
      platforms,
      projectId: id,
    }
  })

  return (
    <KanbanBoard
      items={kanbanItems}
      projectId={id}
      projectName={project.name}
    />
  )
}
