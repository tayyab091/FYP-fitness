import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export interface AuthContext {
  userId: string
  userRole: string
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse
}

export async function requireAuth(req: NextRequest): Promise<AuthContext | NextResponse> {
  const auth = await getAuthUser(req)

  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized: no token provided' }, { status: 401 })
  }

  return { userId: auth.userId, userRole: auth.role }
}
