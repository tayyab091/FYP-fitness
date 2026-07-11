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

    const plan = await DailyNutritionPlan.findOne({ _id: planId, trainerId })
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }

    if (plan.status !== 'draft') {
      return NextResponse.json(
        { success: false, error: 'Plan is already sent or approved' },
        { status: 400 }
      )
    }

    plan.status = 'pending'
    plan.alertSentAt = new Date()
    await plan.save()

    await Notification.create({
      userId: trainerId,
      type: 'nutrition_plan_pending',
      title: '⚠️ Review Required — Nutrition Plan',
      message: `You have a meal plan for ${plan.planDate} waiting for your final approval. Review and confirm before your client sees it.`,
      link: `/trainer/clients/${plan.userId}/nutrition/${planId}`,
      metadata: {
        planId: plan._id,
        planDate: plan.planDate,
        userId: plan.userId,
      },
    })

    const globalAny = global as typeof globalThis & {
      io?: { to: (room: string) => { emit: (event: string, data: unknown) => void } }
    }
    if (globalAny.io) {
      globalAny.io.to(`user:${trainerId}`).emit('notification:new', {
        type: 'nutrition_plan_pending',
        title: '⚠️ Review Required',
        message: `Meal plan for ${plan.planDate} needs your final approval`,
        link: `/trainer/clients/${plan.userId}/nutrition/${planId}`,
        urgent: true,
      })
    }

    console.log(`📤 Plan sent for review: ${planId}`)
    return NextResponse.json({
      success: true,
      data: plan,
      message: 'Plan sent! Check your notifications to give final approval',
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('❌ Send plan error:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
