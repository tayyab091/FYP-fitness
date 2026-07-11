import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { User } from '@/models'

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req)
  if (isNextResponse(authResult)) return authResult

  await connectDB()
  const { currentPassword, newPassword, confirmPassword } = await req.json()

  if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
    return NextResponse.json({ message: 'Invalid password data' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ message: 'New password must be at least 8 characters' }, { status: 400 })
  }

  const user = await User.findById(authResult.userId).select('+password')
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) {
    return NextResponse.json({ message: 'Current password is incorrect' }, { status: 401 })
  }

  user.password = newPassword
  await user.save()

  return NextResponse.json({ success: true, message: 'Password updated' })
}
