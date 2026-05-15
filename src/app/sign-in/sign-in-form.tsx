'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { signInWithEmail, devSignIn } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale } from 'next-intl'
import type { Locale } from '@/i18n.config'

export function SignInForm({ authError }: { authError: boolean }) {
  const t = useTranslations('auth')
  const locale = useLocale() as Locale
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [devLoading, setDevLoading] = useState(false)

  async function handleDevSignIn() {
    setDevLoading(true)
    const result = await devSignIn()
    if (result?.error) {
      toast.error(result.error)
      setDevLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await signInWithEmail(email)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher currentLocale={locale} />
      </div>
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        {authError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {t('error')}
          </div>
        ) : null}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleDevSignIn}
          disabled={devLoading}
        >
          {devLoading
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Входим…</>
            : 'Войти для тестирования'
          }
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">или</span>
          </div>
        </div>

        {sent ? (
          <div className="rounded-lg border bg-muted/40 p-6 text-center space-y-2">
            <p className="font-medium">{t('checkEmail')}</p>
            <p className="text-sm text-muted-foreground">
              {t('checkEmailDesc')}{' '}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('loading') : t('submitButton')}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
