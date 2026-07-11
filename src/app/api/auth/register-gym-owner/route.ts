import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { setAuthCookie, signAuthToken } from '@/lib/auth'
import { Gym, Notification, User } from '@/models'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const {
      fullName,
      email,
      password,
      phoneNumber,
      country,
      gymName,
      gymDescription,
      gymCity,
      gymCountry,
      gymPhone,
      gymEmail,
      gymWebsite,
      gymDocumentUrls,
    } = await req.json()

    if (!fullName || !email || !password || !gymName || !gymCity || !gymCountry) {
      return NextResponse.json(
        {
          success: false,
          error: 'Full name, email, password, gym name, city and country are all required',
        },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber || '',
      country: country || '',
      role: 'gym_owner',
      verificationStatus: 'pending',
      isActive: true,
    })

    const newGym = await Gym.create({
      ownerId: user._id,
      name: gymName.trim(),
      description: gymDescription || '',
      address: {
        city: gymCity.trim(),
        country: gymCountry.trim(),
      },
      email: gymEmail || email,
      phone: gymPhone || '',
      website: gymWebsite || '',
      verificationDocuments: Array.isArray(gymDocumentUrls)
        ? gymDocumentUrls.filter((url: unknown) => typeof url === 'string' && url.trim())
        : [],
      verificationStatus: 'pending',
      isActive: true,
    })

    const admins = await User.find({
      role: { $in: ['admin', 'super_admin'] },
      isActive: true,
    })

    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        type: 'new_gym_application',
        title: 'New Gym Owner Application',
        message: `${fullName} has registered "${gymName}" in ${gymCity}, ${gymCountry}. Review and verify.`,
        link: '/admin/gyms',
        metadata: {
          gymId: newGym._id,
          userId: user._id,
          gymName,
        },
      })
    }

    const globalAny = global as typeof globalThis & { io?: { to: (room: string) => { emit: (event: string, data: unknown) => void } } }
    if (globalAny.io) {
      admins.forEach((admin) => {
        globalAny.io!.to(`user:${admin._id.toString()}`).emit('notification:new', {
          type: 'new_gym_application',
          title: 'New Gym Application',
          message: `${gymName} (${gymCity}) needs verification`,
          link: '/admin/gyms',
          urgent: false,
        })
      })
    }

    const token = signAuthToken(user._id.toString(), user.role)
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            verificationStatus: user.verificationStatus,
          },
          gym: {
            id: newGym._id,
            name: newGym.name,
            verificationStatus: newGym.verificationStatus,
          },
        },
        message: 'Registration successful! Your gym will be reviewed by an admin within 24-48 hours.',
      },
      { status: 201 }
    )

    return setAuthCookie(response, token)
  } catch (err: unknown) {
    console.error('Gym owner registration error:', err)

    if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 })
    }

    if (err && typeof err === 'object' && 'name' in err && err.name === 'ValidationError') {
      const validationError = err as unknown as { errors: Record<string, { message: string }> }
      const messages = Object.values(validationError.errors).map((value) => value.message)
      return NextResponse.json({ success: false, error: messages.join(', ') }, { status: 400 })
    }

    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
