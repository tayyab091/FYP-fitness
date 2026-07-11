import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { DailyNutritionPlan } from '@/models'
import { getTodayString } from '@/lib/nutritionHelpers'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const today = getTodayString()

    const plan = await DailyNutritionPlan.findOne({
      userId: authResult.userId,
      planDate: today,
    }).populate('trainerId', 'fullName imageUrl')

    if (!plan) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No meal plan assigned for today. Your trainer will set one up.',
        today,
      })
    }

    if (plan.status === 'draft' || plan.status === 'pending') {
      return NextResponse.json({
        success: true,
        data: null,
        status: plan.status,
        message: "Your trainer is reviewing today's meal plan. Check back soon!",
        today,
      })
    }

    return NextResponse.json({
      success: true,
      data: plan,
      today,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error("❌ Get today's plan error:", err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
