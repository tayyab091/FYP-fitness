import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireGymOwner } from '@/lib/middleware/permissions'
import { Gym, Trainer } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireGymOwner(req)
    if (isNextResponse(authResult)) return authResult

    const gym = await Gym.findOne({ ownerId: authResult.userId })
    if (!gym) {
      return NextResponse.json({ success: false, error: 'Gym not found' }, { status: 404 })
    }

    const trainerCount = gym.trainers.length
    const pendingTrainers = await Trainer.countDocuments({
      gymId: gym._id,
      gymVerificationStatus: 'pending',
    })
    const memberCount = gym.memberCount

    return NextResponse.json({
      success: true,
      data: {
        gym: {
          id: gym._id,
          name: gym.name,
          verificationStatus: gym.verificationStatus,
        },
        stats: {
          trainerCount,
          pendingTrainers,
          memberCount,
          platformPlan: gym.platformPlan,
        },
        verificationProgress: {
          status: gym.verificationStatus,
          verifiedAt: gym.verifiedAt,
          verificationNote: gym.verificationNote,
          submittedAt: gym.createdAt,
        },
      },
    })
  } catch (err: unknown) {
    console.error('Dashboard error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
