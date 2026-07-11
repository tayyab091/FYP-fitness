import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { ProgressRecord, WorkoutLog, WorkoutPlan, type IWorkoutPlan } from '@/models'

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
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const date = new Date(dateStr)

    const dayOfWeek = date.getDay()
    const monday = new Date(date)
    monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const activePlan = await WorkoutPlan.findOne({ userId, status: 'active' }).populate(
      'trainerId',
      'name imageUrl'
    )

    const weekLogs = await WorkoutLog.find({
      userId,
      scheduledDate: { $gte: monday, $lte: sunday },
    }).sort({ scheduledDate: 1 })

    await ProgressRecord.find({
      userId,
      recordedAt: { $gte: monday, $lte: sunday },
    })

    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      const dayName = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ][i]

      const scheduledSession = activePlan?.weeklySchedule?.find(
        (s: WeeklyDay) => s.dayOfWeek.toLowerCase() === dayName
      )

      const log = weekLogs.find((l) => {
        const logDate = new Date(l.scheduledDate)
        return logDate.toDateString() === day.toDateString()
      })

      days.push({
        date: day.toISOString().split('T')[0],
        dayName,
        dayLabel: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        isToday: day.toDateString() === new Date().toDateString(),
        isPast: day < new Date(),
        scheduledSession: scheduledSession || null,
        log: log || null,
        status: log?.status || (scheduledSession?.isRestDay ? 'rest' : 'pending'),
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        weekStart: monday.toISOString().split('T')[0],
        weekEnd: sunday.toISOString().split('T')[0],
        activePlan: activePlan
          ? {
              id: activePlan._id,
              title: activePlan.title,
              goal: activePlan.goal,
              trainer: activePlan.trainerId,
            }
          : null,
        days,
        weekSummary: {
          completed: weekLogs.filter((l) => l.status === 'completed').length,
          skipped: weekLogs.filter((l) => l.status === 'skipped').length,
          missed: weekLogs.filter((l) => l.status === 'missed').length,
          pending: days.filter((d) => d.status === 'pending').length,
          totalWorkouts: activePlan
            ? days.filter((d) => d.scheduledSession && !d.scheduledSession.isRestDay).length
            : 0,
        },
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
