import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireTrainer } from '@/lib/middleware/permissions'
import { Trainer } from '@/models'

export async function PUT(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireTrainer(req)
    if (isNextResponse(authResult)) return authResult

    const { bio, specialty, yearsOfExperience, languages, availability, certifications, profileVideoUrl } =
      await req.json()

    const trainer = await Trainer.findOne({ userId: authResult.userId })
    if (!trainer) {
      return NextResponse.json({ success: false, error: 'Trainer profile not found' }, { status: 404 })
    }

    if (bio) trainer.bio = bio
    if (specialty && Array.isArray(specialty)) trainer.specialty = specialty
    if (yearsOfExperience !== undefined) trainer.yearsOfExperience = yearsOfExperience
    if (languages && Array.isArray(languages)) trainer.languages = languages
    if (availability) trainer.availability = availability
    if (certifications && Array.isArray(certifications)) trainer.certifications = certifications
    if (profileVideoUrl) trainer.profileVideoUrl = profileVideoUrl

    await trainer.save()

    return NextResponse.json({ success: true, data: trainer, message: 'Profile updated successfully' })
  } catch (err: unknown) {
    console.error('Update trainer profile error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
