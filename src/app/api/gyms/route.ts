import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Gym } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const skip = parseInt(searchParams.get('skip') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    const country = searchParams.get('country') || ''

    const query: Record<string, unknown> = { verificationStatus: 'verified', isActive: true }
    if (country) {
      query['address.country'] = { $regex: country, $options: 'i' }
    }

    const gyms = await Gym.find(query)
      .select('name description logoUrl address platformPlan trainerCount')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const total = await Gym.countDocuments(query)

    return NextResponse.json({
      success: true,
      data: gyms,
      pagination: {
        skip,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err: unknown) {
    console.error('Get gyms error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
