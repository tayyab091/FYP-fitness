import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { User } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    const subscriptions = await User.find({ 'subscription.status': 'active' })
      .select('email fullName subscription createdAt')
      .sort({ 'subscription.startDate': -1 })

    const summary = {
      basic: subscriptions.filter((u) => u.subscription?.plan === 'basic').length,
      pro: subscriptions.filter((u) => u.subscription?.plan === 'pro').length,
      elite: subscriptions.filter((u) => u.subscription?.plan === 'elite').length,
    }

    return NextResponse.json({ success: true, subscriptions, summary })
  } catch (err: unknown) {
    console.error('Subscriptions error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
