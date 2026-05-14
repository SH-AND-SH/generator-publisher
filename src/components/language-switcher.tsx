'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { setLocale } from '@/lib/actions/locale'
import type { Locale } from '@/i18n.config'

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const [isPending, startTransition] = useTransition()
  const next: Locale = currentLocale === 'en' ? 'ru' : 'en'

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => setLocale(next))}
      className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      {currentLocale === 'en' ? 'RU' : 'EN'}
    </Button>
  )
}
