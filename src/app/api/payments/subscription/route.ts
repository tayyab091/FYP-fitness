import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { User } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) return authResult

    const user = await User.findById(authResult.userId)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      subscription: user.subscription || { plan: null, status: 'inactive' },
    })
  } catch (err: unknown) {
    console.error('Get subscription error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ message: 'Failed to fetch subscription', error: message }, { status: 500 })
  }
}
