import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getProjectColor } from '@/lib/constants'

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
          <h1 className="text-2xl font-semibold">Добро пожаловать в ContentOS</h1>
          <p className="text-muted-foreground">Создайте первый workspace чтобы начать.</p>
          <Link href="/workspace/create" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" />
            Создать workspace
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
          <p className="text-sm text-muted-foreground">
            {projects?.length ?? 0} активных проектов
          </p>
        </div>
        <Link href="/project/create" className={buttonVariants({ size: 'sm' })}>
          <Plus className="mr-2 h-4 w-4" />
          Новый проект
        </Link>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, idx) => {
            const color = getProjectColor(project.id)
            return (
              <Link key={project.id} href={`/project/${project.id}`} className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3 w-3 rounded-sm shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <CardTitle className="text-base truncate">{project.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{project.category}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">Проектов пока нет</p>
            <Link href="/project/create" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <Plus className="mr-2 h-4 w-4" />
              Создать первый проект
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
