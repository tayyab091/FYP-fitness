import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export interface JWTPayload {
  userId: string
  role: string
  email?: string
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function signAuthToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

function extractToken(req: NextRequest): string | null {
  const cookieToken = req.cookies.get('token')?.value
  if (cookieToken) return cookieToken

  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  return null
}

export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  const token = extractToken(req)
  if (!token) return null
  return verifyToken(token)
}

export async function getServerUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  return verifyToken(token)
}

export function setCookieOptions() {
  return {
    httpOnly: false, // Allow JavaScript access for WebSocket authentication
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }
}

export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set('token', token, setCookieOptions())
  return response
}

export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set('token', '', { ...setCookieOptions(), maxAge: 0 })
  return response
}
