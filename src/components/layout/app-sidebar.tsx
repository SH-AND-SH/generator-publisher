'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import {
  LayoutDashboard,
  Zap,
  Calendar,
  TrendingUp,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buttonVariants } from '@/components/ui/button'

interface Workspace {
  id: string
  name: string
  logo_url: string | null
}

interface AppSidebarProps {
  workspaces: Workspace[]
  user: User
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/generate', label: 'Generate', icon: Zap },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/trends', label: 'Trends', icon: TrendingUp },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar({ workspaces, user }: AppSidebarProps) {
  const pathname = usePathname()
  const currentWorkspace = workspaces[0]

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-muted/30 shrink-0">
      {/* Workspace switcher */}
      <div className="border-b p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'w-full justify-between px-2 font-medium'
            )}
          >
            <span className="truncate text-sm">
              {currentWorkspace?.name ?? 'Select workspace'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {workspaces.map((ws) => (
              <DropdownMenuItem key={ws.id}>
                {ws.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/workspace/create" />} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              New workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="border-t p-2">
        <div className="flex items-center justify-between rounded-md px-2.5 py-2">
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
