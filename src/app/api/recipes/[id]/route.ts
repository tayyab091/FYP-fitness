import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { Recipe } from '@/models'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await connectDB()

    const { id } = await context.params
    const recipe = await Recipe.findOne({ _id: id, isActive: true })

    if (!recipe) {
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 })
    }

    return NextResponse.json(recipe)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Get recipe error:', err)
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const { id } = await context.params
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

    const recipe = await Recipe.findByIdAndUpdate(
      id,
      {
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
        updatedBy: authResult.userId,
      },
      { new: true, runValidators: true }
    )

    if (!recipe) {
      return NextResponse.json({ success: false, message: 'Recipe not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: recipe,
      message: 'Recipe updated successfully',
    })
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; errors?: Record<string, { message: string }> }
    console.error('❌ Error updating recipe:', err.message)
    if (err.name === 'ValidationError' && err.errors) {
      const messages = Object.values(err.errors).map((val) => val.message)
      return NextResponse.json({ success: false, message: messages.join(', ') }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update recipe', error: err.message },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const { id } = await context.params

    const recipe = await Recipe.findByIdAndUpdate(
      id,
      { isActive: false, updatedBy: authResult.userId },
      { new: true }
    )

    if (!recipe) {
      return NextResponse.json({ success: false, message: 'Recipe not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Recipe deleted successfully' })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Error deleting recipe:', err.message)
    return NextResponse.json(
      { success: false, message: 'Failed to delete recipe', error: err.message },
      { status: 500 }
    )
  }
}
