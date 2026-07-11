import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { createAuditLog } from '@/lib/auditLog'
import { Trainer, Notification } from '@/models'

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

    const trainer = await Trainer.findById(id).populate('userId')
    if (!trainer) {
      return NextResponse.json({ success: false, error: 'Trainer not found' }, { status: 404 })
    }

    trainer.adminVerificationStatus = 'rejected'
    ;(trainer as { verificationNote?: string }).verificationNote = reason
    trainer.isFullyVerified = false
    await trainer.save()

    await createAuditLog(
      authResult.userId,
      'rejected_trainer',
      trainer._id,
      'Trainer',
      { trainerName: trainer.name, reason },
      getClientIp(req)
    )

    if (trainer.userId) {
      await Notification.create({
        userId: (trainer.userId as { _id: string })._id,
        type: 'trainer_rejected',
        title: 'Trainer Verification Rejected',
        message: `Your trainer verification was rejected. Reason: ${reason}`,
        link: '/trainer',
        metadata: { trainerId: trainer._id, reason },
      })
    }

    return NextResponse.json({ success: true, data: trainer, message: 'Trainer rejected' })
  } catch (err: unknown) {
    console.error('Reject trainer error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
