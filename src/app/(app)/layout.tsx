import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/layout/app-sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, logo_url')
    .order('created_at')

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar workspaces={workspaces ?? []} user={user} />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}
