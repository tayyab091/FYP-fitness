import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { Trainer } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    const trainers = await Trainer.find().sort({ rating: -1 }).skip(skip).limit(limit)
    const total = await Trainer.countDocuments()

    return NextResponse.json({
      success: true,
      trainers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (err: unknown) {
    console.error('Get trainers error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
