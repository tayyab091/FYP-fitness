import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Gym } from '@/models'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const { id } = await params

    const gym = await Gym.findById(id)
      .populate({
        path: 'trainers',
        select: 'name specialty rating profileVideoUrl isFullyVerified',
        match: { isFullyVerified: true },
      })
      .populate('ownerId', 'fullName email phoneNumber')

    if (!gym) {
      return NextResponse.json({ success: false, error: 'Gym not found' }, { status: 404 })
    }

    if (gym.verificationStatus !== 'verified') {
      return NextResponse.json({ success: false, error: 'This gym is not yet verified' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: gym })
  } catch (err: unknown) {
    console.error('Get gym by ID error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
