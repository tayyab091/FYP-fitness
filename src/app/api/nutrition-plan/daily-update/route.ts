import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { DailyNutritionPlan } from '@/models'
import { getTodayString, getDateString } from '@/lib/nutritionHelpers'

export async function POST(_req: NextRequest) {
  try {
    await connectDB()

    const today = getTodayString()
    const yesterday = getDateString(-1)

    const activated = await DailyNutritionPlan.updateMany(
      { planDate: today, status: 'approved' },
      { $set: { status: 'active' } }
    )

    const completed = await DailyNutritionPlan.updateMany(
      { planDate: yesterday, status: 'active' },
      { $set: { status: 'completed' } }
    )

    console.log(
      `📅 Daily update: ${activated.modifiedCount} activated, ${completed.modifiedCount} completed`
    )

    return NextResponse.json({
      success: true,
      activated: activated.modifiedCount,
      completed: completed.modifiedCount,
      today,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Daily update error:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
