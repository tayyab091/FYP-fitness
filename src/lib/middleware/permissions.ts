import { NextRequest, NextResponse } from 'next/server'
import { User, type IUser } from '@/models'
import { AuthContext, isNextResponse, requireAuth } from '@/lib/middleware/auth'

export { isNextResponse }

export interface PermissionContext extends AuthContext {
  user: IUser
}

async function loadUser(userId: string): Promise<IUser | null> {
  return User.findById(userId)
}

export async function requireRole(
  req: NextRequest,
  ...roles: string[]
): Promise<PermissionContext | NextResponse> {
  const authResult = await requireAuth(req)

  if (isNextResponse(authResult)) {
    return authResult
  }

  try {
    const user = await loadUser(authResult.userId)

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    if (!roles.includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
          requiredRole: roles,
          userRole: user.role,
        },
        { status: 403 }
      )
    }

    if (user.verificationStatus === 'suspended') {
      return NextResponse.json({ success: false, error: 'Account suspended' }, { status: 403 })
    }

    return { ...authResult, user }
  } catch (err) {
    console.error('Permission check error:', err)
    return NextResponse.json(
      { success: false, error: 'Server error during permission check' },
      { status: 500 }
    )
  }
}

export async function requireVerified(req: NextRequest): Promise<PermissionContext | NextResponse> {
  const authResult = await requireAuth(req)

  if (isNextResponse(authResult)) {
    return authResult
  }

  try {
    const user = await loadUser(authResult.userId)

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    if (user.verificationStatus !== 'verified') {
      return NextResponse.json(
        {
          success: false,
          error: 'Account not verified',
          currentStatus: user.verificationStatus,
        },
        { status: 403 }
      )
    }

    return { ...authResult, user }
  } catch (err) {
    console.error('Verification check error:', err)
    return NextResponse.json(
      { success: false, error: 'Server error during verification check' },
      { status: 500 }
    )
  }
}

export async function requireActive(req: NextRequest): Promise<PermissionContext | NextResponse> {
  const authResult = await requireAuth(req)

  if (isNextResponse(authResult)) {
    return authResult
  }

  try {
    const user = await loadUser(authResult.userId)

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'Account is inactive' }, { status: 403 })
    }

    return { ...authResult, user }
  } catch (err) {
    console.error('Active user check error:', err)
    return NextResponse.json(
      { success: false, error: 'Server error during active user check' },
      { status: 500 }
    )
  }
}

export async function requirePaidSubscription(
  req: NextRequest
): Promise<PermissionContext | NextResponse> {
  const authResult = await requireAuth(req)

  if (isNextResponse(authResult)) {
    return authResult
  }

  try {
    const user = await loadUser(authResult.userId)

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const isPaid =
      user.subscription &&
      user.subscription.status === 'active' &&
      ['pro', 'elite'].includes(user.subscription.plan || '')

    if (!isPaid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Paid subscription required',
          upgradeUrl: '/subscription',
        },
        { status: 403 }
      )
    }

    return { ...authResult, user }
  } catch (err) {
    console.error('Subscription check error:', err)
    return NextResponse.json(
      { success: false, error: 'Server error during subscription check' },
      { status: 500 }
    )
  }
}

export async function requireGymOwner(req: NextRequest): Promise<PermissionContext | NextResponse> {
  const authResult = await requireAuth(req)

  if (isNextResponse(authResult)) {
    return authResult
  }

  try {
    const user = await loadUser(authResult.userId)

    if (!user || user.role !== 'gym_owner') {
      return NextResponse.json({ success: false, error: 'Gym owner access required' }, { status: 403 })
    }

    if (user.verificationStatus === 'suspended') {
      return NextResponse.json({ success: false, error: 'Account suspended' }, { status: 403 })
    }

    return { ...authResult, user }
  } catch (err) {
    console.error('Gym owner check error:', err)
    return NextResponse.json(
      { success: false, error: 'Server error during gym owner check' },
      { status: 500 }
    )
  }
}

export async function requireTrainer(req: NextRequest): Promise<PermissionContext | NextResponse> {
  const authResult = await requireAuth(req)

  if (isNextResponse(authResult)) {
    return authResult
  }

  try {
    const user = await loadUser(authResult.userId)

    if (!user || user.role !== 'trainer') {
      return NextResponse.json({ success: false, error: 'Trainer access required' }, { status: 403 })
    }

    if (user.verificationStatus === 'suspended') {
      return NextResponse.json({ success: false, error: 'Account suspended' }, { status: 403 })
    }

    return { ...authResult, user }
  } catch (err) {
    console.error('Trainer check error:', err)
    return NextResponse.json(
      { success: false, error: 'Server error during trainer check' },
      { status: 500 }
    )
  }
}

export async function requireAdmin(req: NextRequest): Promise<PermissionContext | NextResponse> {
  return requireRole(req, 'admin', 'super_admin')
}

export async function requireSuperAdmin(req: NextRequest): Promise<PermissionContext | NextResponse> {
  const authResult = await requireAuth(req)

  if (isNextResponse(authResult)) {
    return authResult
  }

  try {
    const user = await loadUser(authResult.userId)

    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 })
    }

    return { ...authResult, user }
  } catch (err) {
    console.error('Super admin check error:', err)
    return NextResponse.json(
      { success: false, error: 'Server error during super admin check' },
      { status: 500 }
    )
  }
}
