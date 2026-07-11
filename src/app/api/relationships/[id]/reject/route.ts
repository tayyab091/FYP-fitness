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

    if (relationship.trainerId.toString() !== trainerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized to reject this request',
        },
        { status: 403 }
      )
    }

    relationship.status = 'rejected'
    relationship.terminatedBy = trainerId as typeof relationship.terminatedBy
    relationship.terminationReason = reason || 'Trainer declined'
    relationship.terminatedAt = new Date()
    await relationship.save()

    await Notification.create({
      userId: relationship.userId,
      type: 'request_rejected',
      title: 'Request Declined',
      message: reason || 'Your trainer request was declined',
    })

    console.log(`✅ Relationship rejected: ${relationshipId}`)

    return NextResponse.json({
      success: true,
      message: 'Request rejected',
    })
  } catch (err: unknown) {
    console.error('❌ Error rejecting request:', err)
    const message = err instanceof Error ? err.message : 'Failed to reject request'
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reject request',
        message,
      },
      { status: 500 }
    )
  }
}
