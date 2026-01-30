import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Row, Col, Card, Statistic, Table, Tag, Spin, Segmented, Progress, List, Typography } from 'antd'
import {
  ShoppingOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart,
  Area,
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
} from 'recharts'

import {
  getDashboardStats,
  getRecentReservations,
  getDailyRevenue,
  getWeekdayDistribution,
  getTopProducts,
  getStatusDistribution,
  type RecentReservation,
} from '@/services/dashboardService'
import { RESERVATION_STATUS_LABEL, RESERVATION_STATUS_COLOR } from '@/constants'
import type { ReservationStatusType } from '@/types'

const { Text } = Typography

// 차트 기간 옵션
type ChartPeriod = '7' | '14' | '30'

export function DashboardPage() {
  const navigate = useNavigate()
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('14')

  // 대시보드 통계 조회
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
    refetchInterval: 60000,
  })

  // 최근 예약 조회
  const { data: recentReservations, isLoading: reservationsLoading } = useQuery({
    queryKey: ['recentReservations'],
    queryFn: () => getRecentReservations(5),
  })

  // 일별 매출 추이
  const { data: dailyRevenue } = useQuery({
    queryKey: ['dailyRevenue', chartPeriod],
    queryFn: () => getDailyRevenue(parseInt(chartPeriod)),
  })

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

  // 전월 대비 성장률 표시
  const GrowthIndicator = ({ value }: { value: number }) => {
    if (value === 0) return <Text type="secondary">-</Text>
    const isPositive = value > 0
    return (
      <span style={{ color: isPositive ? '#52c41a' : '#ff4d4f', fontSize: 12 }}>
        {isPositive ? <RiseOutlined /> : <FallOutlined />}
        {' '}{isPositive ? '+' : ''}{value}%
      </span>
    )
  }

  if (statsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  // 총 예약 수 (파이차트용)
  const totalReservations = statusData?.reduce((sum, s) => sum + s.count, 0) || 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>대시보드</h2>
        <Text type="secondary">{dayjs().format('YYYY년 MM월 DD일 (ddd)')}</Text>
      </div>

      {/* 핵심 지표 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title={
                <span>
                  이번 달 매출{' '}
                  <GrowthIndicator value={stats?.revenueGrowth || 0} />
                </span>
              }
              value={stats?.monthlyRevenue || 0}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#3f8600' }}
              formatter={(value) => Number(value).toLocaleString()}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              전월: {(stats?.lastMonthRevenue || 0).toLocaleString()}원
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="오늘 매출"
              value={stats?.todayRevenue || 0}
              prefix={<RiseOutlined />}
              suffix="원"
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => Number(value).toLocaleString()}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="이번 달 예약"
              value={stats?.newReservations || 0}
              prefix={<CalendarOutlined />}
              suffix="건"
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 12 }}>
              <span style={{ color: '#52c41a' }}>
                <CheckCircleOutlined /> 완료 {stats?.completedReservations || 0}
              </span>
              <span style={{ color: '#ff4d4f' }}>
                <CloseCircleOutlined /> 취소 {stats?.cancelledReservations || 0}
              </span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="대기중 예약"
              value={stats?.pendingReservations || 0}
              prefix={<ClockCircleOutlined />}
              suffix="건"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 상품/회원 지표 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="등록 상품"
              value={stats?.totalProducts || 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ fontSize: 20 }}
            />
            <div style={{ fontSize: 11, color: '#999' }}>공개 {stats?.activeProducts || 0}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="총 회원"
              value={stats?.totalMembers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ fontSize: 20 }}
            />
            <div style={{ fontSize: 11, color: '#999' }}>승인 {stats?.approvedMembers || 0}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="신규 가입"
              value={stats?.newMembersThisMonth || 0}
              prefix={<UserAddOutlined />}
              valueStyle={{ fontSize: 20, color: '#722ed1' }}
            />
            <div style={{ fontSize: 11, color: '#999' }}>이번 달</div>
          </Card>
        </Col>
      </Row>

      {/* 차트 영역 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 매출 추이 차트 */}
        <Col xs={24} lg={16}>
          <Card
            size="small"
            title="매출 추이"
            extra={
              <Segmented
                size="small"
                value={chartPeriod}
                onChange={(value) => setChartPeriod(value as ChartPeriod)}
                options={[
                  { label: '7일', value: '7' },
                  { label: '14일', value: '14' },
                  { label: '30일', value: '30' },
                ]}
              />
            }
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyRevenue || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => value >= 10000 ? `${(value / 10000).toFixed(0)}만` : value}
                />
                <Tooltip
                  formatter={(value: number | undefined) => [formatAmount(value || 0), '매출']}
                  labelFormatter={(label) => `${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#1890ff"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 예약 상태 분포 */}
        <Col xs={24} lg={8}>
          <Card size="small" title="예약 상태 분포">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData?.filter((s) => s.count > 0) || []}
                  cx="50%"
                  cy="50%"
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
                <Tooltip formatter={(value: number | undefined) => [`${value || 0}건`, '']} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: -20 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                총 {totalReservations}건
              </Text>
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
                <Tooltip formatter={(value: number | undefined) => [`${value || 0}건`, '예약']} />
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
