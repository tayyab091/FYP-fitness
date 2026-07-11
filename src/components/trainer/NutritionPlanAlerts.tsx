/**
 * Trainer: Nutrition Plan Alerts
 * 
 * Dashboard widget showing pending nutrition plans awaiting approval
 * - Shows plans sent for review
 * - Quick approve/reject actions
 * - Real-time updates via Socket.IO
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PendingPlan {
    _id:      string
    userId:   { fullName: string; email: string }
    planDate: string
    status:   string
    meals:    any[]
}

export default function NutritionPlanAlerts() {
    const router = useRouter()
    const [plans, setPlans] = useState<PendingPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [approving, setApproving] = useState<string | null>(null)

    useEffect(() => {
        fetchPendingPlans()

        // Listen for real-time updates
        const handleNewNotification = (data: any) => {
            if (data.type === 'nutrition_plan_pending') {
                fetchPendingPlans()
            }
        }

        if ((window as any).socket) {
            (window as any).socket.on('notification:new', handleNewNotification)
            return () => {
                (window as any).socket.off('notification:new', handleNewNotification)
            }
        }
    }, [])

    const fetchPendingPlans = async () => {
        try {
            const response = await fetch('/api/nutrition-plan/trainer/pending')
            const data = await response.json()
            setPlans(data.data || [])
        } catch (error) {
            console.error('❌ Failed to fetch pending plans:', error)
        } finally {
            setLoading(false)
        }
    }

    const approvePlan = async (planId: string) => {
        setApproving(planId)
        try {
            const response = await fetch(`/api/nutrition-plan/${planId}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ finalNote: '' })
            })

            if (response.ok) {
                setPlans(plans.filter((p) => p._id !== planId))
            }
        } catch (error) {
            console.error('❌ Approve error:', error)
        } finally {
            setApproving(null)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00')
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day:   'numeric'
        })
    }

    if (loading) {
        return (
            <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Nutrition Plans
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600">Loading...</p>
                </CardContent>
            </Card>
        )
    }

    if (plans.length === 0) {
        return (
            <Card className="border-0 shadow-lg bg-linear-to-br from-green-50 to-emerald-50">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Nutrition Plans
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-green-700">✅ No pending plans — all caught up!</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-0 shadow-lg border-l-4 border-orange-500">
            <CardHeader className="pb-3 bg-linear-to-r from-orange-50 to-yellow-50">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        Nutrition Plans to Review
                    </CardTitle>
                    <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {plans.length} Pending
                    </span>
                </div>
            </CardHeader>

            <CardContent className="pt-4">
                <div className="space-y-3">
                    {plans.map((plan) => (
                        <div
                            key={plan._id}
                            className="p-3 bg-linear-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="font-semibold text-gray-900">
                                        {plan.userId?.fullName}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-0.5">
                                        📅 Meal plan for {formatDate(plan.planDate)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {plan.meals?.length || 0} meals • {plan.status}
                                    </div>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            router.push(
                                                `/trainer/clients/${(plan.userId as any)?._id}/nutrition/${plan._id}`
                                            )
                                        }
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Review
                                    </Button>

                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={approving === plan._id}
                                        onClick={() => approvePlan(plan._id)}
                                    >
                                        {approving === plan._id ? '...' : '✓ Approve'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
