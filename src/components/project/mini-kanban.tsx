'use client'

import { useState } from 'react'
import Link from 'next/link'
import { KanbanSquare, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { CONTENT_STATUS_LABELS } from '@/lib/constants'

interface ScheduledItem {
  id: string
  title_or_label: string
  scheduled_at: string
  workflow_status: string
}

interface MiniKanbanProps {
  projectId: string
  scheduledItems: ScheduledItem[]
}

function getDayLabel(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Сегодня'
  if (diff === 1) return 'Завтра'
  return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })
}

function getNext5Days(): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + i)
    return d
  })
}

function getMonthDays(): { date: Date; inMonth: boolean }[] {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // Monday-first

  const days: { date: Date; inMonth: boolean }[] = []
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, -startDow + i + 1)
    days.push({ date: d, inMonth: false })
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), inMonth: true })
  }
  return days
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function MiniKanban({ projectId, scheduledItems }: MiniKanbanProps) {
  const [tab, setTab] = useState<'5days' | 'month'>('5days')
  const days5 = getNext5Days()
  const monthDays = getMonthDays()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex rounded-md border text-xs overflow-hidden">
          <button
            className={cn(
              'px-3 py-1.5 transition-colors',
              tab === '5days' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setTab('5days')}
          >
            5 дней
          </button>
          <button
            className={cn(
              'px-3 py-1.5 transition-colors',
              tab === 'month' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setTab('month')}
          >
            Месяц
          </button>
        </div>
        <Link
          href={`/project/${projectId}/kanban`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-7 text-xs gap-1')}
        >
          <KanbanSquare className="h-3.5 w-3.5" />
          Открыть канбан
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {tab === '5days' && (
        <div className="grid grid-cols-5 gap-2">
          {days5.map((day) => {
            const dayItems = scheduledItems.filter((item) =>
              sameDay(new Date(item.scheduled_at), day)
            )
            const isToday = sameDay(day, today)
            return (
              <div key={day.toISOString()} className="space-y-1.5">
                <p className={cn(
                  'text-[10px] font-medium truncate',
                  isToday ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {getDayLabel(day)}
                </p>
                <div
                  className={cn(
                    'min-h-[80px] rounded-md border p-1.5 space-y-1',
                    isToday ? 'bg-muted/40' : 'bg-transparent'
                  )}
                >
                  {dayItems.length === 0 && (
                    <p className="text-[10px] text-muted-foreground/50 text-center pt-2">—</p>
                  )}
                  {dayItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/project/${projectId}/content/${item.id}`}
                      className="block rounded bg-background border px-1.5 py-1 hover:shadow-sm transition-shadow"
                    >
                      <p className="text-[10px] truncate">{item.title_or_label}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'month' && (
        <div className="space-y-1">
          <div className="grid grid-cols-7 gap-0.5 text-[10px] text-muted-foreground text-center pb-1">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {monthDays.map(({ date, inMonth }, i) => {
              const count = scheduledItems.filter((item) =>
                sameDay(new Date(item.scheduled_at), date)
              ).length
              const isToday = sameDay(date, today)
              return (
                <div
                  key={i}
                  className={cn(
                    'aspect-square flex flex-col items-center justify-center rounded text-[10px]',
                    !inMonth && 'opacity-30',
                    isToday && 'bg-foreground text-background font-bold',
                    !isToday && inMonth && 'hover:bg-muted'
                  )}
                >
                  {date.getDate()}
                  {count > 0 && !isToday && (
                    <span className="h-1 w-1 rounded-full bg-primary mt-0.5" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
