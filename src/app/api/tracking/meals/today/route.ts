import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { MealLog } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const userId = authResult.userId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const logs = await MealLog.find({
      userId,
      loggedAt: { $gte: today, $lt: tomorrow },
    }).sort({ loggedAt: 1 })

    const dailyTotals = {
      calories: logs.reduce((sum, log) => sum + log.totals.calories, 0),
      protein: logs.reduce((sum, log) => sum + log.totals.protein, 0),
      carbs: logs.reduce((sum, log) => sum + log.totals.carbs, 0),
      fat: logs.reduce((sum, log) => sum + log.totals.fat, 0),
    }

    return NextResponse.json({
      success: true,
      data: {
        meals: logs,
        dailyTotals,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch meals'
    console.error("Error fetching today's meals:", err)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch meals', message },
      { status: 500 }
    )
  }
}
