import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Col, DatePicker, Empty, Row, Space, Spin, Statistic, Table, Typography } from 'antd'
import { CalendarOutlined, FormOutlined, UserAddOutlined } from '@ant-design/icons'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import dayjs, { type Dayjs } from 'dayjs'
import { getSiteAnalytics, type SiteAnalyticsDay } from '@/services/siteAnalyticsService'

interface SiteAnalyticsPanelProps {
  title?: string
}

export function SiteAnalyticsPanel({ title = '홈페이지 방문·CTA 통계' }: SiteAnalyticsPanelProps) {
  const [month, setMonth] = useState<Dayjs>(() => dayjs())
  const startDate = month.startOf('month').format('YYYY-MM-DD')
  const endDate = month.endOf('month').format('YYYY-MM-DD')

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['site-analytics', startDate, endDate],
    queryFn: () => getSiteAnalytics(startDate, endDate),
  })

  const totals = useMemo(() => data.reduce(
    (sum, day) => ({
      daily_visits: sum.daily_visits + day.daily_visits,
      partner_cta_clicks: sum.partner_cta_clicks + day.partner_cta_clicks,
      signup_cta_clicks: sum.signup_cta_clicks + day.signup_cta_clicks,
    }),
    { daily_visits: 0, partner_cta_clicks: 0, signup_cta_clicks: 0 },
  ), [data])

  const chartData = data.map((day) => ({ ...day, displayDate: dayjs(day.metric_date).format('M/D') }))

  return (
    <Card
      size="small"
      title={title}
      extra={(
        <Space>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>월 선택</Typography.Text>
          <DatePicker
            picker="month"
            allowClear={false}
            value={month}
            onChange={(value) => value && setMonth(value)}
            format="YYYY년 MM월"
            style={{ width: 150 }}
          />
        </Space>
      )}
    >
      <Row gutter={[12, 12]}>
        <Col xs={24} md={8}>
          <Card size="small"><Statistic title="월간 순방문 수" value={totals.daily_visits} prefix={<CalendarOutlined />} suffix="명" /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small"><Statistic title="제휴 입점문의 CTA" value={totals.partner_cta_clicks} prefix={<FormOutlined />} suffix="회" /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small"><Statistic title="회원가입 CTA" value={totals.signup_cta_clicks} prefix={<UserAddOutlined />} suffix="회" /></Card>
        </Col>
      </Row>

      {isLoading ? (
        <div style={{ padding: 80, textAlign: 'center' }}><Spin /></div>
      ) : error ? (
        <Empty description="통계 데이터를 불러오지 못했습니다." />
      ) : (
        <>
          <div style={{ width: '100%', height: 280, marginTop: 20 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value, name) => [`${Number(value || 0).toLocaleString()}회`, name]} />
                <Legend />
                <Line type="monotone" dataKey="daily_visits" name="순방문" stroke="#1677ff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="partner_cta_clicks" name="제휴 입점문의" stroke="#52c41a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="signup_cta_clicks" name="회원가입" stroke="#faad14" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Table<SiteAnalyticsDay>
            rowKey="metric_date"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            dataSource={[...data].reverse()}
            columns={[
              { title: '일자', dataIndex: 'metric_date', render: (value: string) => dayjs(value).format('YYYY.MM.DD') },
              { title: '순방문 수', dataIndex: 'daily_visits', align: 'right', render: (value: number) => `${value.toLocaleString()}명` },
              { title: '제휴 입점문의 클릭', dataIndex: 'partner_cta_clicks', align: 'right', render: (value: number) => `${value.toLocaleString()}회` },
              { title: '회원가입 클릭', dataIndex: 'signup_cta_clicks', align: 'right', render: (value: number) => `${value.toLocaleString()}회` },
            ]}
            style={{ marginTop: 16 }}
          />
        </>
      )}
      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
        순방문 수는 같은 브라우저의 하루 중복 방문을 제외하며 개인정보는 저장하지 않습니다.
      </Typography.Text>
    </Card>
  )
}
