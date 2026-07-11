import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { DailyNutritionPlan } from '@/models'

type RouteContext = { params: Promise<{ planId: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const { planId: date } = await context.params

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Date must be YYYY-MM-DD' },
        { status: 400 }
      )
    }

    const plan = await DailyNutritionPlan.findOne({
      userId: authResult.userId,
      planDate: date,
    }).populate('trainerId', 'fullName imageUrl')

    return NextResponse.json({ success: true, data: plan, date })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Get plan for date error:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
