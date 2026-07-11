import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { setAuthCookie, signAuthToken } from '@/lib/auth'
import { User } from '@/models'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }

    if (user.verificationStatus === 'suspended' || !user.isActive) {
      return NextResponse.json({ message: 'Account suspended. Contact support.' }, { status: 403 })
    }

    const token = signAuthToken(user._id.toString(), user.role)
    const response = NextResponse.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        verificationStatus: user.verificationStatus,
      },
    })

    return setAuthCookie(response, token)
  } catch (err: unknown) {
    console.error('Login error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ message }, { status: 500 })
  }
}
