import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { WorkoutPlan, type IWorkoutPlan } from '@/models'

type WeeklyDay = IWorkoutPlan['weeklySchedule'][number]

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    await connectDB()

    const userId = authResult.userId

    const plan = await WorkoutPlan.findOne({
      userId,
      status: 'active',
    }).populate('trainerId', '-password')

    if (!plan) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No active workout plan',
      })
    }

    const today = new Date()
    const dayOfWeek = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ][today.getDay()]

    const todaySession = plan.weeklySchedule.find((day: WeeklyDay) => day.dayOfWeek === dayOfWeek)

    return NextResponse.json({
      success: true,
      data: {
        plan,
        todaySession,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch plan'
    console.error('Error fetching user plan:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plan', message },
      { status: 500 }
    )
  }
}
