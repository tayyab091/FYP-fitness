import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Recipe } from '@/models'

export async function GET(_req: NextRequest) {
  try {
    await connectDB()
    const diets = await Recipe.distinct('diets', { isActive: true, isFullyLoaded: true })
    return NextResponse.json({ diets: diets.filter(Boolean) })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Get diets error:', err)
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 })
  }
}
