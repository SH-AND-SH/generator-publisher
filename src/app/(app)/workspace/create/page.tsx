'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkspace } from '@/lib/actions/workspace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function CreateWorkspacePage() {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const router = useRouter()

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const result = await createWorkspace({ name, timezone })

    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Create workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A workspace contains all your projects and team members.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Company"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="UTC"
            />
            <p className="text-xs text-muted-foreground">
              Used for scheduling and analytics (e.g. Europe/Moscow, America/New_York)
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating…' : 'Create workspace'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
