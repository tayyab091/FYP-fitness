import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { WorkoutLog, WorkoutPlan, type IWorkoutPlan } from '@/models'

type WeeklyDay = IWorkoutPlan['weeklySchedule'][number]

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const userId = authResult.userId
    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))

    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59)

    const logs = await WorkoutLog.find({
      userId,
      scheduledDate: { $gte: startOfMonth, $lte: endOfMonth },
    }).select('scheduledDate status sessionName durationMinutes')

    const activePlan = await WorkoutPlan.findOne({ userId, status: 'active' })

    const dayMap: Record<string, { status: string; sessionName: string; duration: number }> = {}
    logs.forEach((log) => {
      const dateKey = new Date(log.scheduledDate).toISOString().split('T')[0]
      dayMap[dateKey] = {
        status: log.status,
        sessionName: log.sessionName || '',
        duration: log.durationMinutes || 0,
      }
    })

    if (activePlan) {
      const restDays = activePlan.weeklySchedule
        .filter((s: WeeklyDay) => s.isRestDay)
        .map((s: WeeklyDay) => s.dayOfWeek.toLowerCase())

      for (let d = 1; d <= endOfMonth.getDate(); d++) {
        const date = new Date(year, month - 1, d)
        const dayName = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ][date.getDay()]
        const dateKey = date.toISOString().split('T')[0]
        if (restDays.includes(dayName) && !dayMap[dateKey]) {
          dayMap[dateKey] = { status: 'rest', sessionName: 'Rest Day', duration: 0 }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        days: dayMap,
        summary: {
          completed: logs.filter((l) => l.status === 'completed').length,
          skipped: logs.filter((l) => l.status === 'skipped').length,
          missed: logs.filter((l) => l.status === 'missed').length,
        },
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
