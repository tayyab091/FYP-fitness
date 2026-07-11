import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { User, Trainer, Recipe, Exercise } from '@/models'

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    await connectDB()

    const totalUsers = await User.countDocuments({ isActive: true })
    const activeSubscriptions = await User.countDocuments({ 'subscription.status': 'active' })
    const basicCount = await User.countDocuments({ 'subscription.plan': 'basic', 'subscription.status': 'active' })
    const proCount = await User.countDocuments({ 'subscription.plan': 'pro', 'subscription.status': 'active' })
    const eliteCount = await User.countDocuments({ 'subscription.plan': 'elite', 'subscription.status': 'active' })
    const totalTrainers = await Trainer.countDocuments({ isActive: true })
    const totalRecipes = await Recipe.countDocuments({ isActive: true })
    const totalExercises = await Exercise.countDocuments({ isActive: true })

    const basicRevenue = basicCount * 9.99
    const proRevenue = proCount * 19.99
    const eliteRevenue = eliteCount * 39.99
    const monthlyRevenue = basicRevenue + proRevenue + eliteRevenue

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeSubscriptions,
        totalTrainers,
        totalRecipes,
        totalExercises,
        subscriptionBreakdown: { basic: basicCount, pro: proCount, elite: eliteCount },
        revenue: {
          monthly: monthlyRevenue.toFixed(2),
          breakdown: {
            basic: basicRevenue.toFixed(2),
            pro: proRevenue.toFixed(2),
            elite: eliteRevenue.toFixed(2),
          },
        },
      },
    })
  } catch (err: unknown) {
    console.error('Stats error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
