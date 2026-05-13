'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, BarChart2 } from 'lucide-react'
import { fetchBufferPostAnalytics } from '@/lib/actions/analytics'
import type { PostMetrics } from '@/lib/actions/analytics'

const METRIC_LABELS: { key: keyof PostMetrics; label: string; icon: string }[] = [
  { key: 'reach',       label: 'Охват',         icon: '👁' },
  { key: 'impressions', label: 'Показы',        icon: '📊' },
  { key: 'likes',       label: 'Лайки',         icon: '❤️' },
  { key: 'comments',    label: 'Комментарии',   icon: '💬' },
  { key: 'shares',      label: 'Репосты',       icon: '🔁' },
  { key: 'clicks',      label: 'Клики',         icon: '🔗' },
  { key: 'saves',       label: 'Сохранения',    icon: '🔖' },
]

interface Props {
  bufferPostId: string | null | undefined
  workspaceId: string
}

export function PostAnalytics({ bufferPostId, workspaceId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState<PostMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!bufferPostId) {
    return (
      <p className="text-xs text-muted-foreground mt-2">
        Telegram — аналитика недоступна
      </p>
    )
  }

  async function handleOpen() {
    if (open) { setOpen(false); return }
    setOpen(true)
    if (metrics) return
    setLoading(true)
    const result = await fetchBufferPostAnalytics({ bufferPostId: bufferPostId!, workspaceId })
    if (result.error) setError(result.error)
    else setMetrics(result.metrics ?? {})
    setLoading(false)
  }

  return (
    <div className="mt-2">
      <Button variant="ghost" size="sm" onClick={handleOpen} className="h-7 text-xs px-2">
        <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
        Аналитика
      </Button>

      {open && (
        <div className="mt-2 rounded-md border p-3 bg-muted/30">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Загружаем данные…
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          {metrics && !loading && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {METRIC_LABELS
                .filter(({ key }) => metrics[key] != null)
                .map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs">
                    <span>{icon}</span>
                    <span className="text-muted-foreground">{label}:</span>
                    <span className="font-medium">{metrics[key]?.toLocaleString()}</span>
                  </div>
                ))
              }
              {Object.keys(metrics).length === 0 && (
                <p className="text-xs text-muted-foreground col-span-2">Нет данных</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
