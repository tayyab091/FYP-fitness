import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { AuditLog } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const skip = (page - 1) * limit
    const filter: Record<string, unknown> = {}

    const action = searchParams.get('action')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (action) filter.action = action
    if (from) filter.createdAt = { $gte: new Date(from) }
    if (to) {
      filter.createdAt = { ...(filter.createdAt as object), $lte: new Date(to) }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('performedBy', 'fullName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: { page, total, pages: Math.ceil(total / limit) },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
