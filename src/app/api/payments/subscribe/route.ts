import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'
import { User } from '@/models'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAuth(req)
    if (isNextResponse(authResult)) return authResult

    const { plan, cardData } = await req.json()
    const userId = authResult.userId

    if (!plan || !['basic', 'pro', 'elite'].includes(plan)) {
      return NextResponse.json({ message: 'Invalid plan selected' }, { status: 400 })
    }

    if (!cardData || !cardData.cardholderName) {
      return NextResponse.json({ message: 'Card details are required' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 1)

    user.subscription = {
      plan: plan as 'basic' | 'pro' | 'elite',
      status: 'active',
      startDate,
      endDate,
      paymentId,
    }

    await user.save()

    return NextResponse.json({
      message: 'Subscription activated successfully',
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        paymentId,
      },
    })
  } catch (err: unknown) {
    console.error('Payment error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ message: 'Payment processing failed', error: message }, { status: 500 })
  }
}
