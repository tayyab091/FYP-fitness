import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Gym } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const country = searchParams.get('country') || ''

    const query: Record<string, unknown> = {
      verificationStatus: 'verified',
      isActive: true,
    }

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { 'address.city': { $regex: q, $options: 'i' } },
      ]
    }

    if (country) {
      query['address.country'] = { $regex: country, $options: 'i' }
    }

    const gyms = await Gym.find(query)
      .select('name address logoUrl platformPlan memberCount')
      .limit(50)
      .sort({ name: 1 })

    return NextResponse.json({ success: true, data: gyms, total: gyms.length })
  } catch (err: unknown) {
    console.error('Search gyms error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
