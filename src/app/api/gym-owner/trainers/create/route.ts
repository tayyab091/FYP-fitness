import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireGymOwner } from '@/lib/middleware/permissions'
import { User, Gym, Trainer, Notification } from '@/models'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireGymOwner(req)
    if (isNextResponse(authResult)) return authResult

    const gymOwnerId = authResult.userId
    const { fullName, email, phoneNumber, bio, specialty, yearsOfExperience, languages, certifications } =
      await req.json()

    if (!fullName || !email) {
      return NextResponse.json({ success: false, error: 'Full name and email are required' }, { status: 400 })
    }

    const gym = await Gym.findOne({ ownerId: gymOwnerId, verificationStatus: 'verified' })
    if (!gym) {
      return NextResponse.json(
        { success: false, error: 'You must have a verified gym to add trainers' },
        { status: 403 }
      )
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() })
    if (user && user.role !== 'trainer') {
      return NextResponse.json(
        { success: false, error: 'A non-trainer account already exists with this email' },
        { status: 400 }
      )
    }

    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-10) + 'T1!'
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      user = await User.create({
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber || '',
        role: 'trainer',
        verificationStatus: 'pending',
        isActive: true,
      })
    }

    const trainerData: Record<string, unknown> = {
      userId: user._id,
      name: fullName.trim(),
      gymId: gym._id,
      gymName: gym.name,
      phoneNumber: phoneNumber || '',
      bio: bio || '',
      specialty: Array.isArray(specialty) ? specialty : specialty ? [specialty] : [],
      yearsOfExperience: yearsOfExperience || 0,
      languages: Array.isArray(languages) ? languages : languages ? [languages] : ['English'],
      certifications: Array.isArray(certifications) ? certifications : [],
      gymVerificationStatus: 'approved',
      adminVerificationStatus: 'pending',
      isFullyVerified: false,
      isActive: true,
      createdByRole: 'gym_owner',
      createdByUserId: gymOwnerId,
    }

    const trainer = await Trainer.findOneAndUpdate({ userId: user._id }, trainerData, {
      upsert: true,
      new: true,
    })

    if (!gym.trainers.includes(trainer._id)) {
      gym.trainers.push(trainer._id)
      await gym.save()
    }

    await Notification.create({
      type: 'new_trainer_application',
      title: 'Trainer Ready for Admin Verification',
      message: `${gym.name} has added ${fullName} as a trainer. Admin approval needed.`,
      link: '/admin/trainers',
      metadata: { trainerId: trainer._id },
    })

    return NextResponse.json(
      {
        success: true,
        data: trainer,
        message: `Trainer profile created for ${fullName}. Admin will review for final approval.`,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error('Create trainer error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
