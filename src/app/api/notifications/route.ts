import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { Notification } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) return authResult

    const { searchParams } = new URL(req.url)
    const skip = parseInt(searchParams.get('skip') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')

    const notifications = await Notification.find({ userId: authResult.userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const total = await Notification.countDocuments({ userId: authResult.userId })

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: { skip, limit, total },
    })
  } catch (err: unknown) {
    console.error('Get notifications error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
