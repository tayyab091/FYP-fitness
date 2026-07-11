import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse } from '@/lib/middleware/auth'
import { requireAdminAccess } from '@/lib/middleware/admin'
import { Trainer } from '@/models'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const { id } = await params
    const trainer = await Trainer.findOne({ _id: id, isActive: true })

    if (!trainer) {
      return NextResponse.json({ message: 'Trainer not found' }, { status: 404 })
    }

    return NextResponse.json(trainer)
  } catch (err: unknown) {
    console.error('Get trainer error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ message: 'Server error', error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const { id } = await params
    const body = await req.json()
    console.log('📥 Updating trainer:', id, 'with data:', body)
    const { name, bio, country, specialty, avatarUrl, backgroundImageUrl, rating } = body

    const trainer = await Trainer.findByIdAndUpdate(
      id,
      {
        name,
        bio,
        country,
        specialty,
        avatarUrl,
        backgroundImageUrl,
        rating,
        updatedBy: authResult.userId,
      },
      { new: true, runValidators: true }
    )

    if (!trainer) {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 })
    }

    console.log('✅ Trainer updated in MongoDB:', trainer._id)
    return NextResponse.json({
      success: true,
      data: trainer,
      message: 'Trainer updated successfully',
    })
  } catch (err: unknown) {
    console.error('❌ Error updating trainer:', err instanceof Error ? err.message : err)
    const message = err instanceof Error ? err.message : 'Failed to update trainer'
    return NextResponse.json(
      { success: false, message: 'Failed to update trainer', error: message },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const { id } = await params
    console.log('📥 Deleting trainer:', id)

    const trainer = await Trainer.findByIdAndUpdate(
      id,
      { isActive: false, updatedBy: authResult.userId },
      { new: true }
    )

    if (!trainer) {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 })
    }

    console.log('✅ Trainer soft-deleted (isActive=false):', trainer._id)
    return NextResponse.json({ success: true, message: 'Trainer deleted successfully' })
  } catch (err: unknown) {
    console.error('❌ Error deleting trainer:', err instanceof Error ? err.message : err)
    const message = err instanceof Error ? err.message : 'Failed to delete trainer'
    return NextResponse.json(
      { success: false, message: 'Failed to delete trainer', error: message },
      { status: 500 }
    )
  }
}
