import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { setAuthCookie, signAuthToken } from '@/lib/auth'
import { User } from '@/models'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const { email, password, fullName, country } = await req.json()

    if (!email || !password || !fullName) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 })
    }

    const user = await User.create({ email, password, fullName, country: country || 'Pakistan' })

    const token = signAuthToken(user._id.toString(), user.role)
    const response = NextResponse.json(
      {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
      },
      { status: 201 }
    )

    return setAuthCookie(response, token)
  } catch (err: unknown) {
    console.error('Register error:', err)

    if (err && typeof err === 'object' && 'name' in err && err.name === 'ValidationError') {
      const validationError = err as unknown as { errors: Record<string, { message: string }> }
      const messages = Object.values(validationError.errors).map((value) => value.message)
      return NextResponse.json({ message: messages.join(', ') }, { status: 400 })
    }

    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ message }, { status: 500 })
  }
}
