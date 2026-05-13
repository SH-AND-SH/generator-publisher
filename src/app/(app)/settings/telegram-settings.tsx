'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Unlink } from 'lucide-react'
import { connectTelegram, disconnectTelegram } from '@/lib/actions/integrations'
import type { Json } from '@/types/database'

interface Props {
  integration: {
    id: string
    credentials_encrypted: Json | null
    metadata: Json | null
    status: string
  } | null
  workspaceId: string
}

export function TelegramSettings({ integration, workspaceId }: Props) {
  const existingChannels = (integration?.metadata as { channels?: { chat_id: string; name: string }[] } | null)
    ?.channels ?? null

  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [channelName, setChannelName] = useState<string | null>(existingChannels?.[0]?.name ?? null)

  async function handleConnect() {
    if (!botToken.trim() || !chatId.trim()) {
      toast.error('Введите Bot Token и Chat ID')
      return
    }
    setConnecting(true)
    const result = await connectTelegram({
      workspaceId,
      botToken: botToken.trim(),
      chatId: chatId.trim(),
    })
    if (result.error) {
      toast.error(result.error)
    } else {
      setChannelName(result.channelName ?? chatId.trim())
      setBotToken('')
      setChatId('')
      toast.success('Telegram подключён')
    }
    setConnecting(false)
  }

  async function handleDisconnect() {
    if (!confirm('Отключить Telegram?')) return
    setDisconnecting(true)
    const result = await disconnectTelegram(workspaceId)
    if (result.error) {
      toast.error(result.error)
    } else {
      setChannelName(null)
      toast.success('Telegram отключён')
    }
    setDisconnecting(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Telegram
          {channelName && (
            <Badge variant="secondary" className="text-emerald-600 bg-emerald-50 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Подключено
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {channelName ? (
          <>
            <div className="text-sm">
              <span className="text-muted-foreground">Канал: </span>
              <span className="font-medium">{channelName}</span>
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
              Отключить Telegram
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Добавьте бота в канал как администратора. Chat ID — это{' '}
              <code className="bg-muted px-1 rounded text-xs">-100</code> + числовой ID канала
              (например: <code className="bg-muted px-1 rounded text-xs">-1001234567890</code>).
              Или используйте <code className="bg-muted px-1 rounded text-xs">@username</code> канала.
            </p>
            <div className="space-y-2">
              <Input
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Bot Token (от BotFather)"
                type="password"
                className="font-mono text-sm"
              />
              <Input
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="Chat ID (например -1001234567890)"
                className="font-mono text-sm"
              />
              <Button
                onClick={handleConnect}
                disabled={connecting || !botToken.trim() || !chatId.trim()}
                size="sm"
              >
                {connecting
                  ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Подключаем…</>
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
