'use client'

import { useMemo } from 'react'

function getTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone')
  } catch {
    return ['UTC', 'Europe/Moscow', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo']
  }
}

interface Props {
  value: string
  onChange: (value: string) => void
}

export function TimezoneCombobox({ value, onChange }: Props) {
  const timezones = useMemo(() => getTimezones(), [])

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {timezones.map((tz) => (
        <option key={tz} value={tz}>{tz}</option>
      ))}
    </select>
  )
}
