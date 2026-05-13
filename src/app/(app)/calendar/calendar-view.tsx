'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { SOCIAL_PLATFORMS } from '@/lib/constants'
import type { Database } from '@/types/database'

type PlatformEnum = Database['public']['Enums']['platform']

export interface CalendarEntry {
  id: string
  scheduledFor: string
  platform: PlatformEnum
  status: string
  contentId: string
  title: string
  imageUrl: string | null
  projectId: string
  projectName: string
}

interface Props {
  entries: CalendarEntry[]
  currentMonth: string // 'YYYY-MM'
  initialView: 'month' | 'week'
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-blue-100 border-blue-300 text-blue-800',
  scheduled: 'bg-blue-100 border-blue-300 text-blue-800',
  published: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  failed: 'bg-red-100 border-red-300 text-red-800',
}

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  // Monday-based grid
  const startOffset = (firstDay.getDay() + 6) % 7
  const days: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month - 1, d))
  }
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function getWeekDays(year: number, month: number, weekOffset: number): Date[] {
  const firstOfMonth = new Date(year, month - 1, 1)
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7
  const weekStart = new Date(firstOfMonth)
  weekStart.setDate(firstOfMonth.getDate() - mondayOffset + weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function EntryCard({ entry }: { entry: CalendarEntry }) {
  const platform = SOCIAL_PLATFORMS.find((p) => p.id === entry.platform)
  const colorClass = STATUS_COLORS[entry.status] ?? STATUS_COLORS.pending
  return (
    <Link
      href={`/project/${entry.projectId}/content/${entry.contentId}`}
      className={`block rounded border px-1.5 py-0.5 text-[11px] truncate ${colorClass} hover:opacity-80 transition-opacity`}
      title={entry.title || entry.projectName}
    >
      {platform?.name ?? entry.platform} · {(entry.title || entry.projectName).slice(0, 40)}
    </Link>
  )
}

export function CalendarView({ entries, currentMonth, initialView }: Props) {
  const router = useRouter()
  const [view, setView] = useState<'month' | 'week'>(initialView)
  const [weekOffset, setWeekOffset] = useState(0)

  const [year, month] = currentMonth.split('-').map(Number)

  function navigate(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    router.push(`/calendar?month=${newMonth}&view=${view}`)
  }

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('ru-RU', {
    month: 'long', year: 'numeric',
  })

  const entryMap: Record<string, CalendarEntry[]> = {}
  for (const e of entries) {
    const key = e.scheduledFor.split('T')[0]
    if (!entryMap[key]) entryMap[key] = []
    entryMap[key].push(e)
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-base font-semibold capitalize min-w-40 text-center">{monthName}</h1>
            <Button variant="ghost" size="sm" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex rounded-md border overflow-hidden">
            <button
              type="button"
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-xs transition-colors ${
                view === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Месяц
            </button>
            <button
              type="button"
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-xs transition-colors ${
                view === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Неделя
            </button>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Создать контент
        </Link>
      </div>

      {/* Month view */}
      {view === 'month' && (
        <div>
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-l border-t">
            {getMonthDays(year, month).map((day, i) => {
              const key = day ? isoDate(day) : `empty-${i}`
              const dayEntries = day ? (entryMap[isoDate(day)] ?? []) : []
              const isToday = day ? isoDate(day) === isoDate(new Date()) : false
              return (
                <div
                  key={key}
                  className="border-r border-b min-h-[80px] p-1 text-xs"
                >
                  {day && (
                    <>
                      <span className={`inline-block w-5 h-5 text-center leading-5 rounded-full text-xs mb-1 ${
                        isToday ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                      }`}>
                        {day.getDate()}
                      </span>
                      <div className="space-y-0.5">
                        {dayEntries.slice(0, 3).map((e) => (
                          <EntryCard key={e.id} entry={e} />
                        ))}
                        {dayEntries.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{dayEntries.length - 3}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Week view */}
      {view === 'week' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset((o) => o - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset((o) => o + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {getWeekDays(year, month, weekOffset).map((day) => {
              const key = isoDate(day)
              const dayEntries = entryMap[key] ?? []
              const isToday = key === isoDate(new Date())
              return (
                <div key={key} className="space-y-1">
                  <div className={`text-center text-xs py-1 rounded-md font-medium ${
                    isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  }`}>
                    <div>{WEEKDAY_LABELS[(day.getDay() + 6) % 7]}</div>
                    <div>{day.getDate()}</div>
                  </div>
                  <div className="space-y-1 min-h-[120px] border rounded-md p-1">
                    {dayEntries.map((e) => (
                      <EntryCard key={e.id} entry={e} />
                    ))}
                    {dayEntries.length === 0 && (
                      <div className="h-full flex items-center justify-center">
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

      {entries.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <p className="text-sm text-muted-foreground">Нет запланированного контента на этот период</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Plus className="h-4 w-4" />
            Создать контент
          </Link>
        </div>
      )}
    </div>
  )
}
