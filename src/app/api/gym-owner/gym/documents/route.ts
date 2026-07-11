import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireGymOwner } from '@/lib/middleware/permissions'
import { Gym } from '@/models'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireGymOwner(req)
    if (isNextResponse(authResult)) return authResult

    const { documents } = await req.json()

    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json({ success: false, error: 'Documents array is required' }, { status: 400 })
    }

    const gym = await Gym.findOne({ ownerId: authResult.userId })
    if (!gym) {
      return NextResponse.json({ success: false, error: 'Gym not found' }, { status: 404 })
    }

    gym.verificationDocuments = documents
    gym.verificationStatus = 'under_review'
    await gym.save()

    return NextResponse.json({
      success: true,
      data: gym,
      message: 'Documents submitted for verification. Admin will review shortly.',
    })
  } catch (err: unknown) {
    console.error('Upload documents error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
