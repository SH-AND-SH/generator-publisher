'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function toSignInError(router: ReturnType<typeof useRouter>) {
  router.replace('/sign-in?error=auth_callback_failed')
}

export function AuthCallbackClient({ next }: { next: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function completeAuth() {
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (code || (tokenHash && type)) {
        const confirmUrl = new URL('/auth/confirm', window.location.origin)
        confirmUrl.search = searchParams.toString()
        window.location.replace(confirmUrl.toString())
        return
      }

      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          toSignInError(router)
          return
        }

        router.replace(next)
        router.refresh()
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        router.replace(next)
        router.refresh()
        return
      }

      toSignInError(router)
    }

    completeAuth()
  }, [next, router])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 text-center">
        <h1 className="text-lg font-semibold">Signing you in...</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please wait while we complete authentication.
        </p>
      </div>
    </div>
  )
}
