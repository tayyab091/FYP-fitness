import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireGymOwner } from '@/lib/middleware/permissions'
import { Gym } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireGymOwner(req)
    if (isNextResponse(authResult)) return authResult

    const gym = await Gym.findOne({ ownerId: authResult.userId })
    if (!gym) {
      return NextResponse.json({ success: false, error: 'Gym not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        revenue: { thisMonth: 0, lastMonth: 0, total: 0 },
        subscriptions: { active: gym.memberCount, churnedThisMonth: 0 },
        engagement: { activeUsers: gym.memberCount, messagesThisMonth: 0, avgResponseTime: 0 },
      },
    })
  } catch (err: unknown) {
    console.error('Analytics error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
