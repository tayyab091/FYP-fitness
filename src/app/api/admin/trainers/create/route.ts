import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { createAuditLog } from '@/lib/auditLog'
import { User, Trainer, Gym, Notification } from '@/models'

function getClientIp(req: NextRequest): string | undefined {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    const adminId = authResult.userId
    const {
      fullName,
      email,
      phoneNumber,
      country,
      bio,
      specialty,
      yearsOfExperience,
      languages,
      certifications,
      governmentId,
      gymId,
    } = await req.json()

    if (!fullName || !email) {
      return NextResponse.json({ success: false, error: 'Full name and email are required' }, { status: 400 })
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() })

    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-10) + 'T1!'
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      user = await User.create({
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber || '',
        country: country || '',
        role: 'trainer',
        verificationStatus: 'verified',
        isActive: true,
      })
    } else if (user.role !== 'trainer') {
      return NextResponse.json(
        { success: false, error: 'A non-trainer account already exists with this email' },
        { status: 400 }
      )
    }

    let gym = null
    if (gymId) {
      gym = await Gym.findById(gymId)
      if (!gym) {
        return NextResponse.json({ success: false, error: 'Selected gym does not exist' }, { status: 400 })
      }
      if (gym.verificationStatus !== 'verified') {
        return NextResponse.json({ success: false, error: 'Selected gym is not verified' }, { status: 400 })
      }
    }

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
      gymVerificationStatus: gymId ? 'approved' : 'not_required',
      adminVerificationStatus: 'approved',
      isFullyVerified: true,
      isActive: true,
      createdByRole: 'admin',
      createdByUserId: adminId,
    }

    if (gym) {
      trainerData.gymId = gym._id
      trainerData.gymName = gym.name
    }

    const trainer = await Trainer.findOneAndUpdate({ userId: user._id }, trainerData, { upsert: true, new: true })

    if (gym && !gym.trainers.includes(trainer._id)) {
      gym.trainers.push(trainer._id)
      await gym.save()
    }

    await Notification.create({
      userId: user._id,
      type: 'trainer_verified',
      title: 'Welcome to T.E.S.T.!',
      message: 'Your trainer profile has been created and verified. You can start accepting clients immediately!',
      link: '/trainer',
      metadata: { trainerId: trainer._id },
    })

    await createAuditLog(adminId, 'created_trainer', trainer._id, 'Trainer', { trainerName: fullName, email }, getClientIp(req))

    return NextResponse.json(
      {
        success: true,
        data: trainer,
        message: `Trainer ${fullName} created and verified successfully. They can start accepting clients immediately.`,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error('Create trainer error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
