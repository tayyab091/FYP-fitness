import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireRole } from '@/lib/middleware/permissions'
import { DailyNutritionPlan } from '@/models'
import { getTodayString } from '@/lib/nutritionHelpers'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireRole(req, 'trainer', 'admin')
    if (isNextResponse(authResult)) {
      return authResult
    }

    const fromDate = req.nextUrl.searchParams.get('from') || getTodayString()
    const toDate = req.nextUrl.searchParams.get('to') || getTodayString()

    const plans = await DailyNutritionPlan.find({
      trainerId: authResult.userId,
      planDate: { $gte: fromDate, $lte: toDate },
    })
      .populate('userId', 'fullName email profileImage')
      .sort({ planDate: 1 })

    return NextResponse.json({ success: true, data: plans, count: plans.length })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Get overview error:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
