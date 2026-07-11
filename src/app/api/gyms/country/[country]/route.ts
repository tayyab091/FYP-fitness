import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Gym } from '@/models'

type RouteParams = { params: Promise<{ country: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()

    const { country } = await params
    const { searchParams } = new URL(req.url)
    const skip = parseInt(searchParams.get('skip') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')

    const gyms = await Gym.find({
      'address.country': { $regex: country, $options: 'i' },
      verificationStatus: 'verified',
      isActive: true,
    })
      .select('name address logoUrl platformPlan')
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 })

    const total = await Gym.countDocuments({
      'address.country': { $regex: country, $options: 'i' },
      verificationStatus: 'verified',
      isActive: true,
    })

    return NextResponse.json({
      success: true,
      data: gyms,
      pagination: { total, skip, limit },
    })
  } catch (err: unknown) {
    console.error('Get gyms by country error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
