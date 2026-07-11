import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { createAuditLog } from '@/lib/auditLog'
import { Gym, Notification } from '@/models'

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

    if (!reason) {
      return NextResponse.json({ success: false, error: 'Rejection reason is required' }, { status: 400 })
    }

    const gym = await Gym.findById(id)
    if (!gym) {
      return NextResponse.json({ success: false, error: 'Gym not found' }, { status: 404 })
    }

    gym.verificationStatus = 'rejected'
    gym.verificationNote = reason
    await gym.save()

    await createAuditLog(
      authResult.userId,
      'rejected_gym',
      gym._id,
      'Gym',
      { gymName: gym.name, reason },
      getClientIp(req)
    )

    await Notification.create({
      userId: gym.ownerId,
      type: 'gym_rejected',
      title: 'Gym Verification Rejected',
      message: `Your gym verification was rejected. Reason: ${reason}`,
      link: '/gym-owner',
      metadata: { gymId: gym._id, reason },
    })

    return NextResponse.json({ success: true, data: gym, message: 'Gym rejected' })
  } catch (err: unknown) {
    console.error('Reject gym error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
