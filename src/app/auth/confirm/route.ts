import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'

function getSafeNext(nextParam: string | null) {
  if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) {
    return nextParam
  }

  return '/dashboard'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = getSafeNext(searchParams.get('next'))

  // Build the success redirect first so session cookies land on it directly.
  // Using cookies().set() + NextResponse.redirect() in the same handler doesn't
  // guarantee the Set-Cookie headers merge onto the redirect response in all
  // Next.js versions — writing to response.cookies avoids that ambiguity.
  const successResponse = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            successResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return successResponse
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) return successResponse
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`)
}
