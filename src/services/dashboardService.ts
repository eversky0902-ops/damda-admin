import { supabase } from '@/lib/supabase'
import type { Reservation } from '@/types'

// 대시보드 통계 타입
export interface DashboardStats {
  // 매출 관련
  monthlyRevenue: number
  todayRevenue: number
  lastMonthRevenue: number
  revenueGrowth: number // 전월 대비 성장률
  // 예약 관련
  newReservations: number
  pendingReservations: number
  completedReservations: number
  cancelledReservations: number
  // 상품/회원
  totalProducts: number
  activeProducts: number
  totalMembers: number
  approvedMembers: number
  newMembersThisMonth: number
}

// 최근 예약 타입 (조인 포함)
export interface RecentReservation extends Omit<Reservation, 'daycare' | 'product'> {
  daycare?: { id: string; name: string }
  product?: { id: string; name: string }
}

// 일별 매출 데이터
export interface DailyRevenueData {
  date: string
  displayDate: string
  amount: number
  count: number
}

// 요일별 예약 데이터
export interface WeekdayData {
  day: string
  count: number
  amount: number
}

// 시간대별 예약 데이터
export interface HourlyData {
  hour: string
  count: number
}

// 상품별 매출 데이터
export interface ProductRevenueData {
  id: string
  name: string
  revenue: number
  count: number
}

// 예약 상태별 데이터
export interface StatusData {
  status: string
  label: string
  count: number
  color: string
}

// 대시보드 통계 조회
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  const [
    monthlyPayments,
    lastMonthPayments,
    todayPayments,
    monthlyReservations,
    pendingReservations,
    completedReservations,
    cancelledReservations,
    products,
    members,
    newMembers,
  ] = await Promise.all([
    // 이번 달 결제 완료 금액
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', `${firstDayOfMonth}T00:00:00`),

    // 지난 달 결제 완료 금액
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', `${firstDayOfLastMonth}T00:00:00`)
      .lte('paid_at', `${lastDayOfLastMonth}T23:59:59`),

    // 오늘 결제 완료 금액
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', `${today}T00:00:00`)
      .lte('paid_at', `${today}T23:59:59`),

    // 이번 달 신규 예약 수
    supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${firstDayOfMonth}T00:00:00`),

    // 대기중인 예약 수
    supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'paid']),

    // 완료된 예약 수 (이번 달)
    supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('updated_at', `${firstDayOfMonth}T00:00:00`),

    // 취소된 예약 수 (이번 달)
    supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .in('status', ['cancelled', 'refunded'])
      .gte('updated_at', `${firstDayOfMonth}T00:00:00`),

    // 상품 수
    supabase.from('products').select('is_visible', { count: 'exact' }),

    // 회원 수
    supabase.from('daycares').select('status', { count: 'exact' }),

    // 이번 달 신규 가입
    supabase
      .from('daycares')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${firstDayOfMonth}T00:00:00`),
  ])

  const monthlyRevenue = monthlyPayments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  const lastMonthRevenue = lastMonthPayments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  const todayRevenue = todayPayments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  // 성장률 계산
  const revenueGrowth = lastMonthRevenue > 0
    ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : 0

  const totalProducts = products.count || 0
  const activeProducts = products.data?.filter((p) => p.is_visible).length || 0
  const totalMembers = members.count || 0
  const approvedMembers = members.data?.filter((m) => m.status === 'approved').length || 0

  return {
    monthlyRevenue,
    todayRevenue,
    lastMonthRevenue,
    revenueGrowth,
    newReservations: monthlyReservations.count || 0,
    pendingReservations: pendingReservations.count || 0,
    completedReservations: completedReservations.count || 0,
    cancelledReservations: cancelledReservations.count || 0,
    totalProducts,
    activeProducts,
    totalMembers,
    approvedMembers,
    newMembersThisMonth: newMembers.count || 0,
  }
}

// 최근 예약 조회
export async function getRecentReservations(limit = 10): Promise<RecentReservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      daycare:daycares(id, name),
      product:products(id, name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data as RecentReservation[]) || []
}

