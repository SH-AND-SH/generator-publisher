'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, RefreshCw, ImageIcon } from 'lucide-react'
import { SOCIAL_PLATFORMS } from '@/lib/constants'
import { retryPublishJob } from '@/lib/actions/publishing'
import { PostAnalytics } from './post-analytics'
import type { PlatformEnum } from './types'

export interface PublishedPost {
  id: string
  title_or_label: string
  final_text: string
  published_at: string | null
  workflow_status: string
  imageUrl: string | null
  jobs: Array<{
    id: string
    platform: PlatformEnum
    buffer_post_id: string | null
    telegram_message_id: string | null
    status: string
    error_message: string | null
  }>
  projectId: string
  workspaceId: string
}

interface Props {
  posts: PublishedPost[]
}

export function PublicationsList({ posts }: Props) {
  const [filter, setFilter] = useState<PlatformEnum | 'all'>('all')
  const [retrying, setRetrying] = useState<string | null>(null)

  const filtered = filter === 'all'
    ? posts
    : posts.filter((p) => p.jobs.some((j) => j.platform === filter))

  async function handleRetry(post: PublishedPost, job: PublishedPost['jobs'][0]) {
    setRetrying(job.id)
    const result = await retryPublishJob({
      publishJobId: job.id,
      contentItemId: post.id,
      projectId: post.projectId,
      platform: job.platform,
    })
    if (result.error) toast.error(result.error)
    else toast.success('Повторная публикация запущена')
    setRetrying(null)
  }

  return (
    <div className="space-y-4">
      {/* Platform filter */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            filter === 'all'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:border-muted-foreground'
          }`}
        >
          Все ({posts.length})
        </button>
        {SOCIAL_PLATFORMS.map((p) => {
          const count = posts.filter((post) => post.jobs.some((j) => j.platform === p.id)).length
          if (count === 0) return null
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setFilter(p.id)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                filter === p.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              {p.name} ({count})
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">Нет публикаций</p>
      )}

      {filtered.map((post) => (
        <div key={post.id} className="rounded-lg border bg-card p-4">
          <div className="flex gap-3">
            {/* Image preview */}
            <div className="w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0 relative">
              {post.imageUrl ? (
                <Image src={post.imageUrl} alt="" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm line-clamp-2">{post.final_text.slice(0, 150)}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {post.published_at && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.published_at).toLocaleDateString('ru-RU', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                )}
                {post.jobs.map((job) => {
                  const platform = SOCIAL_PLATFORMS.find((p) => p.id === job.platform)
                  return (
                    <Badge key={job.id} variant="secondary" className="text-xs">
                      {platform?.name ?? job.platform}
                    </Badge>
                  )
                })}
              </div>

              {/* Failed jobs */}
              {post.jobs
                .filter((j) => j.status === 'failed')
                .map((job) => (
                  <div key={job.id} className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <Badge variant="destructive" className="text-xs mr-2">Ошибка</Badge>
                        <span className="text-xs text-muted-foreground">{job.error_message}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(post, job)}
                        disabled={retrying === job.id}
                        className="h-7 text-xs shrink-0"
                      >
                        {retrying === job.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <><RefreshCw className="h-3 w-3 mr-1" />Повторить</>
                        }
                      </Button>
                    </div>
                  </div>
                ))
              }

              {/* Analytics for published Buffer posts */}
              {post.jobs
                .filter((j) => j.status === 'published')
                .map((job) => (
                  <PostAnalytics
                    key={job.id}
                    bufferPostId={job.buffer_post_id}
                    workspaceId={post.workspaceId}
                  />
                ))
              }
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
