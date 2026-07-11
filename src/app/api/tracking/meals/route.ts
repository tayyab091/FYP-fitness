import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { requireActiveRelationship } from '@/lib/middleware/relationships'
import { Trainer, TrainerClientRelationship, MealLog } from '@/models'

async function resolveRelationshipBody(
  userId: string,
  userRole: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (typeof body.trainerId === 'string') {
    return body
  }

  const relationship = await TrainerClientRelationship.findOne({
    userId,
    status: 'active',
    isActive: true,
  })

  if (relationship?.trainerId) {
    return { ...body, trainerId: relationship.trainerId.toString() }
  }

  if (userRole === 'trainer') {
    const trainerProfile = await Trainer.findOne({ userId })
    if (trainerProfile && typeof body.userId === 'string') {
      return { ...body, trainerId: body.userId }
    }
  }

  return body
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const body = await req.json()
    const enrichedBody = await resolveRelationshipBody(
      authResult.userId,
      authResult.userRole,
      body
    )
    const relResult = await requireActiveRelationship(req, undefined, enrichedBody)
    if (isNextResponse(relResult)) {
      return relResult
    }

    const userId = relResult.userId
    const { mealType, foods, waterIntakeMl, notes } = body

    if (!mealType || !foods || foods.length === 0) {
      return NextResponse.json(
        { success: false, error: 'mealType and foods array are required' },
        { status: 400 }
      )
    }

    const totals = {
      calories: foods.reduce((sum: number, f: { calories?: number }) => sum + (f.calories || 0), 0),
      protein: foods.reduce((sum: number, f: { protein?: number }) => sum + (f.protein || 0), 0),
      carbs: foods.reduce((sum: number, f: { carbs?: number }) => sum + (f.carbs || 0), 0),
      fat: foods.reduce((sum: number, f: { fat?: number }) => sum + (f.fat || 0), 0),
      fiber: foods.reduce((sum: number, f: { fiber?: number }) => sum + (f.fiber || 0), 0),
    }

    const mealLog = await MealLog.create({
      userId,
      trainerId: relResult.relationship.trainerId,
      relationshipId: relResult.relationship._id,
      loggedAt: new Date(),
      mealType,
      foods,
      totals,
      waterIntakeMl,
      notes,
    })

    return NextResponse.json(
      {
        success: true,
        data: mealLog,
        message: 'Meal logged',
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to log meal'
    console.error('Error logging meal:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to log meal', message },
      { status: 500 }
    )
  }
}
