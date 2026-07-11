import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse } from '@/lib/middleware/auth'
import { requireAdminAccess } from '@/lib/middleware/admin'
import { Trainer } from '@/models'

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const { id } = await params
    console.log('📥 Toggling featured for trainer:', id)

    const trainer = await Trainer.findById(id)
    if (!trainer) {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 })
    }

    trainer.isFeatured = !trainer.isFeatured
    trainer.updatedBy = authResult.userId as typeof trainer.updatedBy
    await trainer.save()

    console.log('✅ Trainer featured status toggled:', trainer._id, '→', trainer.isFeatured)
    return NextResponse.json({
      success: true,
      data: trainer,
      message: 'Featured status updated',
    })
  } catch (err: unknown) {
    console.error('❌ Error toggling featured:', err instanceof Error ? err.message : err)
    const message = err instanceof Error ? err.message : 'Failed to toggle featured status'
    return NextResponse.json(
      { success: false, message: 'Failed to toggle featured status', error: message },
      { status: 500 }
    )
  }
}
