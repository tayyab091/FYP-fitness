import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Gym } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const country = searchParams.get('country') || ''
    const skip = parseInt(searchParams.get('skip') || '0')
    const limit = parseInt(searchParams.get('limit') || '50')

    const query: Record<string, unknown> = {
      verificationStatus: 'verified',
      isActive: true,
    }

    if (q) {
      query.$text = { $search: q }
    }

    if (country) {
      query['address.country'] = { $regex: country, $options: 'i' }
    }

    const gyms = await Gym.find(query)
      .select('name address logoUrl platformPlan')
      .skip(skip)
      .limit(limit)
      .sort(q ? { score: { $meta: 'textScore' } } : { name: 1 })

    return NextResponse.json({ success: true, data: gyms })
  } catch (err: unknown) {
    console.error('Get verified gyms error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
