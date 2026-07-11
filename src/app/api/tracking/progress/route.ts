import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { requireActiveRelationship } from '@/lib/middleware/relationships'
import { ProgressRecord, Trainer, TrainerClientRelationship } from '@/models'

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
    const { bodyMetrics, fitnessMetrics, photos, notes, enteredBy } = body

    if (!bodyMetrics) {
      return NextResponse.json(
        { success: false, error: 'bodyMetrics is required' },
        { status: 400 }
      )
    }

    const record = await ProgressRecord.create({
      userId,
      trainerId: relResult.relationship.trainerId,
      relationshipId: relResult.relationship._id,
      recordedAt: new Date(),
      bodyMetrics,
      fitnessMetrics,
      photos,
      notes,
      enteredBy: enteredBy || 'user',
    })

    return NextResponse.json(
      {
        success: true,
        data: record,
        message: 'Progress recorded',
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create progress record'
    console.error('Error creating progress record:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to create progress record', message },
      { status: 500 }
    )
  }
}
