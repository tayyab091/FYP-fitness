import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { searchExercisesByKeyword } from '@/services/exerciseService'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const keyword = req.nextUrl.searchParams.get('q') ?? ''

    if (!keyword.trim() || keyword.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Search keyword must be at least 2 characters' },
        { status: 400 }
      )
    }

    const result = await searchExercisesByKeyword(keyword)

    return NextResponse.json({
      success: true,
      exercises: result.data,
      fromCache: result.fromCache,
      count: result.count,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Search exercises error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Search failed' },
      { status: 500 }
    )
  }
}
