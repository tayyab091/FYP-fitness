import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { createAuditLog } from '@/lib/auditLog'
import { Gym } from '@/models'

function getClientIp(req: NextRequest): string | undefined {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''
    const skip = parseInt(searchParams.get('skip') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    const country = searchParams.get('country') || ''

    const query: Record<string, unknown> = {}
    if (status) query.verificationStatus = status
    if (country) query['address.country'] = { $regex: country, $options: 'i' }

    const gyms = await Gym.find(query)
      .populate('ownerId', 'fullName email phoneNumber')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const total = await Gym.countDocuments(query)

    return NextResponse.json({
      success: true,
      data: gyms,
      pagination: { skip, limit, total },
    })
  } catch (err: unknown) {
    console.error('Get gyms error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    const { name, description, phone, email, website, address } = await req.json()

    if (!name || !email || !address?.country || !address?.city) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const newGym = await Gym.create({
      name,
      description: description || '',
      phone: phone || '',
      email,
      website: website || '',
      address: {
        street: address.street || '',
        city: address.city,
        country: address.country,
        state: address.state || '',
        postalCode: address.postalCode || '',
      },
      verificationStatus: 'verified',
      ownerId: authResult.userId,
      trainers: [],
      isActive: true,
      memberCount: 0,
      platformPlan: 'free',
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
    })

    await createAuditLog(
      authResult.userId,
      'created_gym',
      newGym._id,
      'Gym',
      { gymName: newGym.name },
      getClientIp(req)
    )

    return NextResponse.json(
      { success: true, data: newGym, message: 'Gym created successfully' },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error('Create gym error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
