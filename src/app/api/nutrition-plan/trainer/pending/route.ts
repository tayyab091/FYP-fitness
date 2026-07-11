import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireRole } from '@/lib/middleware/permissions'
import { DailyNutritionPlan } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireRole(req, 'trainer', 'admin')
    if (isNextResponse(authResult)) {
      return authResult
    }

    const plans = await DailyNutritionPlan.find({
      trainerId: authResult.userId,
      status: 'pending',
    })
      .populate('userId', 'fullName email')
      .sort({ alertSentAt: -1 })

    return NextResponse.json({ success: true, data: plans, count: plans.length })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Get pending plans error:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
