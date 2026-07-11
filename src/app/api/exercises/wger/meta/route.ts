import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getWgerMeta } from '@/services/wgerService'

export async function GET(_req: NextRequest) {
  try {
    await connectDB()
    const meta = await getWgerMeta()
    return NextResponse.json({ success: true, data: meta })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Get wger meta error:', err.message)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to get wger metadata' },
      { status: 500 }
    )
  }
}
