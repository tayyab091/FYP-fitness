import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { MealLog } from '@/models'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) {
      return authResult
    }

    const { id } = await params
    const meal = await MealLog.findOneAndDelete({
      _id: id,
      userId: authResult.userId,
    })

    if (!meal) {
      return NextResponse.json(
        { success: false, error: 'Meal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: 'Meal deleted' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete meal'
    console.error('Error deleting meal:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to delete meal', message },
      { status: 500 }
    )
  }
}
