import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  Clock,
  TrendingUp,
  BarChart2,
  ImageIcon,
  Plus,
  ArrowRight,
} from 'lucide-react'

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, category, description')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const [
    { data: queueItems },
    { data: trendSignals },
    { data: recentContent },
  ] = await Promise.all([
    supabase
      .from('content_items')
      .select('id, title_or_label, workflow_status, scheduled_at')
      .eq('project_id', id)
      .in('workflow_status', ['draft', 'in_review'])
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('trend_signals')
      .select('id, title, relevance_score, source_category')
      .eq('project_id', id)
      .order('relevance_score', { ascending: false })
      .limit(3),
    supabase
      .from('content_items')
      .select('id, title_or_label, workflow_status, published_at')
      .eq('project_id', id)
      .eq('workflow_status', 'published')
      .order('published_at', { ascending: false })
      .limit(4),
  ])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{project.category}</p>
        </div>
        <Link href={`/project/${id}/generate`} className={buttonVariants({ size: 'sm' })}>
          <Zap className="mr-2 h-4 w-4" />
          Generate content
        </Link>
      </div>

      {/* 5-block grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">

        {/* Block 1: Content Queue */}
        <Card className="col-span-1 lg:col-span-2 xl:col-span-1">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Content Queue
            </CardTitle>
            <Link
              href={`/project/${id}/queue`}
              className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' h-7 text-xs'}
            >
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {queueItems && queueItems.length > 0 ? (
              queueItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                  <span className="text-sm truncate">{item.title_or_label}</span>
                  <Badge variant={item.workflow_status === 'in_review' ? 'default' : 'secondary'} className="text-xs shrink-0">
                    {item.workflow_status === 'in_review' ? 'Review' : 'Draft'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-6 gap-2 text-center">
                <p className="text-xs text-muted-foreground">Queue is empty</p>
                <Link href={`/project/${id}/generate`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Generate first post
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Block 2: Quick Generation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Quick Generation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Start from resources or describe the idea directly.
            </p>
            <Link className={buttonVariants({ size: 'sm' }) + ' w-full justify-center'} href={`/project/${id}/generate`}>
              Start generating
            </Link>
            <Link className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' w-full justify-center'} href={`/project/${id}/ideas`}>
              Browse ideas bank
            </Link>
          </CardContent>
        </Card>

        {/* Block 3: Analytics snapshot */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              Analytics
            </CardTitle>
            <Link
              href={`/project/${id}/analytics`}
              className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' h-7 text-xs'}
            >
              Full report <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground py-6 text-center">
              Analytics will appear after publishing content.
            </p>
          </CardContent>
        </Card>

        {/* Block 4: Trends */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Trending Now
            </CardTitle>
            <Link
              href={`/project/${id}/trends`}
              className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' h-7 text-xs'}
            >
              All trends <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {trendSignals && trendSignals.length > 0 ? (
              trendSignals.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate">{t.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {Math.round(t.relevance_score * 100)}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                No trend signals yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Block 5: Latest publications */}
        <Card className="col-span-1 lg:col-span-2 xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Latest Publications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentContent && recentContent.length > 0 ? (
              recentContent.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <div className="h-8 w-8 rounded bg-muted shrink-0 flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{item.title_or_label}</p>
                    {item.published_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.published_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                No published content yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
