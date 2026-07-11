import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { createAuditLog } from '@/lib/auditLog'
import { Gym } from '@/models'

type RouteParams = { params: Promise<{ id: string }> }

function getClientIp(req: NextRequest): string | undefined {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    const { id } = await params
    const { reason } = await req.json()

    const gym = await Gym.findById(id)
    if (!gym) {
      return NextResponse.json({ success: false, error: 'Gym not found' }, { status: 404 })
    }

    gym.verificationStatus = 'suspended'
    gym.isActive = false
    await gym.save()

    await createAuditLog(
      authResult.userId,
      'suspended_gym',
      gym._id,
      'Gym',
      { gymName: gym.name, reason },
      getClientIp(req)
    )

    return NextResponse.json({ success: true, data: gym, message: 'Gym suspended' })
  } catch (err: unknown) {
    console.error('Suspend gym error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
