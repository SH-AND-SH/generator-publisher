import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { BufferSettings } from './buffer-settings'
import { TelegramSettings } from './telegram-settings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const admin = createAdminClient()
  const { data: workspace } = await admin
    .from('workspaces')
    .select('id')
    .eq('owner_user_id', user.id)
    .single()

  if (!workspace) redirect('/dashboard')

  const { data: integrations } = await admin
    .from('integrations')
    .select('id, provider, credentials_encrypted, metadata, status')
    .eq('workspace_id', workspace.id)

  const bufferIntegration = integrations?.find((i) => i.provider === 'buffer') ?? null
  const telegramIntegration = integrations?.find((i) => i.provider === 'telegram') ?? null

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Настройки</h1>
        <p className="text-sm text-muted-foreground mt-1">Подключите платформы для публикации</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Интеграции
        </h2>
        <BufferSettings integration={bufferIntegration} workspaceId={workspace.id} />
        <TelegramSettings integration={telegramIntegration} workspaceId={workspace.id} />
      </div>
    </div>
  )
}
