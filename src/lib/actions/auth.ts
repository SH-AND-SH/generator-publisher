'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient as createRawClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

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

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/sign-in')
}
