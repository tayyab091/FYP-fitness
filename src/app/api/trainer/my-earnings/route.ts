import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireTrainer } from '@/lib/middleware/permissions'
import { Trainer } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireTrainer(req)
    if (isNextResponse(authResult)) return authResult

    const trainer = await Trainer.findOne({ userId: authResult.userId })
    if (!trainer) {
      return NextResponse.json({ success: false, error: 'Trainer profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        totalEarnings: 0,
        thisMonth: 0,
        lastMonth: 0,
        paymentHistory: [],
      },
    })
  } catch (err: unknown) {
    console.error('Get trainer earnings error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
