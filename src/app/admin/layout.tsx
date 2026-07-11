'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, Users, Dumbbell, UtensilsCrossed,
  Building2, CreditCard, Settings, Activity,
  ScrollText, BarChart3, Shield
} from 'lucide-react'

const adminNavLinks = [
  { label: 'Overview',          href: '/admin',                   icon: LayoutDashboard },
  { label: 'Users',             href: '/admin/users',             icon: Users },
  { label: 'Trainers',          href: '/admin/trainers',          icon: Shield },
  { label: 'Gyms',              href: '/admin/gyms',              icon: Building2 },
  { label: 'Recipes',           href: '/admin/recipes',           icon: UtensilsCrossed },
  { label: 'Exercises',         href: '/admin/exercises',         icon: Dumbbell },
  { label: 'Subscriptions',     href: '/admin/subscriptions',     icon: CreditCard },
  { label: 'Platform Stats',    href: '/admin/platform-stats',    icon: BarChart3 },
  { label: 'Audit Logs',        href: '/admin/audit-logs',        icon: ScrollText },
  { label: 'Platform Settings', href: '/admin/platform-settings', icon: Settings },
  { label: 'Verification',      href: '/admin/verification',      icon: Activity },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Redirect if not admin (use useEffect to avoid render-phase navigation)
  useEffect(() => {
    if (!loading && (!user || !['admin', 'super_admin'].includes(user.role))) {
      router.push('/')
    }
  }, [user, loading, router])

  // Show loading state while checking auth
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Show nothing if not admin (useEffect will redirect)
  if (!['admin', 'super_admin'].includes(user.role)) {
    return null
  }

  return (
    <div className="flex min-h-screen">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-card border-r border-border shrink-0 flex flex-col sticky top-0 max-h-screen">
        <div className="p-4 border-b border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Admin Panel</p>
          <p className="font-semibold text-sm mt-2">{user?.fullName || 'Admin'}</p>
          <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full mt-1.5 inline-block font-medium">
            {user?.role?.replace('_', ' ') || 'Loading...'}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {adminNavLinks.map(link => {
            const Icon = link.icon
            const isActive = pathname === link.href ||
              (link.href !== '/admin' && pathname.startsWith(link.href))

            return (
              <Link key={link.href} href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-border text-xs text-muted-foreground">
          <p>Platform v1.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}
