import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getExerciseFullInfo } from '@/services/wgerService'

type RouteContext = { params: Promise<{ wgerId: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await connectDB()

    const { wgerId: wgerIdParam } = await context.params
    const wgerId = parseInt(wgerIdParam, 10)

    if (!wgerId) {
      return NextResponse.json({ success: false, error: 'Invalid wger ID' }, { status: 400 })
    }

    const exercise = await getExerciseFullInfo(wgerId)
    return NextResponse.json({ success: true, data: exercise })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Get wger exercise error:', err.message)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to get exercise' },
      { status: 500 }
    )
  }
}
