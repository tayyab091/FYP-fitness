import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { getNutritionFromText } from '@/services/nutritionService'

function transformNutritionData(item: Record<string, unknown>) {
  return {
    name: item.name,
    calories: item.calories,
    protein: item.protein_g,
    carbohydrates: item.carbohydrates_total_g,
    fat: item.fat_total_g,
    fiber: item.fiber_g,
    sodium: item.sodium_mg,
    sugar: item.sugar_g,
    serving_size_g: item.serving_size_g,
    ...item,
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const query = req.nextUrl.searchParams.get('query') ?? ''

    if (!query.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameter is required',
          example: '/api/nutrition/analyze?query=2 eggs and toast',
        },
        { status: 400 }
      )
    }

    if (query.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Query too long. Maximum 500 characters.' },
        { status: 400 }
      )
    }

    const result = await getNutritionFromText(query)
    type NutritionRow = Record<string, unknown> & {
      calories?: number
      protein?: number
      carbohydrates?: number
      fat?: number
      fiber?: number
    }
    const transformedData: NutritionRow[] = result.data.map((item: Record<string, unknown>) =>
      transformNutritionData(item)
    )

    const totals = {
      calories: transformedData.reduce((sum: number, item: NutritionRow) => sum + (Number(item.calories) || 0), 0),
      protein: transformedData.reduce((sum: number, item: NutritionRow) => sum + (Number(item.protein) || 0), 0),
      carbohydrates: transformedData.reduce(
        (sum: number, item: NutritionRow) => sum + (Number(item.carbohydrates) || 0),
        0
      ),
      fat: transformedData.reduce((sum: number, item: NutritionRow) => sum + (Number(item.fat) || 0), 0),
      fiber: transformedData.reduce((sum: number, item: NutritionRow) => sum + (Number(item.fiber) || 0), 0),
    }

    return NextResponse.json({
      success: true,
      query,
      fromCache: result.fromCache,
      itemCount: transformedData.length,
      data: transformedData,
      totals,
      cacheHitCount: result.hitCount,
    })
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number; data?: unknown } }
    console.error('❌ /api/nutrition/analyze error:', err.message)

    if (err.response?.status === 429) {
      return NextResponse.json(
        { success: false, error: 'Nutrition API rate limit reached. Please try again later.' },
        { status: 429 }
      )
    }

    if (err.response?.status === 401) {
      return NextResponse.json(
        { success: false, error: 'Nutrition API authentication failed. Check API_NINJAS_KEY.' },
        { status: 500 }
      )
    }

    if (err.response?.status === 400) {
      return NextResponse.json(
        { success: false, error: 'Invalid query for nutrition API', details: err.response.data },
        { status: 400 }
      )
    }

    if (err.message === 'API_NINJAS_RATE_LIMIT_REACHED_AND_NO_CACHED_DATA_AVAILABLE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Nutrition API rate limit reached and no cached data available.',
        },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { success: false, error: err.message || 'Failed to analyze nutrition' },
      { status: 500 }
    )
  }
}
