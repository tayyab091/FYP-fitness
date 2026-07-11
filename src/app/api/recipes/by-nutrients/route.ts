import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { findRecipesByNutrients } from '@/services/recipeService'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const filters: Record<string, unknown> = {}
    const numericParams = [
      'minCalories',
      'maxCalories',
      'minCarbs',
      'maxCarbs',
      'minProtein',
      'maxProtein',
      'minFat',
      'maxFat',
    ]

    for (const param of numericParams) {
      const value = req.nextUrl.searchParams.get(param)
      if (value) {
        filters[param] = parseInt(value, 10)
      }
    }

    const diets = req.nextUrl.searchParams.getAll('diets')
    if (diets.length) {
      filters.diets = diets.length === 1 ? diets : diets
    }

    const cuisines = req.nextUrl.searchParams.getAll('cuisines')
    if (cuisines.length) {
      filters.cuisines = cuisines
    }

    const offset = parseInt(req.nextUrl.searchParams.get('offset') ?? '0', 10) || 0
    const number = Math.min(parseInt(req.nextUrl.searchParams.get('number') ?? '20', 10) || 20, 100)

    const result = await findRecipesByNutrients(filters, { offset, number })
    return NextResponse.json(result)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Search by nutrients error:', err)
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 })
  }
}
