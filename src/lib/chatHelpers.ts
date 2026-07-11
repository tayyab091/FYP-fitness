import { PlatformSettings } from '@/models'

export async function getFreeChatLimit(): Promise<number> {
  try {
    const setting = await PlatformSettings.findOne({ settingKey: 'freeChatLimit' })
    return setting?.settingValue ?? 5
  } catch {
    return 5
  }
}
