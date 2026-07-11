'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/Logo';

export function GlobalNavbar() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show navbar on auth pages or while loading
  const isAuthPage = pathname.includes('/login') || pathname.includes('/signup') || pathname.includes('/register');
  if (isLoading || isAuthPage || !user) {
    return null;
  }

  // If no user after loading
  if (!user) {
    return (
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  // Role-based navigation items
  const getNavItems = () => {
    switch (user.role) {
      case 'admin':
      case 'super_admin':
        return [
          { label: 'Dashboard', href: '/admin/verification' },
          { label: 'Platform Stats', href: '/admin/platform-stats' },
          { label: 'Audit Logs', href: '/admin/audit-logs' },
          { label: 'Platform Settings', href: '/admin/platform-settings' },
        ];
      case 'gym_owner':
        return [
          { label: 'Dashboard', href: '/gym-owner' },
          { label: 'My Gym', href: '/gym-owner/gym' },
          { label: 'Trainers', href: '/gym-owner/trainers' },
          { label: 'Members', href: '/gym-owner/members' },
          { label: 'Analytics', href: '/gym-owner/analytics' },
        ];
      case 'trainer':
        return [
          { label: 'Dashboard', href: '/trainer' },
          { label: 'Clients', href: '/trainer/clients' },
          { label: 'Chats', href: '/trainer/chats' },
          { label: 'Earnings', href: '/trainer/earnings' },
        ];
      case 'user':
      default:
        return [
          { label: 'Browse Trainers', href: '/coaching' },
          { label: 'Exercises', href: '/exercises' },
          { label: 'My Chats', href: '/chat' },
          { label: 'Subscription', href: '/subscription' },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
