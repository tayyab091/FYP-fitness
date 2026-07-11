import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getWgerMeta } from '@/services/wgerService'

export async function GET(_req: NextRequest) {
  try {
    await connectDB()
    const meta = await getWgerMeta()
    return NextResponse.json({ success: true, data: meta.equipment })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Get wger equipment error:', err.message)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to get equipment' },
      { status: 500 }
    )
  }
}
