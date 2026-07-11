import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { getRecipeQueryCacheStats } from '@/services/recipeService'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const stats = await getRecipeQueryCacheStats()
    return NextResponse.json(stats)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Get cache stats error:', err)
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 })
  }
}
