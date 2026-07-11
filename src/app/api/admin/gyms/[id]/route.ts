import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { createAuditLog } from '@/lib/auditLog'
import { Gym, Trainer } from '@/models'

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
    const { name, description, phone, email, website, address } = await req.json()

    const gym = await Gym.findById(id)
    if (!gym) {
      return NextResponse.json({ success: false, error: 'Gym not found' }, { status: 404 })
    }

    if (name) gym.name = name
    if (description !== undefined) gym.description = description
    if (phone !== undefined) gym.phone = phone
    if (email) gym.email = email
    if (website !== undefined) gym.website = website
    if (address) {
      gym.address = { ...gym.address, ...address }
    }

    await gym.save()

    await createAuditLog(
      authResult.userId,
      'updated_gym',
      gym._id,
      'Gym',
      { gymName: gym.name },
      getClientIp(req)
    )

    return NextResponse.json({ success: true, data: gym, message: 'Gym updated successfully' })
  } catch (err: unknown) {
    console.error('Update gym error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    const { id } = await params
    const gym = await Gym.findById(id)
    if (!gym) {
      return NextResponse.json({ success: false, error: 'Gym not found' }, { status: 404 })
    }

    await createAuditLog(
      authResult.userId,
      'deleted_gym',
      gym._id,
      'Gym',
      { gymName: gym.name },
      getClientIp(req)
    )

    await Trainer.deleteMany({ gymId: id })
    await Gym.findByIdAndDelete(id)

    return NextResponse.json({ success: true, message: 'Gym deleted successfully' })
  } catch (err: unknown) {
    console.error('Delete gym error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
