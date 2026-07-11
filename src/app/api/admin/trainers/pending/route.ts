import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { Trainer } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    const trainers = await Trainer.find({ adminVerificationStatus: 'pending' })
      .populate('userId', 'fullName email country')
      .populate('gymId', 'name address')
      .sort({ createdAt: 1 })

    return NextResponse.json({ success: true, data: trainers })
  } catch (err: unknown) {
    console.error('Get pending trainers error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
