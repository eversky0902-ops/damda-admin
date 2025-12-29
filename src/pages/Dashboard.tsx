import { Row, Col, Card, Statistic, Table, Tag } from 'antd'
import {
  ShoppingOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { RESERVATION_STATUS_LABEL } from '@/constants'

// 임시 데이터
const recentReservations = [
  {
    id: 1,
    productName: '농장 체험학습',
    customerName: '행복어린이집',
    date: '2024-12-30',
    amount: 150000,
    status: 'pending',
  },
  {
    id: 2,
    productName: '도자기 만들기',
    customerName: '사랑어린이집',
    date: '2024-12-28',
    amount: 200000,
    status: 'confirmed',
  },
  {
    id: 3,
    productName: '자연 생태 탐방',
    customerName: '꿈나무어린이집',
    date: '2024-12-27',
    amount: 180000,
    status: 'completed',
  },
]

const columns = [
  {
    title: '상품명',
    dataIndex: 'productName',
    key: 'productName',
  },
  {
    title: '고객',
    dataIndex: 'customerName',
    key: 'customerName',
  },
  {
    title: '예약일',
    dataIndex: 'date',
    key: 'date',
  },
  {
    title: '금액',
    dataIndex: 'amount',
    key: 'amount',
    render: (amount: number) => `${amount.toLocaleString()}원`,
  },
  {
    title: '상태',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const colorMap: Record<string, string> = {
        pending: 'orange',
        confirmed: 'blue',
        cancelled: 'red',
        completed: 'green',
      }
      return <Tag color={colorMap[status]}>{RESERVATION_STATUS_LABEL[status]}</Tag>
    },
  },
]

export function DashboardPage() {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>대시보드</h2>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="이번 달 매출"
              value={12500000}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="신규 예약"
              value={48}
              prefix={<CalendarOutlined />}
              suffix="건"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="등록 상품"
              value={156}
              prefix={<ShoppingOutlined />}
              suffix="개"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="가입 회원"
              value={892}
              prefix={<UserOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
      </Row>

      <Card title="최근 예약" style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={recentReservations}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  )
}
