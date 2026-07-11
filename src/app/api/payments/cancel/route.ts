import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { User } from '@/models'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) return authResult

    const user = await User.findById(authResult.userId)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    if (!user.subscription || user.subscription.status === 'inactive') {
      return NextResponse.json({ message: 'No active subscription to cancel' }, { status: 400 })
    }

    user.subscription.status = 'cancelled'
    await user.save()

    return NextResponse.json({ message: 'Subscription cancelled successfully' })
  } catch (err: unknown) {
    console.error('Cancel subscription error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ message: 'Failed to cancel subscription', error: message }, { status: 500 })
  }
}
