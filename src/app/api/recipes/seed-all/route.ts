import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { getRecipesForGoal, GOAL_PRESETS } from '@/services/recipeService'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    console.log('🌱 Starting recipe seed for ALL goals...')

    const goals = Object.keys(GOAL_PRESETS)
    let totalSeeded = 0

    for (let goalIndex = 0; goalIndex < goals.length; goalIndex++) {
      const goal = goals[goalIndex]
      console.log(`🎯 Seeding recipes for goal: ${goal} (${goalIndex + 1}/${goals.length})`)

      const batches = 2
      const recipesPerBatch = 15

      for (let i = 0; i < batches; i++) {
        const result = await getRecipesForGoal(goal as keyof typeof GOAL_PRESETS, {
          offset: i * recipesPerBatch,
          number: recipesPerBatch,
        })
        totalSeeded += result.recipes.length

        if (i < batches - 1 || goalIndex < goals.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }
    }

    console.log(`✅ Total recipes seeded: ${totalSeeded}`)
    return NextResponse.json({
      success: true,
      message: `Seeded ${totalSeeded} recipes for all goals`,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Error seeding all recipes:', err.message)
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 })
  }
}
