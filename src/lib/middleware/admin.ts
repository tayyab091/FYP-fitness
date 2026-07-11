import { NextRequest, NextResponse } from 'next/server'
import { AuthContext, isNextResponse, requireAuth } from '@/lib/middleware/auth'

export { isNextResponse }

export async function requireAdminAccess(
  req: NextRequest
): Promise<AuthContext | NextResponse> {
  const authResult = await requireAuth(req)

  if (isNextResponse(authResult)) {
    return authResult
  }

  if (authResult.userRole !== 'admin' && authResult.userRole !== 'super_admin') {
    return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 })
  }

  return authResult
}
