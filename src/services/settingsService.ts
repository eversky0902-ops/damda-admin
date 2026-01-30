import { supabase } from '@/lib/supabase'
import { logUpdate } from '@/services/adminLogService'
import type { SiteSetting } from '@/types'

// 모든 설정 조회
export async function getAllSettings(): Promise<SiteSetting[]> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('key')

  if (error) {
    throw new Error(error.message)
  }

  return (data as SiteSetting[]) || []
}

// 특정 설정 조회
export async function getSetting(key: string): Promise<SiteSetting | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', key)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(error.message)
  }

  return data as SiteSetting
}

// 설정 업데이트
export async function updateSetting(
  key: string,
  value: unknown,
  adminId: string
): Promise<SiteSetting> {
  // 변경 전 데이터 조회
  const { data: beforeData } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', key)
    .single()

  const { data, error } = await supabase
    .from('site_settings')
    .update({
      value: JSON.stringify(value),
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('key', key)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // 활동 로그 기록
  await logUpdate(
    'site_settings',
    key,
    beforeData as Record<string, unknown>,
    data as Record<string, unknown>
  )

  return data as SiteSetting
}

// 여러 설정 한번에 업데이트
export async function updateSettings(
  settings: Record<string, unknown>,
  adminId: string
): Promise<void> {
  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value: JSON.stringify(value),
    updated_by: adminId,
    updated_at: new Date().toISOString(),
  }))

  for (const update of updates) {
    const { error } = await supabase
      .from('site_settings')
      .update({
        value: update.value,
        updated_by: update.updated_by,
        updated_at: update.updated_at,
      })
      .eq('key', update.key)

    if (error) {
      throw new Error(`설정 '${update.key}' 업데이트 실패: ${error.message}`)
    }
  }
}

// 설정값을 객체로 변환
export function settingsToObject(settings: SiteSetting[]): Record<string, unknown> {
  return settings.reduce(
    (acc, setting) => {
      try {
        acc[setting.key] = typeof setting.value === 'string'
          ? JSON.parse(setting.value as string)
          : setting.value
      } catch {
        acc[setting.key] = setting.value
      }
      return acc
    },
    {} as Record<string, unknown>
  )
}
