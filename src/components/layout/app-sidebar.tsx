'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import {
  LayoutDashboard,
  Calendar,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  FolderOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import { getProjectColor } from '@/lib/constants'
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
  projects: { id: string; name: string }[]
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Рабочее пространство', icon: LayoutDashboard },
  { href: '/calendar',  label: 'Календарь',             icon: Calendar },
  { href: '/settings',  label: 'Настройки',             icon: Settings },
]

export function AppSidebar({ workspaces, user, projects }: AppSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const currentWorkspace = workspaces[0]

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setCollapsed(JSON.parse(saved))
  }, [])

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(next))
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))

  const isProjectActive = (id: string) => pathname.startsWith(`/project/${id}`)

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-muted/30 shrink-0 transition-all duration-200',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-3 min-h-[52px]">
        {!collapsed && (
          <span className="text-xs font-semibold text-muted-foreground truncate">
            ContentOS
          </span>
        )}
        <button
          onClick={toggle}
          className={cn(
            'text-muted-foreground hover:text-foreground transition-colors shrink-0',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed
            ? <PanelLeftOpen className="h-4 w-4" />
            : <PanelLeftClose className="h-4 w-4" />
          }
        </button>
      </div>

      {/* Workspace switcher */}
      <div className="border-b p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'w-full px-2 font-medium',
              collapsed ? 'justify-center' : 'justify-between'
            )}
          >
            <span className={cn('truncate text-sm', collapsed && 'sr-only')}>
              {currentWorkspace?.name ?? 'Workspace'}
            </span>
            {!collapsed && <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />}
            {collapsed && <LayoutDashboard className="h-4 w-4" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {workspaces.map((ws) => (
              <DropdownMenuItem key={ws.id}>{ws.name}</DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/workspace/create" />} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Новый workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main nav */}
      <nav className="space-y-0.5 p-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
              collapsed && 'justify-center px-0',
              isActive(href)
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && label}
          </Link>
        ))}
      </nav>

      {/* Projects */}
      <div className="flex-1 overflow-y-auto p-2">
        {!collapsed && (
          <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Проекты
          </p>
        )}
        <div className="space-y-0.5">
          {projects.map((project) => {
            const color = getProjectColor(project.id)
            const active = isProjectActive(project.id)
            return (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'bg-background text-foreground shadow-sm font-medium'
                    : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                )}
                title={collapsed ? project.name : undefined}
              >
                <span
                  className="h-2 w-2 rounded-sm shrink-0"
                  style={{ backgroundColor: color }}
                />
                {!collapsed && (
                  <span className="truncate">{project.name}</span>
                )}
              </Link>
            )
          })}

          {projects.length === 0 && !collapsed && (
            <p className="px-2.5 py-2 text-xs text-muted-foreground">Нет проектов</p>
          )}

          <Link
            href="/project/create"
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-background/60 hover:text-foreground transition-colors',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? 'Новый проект' : undefined}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!collapsed && 'Новый проект'}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-2">
        <div
          className={cn(
            'flex items-center rounded-md px-2.5 py-2',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          )}
          {collapsed && (
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Выйти"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
