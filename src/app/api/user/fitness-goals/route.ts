import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { User } from '@/models'

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req)
  if (isNextResponse(authResult)) return authResult

  await connectDB()
  const { goalType, currentWeight, targetWeight, activityLevel } = await req.json()

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  }

  const bmr = currentWeight ? currentWeight * 24 : 2000
  const multiplier = activityMultipliers[activityLevel] || 1.55
  const dailyCalorieTarget = Math.round(bmr * multiplier)

  const user = await User.findByIdAndUpdate(
    authResult.userId,
    {
      $set: {
        fitnessGoals: { goalType, currentWeight, targetWeight, activityLevel, dailyCalorieTarget },
      },
    },
    { new: true }
  )

  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

  return NextResponse.json({
    success: true,
    fitnessGoals: { goalType, currentWeight, targetWeight, activityLevel, dailyCalorieTarget },
  })
}
