import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Row, Col, Card, Statistic, Table, Spin, Button, Space, Typography } from 'antd'
import {
  DollarOutlined,
  HomeOutlined,
  ShopOutlined,
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { DatePicker } from 'antd'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

import {
  getRegionalMonthlyComparison,
  type RegionalStatsWithChange,
} from '@/services/regionalStatsService'

const { Text } = Typography

// 변화율 표시 컴포넌트
function GrowthTag({ value, label }: { value: number | null; label: string }) {
  if (value === null) return <span style={{ fontSize: 11, color: '#bfbfbf' }}>{label} -</span>
  const color = value > 0 ? '#52c41a' : value < 0 ? '#ff4d4f' : '#8c8c8c'
  const icon = value > 0 ? <ArrowUpOutlined /> : value < 0 ? <ArrowDownOutlined /> : null
  return (
    <span style={{ fontSize: 11, color }}>
      {label} {icon} {value > 0 ? '+' : ''}{value}%
    </span>
  )
}

export function RegionalMonthlyStatsPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => dayjs().format('YYYY-MM'))

  const currentDayjs = dayjs(selectedMonth, 'YYYY-MM')

  const handlePrevMonth = () => {
    setSelectedMonth(currentDayjs.subtract(1, 'month').format('YYYY-MM'))
  }

  const handleNextMonth = () => {
    setSelectedMonth(currentDayjs.add(1, 'month').format('YYYY-MM'))
  }

  const handleThisMonth = () => {
    setSelectedMonth(dayjs().format('YYYY-MM'))
  }

  const handleMonthChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedMonth(date.format('YYYY-MM'))
    }
  }

  const isCurrentMonth = selectedMonth === dayjs().format('YYYY-MM')

  // 데이터 조회
  const { data, isLoading } = useQuery({
    queryKey: ['regionalMonthlyStats', selectedMonth],
    queryFn: () => getRegionalMonthlyComparison(selectedMonth),
  })

  const summary = data?.summary
  const regions = data?.regions || []

  // 테이블 컬럼 정의
  const columns: ColumnsType<RegionalStatsWithChange> = [
    {
      title: '지역',
      dataIndex: 'region',
      key: 'region',
      width: 80,
      fixed: 'left',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '매출액',
      children: [
        {
          title: '금액',
          dataIndex: 'revenue',
          key: 'revenue',
          width: 120,
          align: 'right',
          render: (v: number) => `${v.toLocaleString()}원`,
        },
        {
          title: 'MOM',
          dataIndex: 'revenueMom',
          key: 'revenueMom',
          width: 70,
          align: 'center',
          render: (v: number | null) => <GrowthTag value={v} label="" />,
        },
        {
          title: 'YOY',
          dataIndex: 'revenueYoy',
          key: 'revenueYoy',
          width: 70,
          align: 'center',
          render: (v: number | null) => <GrowthTag value={v} label="" />,
        },
      ],
    },
    {
      title: '어린이집수',
      children: [
        {
          title: '수',
          dataIndex: 'daycareCount',
          key: 'daycareCount',
          width: 60,
          align: 'right',
        },
        {
          title: 'MOM',
          dataIndex: 'daycareCountMom',
          key: 'daycareCountMom',
          width: 70,
          align: 'center',
          render: (v: number | null) => <GrowthTag value={v} label="" />,
        },
        {
          title: 'YOY',
          dataIndex: 'daycareCountYoy',
          key: 'daycareCountYoy',
          width: 70,
          align: 'center',
          render: (v: number | null) => <GrowthTag value={v} label="" />,
        },
      ],
    },
    {
      title: '사업주수',
      children: [
        {
          title: '수',
          dataIndex: 'businessOwnerCount',
          key: 'businessOwnerCount',
          width: 60,
          align: 'right',
        },
        {
          title: 'MOM',
          dataIndex: 'businessOwnerCountMom',
          key: 'businessOwnerCountMom',
          width: 70,
          align: 'center',
          render: (v: number | null) => <GrowthTag value={v} label="" />,
        },
        {
          title: 'YOY',
          dataIndex: 'businessOwnerCountYoy',
          key: 'businessOwnerCountYoy',
          width: 70,
          align: 'center',
          render: (v: number | null) => <GrowthTag value={v} label="" />,
        },
      ],
    },
    {
      title: '예약건수',
      children: [
        {
          title: '수',
          dataIndex: 'reservationCount',
          key: 'reservationCount',
          width: 60,
          align: 'right',
        },
        {
          title: 'MOM',
          dataIndex: 'reservationCountMom',
          key: 'reservationCountMom',
          width: 70,
          align: 'center',
          render: (v: number | null) => <GrowthTag value={v} label="" />,
        },
        {
          title: 'YOY',
          dataIndex: 'reservationCountYoy',
          key: 'reservationCountYoy',
          width: 70,
          align: 'center',
          render: (v: number | null) => <GrowthTag value={v} label="" />,
        },
      ],
    },
  ]

  // 합계 행 데이터
  const summaryRow: RegionalStatsWithChange | null = summary
    ? {
        region: '합계',
        revenue: summary.totalRevenue,
        daycareCount: summary.totalDaycareCount,
        businessOwnerCount: summary.totalBusinessOwnerCount,
        reservationCount: summary.totalReservationCount,
        revenueMom: summary.revenueMom,
        revenueYoy: summary.revenueYoy,
        daycareCountMom: summary.daycareCountMom,
        daycareCountYoy: summary.daycareCountYoy,
        businessOwnerCountMom: summary.businessOwnerCountMom,
        businessOwnerCountYoy: summary.businessOwnerCountYoy,
        reservationCountMom: summary.reservationCountMom,
        reservationCountYoy: summary.reservationCountYoy,
      }
    : null

  const tableData = summaryRow ? [...regions, summaryRow] : regions

  return (
    <div>
      <h2 style={{ margin: 0, marginBottom: 16 }}>지역별 월간 통계</h2>

      {/* 월 선택 바 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          padding: '12px 16px',
          background: '#fafafa',
          borderRadius: 8,
        }}
      >
        <Button icon={<LeftOutlined />} size="small" onClick={handlePrevMonth} />
        <DatePicker
          picker="month"
          value={currentDayjs}
          onChange={handleMonthChange}
          allowClear={false}
          size="small"
          style={{ width: 140 }}
        />
        <Button icon={<RightOutlined />} size="small" onClick={handleNextMonth} />
        <Button size="small" disabled={isCurrentMonth} onClick={handleThisMonth}>
          이번달
        </Button>
        <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
          {currentDayjs.format('YYYY년 MM월')} 통계
        </Text>
      </div>

      {/* 요약 카드 4개 */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <DollarOutlined style={{ color: '#1890ff' }} />
                      매출액
                    </span>
                  }
                  value={summary?.totalRevenue || 0}
                  suffix="원"
                  valueStyle={{ color: '#1890ff' }}
                  formatter={(value) => Number(value).toLocaleString()}
                />
                <Space direction="vertical" size={0} style={{ marginTop: 8 }}>
                  <GrowthTag value={summary?.revenueMom ?? null} label="MOM" />
                  <GrowthTag value={summary?.revenueYoy ?? null} label="YOY" />
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <HomeOutlined style={{ color: '#52c41a' }} />
                      어린이집수
                    </span>
                  }
                  value={summary?.totalDaycareCount || 0}
                  suffix="개"
                  valueStyle={{ color: '#52c41a' }}
                />
                <Space direction="vertical" size={0} style={{ marginTop: 8 }}>
                  <GrowthTag value={summary?.daycareCountMom ?? null} label="MOM" />
                  <GrowthTag value={summary?.daycareCountYoy ?? null} label="YOY" />
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShopOutlined style={{ color: '#722ed1' }} />
                      사업주수
                    </span>
                  }
                  value={summary?.totalBusinessOwnerCount || 0}
                  suffix="명"
                  valueStyle={{ color: '#722ed1' }}
                />
                <Space direction="vertical" size={0} style={{ marginTop: 8 }}>
                  <GrowthTag value={summary?.businessOwnerCountMom ?? null} label="MOM" />
                  <GrowthTag value={summary?.businessOwnerCountYoy ?? null} label="YOY" />
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CalendarOutlined style={{ color: '#faad14' }} />
                      예약건수
                    </span>
                  }
                  value={summary?.totalReservationCount || 0}
                  suffix="건"
                  valueStyle={{ color: '#faad14' }}
                />
                <Space direction="vertical" size={0} style={{ marginTop: 8 }}>
                  <GrowthTag value={summary?.reservationCountMom ?? null} label="MOM" />
                  <GrowthTag value={summary?.reservationCountYoy ?? null} label="YOY" />
                </Space>
              </Card>
            </Col>
          </Row>

          {/* 지역별 통계 테이블 */}
          <Card size="small" title="지역별 통계" style={{ marginTop: 16 }}>
            <Table
              columns={columns}
              dataSource={tableData}
              rowKey="region"
              size="small"
              bordered
              pagination={false}
              scroll={{ x: 900 }}
              rowClassName={(record) => (record.region === '합계' ? 'summary-row' : '')}
            />
          </Card>

          {/* 지역별 매출 바 차트 */}
          <Card size="small" title="지역별 매출" style={{ marginTop: 16 }}>
            {regions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
                데이터가 없습니다
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={regions} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      value >= 10000 ? `${(value / 10000).toFixed(0)}만` : String(value)
                    }
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [`${(value ?? 0).toLocaleString()}원`, '매출액']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" fill="#1890ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </>
      )}

      <style>{`
        .summary-row td {
          background: #fafafa !important;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
