'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
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
  Columns3,
  BarChart3,
  Send,
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
import { LanguageSwitcher } from '@/components/language-switcher'
import type { Locale } from '@/i18n.config'

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

export function AppSidebar({ workspaces, user, projects }: AppSidebarProps) {
  const t = useTranslations('nav')
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const currentWorkspace = workspaces[0]

  const NAV_ITEMS = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/calendar',  label: t('calendar'),  icon: Calendar },
    { href: '/settings',  label: t('settings'),  icon: Settings },
  ]

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
              {t('newWorkspace')}
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
            {t('projects')}
          </p>
        )}
        <div className="space-y-0.5">
          {projects.map((project) => {
            const color = getProjectColor(project.id)
            const active = isProjectActive(project.id)
            return (
              <div key={project.id}>
                <Link
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
                {active && !collapsed && (
                  <div className="mt-0.5 space-y-0.5">
                    {[
                      { href: `/project/${project.id}/kanban`, label: 'Канбан', icon: Columns3 },
                      { href: `/project/${project.id}/analytics`, label: 'Аналитика', icon: BarChart3 },
                      { href: `/project/${project.id}/publications`, label: 'Публикации', icon: Send },
                    ].map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          'flex items-center gap-2 rounded-md pl-6 pr-2.5 py-1.5 text-xs transition-colors',
                          pathname === href || pathname.startsWith(href + '/')
                            ? 'bg-background text-foreground font-medium'
                            : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {projects.length === 0 && !collapsed && (
            <p className="px-2.5 py-2 text-xs text-muted-foreground">{t('noProjects')}</p>
          )}

          <Link
            href="/project/create"
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-background/60 hover:text-foreground transition-colors',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? t('newProject') : undefined}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!collapsed && t('newProject')}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-2 space-y-1">
        {!collapsed && (
          <div className="flex items-center justify-between px-2.5 py-1">
            <LanguageSwitcher currentLocale={locale} />
          </div>
        )}
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
              title={t('signOut')}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
