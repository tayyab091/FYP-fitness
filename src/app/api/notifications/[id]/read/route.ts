import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { Notification } from '@/models'

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) return authResult

    const { id } = await params
    const notification = await Notification.findById(id)

    if (!notification) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 })
    }

    if (notification.userId.toString() !== authResult.userId) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
    }

    notification.isRead = true
    await notification.save()

    return NextResponse.json({ success: true, data: notification })
  } catch (err: unknown) {
    console.error('Mark read error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
