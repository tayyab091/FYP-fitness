'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Users, DollarSign, Dumbbell, Star, ChefHat, CreditCard, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'


const StatCard = ({ label, value, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-card border rounded-xl p-4"
  >
    <div className={`rounded-lg p-2 w-fit ${color} mb-3`}>
      <Icon className="h-5 w-5" />
    </div>
    <motion.p
      className="text-2xl font-bold"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: delay + 0.2 }}
    >
      {value || '—'}
    </motion.p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </motion.div>
)

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && (!user || !['admin', 'super_admin'].includes(user.role))) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/stats`, { credentials: 'include' })
      return res.json()
    }
    , enabled: !!user
  })

  const stats = data?.stats || {}

  if (authLoading || isLoading || !user) {
    return <Loader2 className="h-8 w-8 animate-spin" />
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of platform metrics</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Users"
            value={stats.totalUsers ?? 0}
            icon={Users}
            color="bg-blue-500/10 text-blue-500"
            delay={0}
          />
          <StatCard
            label="Total Trainers"
            value={stats.totalTrainers ?? 0}
            icon={Star}
            color="bg-green-500/10 text-green-500"
            delay={0.1}
          />
          <StatCard
            label="Active Subscriptions"
            value={stats.activeSubscriptions ?? 0}
            icon={CreditCard}
            color="bg-purple-500/10 text-purple-500"
            delay={0.2}
          />
          <StatCard
            label="Total Recipes"
            value={stats.totalRecipes ?? 0}
            icon={ChefHat}
            color="bg-orange-500/10 text-orange-500"
            delay={0.3}
          />
          <StatCard
            label="Total Exercises"
            value={stats.totalExercises ?? 0}
            icon={Dumbbell}
            color="bg-red-500/10 text-red-500"
            delay={0.4}
          />
          <StatCard
            label="Monthly Revenue"
            value={`$${stats.revenue?.monthly ?? '0'}`}
            icon={DollarSign}
            color="bg-yellow-500/10 text-yellow-500"
            delay={0.5}
          />
        </div>
      )}

      {/* Subscription Breakdown */}
      {!isLoading && stats.subscriptionBreakdown && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Subscription Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.subscriptionBreakdown.basic ?? 0}</p>
              <p className="text-sm text-muted-foreground">Basic Plans</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.subscriptionBreakdown.pro ?? 0}</p>
              <p className="text-sm text-muted-foreground">Pro Plans</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.subscriptionBreakdown.elite ?? 0}</p>
              <p className="text-sm text-muted-foreground">Elite Plans</p>
            </div>
          </div>
        </Card>
      )}

      {/* Revenue Breakdown */}
      {!isLoading && stats.revenue?.breakdown && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue by Plan</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">${stats.revenue.breakdown.basic ?? '0'}</p>
              <p className="text-sm text-muted-foreground">Basic</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">${stats.revenue.breakdown.pro ?? '0'}</p>
              <p className="text-sm text-muted-foreground">Pro</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">${stats.revenue.breakdown.elite ?? '0'}</p>
              <p className="text-sm text-muted-foreground">Elite</p>
            </div>
          </div>
        </Card>
      )}

      <div className="text-xs text-muted-foreground">
        <p>ℹ️ Navigate using the sidebar menu to manage users, trainers, gyms, recipes, exercises, and more.</p>
      </div>
    </div>
  )
}

