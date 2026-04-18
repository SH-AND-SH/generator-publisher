'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createProject(payload: {
  workspaceId: string
  name: string
  category: string
  description: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { workspaceId, name, category, description } = payload

  if (!name?.trim() || !category?.trim() || !description?.trim()) {
    return { error: 'All fields are required' }
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      workspace_id: workspaceId,
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createProject] insert error:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  redirect(`/project/${data.id}`)
}
