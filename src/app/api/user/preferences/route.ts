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
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const preferences = {
      language: user.language || 'en',
      timezone: user.timezone || 'UTC+00:00',
      currency: user.currency || 'USD',
    }

    return NextResponse.json({ success: true, data: { preferences } })
  } catch (err: unknown) {
    console.error('Get preferences error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) return authResult

    const { language, timezone, currency } = await req.json()

    const user = await User.findByIdAndUpdate(
      authResult.userId,
      {
        ...(language && { language }),
        ...(timezone && { timezone }),
        ...(currency && { currency }),
      },
      { new: true }
    )

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const preferences = {
      language: user.language || 'en',
      timezone: user.timezone || 'UTC+00:00',
      currency: user.currency || 'USD',
    }

    return NextResponse.json({ success: true, message: 'Preferences updated', data: { preferences } })
  } catch (err: unknown) {
    console.error('Update preferences error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
