import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireRole } from '@/lib/middleware/permissions'
import { DailyNutritionPlan, Notification } from '@/models'

type RouteContext = { params: Promise<{ planId: string }> }

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    await connectDB()

    const authResult = await requireRole(req, 'trainer', 'admin')
    if (isNextResponse(authResult)) {
      return authResult
    }

    const { planId } = await context.params
    const trainerId = authResult.userId
    const body = await req.json().catch(() => ({}))
    const { finalNote } = body as { finalNote?: string }

    const plan = await DailyNutritionPlan.findOne({ _id: planId, trainerId })
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }

    plan.status = 'approved'
    plan.approvedAt = new Date()
    if (finalNote) plan.trainerNotes = finalNote
    await plan.save()

    await Notification.create({
      userId: plan.userId,
      type: 'nutrition_plan_ready',
      title: '🥗 Your Meal Plan is Ready!',
      message: `Your trainer has set up your meal plan for ${plan.planDate}. Check your nutrition page!`,
      link: '/my-fitness/nutrition',
      metadata: {
        planId: plan._id,
        planDate: plan.planDate,
      },
    })

    const globalAny = global as typeof globalThis & {
      io?: { to: (room: string) => { emit: (event: string, data: unknown) => void } }
    }
    if (globalAny.io) {
      globalAny.io.to(`user:${plan.userId.toString()}`).emit('notification:new', {
        type: 'nutrition_plan_ready',
        title: '🥗 Meal Plan Ready!',
        message: `Your meal plan for ${plan.planDate} is ready`,
        link: '/my-fitness/nutrition',
      })

      const unreadCount = await Notification.countDocuments({
        userId: plan.userId,
        isRead: false,
      })
      globalAny.io
        .to(`user:${plan.userId.toString()}`)
        .emit('notification:count', { count: unreadCount })
    }

    console.log(`✅ Plan approved: ${planId}`)
    return NextResponse.json({
      success: true,
      data: plan,
      message: 'Plan approved! User has been notified.',
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Approve plan error:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
