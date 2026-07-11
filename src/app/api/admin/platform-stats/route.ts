import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { User, Trainer, Gym, Recipe, Exercise, AuditLog } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)

    const [
      totalUsers,
      activeSubscriptions,
      totalTrainers,
      totalGyms,
      basicCount,
      proCount,
      eliteCount,
      totalRecipes,
      totalExercises,
      newUsersToday,
      messagesTotal,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ 'subscription.status': 'active' }),
      Trainer.countDocuments({ isFullyVerified: true, isActive: true }),
      Gym.countDocuments({ verificationStatus: 'verified', isActive: true }),
      User.countDocuments({ 'subscription.plan': 'basic', 'subscription.status': 'active' }),
      User.countDocuments({ 'subscription.plan': 'pro', 'subscription.status': 'active' }),
      User.countDocuments({ 'subscription.plan': 'elite', 'subscription.status': 'active' }),
      Recipe.countDocuments({ isActive: true }),
      Exercise.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({}),
    ])

    const registrationsByDay = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const usersByCountry = await User.aggregate([
      { $match: { isActive: true, country: { $exists: true, $ne: '' } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    const revenueEstimate = proCount * 19.99 + eliteCount * 39.99

    return NextResponse.json({
      success: true,
      data: {
        totals: {
          totalUsers,
          activeSubscriptions,
          totalTrainers,
          totalGyms,
          totalRecipes,
          totalExercises,
          newUsersToday,
          messagesTotal,
          revenueEstimate: revenueEstimate.toFixed(2),
        },
        subscriptions: { basicCount, proCount, eliteCount },
        registrationsByDay,
        usersByCountry,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
