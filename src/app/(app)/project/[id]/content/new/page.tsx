import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ContentTaskBuilder } from './content-task-builder'

export default async function ContentNewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!project) notFound()

  return <ContentTaskBuilder projectId={id} projectName={project.name} />
}
