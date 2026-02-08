import { supabase } from '@/lib/supabase'

// 지역별 통계 데이터
export interface RegionalStats {
  region: string
  revenue: number
  daycareCount: number
  businessOwnerCount: number
  reservationCount: number
}

// 변화율 포함 지역별 통계
export interface RegionalStatsWithChange extends RegionalStats {
  revenueMom: number | null
  revenueYoy: number | null
  daycareCountMom: number | null
  daycareCountYoy: number | null
  businessOwnerCountMom: number | null
  businessOwnerCountYoy: number | null
  reservationCountMom: number | null
  reservationCountYoy: number | null
}

// 전체 요약 통계
export interface MonthlySummary {
  totalRevenue: number
  totalDaycareCount: number
  totalBusinessOwnerCount: number
  totalReservationCount: number
  revenueMom: number | null
  revenueYoy: number | null
  daycareCountMom: number | null
  daycareCountYoy: number | null
  businessOwnerCountMom: number | null
  businessOwnerCountYoy: number | null
  reservationCountMom: number | null
  reservationCountYoy: number | null
}

// 비교 결과
export interface RegionalMonthlyComparison {
  summary: MonthlySummary
  regions: RegionalStatsWithChange[]
}

const VALID_STATUSES = ['paid', 'confirmed', 'completed']

