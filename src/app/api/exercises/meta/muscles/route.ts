import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getExerciseMeta } from '@/services/exerciseService'

export async function GET(_req: NextRequest) {
  try {
    await connectDB()
    const result = await getExerciseMeta('muscles')
    return NextResponse.json({
      success: true,
      data: result.data,
      fromCache: result.fromCache,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Get muscles error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to get muscles' },
      { status: 500 }
    )
  }
}
