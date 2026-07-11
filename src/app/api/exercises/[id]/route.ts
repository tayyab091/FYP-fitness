import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { Exercise } from '@/models'
import { getExerciseById } from '@/services/exerciseService'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await connectDB()

    const { id } = await context.params
    const result = await getExerciseById(id)

    if (!result.data) {
      return NextResponse.json({ success: false, error: 'Exercise not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      exercise: result.data,
      fromCache: result.fromCache,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Get exercise error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to get exercise' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const { id } = await context.params
    const body = await req.json()
    const { name, type, muscle, equipment, difficulty, instructions } = body

    const exercise = await Exercise.findByIdAndUpdate(
      id,
      {
        name,
        type,
        muscle,
        equipment,
        difficulty,
        instructions,
        updatedBy: authResult.userId,
        cachedAt: new Date(),
      },
      { new: true, runValidators: true }
    )

    if (!exercise) {
      return NextResponse.json({ success: false, message: 'Exercise not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: exercise,
      message: 'Exercise updated successfully',
    })
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; errors?: Record<string, { message: string }> }
    console.error('❌ Error updating exercise:', err.message)
    if (err.name === 'ValidationError' && err.errors) {
      const messages = Object.values(err.errors).map((val) => val.message)
      return NextResponse.json({ success: false, message: messages.join(', ') }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update exercise', error: err.message },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const { id } = await context.params

    const exercise = await Exercise.findByIdAndUpdate(
      id,
      { isActive: false, updatedBy: authResult.userId },
      { new: true }
    )

    if (!exercise) {
      return NextResponse.json({ success: false, message: 'Exercise not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Exercise deleted successfully' })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Error deleting exercise:', err.message)
    return NextResponse.json(
      { success: false, message: 'Failed to delete exercise', error: err.message },
      { status: 500 }
    )
  }
}
