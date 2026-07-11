import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireGymOwner } from '@/lib/middleware/permissions'
import { Gym } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireGymOwner(req)
    if (isNextResponse(authResult)) return authResult

    const gym = await Gym.findOne({ ownerId: authResult.userId }).populate(
      'ownerId',
      'fullName email phoneNumber'
    )

    if (!gym) {
      return NextResponse.json({ success: false, error: 'Gym not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: gym })
  } catch (err: unknown) {
    console.error('Get gym error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireGymOwner(req)
    if (isNextResponse(authResult)) return authResult

    const {
      name,
      description,
      logoUrl,
      coverImageUrl,
      address,
      email,
      phone,
      website,
      socialMedia,
      timezone,
      currency,
      language,
    } = await req.json()

    const gym = await Gym.findOne({ ownerId: authResult.userId })
    if (!gym) {
      return NextResponse.json({ success: false, error: 'Gym not found' }, { status: 404 })
    }

    if (name) gym.name = name
    if (description) gym.description = description
    if (logoUrl) gym.logoUrl = logoUrl
    if (coverImageUrl) gym.coverImageUrl = coverImageUrl
    if (address) gym.address = { ...gym.address, ...address }
    if (email) gym.email = email
    if (phone) gym.phone = phone
    if (website) gym.website = website
    if (socialMedia) gym.socialMedia = { ...gym.socialMedia, ...socialMedia }
    if (timezone) gym.timezone = timezone
    if (currency) gym.currency = currency
    if (language) gym.language = language

    await gym.save()

    return NextResponse.json({ success: true, data: gym, message: 'Gym profile updated successfully' })
  } catch (err: unknown) {
    console.error('Update gym error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
