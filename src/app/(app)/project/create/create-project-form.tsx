'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '@/lib/actions/project'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Workspace {
  id: string
  name: string
}

const CATEGORIES = [
  'Mobile App',
  'SaaS Product',
  'E-commerce',
  'Media / Blog',
  'Agency',
  'Personal Brand',
  'Other',
]

export function CreateProjectForm({ workspaces }: { workspaces: Workspace[] }) {
  const [loading, setLoading] = useState(false)
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? '')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim() || !category || !description.trim()) return
    setLoading(true)

    const result = await createProject({ workspaceId, name, category, description })

    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Create project</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A project is a single brand or product with its own content strategy.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {workspaces.length > 1 && (
          <div className="space-y-2">
            <Label>Workspace</Label>
            <Select value={workspaceId} onValueChange={(v) => setWorkspaceId(v ?? '')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Project name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My App"
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the product and what content you're creating…"
            rows={3}
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !name.trim() || !category || !description.trim()}>
            {loading ? 'Creating…' : 'Create project'}
          </Button>
        </div>
      </form>
    </div>
  )
}
