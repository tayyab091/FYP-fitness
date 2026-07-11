import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { createAuditLog } from '@/lib/auditLog'
import { User, Trainer, Notification } from '@/models'

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
    const trainer = await Trainer.findById(id).populate('userId')
    if (!trainer) {
      return NextResponse.json({ success: false, error: 'Trainer not found' }, { status: 404 })
    }

    if (trainer.gymId) {
      if (trainer.gymVerificationStatus !== 'approved') {
        return NextResponse.json(
          { success: false, error: 'Gym owner has not yet approved this trainer' },
          { status: 400 }
        )
      }
    } else if (trainer.gymVerificationStatus !== 'not_required') {
      trainer.gymVerificationStatus = 'not_required'
    }

    trainer.adminVerificationStatus = 'approved'
    trainer.adminVerifiedAt = new Date()
    trainer.adminVerifiedBy = authResult.userId as never
    trainer.isFullyVerified = true

    if (trainer.userId) {
      const userId =
        typeof trainer.userId === 'string' ? trainer.userId : (trainer.userId as { _id: string })._id
      const user = await User.findById(userId)
      if (user) {
        user.verificationStatus = 'verified'
        await user.save()
      }
    }

    await trainer.save()

    await createAuditLog(
      authResult.userId,
      'verified_trainer',
      trainer._id,
      'Trainer',
      { trainerName: trainer.name || 'Unknown' },
      getClientIp(req)
    )

    if (trainer.userId) {
      const userId =
        typeof trainer.userId === 'string' ? trainer.userId : (trainer.userId as { _id: string })._id
      await Notification.create({
        userId,
        type: 'trainer_verified',
        title: 'Trainer Verified',
        message: 'Your trainer profile has been verified! You can now start accepting clients.',
        link: '/trainer',
        metadata: { trainerId: trainer._id },
      })
    }

    return NextResponse.json({ success: true, data: trainer, message: 'Trainer verified successfully' })
  } catch (err: unknown) {
    console.error('Verify trainer error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
