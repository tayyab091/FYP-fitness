import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { Gym } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    const gyms = await Gym.find({
      $or: [{ verificationStatus: 'pending' }, { verificationStatus: 'under_review' }],
    })
      .populate('ownerId', 'fullName email')
      .sort({ createdAt: 1 })

    return NextResponse.json({ success: true, data: gyms })
  } catch (err: unknown) {
    console.error('Get pending gyms error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
