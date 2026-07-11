import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { getExerciseCacheStats } from '@/services/exerciseService'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const stats = await getExerciseCacheStats()

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Exercise cache statistics',
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Get exercise cache stats error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to get stats' },
      { status: 500 }
    )
  }
}
