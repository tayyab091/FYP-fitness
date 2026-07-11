import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { Exercise } from '@/models'
import { searchExercises } from '@/services/exerciseService'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10) || 1
    const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '12', 10) || 12
    const skip = (page - 1) * limit

    const filters: Record<string, unknown> = {}
    const search = req.nextUrl.searchParams.get('search')
    const muscle = req.nextUrl.searchParams.get('muscle')
    const wgerMuscleId = req.nextUrl.searchParams.get('wgerMuscleId')
    const difficulty = req.nextUrl.searchParams.get('difficulty')
    const equipment = req.nextUrl.searchParams.get('equipment')

    if (search) filters.name = search
    if (muscle) filters.muscle = muscle
    if (wgerMuscleId) filters.wgerMuscleId = parseInt(wgerMuscleId, 10)
    if (difficulty) filters.difficulty = difficulty
    if (equipment) filters.equipment = equipment

    const result = await searchExercises(filters)
    const paginatedData = result.data.slice(skip, skip + limit)

    return NextResponse.json({
      success: true,
      exercises: paginatedData,
      fromCache: result.fromCache,
      pagination: {
        page,
        limit,
        total: result.count,
        pages: Math.ceil(result.count / limit),
      },
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Get exercises error:', err)
    return NextResponse.json(
      { success: false, message: 'Server error', error: err.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const body = await req.json()
    const { name, type, muscle, equipment, difficulty, instructions } = body

    if (!name || !instructions) {
      return NextResponse.json(
        { success: false, message: 'Name and instructions are required' },
        { status: 400 }
      )
    }

    const exercise = await Exercise.create({
      name,
      type,
      muscle,
      equipment,
      difficulty,
      instructions,
      isActive: true,
      createdBy: authResult.userId,
      updatedBy: authResult.userId,
      dataSource: 'manual',
      cachedAt: new Date(),
    })

    return NextResponse.json(
      { success: true, data: exercise, message: 'Exercise created successfully' },
      { status: 201 }
    )
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; errors?: Record<string, { message: string }> }
    console.error('❌ Error saving exercise:', err.message)
    if (err.name === 'ValidationError' && err.errors) {
      const messages = Object.values(err.errors).map((val) => val.message)
      return NextResponse.json({ success: false, message: messages.join(', ') }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to create exercise', error: err.message },
      { status: 500 }
    )
  }
}
