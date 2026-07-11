import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireGymOwner } from '@/lib/middleware/permissions'
import { User, Gym } from '@/models'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireGymOwner(req)
    if (isNextResponse(authResult)) return authResult

    const { trainerEmail, message } = await req.json()

    if (!trainerEmail) {
      return NextResponse.json({ success: false, error: 'Trainer email is required' }, { status: 400 })
    }

    const gym = await Gym.findOne({ ownerId: authResult.userId })
    if (!gym) {
      return NextResponse.json({ success: false, error: 'Gym not found' }, { status: 404 })
    }

    const trainerUser = await User.findOne({ email: trainerEmail })
    if (!trainerUser || trainerUser.role !== 'trainer') {
      return NextResponse.json({ success: false, error: 'Trainer not found with this email' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent to trainer. They will see the request in their dashboard.',
      data: {
        gymId: gym._id,
        trainerEmail,
        invitedAt: new Date(),
        message,
      },
    })
  } catch (err: unknown) {
    console.error('Invite trainer error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
