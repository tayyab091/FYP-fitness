import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { setAuthCookie, signAuthToken } from '@/lib/auth'
import { Gym, Notification, Trainer, User } from '@/models'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const {
      email,
      password,
      fullName,
      phoneNumber,
      country,
      bio,
      specialty,
      yearsOfExperience,
      languages,
      certifications,
      governmentId,
      gymId,
      isIndependent,
    } = await req.json()

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 409 })
    }

    let gym = null

    if (gymId && !isIndependent) {
      gym = await Gym.findById(gymId)
      if (!gym) {
        return NextResponse.json({ success: false, error: 'Selected gym does not exist' }, { status: 400 })
      }
      if (gym.verificationStatus !== 'verified') {
        return NextResponse.json(
          { success: false, error: 'Selected gym is not verified yet' },
          { status: 400 }
        )
      }
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber || '',
      country: country || '',
      role: 'trainer',
      verificationStatus: 'pending',
      isActive: true,
    })

    const trainerData: Record<string, unknown> = {
      userId: user._id,
      name: fullName.trim(),
      bio: bio || '',
      country: country || '',
      phoneNumber: phoneNumber || '',
      specialty: Array.isArray(specialty) ? specialty : specialty ? [specialty] : [],
      yearsOfExperience: yearsOfExperience || 0,
      languages: Array.isArray(languages) ? languages : languages ? [languages] : ['English'],
      certifications: Array.isArray(certifications) ? certifications : [],
      governmentId: governmentId || '',
      isActive: true,
      createdByRole: 'self',
      createdByUserId: user._id,
      gymVerificationStatus: gym ? 'pending' : 'not_required',
      adminVerificationStatus: 'pending',
      isFullyVerified: false,
    }

    if (gym) {
      trainerData.gymId = gym._id
      trainerData.gymName = gym.name
    }

    const newTrainer = await Trainer.create(trainerData)

    if (gym) {
      gym.trainers.push(newTrainer._id)
      await gym.save()
    }

    await Notification.create({
      type: 'new_trainer_application',
      title: 'New Trainer Application',
      message: `${fullName} has registered as a trainer${gym ? ` at ${gym.name}` : ' (independent)'}`,
      link: '/admin/trainers',
      metadata: { trainerId: newTrainer._id },
    })

    const token = signAuthToken(user._id.toString(), user.role)
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          verificationStatus: user.verificationStatus,
        },
        trainer: {
          id: newTrainer._id,
          gymVerificationStatus: newTrainer.gymVerificationStatus,
          adminVerificationStatus: newTrainer.adminVerificationStatus,
          isFullyVerified: false,
        },
        message: gym
          ? 'Application submitted! The gym owner and admin will review your profile.'
          : 'Welcome! An admin will review your profile and approve it within 24 hours.',
      },
      { status: 201 }
    )

    return setAuthCookie(response, token)
  } catch (err: unknown) {
    console.error('Register trainer error:', err)

    if (err && typeof err === 'object' && 'name' in err && err.name === 'ValidationError') {
      const validationError = err as unknown as { errors: Record<string, { message: string }> }
      const messages = Object.values(validationError.errors).map((value) => value.message)
      return NextResponse.json({ success: false, error: messages.join(', ') }, { status: 400 })
    }

    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
