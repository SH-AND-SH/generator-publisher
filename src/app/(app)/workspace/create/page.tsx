'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createWorkspace } from '@/lib/actions/workspace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TimezoneCombobox } from '@/components/ui/timezone-combobox'
import { LanguageSwitcher } from '@/components/language-switcher'
import { toast } from 'sonner'
import type { Locale } from '@/i18n.config'

export default function CreateWorkspacePage() {
  const t = useTranslations('workspace')
  const locale = useLocale() as Locale
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState(
    () => (typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC')
  )
  const router = useRouter()

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const result = await createWorkspace({ name, timezone })

    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher currentLocale={locale} />
      </div>
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-xl font-semibold">{t('createTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('createSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('nameLabel')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>{t('timezoneLabel')}</Label>
            <TimezoneCombobox value={timezone} onChange={setTimezone} />
            <p className="text-xs text-muted-foreground">{t('timezoneHint')}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? t('creating') : t('createButton')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