// 일별 매출 추이 (최근 N일)
export async function getDailyRevenue(days = 14): Promise<DailyRevenueData[]> {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - days + 1)
  const startDateStr = startDate.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('payments')
    .select('amount, paid_at')
    .eq('status', 'paid')
    .gte('paid_at', `${startDateStr}T00:00:00`)
    .order('paid_at', { ascending: true })

  if (error) throw new Error(error.message)

  // 날짜별로 집계
  const dailyMap = new Map<string, { amount: number; count: number }>()

  // 모든 날짜 초기화
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    dailyMap.set(dateStr, { amount: 0, count: 0 })
  }

  // 데이터 집계
  data?.forEach((row) => {
    if (row.paid_at) {
      const dateStr = row.paid_at.split('T')[0]
      const existing = dailyMap.get(dateStr)
      if (existing) {
        existing.amount += row.amount || 0
        existing.count += 1
      }
    }
  })

  // 결과 변환
  return Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    displayDate: `${parseInt(date.split('-')[1])}/${parseInt(date.split('-')[2])}`,
    amount: data.amount,
    count: data.count,
  }))
}

// 요일별 예약 분포
export async function getWeekdayDistribution(): Promise<WeekdayData[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('reserved_date, total_amount')
    .not('reserved_date', 'is', null)

  if (error) throw new Error(error.message)

  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekdayStats = weekdays.map((day) => ({ day, count: 0, amount: 0 }))

  data?.forEach((row) => {
    if (row.reserved_date) {
      const date = new Date(row.reserved_date)
      const dayIndex = date.getDay()
      weekdayStats[dayIndex].count += 1
      weekdayStats[dayIndex].amount += row.total_amount || 0
    }
  })

  return weekdayStats
}

// 시간대별 예약 분포
export async function getHourlyDistribution(): Promise<HourlyData[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('reserved_time')
    .not('reserved_time', 'is', null)

  if (error) throw new Error(error.message)

  // 시간대별 집계 (6시~22시)
  const hourlyStats: HourlyData[] = []
  for (let h = 6; h <= 22; h += 2) {
    hourlyStats.push({ hour: `${h}시`, count: 0 })
  }

  data?.forEach((row) => {
    if (row.reserved_time) {
      const hour = parseInt(row.reserved_time.split(':')[0])
      const index = Math.floor((hour - 6) / 2)
      if (index >= 0 && index < hourlyStats.length) {
        hourlyStats[index].count += 1
      }
    }
  })

  return hourlyStats
}

// 상품별 매출 TOP N
export async function getTopProducts(limit = 5): Promise<ProductRevenueData[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      product_id,
      total_amount,
      product:products(id, name)
    `)
    .in('status', ['paid', 'confirmed', 'completed'])

  if (error) throw new Error(error.message)

  // 상품별 집계
  const productMap = new Map<string, { name: string; revenue: number; count: number }>()

  data?.forEach((row) => {
    const productId = row.product_id
    const product = row.product as { id: string; name: string } | null
    if (productId && product) {
      const existing = productMap.get(productId)
      if (existing) {
        existing.revenue += row.total_amount || 0
        existing.count += 1
      } else {
        productMap.set(productId, {
          name: product.name || '알 수 없음',
          revenue: row.total_amount || 0,
          count: 1,
        })
      }
    }
  })

  // 매출순 정렬 후 상위 N개
  return Array.from(productMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

// 예약 상태별 분포
export async function getStatusDistribution(): Promise<StatusData[]> {
  const { data, error } = await supabase.from('reservations').select('status')

  if (error) throw new Error(error.message)

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: '대기중', color: '#faad14' },
    paid: { label: '결제완료', color: '#1890ff' },
    confirmed: { label: '확정', color: '#52c41a' },
    completed: { label: '완료', color: '#13c2c2' },
    cancelled: { label: '취소', color: '#ff4d4f' },
    refunded: { label: '환불', color: '#722ed1' },
  }

  const statusCounts = new Map<string, number>()
  data?.forEach((row) => {
    const count = statusCounts.get(row.status) || 0
    statusCounts.set(row.status, count + 1)
  })

  return Object.entries(statusConfig).map(([status, config]) => ({
    status,
    label: config.label,
    count: statusCounts.get(status) || 0,
    color: config.color,
  }))
}

// 기간별 매출 비교
export async function getPeriodComparison(periodDays = 30): Promise<{
  current: number
  previous: number
  growth: number
}> {
  const now = new Date()
  const currentStart = new Date(now)
  currentStart.setDate(currentStart.getDate() - periodDays)
  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - periodDays)

  const [currentData, previousData] = await Promise.all([
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', currentStart.toISOString()),
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', previousStart.toISOString())
      .lt('paid_at', currentStart.toISOString()),
  ])

  const current = currentData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  const previous = previousData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  const growth = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0

  return { current, previous, growth }
}
