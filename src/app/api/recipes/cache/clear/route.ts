import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { clearRecipeQueryCache } from '@/services/recipeService'

export async function DELETE(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const deletedCount = await clearRecipeQueryCache()
    return NextResponse.json({
      success: true,
      message: `Cleared ${deletedCount} cached queries`,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Clear cache error:', err)
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 })
  }
}
