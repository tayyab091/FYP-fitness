import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { Notification, Trainer, TrainerClientRelationship } from '@/models'

type RouteParams = { params: Promise<{ trainerId: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const userId = authResult.userId
    const { trainerId } = await params

    const trainer = await Trainer.findById(trainerId)
    if (!trainer || !trainer.isFullyVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trainer not found or not verified',
        },
        { status: 404 }
      )
    }

    const existingRelationship = await TrainerClientRelationship.findOne({
      trainerId,
      userId,
    })

    if (existingRelationship) {
      return NextResponse.json(
        {
          success: false,
          error: 'Relationship already exists with this trainer',
          status: existingRelationship.status,
        },
        { status: 400 }
      )
    }

    const relationship = await TrainerClientRelationship.create({
      trainerId,
      userId,
      initiatedBy: 'user',
      status: 'pending',
      accessFlags: {
        canChat: false,
        canViewSchedule: false,
        canViewProgress: false,
        canEditSchedule: false,
        canViewNutrition: false,
      },
      freeMessagesUsed: 0,
      freeMessagesLimit: 5,
      requestedAt: new Date(),
      isActive: true,
    })

    await Notification.create({
      userId: trainerId,
      type: 'client_request',
      title: 'New Client Request',
      message: `${(req as NextRequest & { user?: { fullName?: string } }).user?.fullName || 'A user'} requested to connect with you`,
      link: `/trainer/requests`,
    })

    console.log(`✅ Relationship request created: ${userId} → ${trainerId}`)

    return NextResponse.json(
      {
        success: true,
        data: relationship,
        message: 'Request sent to trainer',
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error('❌ Error creating relationship request:', err)
    const message = err instanceof Error ? err.message : 'Failed to create relationship request'
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create relationship request',
        message,
      },
      { status: 500 }
    )
  }
}