// 월 범위 계산 (시작일, 종료일)
function getMonthRange(yearMonth: string): { start: string; end: string } {
  const [year, month] = yearMonth.split('-').map(Number)
  const start = `${yearMonth}-01T00:00:00`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${yearMonth}-${String(lastDay).padStart(2, '0')}T23:59:59`
  return { start, end }
}

// 변화율 계산
function calcGrowth(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 100)
}

// 특정 월의 지역별 통계 조회
export async function getRegionalStatsForMonth(yearMonth: string): Promise<RegionalStats[]> {
  const { start, end } = getMonthRange(yearMonth)

  const { data, error } = await supabase
    .from('reservations')
    .select('id, daycare_id, business_owner_id, total_amount, product:products(region)')
    .in('status', VALID_STATUSES)
    .gte('created_at', start)
    .lte('created_at', end)

  if (error) throw new Error(error.message)

  // 지역별 집계
  const regionMap = new Map<string, {
    revenue: number
    daycareIds: Set<string>
    businessOwnerIds: Set<string>
    reservationCount: number
  }>()

  data?.forEach((row) => {
    const product = row.product as { region: string | null } | null
    const region = product?.region?.split(' ')[0] || '기타'

    if (!regionMap.has(region)) {
      regionMap.set(region, {
        revenue: 0,
        daycareIds: new Set(),
        businessOwnerIds: new Set(),
        reservationCount: 0,
      })
    }

    const stats = regionMap.get(region)!
    stats.revenue += row.total_amount || 0
    if (row.daycare_id) stats.daycareIds.add(row.daycare_id)
    if (row.business_owner_id) stats.businessOwnerIds.add(row.business_owner_id)
    stats.reservationCount += 1
  })

  return Array.from(regionMap.entries())
    .map(([region, stats]) => ({
      region,
      revenue: stats.revenue,
      daycareCount: stats.daycareIds.size,
      businessOwnerCount: stats.businessOwnerIds.size,
      reservationCount: stats.reservationCount,
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

// 선택월 / 전월(MOM) / 전년동월(YOY) 비교 조회
export async function getRegionalMonthlyComparison(yearMonth: string): Promise<RegionalMonthlyComparison> {
  const [year, month] = yearMonth.split('-').map(Number)

  // 전월 계산
  const prevDate = new Date(year, month - 2, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  // 전년 동월 계산
  const yoyMonth = `${year - 1}-${String(month).padStart(2, '0')}`

  // 3건 병렬 조회
  const [current, prev, yoy] = await Promise.all([
    getRegionalStatsForMonth(yearMonth),
    getRegionalStatsForMonth(prevMonth),
    getRegionalStatsForMonth(yoyMonth),
  ])

  // 지역별 Map으로 변환
  const prevMap = new Map(prev.map((r) => [r.region, r]))
  const yoyMap = new Map(yoy.map((r) => [r.region, r]))

  // 모든 지역 수집
  const allRegions = new Set<string>()
  current.forEach((r) => allRegions.add(r.region))
  prev.forEach((r) => allRegions.add(r.region))
  yoy.forEach((r) => allRegions.add(r.region))

  // 지역별 비교 데이터 생성
  const currentMap = new Map(current.map((r) => [r.region, r]))
  const emptyStats: RegionalStats = { region: '', revenue: 0, daycareCount: 0, businessOwnerCount: 0, reservationCount: 0 }

  const regions: RegionalStatsWithChange[] = Array.from(allRegions)
    .map((region) => {
      const cur = currentMap.get(region) || { ...emptyStats, region }
      const prv = prevMap.get(region) || { ...emptyStats, region }
      const yr = yoyMap.get(region) || { ...emptyStats, region }

      return {
        ...cur,
        revenueMom: calcGrowth(cur.revenue, prv.revenue),
        revenueYoy: calcGrowth(cur.revenue, yr.revenue),
        daycareCountMom: calcGrowth(cur.daycareCount, prv.daycareCount),
        daycareCountYoy: calcGrowth(cur.daycareCount, yr.daycareCount),
        businessOwnerCountMom: calcGrowth(cur.businessOwnerCount, prv.businessOwnerCount),
        businessOwnerCountYoy: calcGrowth(cur.businessOwnerCount, yr.businessOwnerCount),
        reservationCountMom: calcGrowth(cur.reservationCount, prv.reservationCount),
        reservationCountYoy: calcGrowth(cur.reservationCount, yr.reservationCount),
      }
    })
    .sort((a, b) => b.revenue - a.revenue)

  // 전체 요약
  const sumStats = (list: RegionalStats[]) => ({
    revenue: list.reduce((s, r) => s + r.revenue, 0),
    daycareCount: new Set(list.flatMap(() => [])).size, // 아래에서 별도 계산
    businessOwnerCount: 0,
    reservationCount: list.reduce((s, r) => s + r.reservationCount, 0),
  })

  const curTotal = {
    revenue: current.reduce((s, r) => s + r.revenue, 0),
    daycareCount: current.reduce((s, r) => s + r.daycareCount, 0),
    businessOwnerCount: current.reduce((s, r) => s + r.businessOwnerCount, 0),
    reservationCount: current.reduce((s, r) => s + r.reservationCount, 0),
  }
  const prevTotal = {
    revenue: prev.reduce((s, r) => s + r.revenue, 0),
    daycareCount: prev.reduce((s, r) => s + r.daycareCount, 0),
    businessOwnerCount: prev.reduce((s, r) => s + r.businessOwnerCount, 0),
    reservationCount: prev.reduce((s, r) => s + r.reservationCount, 0),
  }
  const yoyTotal = {
    revenue: yoy.reduce((s, r) => s + r.revenue, 0),
    daycareCount: yoy.reduce((s, r) => s + r.daycareCount, 0),
    businessOwnerCount: yoy.reduce((s, r) => s + r.businessOwnerCount, 0),
    reservationCount: yoy.reduce((s, r) => s + r.reservationCount, 0),
  }

  const summary: MonthlySummary = {
    totalRevenue: curTotal.revenue,
    totalDaycareCount: curTotal.daycareCount,
    totalBusinessOwnerCount: curTotal.businessOwnerCount,
    totalReservationCount: curTotal.reservationCount,
    revenueMom: calcGrowth(curTotal.revenue, prevTotal.revenue),
    revenueYoy: calcGrowth(curTotal.revenue, yoyTotal.revenue),
    daycareCountMom: calcGrowth(curTotal.daycareCount, prevTotal.daycareCount),
    daycareCountYoy: calcGrowth(curTotal.daycareCount, yoyTotal.daycareCount),
    businessOwnerCountMom: calcGrowth(curTotal.businessOwnerCount, prevTotal.businessOwnerCount),
    businessOwnerCountYoy: calcGrowth(curTotal.businessOwnerCount, yoyTotal.businessOwnerCount),
    reservationCountMom: calcGrowth(curTotal.reservationCount, prevTotal.reservationCount),
    reservationCountYoy: calcGrowth(curTotal.reservationCount, yoyTotal.reservationCount),
  }

  return { summary, regions }
}
