import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { setAuthCookie, signAuthToken } from '@/lib/auth'
import { User } from '@/models'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const { email, password, fullName, setupKey } = await req.json()
    const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'test-admin-key-change-in-production'

    if (setupKey !== ADMIN_SETUP_KEY) {
      return NextResponse.json({ success: false, error: 'Invalid setup key' }, { status: 401 })
    }

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 409 })
    }

    const user = await User.create({
      email,
      password,
      fullName,
      role: 'admin',
      verificationStatus: 'verified',
      isActive: true,
    })

    const token = signAuthToken(user._id.toString(), user.role)
    const response = NextResponse.json(
      {
        success: true,
        message: 'Admin created successfully',
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
      { status: 201 }
    )

    return setAuthCookie(response, token)
  } catch (err: unknown) {
    console.error('Create admin error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
