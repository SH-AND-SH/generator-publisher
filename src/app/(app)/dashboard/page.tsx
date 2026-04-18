import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name')
    .order('created_at')

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Welcome to Generator / Publisher</h1>
          <p className="text-muted-foreground">Create your first workspace to get started.</p>
          <Link href="/workspace/create" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" />
            Create workspace
          </Link>
        </div>
      </div>
    )
  }

  const workspace = workspaces[0]

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, category, status, updated_at')
    .eq('workspace_id', workspace.id)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{workspace.name}</h1>
          <p className="text-sm text-muted-foreground">{projects?.length ?? 0} active projects</p>
        </div>
        <Link href="/project/create" className={buttonVariants({ size: 'sm' })}>
          <Plus className="mr-2 h-4 w-4" />
          New project
        </Link>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/project/${project.id}`} className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{project.category}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">No projects yet</p>
            <Link href="/project/create" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <Plus className="mr-2 h-4 w-4" />
              Create first project
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
