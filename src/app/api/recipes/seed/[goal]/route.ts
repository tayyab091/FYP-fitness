import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { getRecipesForGoal, GOAL_PRESETS } from '@/services/recipeService'

type RouteContext = { params: Promise<{ goal: string }> }

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const { goal } = await context.params

    if (!Object.keys(GOAL_PRESETS).includes(goal)) {
      return NextResponse.json(
        { message: `Invalid goal. Available: ${Object.keys(GOAL_PRESETS).join(', ')}` },
        { status: 400 }
      )
    }

    console.log(`🌱 Starting recipe seed for goal: ${goal}`)

    const batches = 3
    const recipesPerBatch = 20
    let totalSeeded = 0

    for (let i = 0; i < batches; i++) {
      console.log(`📦 Seeding batch ${i + 1}/${batches}...`)
      const result = await getRecipesForGoal(goal as keyof typeof GOAL_PRESETS, {
        offset: i * recipesPerBatch,
        number: recipesPerBatch,
      })
      totalSeeded += result.recipes.length

      if (i < batches - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    console.log(`✅ Seeded ${totalSeeded} recipes for goal: ${goal}`)
    return NextResponse.json({
      success: true,
      message: `Seeded ${totalSeeded} recipes for goal: ${goal}`,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Error seeding recipes:', err.message)
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 })
  }
}
