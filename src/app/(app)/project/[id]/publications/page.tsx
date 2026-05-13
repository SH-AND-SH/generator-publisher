import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PublicationsList } from './publications-list'
import type { PublishedPost } from './publications-list'
import type { PlatformEnum } from './types'

export default async function PublicationsPage({
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
    .select('name, workspace_id')
    .eq('id', id)
    .single()
  if (!project) notFound()

  const { data: items } = await admin
    .from('content_items')
    .select(`
      id, final_text, title_or_label, published_at, workflow_status,
      cover_image_asset_id,
      image_assets ( storage_path ),
      publish_jobs ( id, platform, buffer_post_id, telegram_message_id, status, error_message )
    `)
    .eq('project_id', id)
    .eq('workflow_status', 'published')
    .order('published_at', { ascending: false })

  const posts: PublishedPost[] = (items ?? []).map((item) => {
    const asset = item.image_assets as { storage_path: string } | null
    let imageUrl: string | null = null
    if (asset?.storage_path) {
      const { data: { publicUrl } } = admin.storage
        .from('image-assets')
        .getPublicUrl(asset.storage_path)
      imageUrl = publicUrl
    }

    const jobs = (item.publish_jobs as Array<{
      id: string
      platform: PlatformEnum
      buffer_post_id: string | null
      telegram_message_id: string | null
      status: string
      error_message: string | null
    }>) ?? []

    return {
      id: item.id,
      title_or_label: item.title_or_label,
      final_text: item.final_text,
      published_at: item.published_at,
      workflow_status: item.workflow_status,
      imageUrl,
      jobs,
      projectId: id,
      workspaceId: project.workspace_id,
    }
  })

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/project/${id}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Публикации</h1>
          <p className="text-sm text-muted-foreground">{project.name}</p>
        </div>
      </div>

      <PublicationsList posts={posts} />
    </div>
  )
}
