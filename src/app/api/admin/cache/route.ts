import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { clearAllNutritionCache } from '@/lib/seedNutritionCache'

export async function DELETE(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    await clearAllNutritionCache()

    return NextResponse.json({ success: true, message: 'Nutrition cache cleared' })
  } catch (err: unknown) {
    console.error('Clear cache error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
