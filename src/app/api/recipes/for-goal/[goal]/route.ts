import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getRecipesForGoal, GOAL_PRESETS } from '@/services/recipeService'

type RouteContext = { params: Promise<{ goal: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await connectDB()

    const { goal } = await context.params

    if (!Object.keys(GOAL_PRESETS).includes(goal)) {
      return NextResponse.json(
        {
          message: `Invalid goal. Available: ${Object.keys(GOAL_PRESETS).join(', ')}`,
          available: GOAL_PRESETS,
        },
        { status: 400 }
      )
    }

    const offset = parseInt(req.nextUrl.searchParams.get('offset') ?? '0', 10) || 0
    const number = Math.min(parseInt(req.nextUrl.searchParams.get('number') ?? '20', 10) || 20, 100)

    const result = await getRecipesForGoal(goal as keyof typeof GOAL_PRESETS, { offset, number })
    return NextResponse.json(result)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Get recipes for goal error:', err)
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 })
  }
}
