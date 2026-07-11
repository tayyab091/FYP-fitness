'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

const NAV_LINKS = [
  { label: 'Find Trainers', href: '/coaching' },
  { label: 'Nutrition', href: '/nutrition' },
  { label: 'Exercises', href: '/exercises' },
  { label: 'Pricing', href: '/subscription' },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const hideOn = ['/login', '/signup', '/register-trainer', '/register-gym-owner', '/register-gym', '/admin', '/gym-owner', '/trainer-dashboard']
  if (hideOn.some(p => pathname.startsWith(p))) return null

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 flex items-center justify-between ${
      scrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-[#1a1a1a]' : 'bg-transparent'
    }`}>
      <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight">
        <span className="gradient-text">T.E.S.T.</span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map(l => (
          <Link key={l.href} href={l.href}
            className={`text-sm font-medium transition-colors ${pathname === l.href ? 'text-[#00ff87]' : 'text-[#a0a0a0] hover:text-white'}`}>
            {l.label}
          </Link>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <Link href={
              user.role === 'admin' || user.role === 'super_admin' ? '/admin' :
              user.role === 'trainer' ? '/trainer-dashboard' :
              user.role === 'gym_owner' ? '/gym-owner' : '/my-fitness'
            } className="text-sm text-[#a0a0a0] hover:text-white font-medium transition-colors">
              Dashboard
            </Link>
            <button onClick={logout} className="text-sm text-[#a0a0a0] hover:text-[#ef4444] transition-colors font-medium">
              Logout
            </button>
          </div>
        ) : (
          <>
            <Link href="/login" className="text-sm text-[#a0a0a0] hover:text-white font-medium transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="btn-accent px-5 py-2 text-sm">
              Get Started
            </Link>
          </>
        )}
      </div>

      <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
        <div className="space-y-1.5">
          <span className={`block h-0.5 w-6 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 w-6 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </div>
      </button>

      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#0a0a0a] border-b border-[#1a1a1a] p-6 space-y-4 md:hidden">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="block text-[#a0a0a0] hover:text-white font-medium py-2">
              {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={() => { logout(); setMenuOpen(false) }}
              className="block text-[#ef4444] font-medium py-2">
              Logout
            </button>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/login" onClick={() => setMenuOpen(false)}
                className="block text-center border border-[#2a2a2a] text-white py-2.5 rounded-xl font-medium">
                Sign In
              </Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)}
                className="btn-accent block text-center py-2.5">
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
