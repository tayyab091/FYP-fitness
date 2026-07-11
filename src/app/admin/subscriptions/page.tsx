'use client'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, Users, TrendingUp } from 'lucide-react'


export default function AdminSubscriptionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/subscriptions`, { credentials: 'include' })
      return res.json()
    }
  })

  const subs = data?.subscriptions || data?.data || []
  const summary = data?.summary || {}

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Subscriptions</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Basic', count: summary.basic || 0, color: 'border-zinc-500/30', icon: Users },
          { label: 'Pro', count: summary.pro || 0, color: 'border-blue-500/30', icon: CreditCard },
          { label: 'Elite', count: summary.elite || 0, color: 'border-yellow-500/30', icon: TrendingUp }
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`border-2 ${card.color} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{card.label}</span>
              </div>
              <p className="text-3xl font-bold">{card.count}</p>
            </div>
          )
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Start Date</th>
                <th className="text-left px-4 py-3 font-medium">End Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subs.map((sub: any) => (
                <tr key={sub._id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">{sub.fullName || sub.email}</td>
                  <td className="px-4 py-3 capitalize">{sub.subscription?.plan || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium
                      ${sub.subscription?.status === 'active' ? 'bg-green-500/15 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                      {sub.subscription?.status || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {sub.subscription?.startDate ? new Date(sub.subscription.startDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {sub.subscription?.endDate ? new Date(sub.subscription.endDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
