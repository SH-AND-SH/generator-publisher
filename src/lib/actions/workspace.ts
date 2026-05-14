'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createWorkspace(payload: { name: string; timezone: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { name, timezone } = payload

  if (!name?.trim()) {
    return { error: 'Workspace name is required' }
  }

  // Use user-context client so RLS policy (auth.uid() = owner_user_id) passes
  const { error } = await supabase
    .from('workspaces')
    .insert({ name: name.trim(), owner_user_id: user.id, timezone: timezone || 'UTC' })

  if (error) {
    console.error('[createWorkspace] insert error:', error.code, error.message)
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
