import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse } from '@/lib/middleware/auth'
import { checkAccessFlag, requireActiveRelationship } from '@/lib/middleware/relationships'
import { getTrainerIdFromPlan } from '@/lib/trackingHelpers'
import { WorkoutPlan } from '@/models'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id } = await params
    const trainerId = await getTrainerIdFromPlan(id)
    const relResult = await requireActiveRelationship(
      req,
      undefined,
      trainerId ? { trainerId } : undefined
    )
    if (isNextResponse(relResult)) {
      return relResult
    }

    const accessDenied = await checkAccessFlag(relResult.relationship, 'canEditSchedule')
    if (accessDenied) {
      return accessDenied
    }

    const plan = await WorkoutPlan.findByIdAndUpdate(
      id,
      {
        status: 'active',
        startDate: new Date(),
      },
      { new: true }
    )

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: plan,
      message: 'Workout plan activated',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to activate plan'
    console.error('Error activating plan:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to activate plan', message },
      { status: 500 }
    )
  }
}
