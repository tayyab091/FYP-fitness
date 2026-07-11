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
    const { reason } = await req.json()

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

    trainer.gymVerificationStatus = 'rejected'
    ;(trainer as { verificationNote?: string }).verificationNote = reason || ''
    await trainer.save()

    return NextResponse.json({ success: true, data: trainer, message: 'Trainer rejected' })
  } catch (err: unknown) {
    console.error('Reject trainer error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
