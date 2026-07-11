import { NextRequest, NextResponse } from 'next/server'
import { isNextResponse, requireAuth } from '@/lib/middleware/auth'

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)
  if (isNextResponse(authResult)) {
    return authResult
  }

  return NextResponse.json({ success: true, message: 'Use /api/relationships/my-trainer or related endpoints' })
}
