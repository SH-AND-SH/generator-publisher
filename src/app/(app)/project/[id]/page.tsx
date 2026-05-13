import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  TrendingUp,
  BarChart2,
  ImageIcon,
  Plus,
  ArrowRight,
  FileText,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { getProjectColor, CONTENT_STATUS_LABELS } from '@/lib/constants'
import { MiniKanban } from '@/components/project/mini-kanban'

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
    { data: allStatusItems },
    { data: scheduledItems },
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
    supabase
      .from('content_items')
      .select('workflow_status')
      .eq('project_id', id)
      .in('workflow_status', ['draft', 'in_review', 'scheduled']),
    supabase
      .from('content_items')
      .select('id, title_or_label, scheduled_at, workflow_status')
      .eq('project_id', id)
      .not('scheduled_at', 'is', null)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at')
      .limit(30),
  ])

  const draftCount     = allStatusItems?.filter((i) => i.workflow_status === 'draft').length ?? 0
  const approvedCount  = allStatusItems?.filter((i) => i.workflow_status === 'in_review').length ?? 0
  const scheduledCount = allStatusItems?.filter((i) => i.workflow_status === 'scheduled').length ?? 0

  const color = getProjectColor(project.id)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="h-8 w-8 rounded-lg shrink-0"
            style={{ backgroundColor: color }}
          />
          <div>
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{project.category}</p>
          </div>
        </div>
        <Link href={`/project/${id}/content/new`} className={buttonVariants({ size: 'sm' })}>
          <Zap className="mr-2 h-4 w-4" />
          Создать контент
        </Link>
      </div>

      {/* Status counters */}
      <div className="grid grid-cols-3 gap-3">
        <Link href={`/project/${id}/drafts`} className="block">
          <Card className="hover:shadow-sm transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-2 py-3 px-4">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xl font-bold">{draftCount}</p>
                <p className="text-xs text-muted-foreground">Черновики</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/project/${id}/approved`} className="block">
          <Card className="hover:shadow-sm transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-2 py-3 px-4">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xl font-bold">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Утверждено</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/project/${id}/scheduled`} className="block">
          <Card className="hover:shadow-sm transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-2 py-3 px-4">
              <Clock className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-xl font-bold">{scheduledCount}</p>
                <p className="text-xs text-muted-foreground">Запланировано</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Mini Kanban */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Контент-план</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniKanban
            projectId={id}
            scheduledItems={(scheduledItems ?? []).filter((i) => i.scheduled_at !== null) as { id: string; title_or_label: string; scheduled_at: string; workflow_status: string }[]}
          />
        </CardContent>
      </Card>

      {/* Queue + Trends */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Content Queue */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Очередь контента</CardTitle>
            <Link
              href={`/project/${id}/drafts`}
              className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' h-7 text-xs'}
            >
              Все <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {queueItems && queueItems.length > 0 ? (
              queueItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/project/${id}/content/${item.id}`}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 hover:bg-muted/40 transition-colors"
                >
                  <span className="text-sm truncate">{item.title_or_label}</span>
                  <Badge
                    variant={item.workflow_status === 'in_review' ? 'default' : 'secondary'}
                    className="text-xs shrink-0"
                  >
                    {CONTENT_STATUS_LABELS[item.workflow_status] ?? item.workflow_status}
                  </Badge>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center py-6 gap-2 text-center">
                <p className="text-xs text-muted-foreground">Очередь пуста</p>
                <Link
                  href={`/project/${id}/content/new`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Создать первый пост
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trends */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Тренды
            </CardTitle>
            <Link
              href={`/project/${id}/trends`}
              className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' h-7 text-xs'}
            >
              Все тренды <ArrowRight className="ml-1 h-3 w-3" />
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
                Трендов пока нет
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics + Publications */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Analytics */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              Аналитика
            </CardTitle>
            <Link
              href={`/project/${id}/analytics`}
              className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' h-7 text-xs'}
            >
              Подробнее <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground py-6 text-center">
              Аналитика появится после публикаций
            </p>
          </CardContent>
        </Card>

        {/* Latest publications */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Последние публикации
            </CardTitle>
            <Link
              href={`/project/${id}/publications`}
              className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' h-7 text-xs'}
            >
              Все <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentContent && recentContent.length > 0 ? (
              recentContent.map((item) => (
                <Link
                  key={item.id}
                  href={`/project/${id}/content/${item.id}`}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="h-8 w-8 rounded bg-muted shrink-0 flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{item.title_or_label}</p>
                    {item.published_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.published_at).toLocaleDateString('ru-RU')}
                      </p>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Публикаций пока нет
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
