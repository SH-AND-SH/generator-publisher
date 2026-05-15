'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Plus, ImageIcon, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
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

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const CAL_HEADERS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

function getWeekDates(offset: number): Date[] {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startingDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const days: (Date | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i))
  return days
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
      {item.imageUrl ? (
        <div className="w-full aspect-video rounded overflow-hidden bg-muted relative">
          <Image src={item.imageUrl} alt="" fill className="object-cover" unoptimized />
        </div>
      ) : (
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
  const [view, setView] = useState<'week' | 'calendar'>('calendar')
  const [weekOffset, setWeekOffset] = useState(0)
  const now = new Date()
  const [calMonth, setCalMonth] = useState({ year: now.getFullYear(), month: now.getMonth() })

  function prevMonth() {
    setCalMonth((m) => m.month === 0
      ? { year: m.year - 1, month: 11 }
      : { year: m.year, month: m.month - 1 }
    )
  }
  function nextMonth() {
    setCalMonth((m) => m.month === 11
      ? { year: m.year + 1, month: 0 }
      : { year: m.year, month: m.month + 1 }
    )
  }

  const monthName = new Date(calMonth.year, calMonth.month, 1).toLocaleDateString('ru-RU', {
    month: 'long', year: 'numeric',
  })

  const todayKey = isoDate(new Date())

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
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                view === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Календарь
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

      {/* Week view: 7 columns Mon–Sun */}
      {view === 'week' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset((o) => o - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {getWeekDates(weekOffset)[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              {' — '}
              {getWeekDates(weekOffset)[6].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset((o) => o + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-3">
            {getWeekDates(weekOffset).map((day, i) => {
              const key = isoDate(day)
              const dayItems = items.filter((item) => item.scheduledAt?.startsWith(key))
              const isToday = key === todayKey
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

      {/* Calendar view: month grid */}
      {view === 'calendar' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium capitalize min-w-36 text-center">{monthName}</span>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <div className="grid grid-cols-7 mb-1">
              {CAL_HEADERS.map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-l border-t">
              {getCalendarDays(calMonth.year, calMonth.month).map((day, i) => {
                const key = day ? isoDate(day) : `empty-${i}`
                const dayItems = day
                  ? items.filter((item) => item.scheduledAt?.startsWith(isoDate(day)))
                  : []
                const isToday = day ? isoDate(day) === todayKey : false
                return (
                  <div key={key} className="border-r border-b min-h-[72px] p-1 text-xs">
                    {day && (
                      <>
                        <span className={`inline-block w-5 h-5 text-center leading-5 rounded-full text-xs mb-1 ${
                          isToday ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                        }`}>
                          {day.getDate()}
                        </span>
                        <div className="space-y-0.5">
                          {dayItems.slice(0, 3).map((item) => (
                            <Link
                              key={item.id}
                              href={`/project/${item.projectId}/content/${item.id}`}
                              className="block rounded px-1 py-0.5 text-[11px] truncate bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                              title={item.title}
                            >
                              {item.title}
                            </Link>
                          ))}
                          {dayItems.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{dayItems.length - 3} ещё</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
