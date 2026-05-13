'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ChevronLeft, Calendar, Zap, ImageIcon } from 'lucide-react'
import { SOCIAL_PLATFORMS } from '@/lib/constants'
import { scheduleContent } from '@/lib/actions/content'
import { publishContent } from '@/lib/actions/publishing'
import type { Database } from '@/types/database'

type PlatformEnum = Database['public']['Enums']['platform']

interface ContentData {
  id: string
  final_text: string
  workflow_status: string
  image_url: string | null
  platform: PlatformEnum | null
}

interface PublishJob {
  id: string
  platform: PlatformEnum
}

export default function ContentPlannerPage() {
  const params = useParams<{ id: string; contentId: string }>()
  const projectId = params.id
  const contentItemId = params.contentId
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<ContentData | null>(null)
  const [publishJob, setPublishJob] = useState<PublishJob | null>(null)

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('10:00')
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformEnum>('instagram')

  const [scheduling, setScheduling] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('content_items')
        .select(`
          id,
          final_text,
          workflow_status,
          image_assets!cover_image_asset_id(storage_path),
          publish_jobs(id, platform)
        `)
        .eq('id', contentItemId)
        .single()

      if (!data) { router.replace(`/project/${projectId}`); return }

      const assetPath = (data.image_assets as { storage_path: string } | null)?.storage_path
      let imageUrl: string | null = null
      if (assetPath) {
        const { data: { publicUrl } } = supabase.storage
          .from('image-assets')
          .getPublicUrl(assetPath)
        imageUrl = publicUrl
      }

      setContent({
        id: data.id,
        final_text: data.final_text,
        workflow_status: data.workflow_status,
        image_url: imageUrl,
        platform: null,
      })

      // Use existing publish job if present
      const jobs = data.publish_jobs as PublishJob[] | null
      if (jobs && jobs.length > 0) {
        setPublishJob(jobs[0])
        setSelectedPlatform(jobs[0].platform)
      }

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setSelectedDate(tomorrow.toISOString().split('T')[0])
      setLoading(false)
    }
    load()
  }, [contentItemId, projectId, router])

  async function handleSchedule() {
    if (!selectedDate || !selectedTime) { toast.error('Выберите дату и время'); return }
    setScheduling(true)
    const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString()
    const result = await scheduleContent({
      contentItemId,
      projectId,
      platform: selectedPlatform,
      scheduledAt,
    })
    if (result?.error) { toast.error(result.error); setScheduling(false) }
  }

  async function handlePublishNow() {
    if (!confirm('Опубликовать сейчас?')) return
    setPublishing(true)

    // If no publish job yet, schedule first (creates job), then publish
    if (!publishJob) {
      const scheduledAt = new Date().toISOString()
      const schedResult = await scheduleContent({
        contentItemId,
        projectId,
        platform: selectedPlatform,
        scheduledAt,
      })
      if (schedResult?.error) {
        toast.error(schedResult.error)
        setPublishing(false)
        return
      }
      // scheduleContent redirects on success, so we won't reach here normally
      return
    }

    const result = await publishContent({
      publishJobId: publishJob.id,
      contentItemId,
      projectId,
      platform: publishJob.platform,
      publishNow: true,
    })
    if (result.error) {
      toast.error(result.error)
      setPublishing(false)
    } else {
      toast.success('Опубликовано!')
      router.push(`/project/${projectId}`)
    }
  }

  if (loading || !content) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/project/${projectId}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Публикация</h1>
          <p className="text-sm text-muted-foreground">Запланируйте или опубликуйте сейчас</p>
        </div>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Превью</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.image_url && (
            <div className="aspect-square w-full max-w-xs mx-auto rounded-md overflow-hidden bg-muted relative">
              <Image
                src={content.image_url}
                alt="Content"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          {!content.image_url && (
            <div className="aspect-square w-full max-w-xs mx-auto rounded-md bg-muted flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="bg-muted/40 rounded-md p-3">
            <p className="text-sm whitespace-pre-wrap line-clamp-6">{content.final_text}</p>
          </div>
        </CardContent>
      </Card>

      {/* Platform */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Платформа</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SOCIAL_PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlatform(p.id)}
                className={`rounded-md border px-3 py-2 text-sm text-left transition-colors ${
                  selectedPlatform === p.id
                    ? 'border-primary bg-primary/5 font-medium'
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Запланировать
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Дата</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Время</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSchedule}
              disabled={scheduling || !selectedDate}
              className="flex-1"
            >
              {scheduling
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Планируем…</>
                : <><Calendar className="mr-2 h-4 w-4" />Запланировать</>
              }
            </Button>
            <Button
              variant="outline"
              onClick={handlePublishNow}
              disabled={publishing}
              className="flex-1"
            >
              {publishing
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Публикуем…</>
                : <><Zap className="mr-2 h-4 w-4" />Опубликовать сейчас</>
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
