'use client'

import { useState } from 'react'
import { signInWithEmail } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function SignInForm({ authError }: { authError: boolean }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await signInWithEmail(email)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Generator / Publisher</h1>
          <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
        </div>

        {authError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            We could not complete sign-in. Please request a new magic link and try again.
          </div>
        ) : null}

        {sent ? (
          <div className="rounded-lg border bg-muted/40 p-6 text-center space-y-2">
            <p className="font-medium">Check your email</p>
            <p className="text-sm text-muted-foreground">
              We sent a magic link to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending link…' : 'Continue with email'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
