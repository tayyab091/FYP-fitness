import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { seedNutritionCache } from '@/lib/seedNutritionCache'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    await seedNutritionCache()

    return NextResponse.json({ success: true, message: 'Nutrition cache seeded successfully' })
  } catch (err: unknown) {
    console.error('Seed cache error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
