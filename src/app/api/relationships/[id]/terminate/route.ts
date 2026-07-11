import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { Notification, TrainerClientRelationship } from '@/models'

type RouteParams = { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const userId = authResult.userId
    const { id: relationshipId } = await params
    const { reason } = await req.json()

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

    const isTrainer = relationship.trainerId.toString() === userId
    const isUser = relationship.userId.toString() === userId

    if (!isTrainer && !isUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized to terminate this relationship',
        },
        { status: 403 }
      )
    }

    relationship.status = 'terminated'
    relationship.terminatedBy = userId as typeof relationship.terminatedBy
    relationship.terminationReason = reason || 'Relationship ended'
    relationship.terminatedAt = new Date()
    await relationship.save()

    const otherUserId = isTrainer ? relationship.userId : relationship.trainerId
    await Notification.create({
      userId: otherUserId,
      type: 'relationship_terminated',
      title: 'Relationship Ended',
      message: 'Your trainer-client relationship has ended',
    })

    console.log(`✅ Relationship terminated: ${relationshipId}`)

    return NextResponse.json({
      success: true,
      message: 'Relationship terminated',
    })
  } catch (err: unknown) {
    console.error('❌ Error terminating relationship:', err)
    const message = err instanceof Error ? err.message : 'Failed to terminate relationship'
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to terminate relationship',
        message,
      },
      { status: 500 }
    )
  }
}
