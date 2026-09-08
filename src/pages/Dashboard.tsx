import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Row, Col, Card, Statistic, Table, Tag, Spin, Progress, List, Typography, DatePicker, Button, Space, Tooltip as AntTooltip } from 'antd'
import {
  DollarOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'

import {
  getRecentReservations,
  getDailyRevenueDetail,
  getWeekdayDistribution,
  getTopProducts,
  getStatusDistribution,
  type RecentReservation,
} from '@/services/dashboardService'
import { RESERVATION_STATUS_LABEL, RESERVATION_STATUS_COLOR } from '@/constants'
import type { ReservationStatusType } from '@/types'
import { SiteAnalyticsPanel } from '@/components/analytics/SiteAnalyticsPanel'

const { Text } = Typography
const { RangePicker } = DatePicker

// 빠른 기간 선택 타입
type QuickPeriod = '1d' | '1m' | '1y' | 'custom'

export function DashboardPage() {
  const navigate = useNavigate()

  // 기간 선택 상태
  const [quickPeriod, setQuickPeriod] = useState<QuickPeriod>('1m')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(() => {
    const end = dayjs()
    const start = end.subtract(1, 'month')
    return [start, end]
  })

  // 빠른 기간 선택 핸들러
  const handleQuickPeriod = (period: QuickPeriod) => {
    setQuickPeriod(period)
    const end = dayjs()
    let start: dayjs.Dayjs

    switch (period) {
      case '1d':
        start = end
        break
      case '1m':
        start = end.subtract(1, 'month')
        break
      case '1y':
        start = end.subtract(1, 'year')
        break
      default:
        return
    }
    setDateRange([start, end])
  }

  // 직접 날짜 선택 핸들러
  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setQuickPeriod('custom')
      setDateRange([dates[0], dates[1]])
    }
  }

  // 조회할 날짜 범위 (문자열)
  const startDateStr = useMemo(() => dateRange[0].format('YYYY-MM-DD'), [dateRange])
  const endDateStr = useMemo(() => dateRange[1].format('YYYY-MM-DD'), [dateRange])

  // 최근 예약 조회
  const { data: recentReservations, isLoading: reservationsLoading } = useQuery({
    queryKey: ['recentReservations'],
    queryFn: () => getRecentReservations(5),
  })

  // 일별 매출 추이 (세분화)
  const { data: revenueResult, isLoading: revenueLoading, error: revenueError, refetch: refetchRevenue } = useQuery({
    queryKey: ['dailyRevenueDetail', 'fixed-original-12-percent', startDateStr, endDateStr],
    queryFn: () => getDailyRevenueDetail(startDateStr, endDateStr),
  })
  const dailyRevenueDetail = revenueError ? undefined : revenueResult?.data
  const revenueTotals = dailyRevenueDetail?.reduce((sum, day) => ({
    revenue: sum.revenue + day.revenue,
    refundAmount: sum.refundAmount + day.refundAmount,
    netRevenue: sum.netRevenue + day.netRevenue,
    settlementAmount: sum.settlementAmount + day.settlementAmount,
    count: sum.count + day.count,
  }), { revenue: 0, refundAmount: 0, netRevenue: 0, settlementAmount: 0, count: 0 })
  const formatRevenue = (value: string | number) => revenueError ? '—' : Number(value).toLocaleString()

  // 요일별 예약 분포
  const { data: weekdayData } = useQuery({
    queryKey: ['weekdayDistribution'],
    queryFn: getWeekdayDistribution,
  })

  // 상품별 매출 TOP 5
  const { data: topProducts } = useQuery({
    queryKey: ['topProducts'],
    queryFn: () => getTopProducts(5),
  })

  // 예약 상태별 분포
  const { data: statusData } = useQuery({
    queryKey: ['statusDistribution'],
    queryFn: getStatusDistribution,
  })

  const columns: ColumnsType<RecentReservation> = [
    {
      title: '예약번호',
      dataIndex: 'reservation_number',
      key: 'reservation_number',
      width: 130,
      render: (num: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{num}</span>
      ),
    },
    {
      title: '상품',
      key: 'product',
      ellipsis: true,
      render: (_, record) => record.product?.name || '-',
    },
    {
      title: '금액',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      align: 'right',
      render: (amount: number) => `${amount?.toLocaleString() || 0}원`,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: ReservationStatusType) => (
        <Tag color={RESERVATION_STATUS_COLOR[status]} style={{ margin: 0 }}>
          {RESERVATION_STATUS_LABEL[status]}
        </Tag>
      ),
    },
  ]

  // 금액 포맷팅 (차트 툴팁용)
  const formatAmount = (value: number) => `${value.toLocaleString()}원`

  // 총 예약 수 (파이차트용)
  const totalReservations = statusData?.reduce((sum, s) => sum + s.count, 0) || 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>대시보드</h2>
        <Text type="secondary">{dayjs().format('YYYY년 MM월 DD일 (ddd)')}</Text>
      </div>

      {/* 기간 선택 필터 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        padding: '12px 16px',
        background: '#fafafa',
        borderRadius: 8,
      }}>
        <Text strong style={{ fontSize: 13 }}>조회 기간</Text>
        <Space size={8}>
          <Button
            size="small"
            type={quickPeriod === '1d' ? 'primary' : 'default'}
            onClick={() => handleQuickPeriod('1d')}
          >
            1일
          </Button>
          <Button
            size="small"
            type={quickPeriod === '1m' ? 'primary' : 'default'}
            onClick={() => handleQuickPeriod('1m')}
          >
            1달
          </Button>
          <Button
            size="small"
            type={quickPeriod === '1y' ? 'primary' : 'default'}
            onClick={() => handleQuickPeriod('1y')}
          >
            1년
          </Button>
          <RangePicker
            size="small"
            value={dateRange}
            onChange={handleDateRangeChange}
            allowClear={false}
            style={{ width: 220 }}
            popupClassName="single-calendar-range"
          />
        </Space>
        <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
          {dateRange[0].format('YYYY.MM.DD')} ~ {dateRange[1].format('YYYY.MM.DD')}
        </Text>
      </div>

      {/* 매출 지표 (날짜 필터 연동) */}
      {revenueError && (
        <Alert
          type="error"
          showIcon
          title="매출 통계를 불러오지 못했습니다."
          description={revenueError.message}
          action={<Button onClick={() => void refetchRevenue()}>다시 조회</Button>}
          style={{ marginBottom: 16 }}
        />
      )}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" loading={revenueLoading}>
            <Statistic
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <DollarOutlined style={{ color: '#1890ff' }} />
                  매출액
                </span>
              }
              value={revenueTotals?.revenue ?? 0}
              suffix="원"
              valueStyle={{ color: '#1890ff' }}
              formatter={formatRevenue}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              실제 결제된 예약거래액 · {revenueError ? '—' : revenueTotals?.count ?? 0}건
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" loading={revenueLoading}>
            <AntTooltip title="전체 취소·부분환불 중 실제 환불 완료된 금액의 합계입니다. 환불 대기·실패 건은 제외합니다.">
              <Statistic
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    환불액
                  </span>
                }
                value={revenueTotals?.refundAmount ?? 0}
                suffix="원"
                valueStyle={{ color: '#ff4d4f' }}
                formatter={formatRevenue}
              />
            </AntTooltip>
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              전체 취소·부분환불 완료액
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" loading={revenueLoading}>
            <Statistic
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  순매출
                </span>
              }
              value={revenueTotals?.netRevenue ?? 0}
              suffix="원"
              valueStyle={{ color: '#52c41a' }}
              formatter={formatRevenue}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              담다 수익 · 최초 결제액 × 12% (부분환불 유지·전액환불 면제)
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" loading={revenueLoading}>
            <Statistic
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RiseOutlined style={{ color: '#722ed1' }} />
                  정산액
                </span>
              }
              value={revenueTotals?.settlementAmount ?? 0}
              suffix="원"
              valueStyle={{ color: '#722ed1' }}
              formatter={formatRevenue}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              사업주 정산 예상액 · 매출액 − 환불액 − 순매출
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        결제는 결제일, 환불은 환불 완료일(한국 시간) 기준으로 반영됩니다.
        순매출은 최초 실제 결제액의 12%를 거래별로 원 단위 반올림하며, 부분환불 시에는 유지됩니다.
        누적 환불액이 결제액 전액에 도달하면 전액환불 완료일에 기존 수수료를 차감하여 해당 거래의 수수료를 0원으로 처리합니다.
        정산액은 실제 지급 완료액과 다른 예상액입니다.
        이전 기간 결제에 대한 환불·수수료 조정으로 기간별 금액이 음수가 되면 차감액으로 표시됩니다.
      </div>

      <div style={{ marginTop: 16 }}>
        <SiteAnalyticsPanel title="메인 홈페이지 월별·일별 방문 현황" />
      </div>

      {/* 차트 영역 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 매출 추이 차트 */}
        <Col xs={24} lg={16}>
          <Card size="small" title="매출 추이">
            {revenueLoading ? (
              <div style={{ textAlign: 'center', padding: 100 }}>
                <Spin />
              </div>
            ) : revenueError ? (
              <Text type="secondary">매출 통계를 다시 조회해주세요.</Text>
            ) : (
              <>
                {/* 범례 */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <span style={{ width: 12, height: 3, background: '#1890ff', borderRadius: 2 }} />
                    매출액
                  </span>
                  <AntTooltip title="전체 취소·부분환불 중 실제 환불 완료된 금액입니다">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'help' }}>
                      <span style={{ width: 12, height: 3, background: '#ff4d4f', borderRadius: 2 }} />
                      환불액
                    </span>
                  </AntTooltip>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <span style={{ width: 12, height: 3, background: '#52c41a', borderRadius: 2 }} />
                    순매출
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <span style={{ width: 12, height: 3, background: '#722ed1', borderRadius: 2 }} />
                    정산액
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={dailyRevenueDetail || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      tick={{ fontSize: 11 }}
                      interval={dailyRevenueDetail && dailyRevenueDetail.length > 60 ? Math.floor(dailyRevenueDetail.length / 12) : 'preserveStartEnd'}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => value >= 10000 ? `${(value / 10000).toFixed(0)}만` : value}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        const labels: Record<string, string> = {
                          revenue: '매출액',
                          refundAmount: '환불액',
                          netRevenue: '순매출',
                          settlementAmount: '정산액',
                        }
                        const metricName = String(name || '')
                        return [formatAmount(Number(value || 0)), labels[metricName] || metricName]
                      }}
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1890ff"
                      strokeWidth={2}
                      dot={false}
                      name="revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="refundAmount"
                      stroke="#ff4d4f"
                      strokeWidth={2}
                      dot={false}
                      name="refundAmount"
                    />
                    <Line
                      type="monotone"
                      dataKey="netRevenue"
                      stroke="#52c41a"
                      strokeWidth={2}
                      dot={false}
                      name="netRevenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="settlementAmount"
                      stroke="#722ed1"
                      strokeWidth={2}
                      dot={false}
                      name="settlementAmount"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </Card>
        </Col>

        {/* 예약 상태 분포 */}
        <Col xs={24} lg={8}>
          <Card size="small" title="예약 상태 분포">
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData?.filter((s) => s.count > 0) || []}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="label"
                  >
                    {statusData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${Number(value ?? 0)}건`, '']} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: 11, paddingTop: 16 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* 파이차트 중앙에 총 건수 표시 */}
              <div style={{
                position: 'absolute',
                top: '45%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#262626' }}>
                  {totalReservations}
                </div>
                <div style={{ fontSize: 11, color: '#8c8c8c' }}>총 건수</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 하단 영역 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 요일별 예약 분포 */}
        <Col xs={24} lg={8}>
          <Card size="small" title="요일별 예약 현황">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekdayData || []} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${Number(value ?? 0)}건`, '예약']} />
                <Bar dataKey="count" fill="#52c41a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {weekdayData && (() => {
                  const max = weekdayData.reduce((a, b) => a.count > b.count ? a : b)
                  return max.count > 0 ? `${max.day}요일에 예약이 가장 많습니다` : '데이터가 없습니다'
                })()}
              </Text>
            </div>
          </Card>
        </Col>

        {/* 인기 상품 TOP 5 */}
        <Col xs={24} lg={8}>
          <Card size="small" title={<><TrophyOutlined style={{ color: '#faad14' }} /> 상품 매출 TOP 5</>}>
            <List
              size="small"
              dataSource={topProducts || []}
              locale={{ emptyText: '데이터가 없습니다' }}
              renderItem={(item, index) => {
                const maxRevenue = topProducts?.[0]?.revenue || 1
                const percent = Math.round((item.revenue / maxRevenue) * 100)
                return (
                  <List.Item style={{ padding: '8px 0' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text
                          ellipsis
                          style={{
                            flex: 1,
                            fontSize: 13,
                            fontWeight: index === 0 ? 600 : 400,
                          }}
                        >
                          <span style={{
                            display: 'inline-block',
                            width: 18,
                            height: 18,
                            lineHeight: '18px',
                            textAlign: 'center',
                            borderRadius: '50%',
                            backgroundColor: index < 3 ? ['#faad14', '#bfbfbf', '#d48806'][index] : '#f0f0f0',
                            color: index < 3 ? '#fff' : '#666',
                            fontSize: 11,
                            marginRight: 8,
                          }}>
                            {index + 1}
                          </span>
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#1890ff' }}>
                          {item.revenue.toLocaleString()}원
                        </Text>
                      </div>
                      <Progress
                        percent={percent}
                        size="small"
                        showInfo={false}
                        strokeColor={index === 0 ? '#faad14' : '#1890ff'}
                      />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {item.count}건 판매
                      </Text>
                    </div>
                  </List.Item>
                )
              }}
            />
          </Card>
        </Col>

        {/* 최근 예약 */}
        <Col xs={24} lg={8}>
          <Card
            size="small"
            title="최근 예약"
            extra={
              <a onClick={() => navigate('/reservations')} style={{ fontSize: 12 }}>
                전체보기
              </a>
            }
          >
            <Table
              columns={columns}
              dataSource={recentReservations || []}
              rowKey="id"
              loading={reservationsLoading}
              pagination={false}
              size="small"
              showHeader={false}
              onRow={(record) => ({
                onClick: () => navigate(`/reservations/${record.id}`),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
