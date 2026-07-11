import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { PlatformSettings, User } from '@/models'

type RouteParams = { params: Promise<{ key: string }> }

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    const user = await User.findById(authResult.userId)
    if (user?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Only super admins can update settings' }, { status: 403 })
    }

    const { key } = await params
    const { value } = await req.json()

    const updated = await PlatformSettings.findOneAndUpdate(
      { settingKey: key },
      { settingValue: value, lastUpdatedBy: authResult.userId, updatedAt: new Date() },
      { new: true, upsert: true }
    )

    return NextResponse.json({ success: true, data: updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
