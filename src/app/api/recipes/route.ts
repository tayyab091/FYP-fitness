import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { Recipe } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10) || 1
    const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '12', 10) || 12
    const skip = (page - 1) * limit
    const mealType = req.nextUrl.searchParams.get('mealType')

    const filter: Record<string, unknown> = { isActive: true }
    if (mealType) {
      filter.mealType = mealType
    }

    const recipes = await Recipe.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
    const total = await Recipe.countDocuments(filter)

    return NextResponse.json({
      recipes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Get recipes error:', err)
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const body = await req.json()
    const {
      title,
      imageUrl,
      mealType,
      prepTimeMinutes,
      calories,
      protein,
      carbs,
      fat,
      ingredients,
      instructions,
    } = body

    if (!title || !mealType || !calories) {
      return NextResponse.json(
        { success: false, message: 'Title, mealType, and calories are required' },
        { status: 400 }
      )
    }

    if (!['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(mealType)) {
      return NextResponse.json({ success: false, message: 'Invalid meal type' }, { status: 400 })
    }

    const recipe = await Recipe.create({
      title,
      imageUrl,
      mealType,
      prepTimeMinutes,
      calories,
      protein,
      carbs,
      fat,
      ingredients: ingredients || [],
      instructions: instructions || [],
      isActive: true,
      dataSource: 'manual',
      createdBy: authResult.userId,
      updatedBy: authResult.userId,
    })

    return NextResponse.json(
      { success: true, data: recipe, message: 'Recipe created successfully' },
      { status: 201 }
    )
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; errors?: Record<string, { message: string }> }
    console.error('❌ Error saving recipe:', err.message)
    if (err.name === 'ValidationError' && err.errors) {
      const messages = Object.values(err.errors).map((val) => val.message)
      return NextResponse.json({ success: false, message: messages.join(', ') }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to create recipe', error: err.message },
      { status: 500 }
    )
  }
}
