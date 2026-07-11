import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { searchIngredients } from '@/services/wgerService'

function mapToFrontendIngredient(ingredient: Record<string, unknown>) {
  return {
    id: ingredient.wgerIngredientId ?? ingredient.id ?? ingredient.name,
    name: ingredient.name,
    energy: ingredient.calories ?? 0,
    protein: ingredient.protein_g ?? 0,
    carbohydrates: ingredient.carbohydrates_total_g ?? 0,
    fat: ingredient.fat_total_g ?? 0,
    fiber: ingredient.fiber_g ?? 0,
    imageUrl: ingredient.imageUrl ?? '',
    brand: ingredient.brand ?? '',
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const query = req.nextUrl.searchParams.get('query') ?? ''
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '10', 10) || 10, 50)

    if (!query.trim()) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const result = await searchIngredients(query, limit)
    const results = (result.data as Record<string, unknown>[]).map(mapToFrontendIngredient)

    return NextResponse.json({
      success: true,
      data: { results },
      fromCache: result.fromCache,
      count: results.length,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ /api/nutrition/search error:', err.message)
    return NextResponse.json(
      { success: false, error: err.message || 'Search failed' },
      { status: 500 }
    )
  }
}
