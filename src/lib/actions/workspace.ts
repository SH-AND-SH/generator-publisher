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

  const { error } = await supabase
    .from('workspaces')
    .insert({ name: name.trim(), owner_user_id: user.id, timezone: timezone || 'UTC' })
    .select('id')
    .single()

  if (error) {
    console.error('[createWorkspace] insert error:', error.code, error.message, error.details, error.hint)
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(`/dashboard`)
}
