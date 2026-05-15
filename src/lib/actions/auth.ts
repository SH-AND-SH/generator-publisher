'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient as createRawClient } from '@supabase/supabase-js'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function signInWithEmail(email: string) {
  // Use raw client with implicit flow so the magic link works across any browser.
  // @supabase/ssr hardcodes PKCE, which requires the code_verifier cookie from the
  // exact browser session where the form was submitted — breaking email clients that
  // open links in a different browser or web view.
  const supabase = createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function devSignIn() {
  const email = process.env.DEV_LOGIN_EMAIL
  if (!email) return { error: 'DEV_LOGIN_EMAIL not set' }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  })

  if (error || !data?.properties?.action_link) {
    return { error: error?.message ?? 'Failed to generate link' }
  }

  redirect(data.properties.action_link)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/sign-in')
}
