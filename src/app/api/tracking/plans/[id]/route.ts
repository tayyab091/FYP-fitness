import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse } from '@/lib/middleware/auth'
import { checkAccessFlag, requireActiveRelationship } from '@/lib/middleware/relationships'
import { getTrainerIdFromPlan } from '@/lib/trackingHelpers'
import { WorkoutPlan } from '@/models'

export async function GET(
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

    const plan = await WorkoutPlan.findById(id).populate('trainerId', '-password')

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: plan,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch plan'
    console.error('Error fetching plan:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plan', message },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id } = await params
    const body = await req.json()
    const trainerId = await getTrainerIdFromPlan(id)
    const relResult = await requireActiveRelationship(req, undefined, {
      ...body,
      trainerId: body.trainerId || trainerId,
    })
    if (isNextResponse(relResult)) {
      return relResult
    }

    const accessDenied = await checkAccessFlag(relResult.relationship, 'canEditSchedule')
    if (accessDenied) {
      return accessDenied
    }

    const { title, description, weeklySchedule, trainerNotes } = body

    const plan = await WorkoutPlan.findByIdAndUpdate(
      id,
      {
        title,
        description,
        weeklySchedule,
        trainerNotes,
      },
      { new: true, runValidators: true }
    )

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: plan,
      message: 'Plan updated',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update plan'
    console.error('Error updating plan:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to update plan', message },
      { status: 500 }
    )
  }
}
