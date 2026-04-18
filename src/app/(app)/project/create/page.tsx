import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateProjectForm } from './create-project-form'

export default async function CreateProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name')
    .order('created_at')

  if (!workspaces || workspaces.length === 0) {
    redirect('/workspace/create')
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <CreateProjectForm workspaces={workspaces} />
    </div>
  )
}
