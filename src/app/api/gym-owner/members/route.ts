import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireGymOwner } from '@/lib/middleware/permissions'
import { User, Gym } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireGymOwner(req)
    if (isNextResponse(authResult)) return authResult

    const { searchParams } = new URL(req.url)
    const skip = parseInt(searchParams.get('skip') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')

    const gym = await Gym.findOne({ ownerId: authResult.userId })
    if (!gym) {
      return NextResponse.json({ success: false, error: 'Gym not found' }, { status: 404 })
    }

    const members = await User.find({
      'subscription.status': 'active',
      country: gym.address.country,
    })
      .select('fullName email phoneNumber country subscription')
      .skip(skip)
      .limit(limit)

    const total = await User.countDocuments({
      'subscription.status': 'active',
      country: gym.address.country,
    })

    return NextResponse.json({
      success: true,
      data: members,
      pagination: { skip, limit, total },
    })
  } catch (err: unknown) {
    console.error('Get members error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
