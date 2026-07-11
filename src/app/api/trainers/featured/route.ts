import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Trainer } from '@/models'

export async function GET() {
  try {
    await connectDB()

    const trainer = await Trainer.findOne({ isFeatured: true, isActive: true })
    return NextResponse.json(trainer)
  } catch (err: unknown) {
    console.error('Get featured trainer error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ message: 'Server error', error: message }, { status: 500 })
  }
}
