import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { createAuditLog } from '@/lib/auditLog'
import { User, Trainer } from '@/models'

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

    const trainer = await Trainer.findById(id).populate('userId')
    if (!trainer) {
      return NextResponse.json({ success: false, error: 'Trainer not found' }, { status: 404 })
    }

    trainer.adminVerificationStatus = 'suspended'
    trainer.isFullyVerified = false
    await trainer.save()

    if (trainer.userId) {
      const user = await User.findById(trainer.userId)
      if (user) {
        user.verificationStatus = 'suspended'
        await user.save()
      }
    }

    await createAuditLog(
      authResult.userId,
      'suspended_trainer',
      trainer._id,
      'Trainer',
      { trainerName: trainer.name, reason },
      getClientIp(req)
    )

    return NextResponse.json({ success: true, data: trainer, message: 'Trainer suspended' })
  } catch (err: unknown) {
    console.error('Suspend trainer error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
