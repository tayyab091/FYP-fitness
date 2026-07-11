'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Dumbbell,
  ShoppingCart,
  TrendingUp,
  FileText,
  Building2,
  Clock,
  AlertCircle
} from 'lucide-react';

const sidebarItems = [
  { name: 'Dashboard', href: '/gym-owner', icon: BarChart3 },
  { name: 'My Gym', href: '/gym-owner/gym', icon: ShoppingCart },
  { name: 'Trainers', href: '/gym-owner/trainers', icon: Dumbbell },
  { name: 'Members', href: '/gym-owner/members', icon: Users },
  { name: 'Analytics', href: '/gym-owner/analytics', icon: TrendingUp },
  { name: 'Documents', href: '/gym-owner/documents', icon: FileText },
  { name: 'Settings', href: '/gym-owner/settings', icon: Settings },
];

export default function GymOwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isLoading } = useAuth() as any;
  const router = useRouter();

  // Redirect if not gym owner (use useEffect to avoid render-phase state updates)
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'gym_owner')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Show nothing if not gym owner (useEffect will redirect)
  if (user.role !== 'gym_owner') {
    return null;
  }

  // Show pending verification screen if gym owner is not yet verified
  if (user.verificationStatus === 'pending' || user.verificationStatus === 'under_review') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-primary/5 via-background to-background">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Verification Pending</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Your gym registration has been received. Our admin team is reviewing your application.
            This usually takes 24-48 hours.
          </p>
          <div className="bg-card border rounded-lg p-4 text-left space-y-3 mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verification Steps</p>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Account created</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center shrink-0">
                <Clock className="w-3 h-3 text-white" />
              </div>
              <span>Admin reviewing gym details</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-xs">3</span>
              </div>
              <span>Dashboard unlocked after approval</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            You will receive a notification when your gym is approved.
          </p>
          <Button onClick={() => logout()} variant="outline" className="mt-4 w-full">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    );
  }

  if (user.verificationStatus === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-primary/5 via-background to-background">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Verification Rejected</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Unfortunately, your gym registration was not approved. Please review the requirements and try again.
          </p>
          <div className="space-y-3">
            <Button className="w-full">
              Resubmit Application
            </Button>
            <Button onClick={() => logout()} variant="outline" className="w-full">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static`}
      >
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">T.E.S.T. Gym</h1>
          <p className="text-sm text-gray-500 mt-1">Owner Dashboard</p>
        </div>

        <nav className="mt-8 px-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4 space-y-2">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">Gym Owner</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Close sidebar on small screens when navigating */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
