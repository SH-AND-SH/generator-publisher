import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { publishContent } from '@/lib/actions/publishing'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: jobs } = await admin
    .from('publish_jobs')
    .select('id, platform, content_item_id, content_items!inner(project_id)')
    .eq('status', 'pending')
    .not('scheduled_at', 'is', null)
    .lte('scheduled_at', new Date().toISOString())
    .limit(50)

  const results: Array<{ jobId: string; success?: boolean; error?: string }> = []

  for (const job of jobs ?? []) {
    const contentItems = job.content_items as { project_id: string }
    const result = await publishContent({
      publishJobId: job.id,
      contentItemId: job.content_item_id,
      projectId: contentItems.project_id,
      platform: job.platform,
      publishNow: false,
    })
    results.push({ jobId: job.id, ...result })
  }

  return NextResponse.json({ processed: results.length, results })
}
