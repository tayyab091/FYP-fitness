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

    if (relationship.userId.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized to cancel this relationship',
        },
        { status: 403 }
      )
    }

    relationship.status = 'terminated'
    relationship.terminatedBy = userId as typeof relationship.terminatedBy
    relationship.terminatedAt = new Date()
    await relationship.save()

    await Notification.create({
      userId: relationship.trainerId,
      type: 'relationship_terminated',
      title: 'Relationship Ended',
      message: 'A client has ended their relationship with you',
    })

    console.log(`✅ Relationship cancelled: ${relationshipId}`)

    return NextResponse.json({
      success: true,
      message: 'Relationship cancelled',
    })
  } catch (err: unknown) {
    console.error('❌ Error cancelling relationship:', err)
    const message = err instanceof Error ? err.message : 'Failed to cancel relationship'
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel relationship',
        message,
      },
      { status: 500 }
    )
  }
}
