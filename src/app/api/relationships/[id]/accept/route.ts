import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { Conversation, Notification, TrainerClientRelationship, User } from '@/models'

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
          error: 'Unauthorized to accept this request',
        },
        { status: 403 }
      )
    }

    let conversation = await Conversation.findById(relationship.conversationId)

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [
          { userId: relationship.userId, role: 'user' },
          { userId: trainerId, role: 'trainer' },
        ],
        trainerId,
        isFreeChat: false,
        relationshipId: relationship._id,
      })
    }

    relationship.status = 'active'
    relationship.acceptedAt = new Date()
    relationship.accessFlags = {
      canChat: true,
      canViewSchedule: true,
      canViewProgress: true,
      canEditSchedule: true,
      canViewNutrition: true,
    }
    relationship.conversationId = conversation._id
    await relationship.save()

    const trainer = await User.findById(trainerId)
    await Notification.create({
      userId: relationship.userId,
      type: 'request_accepted',
      title: 'Trainer Accepted!',
      message: `${trainer?.fullName || 'Your trainer'} accepted your request!`,
      link: `/chat`,
    })

    console.log(`✅ Relationship accepted: ${relationshipId}`)

    return NextResponse.json({
      success: true,
      data: relationship,
      message: 'Request accepted',
    })
  } catch (err: unknown) {
    console.error('❌ Error accepting request:', err)
    const message = err instanceof Error ? err.message : 'Failed to accept request'
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to accept request',
        message,
      },
      { status: 500 }
    )
  }
}
