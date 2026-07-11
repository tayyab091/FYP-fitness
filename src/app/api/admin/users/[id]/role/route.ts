import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { User } from '@/models'

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    const { id } = await params
    const { role } = await req.json()

    if (!role || !['admin', 'trainer', 'user'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })
    }

    if (authResult.userId === id && role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Cannot remove your own admin role' }, { status: 403 })
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password')
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, user })
  } catch (err: unknown) {
    console.error('Update role error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
