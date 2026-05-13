'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Unlink } from 'lucide-react'
import { connectBuffer, disconnectBuffer } from '@/lib/actions/integrations'
import type { BufferProfile } from '@/lib/actions/integrations'
import type { Json } from '@/types/database'

const SERVICE_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
  tiktok: 'TikTok',
}

interface Props {
  integration: {
    id: string
    credentials_encrypted: Json | null
    metadata: Json | null
    status: string
  } | null
  workspaceId: string
}

export function BufferSettings({ integration, workspaceId }: Props) {
  const existingProfiles = (integration?.metadata as { profiles?: BufferProfile[] } | null)
    ?.profiles ?? null

  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [profiles, setProfiles] = useState<BufferProfile[] | null>(existingProfiles)

  async function handleConnect() {
    if (!token.trim()) return
    setConnecting(true)
    const result = await connectBuffer({ workspaceId, accessToken: token.trim() })
    if (result.error) {
      toast.error(result.error)
    } else {
      setProfiles(result.profiles ?? [])
      setToken('')
      toast.success('Buffer подключён')
    }
    setConnecting(false)
  }

  async function handleDisconnect() {
    if (!confirm('Отключить Buffer? Запланированные публикации могут не отправиться.')) return
    setDisconnecting(true)
    const result = await disconnectBuffer(workspaceId)
    if (result.error) {
      toast.error(result.error)
    } else {
      setProfiles(null)
      toast.success('Buffer отключён')
    }
    setDisconnecting(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Buffer
          {profiles && profiles.length > 0 && (
            <Badge variant="secondary" className="text-emerald-600 bg-emerald-50 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Подключено
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {profiles && profiles.length > 0 ? (
          <>
            <div className="space-y-2">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-muted-foreground w-24">
                    {SERVICE_LABEL[p.service] ?? p.service}
                  </span>
                  <span>@{p.formatted_username}</span>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-destructive hover:text-destructive"
            >
              {disconnecting
                ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                : <Unlink className="mr-2 h-3.5 w-3.5" />
              }
              Отключить Buffer
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Введите Access Token из Buffer Dashboard → Apps → ваш app → Access Token.
            </p>
            <div className="flex gap-2">
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Access Token"
                type="password"
                className="font-mono text-sm"
              />
              <Button onClick={handleConnect} disabled={connecting || !token.trim()} size="sm">
                {connecting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : 'Подключить'
                }
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
