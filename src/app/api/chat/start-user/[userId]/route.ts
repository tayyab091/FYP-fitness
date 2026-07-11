import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { Conversation, Trainer, TrainerClientRelationship, User } from '@/models'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const trainerId = authResult.userId
    const { userId } = await params

    if (authResult.userRole !== 'trainer') {
      return NextResponse.json(
        { success: false, error: 'Only trainers can use this endpoint' },
        { status: 403 }
      )
    }

    const trainer = await Trainer.findOne({ userId: trainerId })
    if (!trainer) {
      return NextResponse.json(
        { success: false, error: 'Trainer profile not found' },
        { status: 404 }
      )
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    let conversation = await Conversation.findOne({
      'participants.userId': userId,
      trainerId: trainer._id,
    })

    if (conversation) {
      return NextResponse.json({
        success: true,
        data: conversation,
        message: 'Existing conversation opened',
      })
    }

    let relationship = await TrainerClientRelationship.findOne({
      trainerId: trainer._id,
      userId,
      status: 'active',
    })

    const relationshipCreated = !relationship

    if (!relationship) {
      relationship = await TrainerClientRelationship.create({
        trainerId: trainer._id,
        userId,
        status: 'active',
        initiatedBy: 'trainer',
        accessFlags: {
          canChat: true,
          canViewSchedule: false,
          canViewProgress: false,
          canEditSchedule: false,
          canViewNutrition: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    conversation = await Conversation.create({
      participants: [
        { userId, role: 'user', lastSeen: new Date(), isTyping: false },
        {
          userId: trainerId,
          role: 'trainer',
          lastSeen: new Date(),
          isTyping: false,
        },
      ],
      trainerId: trainer._id,
      isFreeChat: false,
      freeMessageCount: 0,
      status: 'active',
      unreadCount: { user: 0, trainer: 0 },
    })

    return NextResponse.json(
      {
        success: true,
        data: conversation,
        message: 'Conversation started',
        relationshipCreated,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('Start conversation (trainer) error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
