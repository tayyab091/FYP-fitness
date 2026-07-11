import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { User } from '@/models'

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    await connectDB()

    const user = await User.findById(authResult.userId).select('-password')
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        verificationStatus: user.verificationStatus,
        subscription: user.subscription
          ? { plan: user.subscription.plan, status: user.subscription.status }
          : { plan: 'basic', status: 'active' },
      },
    })
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
