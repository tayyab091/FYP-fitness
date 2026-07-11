import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { getNutritionCacheStats, clearNutritionCache } from '@/services/nutritionService'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const stats = await getNutritionCacheStats()

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Nutrition cache statistics',
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ /api/nutrition/cache GET error:', err.message)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to get cache stats' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const result = await clearNutritionCache()

    return NextResponse.json({
      success: true,
      data: result,
      message: `Cleared ${result.deletedCount} nutrition cache entries`,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ /api/nutrition/cache DELETE error:', err.message)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to clear cache' },
      { status: 500 }
    )
  }
}
