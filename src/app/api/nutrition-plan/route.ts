import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireRole } from '@/lib/middleware/permissions'
import { DailyNutritionPlan, TrainerClientRelationship } from '@/models'
import {
  scaleNutrition,
  calculateMealTotals,
  getDayOfWeek,
} from '@/lib/nutritionHelpers'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireRole(req, 'trainer', 'admin', 'super_admin')
    if (isNextResponse(authResult)) {
      return authResult
    }

    const trainerId = authResult.userId
    const body = await req.json()
    const { userId, planDate, meals, goals, trainerNotes } = body

    if (!userId || !planDate || !meals?.length) {
      return NextResponse.json(
        { success: false, error: 'userId, planDate, and meals are required' },
        { status: 400 }
      )
    }

    const relationship = await TrainerClientRelationship.findOne({
      trainerId,
      userId,
      status: 'active',
    })

    if (!relationship) {
      return NextResponse.json(
        { success: false, error: 'No active trainer-client relationship with this user' },
        { status: 403 }
      )
    }

    const processedMeals = meals.map((meal: Record<string, unknown>) => {
      const items = (meal.items as Record<string, unknown>[]) || []
      const processedItems = items.map((item) => ({
        ...item,
        ...scaleNutrition(item, (item.servingAmountG as number) || 100),
      }))
      return {
        ...meal,
        items: processedItems,
        ...calculateMealTotals(processedItems),
      }
    })

    const dailyTotals = processedMeals.reduce(
      (acc: Record<string, number>, meal: Record<string, number>) => ({
        targetCalories: acc.targetCalories + (meal.totalCalories || 0),
        targetProtein: acc.targetProtein + (meal.totalProtein || 0),
        targetCarbs: acc.targetCarbs + (meal.totalCarbs || 0),
        targetFat: acc.targetFat + (meal.totalFat || 0),
        targetFiber: acc.targetFiber + (meal.totalFiber || 0),
      }),
      { targetCalories: 0, targetProtein: 0, targetCarbs: 0, targetFat: 0, targetFiber: 0 }
    )

    const dayOfWeek = getDayOfWeek(planDate)

    const plan = await DailyNutritionPlan.findOneAndUpdate(
      { userId, planDate },
      {
        userId,
        trainerId,
        relationshipId: relationship._id,
        planDate,
        dayOfWeek,
        meals: processedMeals,
        dailyTotals,
        goals: goals || {},
        trainerNotes: trainerNotes || '',
        status: 'draft',
      },
      { upsert: true, new: true }
    )

    console.log(`💾 Nutrition plan created/updated: ${plan._id} for ${planDate}`)
    return NextResponse.json({ success: true, data: plan }, { status: 201 })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Create plan error:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
