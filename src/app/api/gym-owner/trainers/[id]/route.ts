import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireGymOwner } from '@/lib/middleware/permissions'
import { Gym, Trainer } from '@/models'

type RouteParams = { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const authResult = await requireGymOwner(req)
    if (isNextResponse(authResult)) return authResult

    const { id } = await params
    const gym = await Gym.findOne({ ownerId: authResult.userId })
    if (!gym) {
      return NextResponse.json({ success: false, error: 'Gym not found' }, { status: 404 })
    }

    const trainer = await Trainer.findById(id)
    if (!trainer) {
      return NextResponse.json({ success: false, error: 'Trainer not found' }, { status: 404 })
    }

    if (trainer.gymId?.toString() !== gym._id.toString()) {
      return NextResponse.json({ success: false, error: 'This trainer does not belong to your gym' }, { status: 403 })
    }

    gym.trainers = gym.trainers.filter((t: { toString: () => string }) => t.toString() !== id)
    await gym.save()

    trainer.gymId = undefined
    trainer.gymVerificationStatus = 'pending'
    await trainer.save()

    return NextResponse.json({ success: true, message: 'Trainer removed from gym' })
  } catch (err: unknown) {
    console.error('Remove trainer error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
