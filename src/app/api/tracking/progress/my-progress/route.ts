import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { ProgressRecord } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const userId = authResult.userId

    const records = await ProgressRecord.find({ userId }).sort({ recordedAt: -1 })

    return NextResponse.json({
      success: true,
      data: records,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch progress'
    console.error('Error fetching progress:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress', message },
      { status: 500 }
    )
  }
}
