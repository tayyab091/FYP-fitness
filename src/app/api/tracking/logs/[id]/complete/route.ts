import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse } from '@/lib/middleware/auth'
import { requireActiveRelationship } from '@/lib/middleware/relationships'
import { getTrainerIdFromLog } from '@/lib/trackingHelpers'
import { WorkoutLog, type IWorkoutLog } from '@/models'

type WorkoutExercise = IWorkoutLog['exercises'][number]
type CompletedSet = WorkoutExercise['completedSets'][number]

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id } = await params
    const body = await req.json()
    const trainerId = await getTrainerIdFromLog(id)
    const relResult = await requireActiveRelationship(req, undefined, {
      ...body,
      trainerId: body.trainerId || trainerId,
    })
    if (isNextResponse(relResult)) {
      return relResult
    }

    const { userFeedback } = body

    const log = await WorkoutLog.findById(id)

    if (!log) {
      return NextResponse.json(
        { success: false, error: 'Workout log not found' },
        { status: 404 }
      )
    }

    const totalVolume = log.exercises.reduce((sum: number, ex: WorkoutExercise) => {
      const volume = ex.completedSets.reduce(
        (exSum: number, set: CompletedSet) => exSum + (set.reps * set.weight || 0),
        0
      )
      return sum + volume
    }, 0)

    const completedExercises = log.exercises.filter((ex: WorkoutExercise) => !ex.wasSkipped).length
    const totalExercises = log.exercises.length
    const completionRate =
      totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0

    log.status = 'completed'
    log.finishedAt = new Date()
    log.completedDate = new Date()
    if (log.startedAt && log.finishedAt) {
      log.durationMinutes = Math.round(
        (log.finishedAt.getTime() - log.startedAt.getTime()) / 1000 / 60
      )
    }
    log.userFeedback = userFeedback
    log.metrics = {
      totalVolume,
      completionRate,
    }

    await log.save()

    return NextResponse.json({
      success: true,
      data: log,
      message: 'Workout logged',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to complete workout'
    console.error('Error completing workout:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to complete workout', message },
      { status: 500 }
    )
  }
}
