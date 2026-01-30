import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type {
  AdminLog,
  AdminLogFilter,
  AdminLogAction,
  AdminLogTargetType,
  PaginationParams,
  Admin,
} from '@/types'

// 현재 로그인한 관리자 ID 가져오기
export function getCurrentAdminId(): string | null {
  return useAuthStore.getState().admin?.id || null
}

// 활동 로그 목록 조회
export async function getAdminLogs(
  params: PaginationParams & AdminLogFilter
): Promise<{ data: AdminLog[]; total: number }> {
  const { page, pageSize, admin_id, action, target_type, date_from, date_to } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('admin_logs')
    .select(
      `
      *,
      admin:admin_id(name, login_id)
    `,
      { count: 'exact' }
    )

  // 관리자 필터
  if (admin_id && admin_id !== 'all') {
    query = query.eq('admin_id', admin_id)
  }

  // 작업 유형 필터
  if (action && action !== 'all') {
    query = query.eq('action', action)
  }

  // 대상 유형 필터
  if (target_type && target_type !== 'all') {
    query = query.eq('target_type', target_type)
  }

  // 날짜 필터
  if (date_from) {
    query = query.gte('created_at', `${date_from}T00:00:00`)
  }
  if (date_to) {
    query = query.lte('created_at', `${date_to}T23:59:59`)
  }

  // 정렬 및 페이지네이션
  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: (data as AdminLog[]) || [],
    total: count || 0,
  }
}

// 활동 로그 상세 조회
export async function getAdminLog(id: string): Promise<AdminLog> {
  const { data, error } = await supabase
    .from('admin_logs')
    .select(
      `
      *,
      admin:admin_id(name, login_id)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as AdminLog
}

// 활동 로그 기록
export async function createAdminLog(params: {
  adminId: string
  action: AdminLogAction
  targetType: AdminLogTargetType
  targetId: string
  beforeData?: Record<string, unknown> | null
  afterData?: Record<string, unknown> | null
  ipAddress?: string | null
}): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('admin_logs') as any).insert({
    admin_id: params.adminId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    before_data: params.beforeData || null,
    after_data: params.afterData || null,
    ip_address: params.ipAddress || null,
  })

  if (error) {
    console.error('활동 로그 기록 실패:', error.message)
  }
}

// DB Admin 타입 (Supabase에서 반환하는 형태)
interface DbAdmin {
  id: string
  login_id: string
  name: string
  role: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

// 관리자 목록 조회 (필터용)
export async function getAdmins(): Promise<Admin[]> {
  const { data, error } = await supabase
    .from('admins')
    .select('id, login_id, name, role, is_active, last_login_at, created_at')
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  // DB 형식을 앱 타입으로 변환
  return ((data as DbAdmin[]) || []).map((admin) => ({
    id: admin.id,
    loginId: admin.login_id,
    name: admin.name,
    role: admin.role as 'super_admin' | 'admin',
    is_active: admin.is_active,
    last_login_at: admin.last_login_at,
    created_at: admin.created_at,
  }))
}

// 작업 유형 라벨
export const ACTION_LABELS: Record<AdminLogAction, string> = {
  create: '생성',
  update: '수정',
  delete: '삭제',
  status_change: '상태 변경',
  login: '로그인',
  logout: '로그아웃',
}

// 대상 유형 라벨
export const TARGET_TYPE_LABELS: Record<AdminLogTargetType, string> = {
  business_owner: '사업주',
  daycare: '어린이집',
  product: '상품',
  category: '카테고리',
  reservation: '예약',
  review: '리뷰',
  notice: '공지사항',
  faq: 'FAQ',
  banner: '배너',
  popup: '팝업',
  inquiry: '1:1 문의',
  site_settings: '사이트 설정',
}

// ===== 편의 함수: 서비스에서 쉽게 로그 기록 =====

// 생성 로그 기록
export async function logCreate(
  targetType: AdminLogTargetType,
  targetId: string,
  afterData?: Record<string, unknown> | null
): Promise<void> {
  const adminId = getCurrentAdminId()
  if (!adminId) return

  await createAdminLog({
    adminId,
    action: 'create',
    targetType,
    targetId,
    afterData,
  })
}

// 수정 로그 기록
export async function logUpdate(
  targetType: AdminLogTargetType,
  targetId: string,
  beforeData?: Record<string, unknown> | null,
  afterData?: Record<string, unknown> | null
): Promise<void> {
  const adminId = getCurrentAdminId()
  if (!adminId) return

  await createAdminLog({
    adminId,
    action: 'update',
    targetType,
    targetId,
    beforeData,
    afterData,
  })
}

// 삭제 로그 기록
export async function logDelete(
  targetType: AdminLogTargetType,
  targetId: string,
  beforeData?: Record<string, unknown> | null
): Promise<void> {
  const adminId = getCurrentAdminId()
  if (!adminId) return

  await createAdminLog({
    adminId,
    action: 'delete',
    targetType,
    targetId,
    beforeData,
  })
}

// 상태 변경 로그 기록
export async function logStatusChange(
  targetType: AdminLogTargetType,
  targetId: string,
  beforeData?: Record<string, unknown> | null,
  afterData?: Record<string, unknown> | null
): Promise<void> {
  const adminId = getCurrentAdminId()
  if (!adminId) return

  await createAdminLog({
    adminId,
    action: 'status_change',
    targetType,
    targetId,
    beforeData,
    afterData,
  })
}

// 로그인 로그 기록
export async function logLogin(adminId: string): Promise<void> {
  await createAdminLog({
    adminId,
    action: 'login',
    targetType: 'site_settings',
    targetId: adminId,
  })
}

// 로그아웃 로그 기록
export async function logLogout(): Promise<void> {
  const adminId = getCurrentAdminId()
  if (!adminId) return

  await createAdminLog({
    adminId,
    action: 'logout',
    targetType: 'site_settings',
    targetId: adminId,
  })
}
