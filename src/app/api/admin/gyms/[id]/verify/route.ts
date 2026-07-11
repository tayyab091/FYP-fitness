import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { createAuditLog } from '@/lib/auditLog'
import { User, Gym, Notification } from '@/models'

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
    const gym = await Gym.findById(id)
    if (!gym) {
      return NextResponse.json({ success: false, error: 'Gym not found' }, { status: 404 })
    }

    gym.verificationStatus = 'verified'
    gym.verifiedAt = new Date()
    gym.verifiedBy = authResult.userId as never
    await gym.save()

    if (gym.ownerId) {
      await User.findByIdAndUpdate(gym.ownerId, { verificationStatus: 'verified' }, { new: true })
    }

    await createAuditLog(
      authResult.userId,
      'verified_gym',
      gym._id,
      'Gym',
      { gymName: gym.name, country: gym.address.country },
      getClientIp(req)
    )

    await Notification.create({
      userId: gym.ownerId,
      type: 'gym_verified',
      title: 'Gym Verified',
      message: `Your gym "${gym.name}" has been verified and is now live on the platform!`,
      link: '/gym-owner',
      metadata: { gymId: gym._id },
    })

    return NextResponse.json({ success: true, data: gym, message: 'Gym verified successfully' })
  } catch (err: unknown) {
    console.error('Verify gym error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
