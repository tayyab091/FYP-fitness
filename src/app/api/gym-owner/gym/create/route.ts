import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireGymOwner } from '@/lib/middleware/permissions'
import { Gym } from '@/models'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireGymOwner(req)
    if (isNextResponse(authResult)) return authResult

    const existingGym = await Gym.findOne({ ownerId: authResult.userId })
    if (existingGym) {
      return NextResponse.json({ success: false, error: 'You already have a gym registered' }, { status: 400 })
    }

    const { name, description, phone, email, website, address } = await req.json()

    if (!name || !email || !address?.city || !address?.country) {
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
        state: address.state || '',
        country: address.country,
        postalCode: address.postalCode || '',
      },
      ownerId: authResult.userId,
      verificationStatus: 'pending',
      trainers: [],
      isActive: true,
      memberCount: 0,
      platformPlan: 'free',
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
    })

    return NextResponse.json(
      {
        success: true,
        data: newGym,
        message: "Gym created successfully. It's now pending admin verification.",
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error('Create gym error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
