'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export function BottomNav() {
  const { user } = useAuth()
  const pathname = usePathname()

  if (!user) return null
  if (['/login', '/signup', '/admin', '/gym-owner', '/trainer-dashboard'].some(p => pathname.startsWith(p))) return null

  const links = [
    { href: '/', icon: '🏠', label: 'Home' },
    { href: '/coaching', icon: '🏋️', label: 'Trainers' },
    { href: '/my-fitness', icon: '📊', label: 'My Fitness' },
    { href: '/nutrition', icon: '🥗', label: 'Nutrition' },
    { href: '/chat', icon: '💬', label: 'Chat' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#111]/95 backdrop-blur-xl border-t border-[#1a1a1a] px-2 py-2 safe-area-pb">
      <div className="flex items-center justify-around">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
              pathname === l.href
                ? 'text-[#00ff87] bg-[#00ff87]/10'
                : 'text-[#555] hover:text-[#a0a0a0]'
            }`}>
            <span className="text-xl">{l.icon}</span>
            <span className="text-[10px] font-medium">{l.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
