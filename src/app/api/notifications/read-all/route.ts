import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { Notification } from '@/models'

export async function PUT(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) return authResult

    await Notification.updateMany({ userId: authResult.userId, isRead: false }, { isRead: true })

    return NextResponse.json({ success: true, message: 'All notifications marked as read' })
  } catch (err: unknown) {
    console.error('Mark all read error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
