import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireAdminAccess } from '@/lib/middleware/admin'
import { PlatformSettings } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdminAccess(req)
    if (isNextResponse(authResult)) return authResult

    const settings = await PlatformSettings.find({})
    const settingsObj: Record<string, unknown> = {}
    settings.forEach((s) => {
      settingsObj[s.settingKey] = s.settingValue
    })

    return NextResponse.json({ success: true, data: settingsObj, raw: settings })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
