import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse } from '@/lib/middleware/auth'
import { requireAdminAccess } from '@/lib/middleware/admin'
import { Trainer } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1') || 1
    const limit = parseInt(searchParams.get('limit') || '12') || 12
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = { isActive: true, isFullyVerified: true }

    const country = searchParams.get('country')
    if (country && country !== '') {
      filter.country = country
    }

    const specialty = searchParams.get('specialty')
    if (specialty && specialty !== '' && specialty !== '__all__') {
      filter.specialty = { $in: [specialty] }
    }

    const language = searchParams.get('language')
    if (language && language !== '' && language !== '__all__') {
      filter.languages = { $in: [language] }
    }

    const search = searchParams.get('search')
    if (search && search.trim() !== '') {
      filter.name = { $regex: search.trim(), $options: 'i' }
    }

    const trainers = await Trainer.find(filter)
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Trainer.countDocuments(filter)

    return NextResponse.json({
      success: true,
      data: {
        trainers,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    })
  } catch (err: unknown) {
    console.error('❌ Get trainers error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json(
      {
        success: false,
        message: 'Server error',
        error: message,
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const body = await req.json()
    console.log('📥 Creating trainer with data:', body)
    const { name, bio, country, specialty, avatarUrl, backgroundImageUrl, rating } = body

    if (!name || !country) {
      return NextResponse.json(
        { success: false, message: 'Name and country are required' },
        { status: 400 }
      )
    }

    const trainer = await Trainer.create({
      name,
      bio,
      country,
      specialty: specialty || [],
      avatarUrl,
      backgroundImageUrl,
      rating: rating || 0,
      peopleTrained: 0,
      trainingVideos: 0,
      isFeatured: false,
      isActive: true,
      createdBy: authResult.userId,
      updatedBy: authResult.userId,
    })

    console.log('✅ Trainer saved to MongoDB:', trainer._id)
    return NextResponse.json(
      { success: true, data: trainer, message: 'Trainer created successfully' },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error('❌ Error saving trainer:', err instanceof Error ? err.message : err)
    const message = err instanceof Error ? err.message : 'Failed to create trainer'
    return NextResponse.json(
      { success: false, message: 'Failed to create trainer', error: message },
      { status: 500 }
    )
  }
}
