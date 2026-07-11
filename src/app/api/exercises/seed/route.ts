import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { seedExercisesFromAPIs } from '@/services/exerciseService'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    console.log('🌱 Starting bulk exercise seed from APIs (admin initiated)')
    const totalSaved = await seedExercisesFromAPIs()

    return NextResponse.json({
      success: true,
      totalSaved,
      message: `${totalSaved} exercises imported and cached`,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Seed exercises error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to seed exercises' },
      { status: 500 }
    )
  }
}
