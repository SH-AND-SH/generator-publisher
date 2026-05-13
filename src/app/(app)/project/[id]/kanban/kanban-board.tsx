'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Plus, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { SOCIAL_PLATFORMS } from '@/lib/constants'
import type { Database } from '@/types/database'

type PlatformEnum = Database['public']['Enums']['platform']
type WorkflowStatus = Database['public']['Enums']['content_workflow_status']

export interface KanbanItem {
  id: string
  title: string
  workflowStatus: WorkflowStatus
  scheduledAt: string | null
  publishedAt: string | null
  imageUrl: string | null
  platforms: PlatformEnum[]
  projectId: string
}

interface Props {
  items: KanbanItem[]
  projectId: string
  projectName: string
}

const STATUS_COLUMNS: { status: WorkflowStatus; label: string; color: string }[] = [
  { status: 'draft',      label: 'Черновики',    color: 'bg-gray-100 border-gray-200' },
  { status: 'in_review',  label: 'На проверке',  color: 'bg-yellow-50 border-yellow-200' },
  { status: 'scheduled',  label: 'Запланировано', color: 'bg-violet-50 border-violet-200' },
  { status: 'published',  label: 'Опубликовано', color: 'bg-emerald-50 border-emerald-200' },
  { status: 'publish_failed', label: 'Ошибка',   color: 'bg-red-50 border-red-200' },
]

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт']

function getWeekDates(offset: number): Date[] {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7)
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function ItemCard({ item }: { item: KanbanItem }) {
  const platformNames = item.platforms
    .map((p) => SOCIAL_PLATFORMS.find((sp) => sp.id === p)?.name ?? p)
    .join(', ')
  const date = item.publishedAt ?? item.scheduledAt
  return (
    <Link
      href={`/project/${item.projectId}/content/${item.id}`}
      className="block rounded-md border bg-card p-2 hover:shadow-sm transition-shadow space-y-1.5"
    >
      {item.imageUrl && (
        <div className="w-full aspect-video rounded overflow-hidden bg-muted relative">
          <Image src={item.imageUrl} alt="" fill className="object-cover" unoptimized />
        </div>
      )}
      {!item.imageUrl && (
        <div className="w-full h-12 rounded bg-muted flex items-center justify-center">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <p className="text-xs line-clamp-2 font-medium">{item.title}</p>
      <div className="flex items-center justify-between gap-1">
        {platformNames && (
          <span className="text-[10px] text-muted-foreground truncate">{platformNames}</span>
        )}
        {date && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </Link>
  )
}

export function KanbanBoard({ items, projectId, projectName }: Props) {
  const [view, setView] = useState<'week' | 'month'>('month')
  const [weekOffset, setWeekOffset] = useState(0)

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold">Канбан</h1>
            <p className="text-sm text-muted-foreground">{projectName}</p>
          </div>
          <div className="flex rounded-md border overflow-hidden">
            <button
              type="button"
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-xs transition-colors ${
                view === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Неделя
            </button>
            <button
              type="button"
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-xs transition-colors ${
                view === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Месяц
            </button>
          </div>
        </div>
        <Link
          href={`/project/${projectId}/content/new`}
          className="flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Создать контент
        </Link>
      </div>

      {/* Week view: 5 columns Mon–Fri */}
      {view === 'week' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset((o) => o - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {getWeekDates(weekOffset)[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              {' — '}
              {getWeekDates(weekOffset)[4].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset((o) => o + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {getWeekDates(weekOffset).map((day, i) => {
              const key = isoDate(day)
              const dayItems = items.filter(
                (item) => item.scheduledAt?.startsWith(key)
              )
              const isToday = key === isoDate(new Date())
              return (
                <div key={key} className="space-y-2">
                  <div className={`text-center text-xs py-1 rounded-md font-medium ${
                    isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  }`}>
                    <div>{WEEKDAY_LABELS[i]}</div>
                    <div>{day.getDate()}</div>
                  </div>
                  <div className="space-y-2 min-h-[120px] rounded-md border border-dashed p-1.5">
                    {dayItems.map((item) => <ItemCard key={item.id} item={item} />)}
                    {dayItems.length === 0 && (
                      <div className="h-full flex items-center justify-center py-6">
                        <span className="text-[10px] text-muted-foreground">—</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Month view: 5 status columns */}
      {view === 'month' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STATUS_COLUMNS.map(({ status, label, color }) => {
            const colItems = items.filter((item) => item.workflowStatus === status)
            return (
              <div key={status} className="space-y-2">
                <div className={`rounded-md border px-2 py-1.5 ${color}`}>
                  <span className="text-xs font-medium">{label}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">({colItems.length})</span>
                </div>
                <div className="space-y-2">
                  {colItems.map((item) => <ItemCard key={item.id} item={item} />)}
                  {colItems.length === 0 && (
                    <div className="rounded-md border border-dashed p-3 text-center">
                      <span className="text-[10px] text-muted-foreground">Пусто</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
