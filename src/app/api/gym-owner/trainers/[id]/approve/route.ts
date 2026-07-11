import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireGymOwner } from '@/lib/middleware/permissions'
import { Gym, Trainer } from '@/models'

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    trainer.gymVerificationStatus = 'approved'
    trainer.gymVerifiedAt = new Date()
    trainer.gymVerifiedBy = authResult.userId as never
    await trainer.save()

    return NextResponse.json({
      success: true,
      data: trainer,
      message: 'Trainer approved. Admin will now review their application.',
    })
  } catch (err: unknown) {
    console.error('Approve trainer error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
