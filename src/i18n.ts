import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales, type Locale } from './i18n.config'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const stored = cookieStore.get('locale')?.value as Locale | undefined
  const locale: Locale = stored && locales.includes(stored) ? stored : defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
