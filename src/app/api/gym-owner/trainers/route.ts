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

    const trainers = await Trainer.find({ gymId: gym._id }).populate('userId', 'fullName email phoneNumber')

    return NextResponse.json({ success: true, data: trainers })
  } catch (err: unknown) {
    console.error('Get trainers error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
