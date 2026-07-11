import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getFullRecipeById } from '@/services/recipeService'

type RouteContext = { params: Promise<{ spoonacularId: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await connectDB()

    const { spoonacularId } = await context.params
    const recipe = await getFullRecipeById(parseInt(spoonacularId, 10))

    if (!recipe) {
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 })
    }

    return NextResponse.json(recipe)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Get full recipe error:', err)
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 })
  }
}
