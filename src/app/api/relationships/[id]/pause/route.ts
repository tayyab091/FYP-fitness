import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { Notification, TrainerClientRelationship } from '@/models'

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const trainerId = authResult.userId
    const { id: relationshipId } = await params

    const relationship = await TrainerClientRelationship.findById(relationshipId)

    if (!relationship) {
      return NextResponse.json(
        {
          success: false,
          error: 'Relationship not found',
        },
        { status: 404 }
      )
    }

    if (relationship.trainerId.toString() !== trainerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized to pause this relationship',
        },
        { status: 403 }
      )
    }

    relationship.status = 'paused'
    relationship.accessFlags.canChat = false
    await relationship.save()

    await Notification.create({
      userId: relationship.userId,
      type: 'trainer_paused',
      title: 'Trainer On Leave',
      message: 'Your trainer is temporarily unavailable',
    })

    console.log(`✅ Relationship paused: ${relationshipId}`)

    return NextResponse.json({
      success: true,
      message: 'Relationship paused',
    })
  } catch (err: unknown) {
    console.error('❌ Error pausing relationship:', err)
    const message = err instanceof Error ? err.message : 'Failed to pause relationship'
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to pause relationship',
        message,
      },
      { status: 500 }
    )
  }
}
