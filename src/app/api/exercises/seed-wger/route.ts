import { NextRequest, NextResponse } from 'next/server'
import { seedAllExercisesFromWger } from '@/services/wgerService'

export async function POST(_req: NextRequest) {
  try {
    console.log('🌱 Starting wger exercise seed...')
    const total = await seedAllExercisesFromWger()
    return NextResponse.json({
      success: true,
      message: `Seeded ${total} exercises from wger`,
      totalSaved: total,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Seed wger error:', err.message)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to seed exercises' },
      { status: 500 }
    )
  }
}
