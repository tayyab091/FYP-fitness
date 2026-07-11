import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { User } from '@/models'

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)
  if (isNextResponse(authResult)) return authResult

  await connectDB()
  const user = await User.findById(authResult.userId)
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

  return NextResponse.json({
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      country: user.country,
      avatarUrl: user.avatarUrl || user.profileImage,
      fitnessGoals: (user as typeof user & { fitnessGoals?: Record<string, unknown> }).fitnessGoals || null,
    },
  })
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req)
  if (isNextResponse(authResult)) return authResult

  await connectDB()
  const { fullName, country, avatarUrl } = await req.json()

  const user = await User.findByIdAndUpdate(
    authResult.userId,
    { fullName, country, avatarUrl, profileImage: avatarUrl },
    { new: true }
  )

  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

  return NextResponse.json({ success: true, user: { id: user._id, fullName: user.fullName, country: user.country, avatarUrl: user.avatarUrl } })
}
