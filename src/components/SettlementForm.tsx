import { useEffect, useMemo, useState } from 'react'
import { Form, InputNumber, Button, Card, Typography, Row, Col, Select, DatePicker, Table, Tag, Spin } from 'antd'
import { ArrowLeftOutlined, DollarOutlined, CalendarOutlined, FileSearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import { getVendorsForSelect, getPaymentsForSettlement, type SettlementPayment } from '@/services/settlementService'
import { DATE_FORMAT } from '@/constants'
import type { Settlement } from '@/types'

const { Text } = Typography

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18, color: '#1677ff' }}>{icon}</span>
        <Text strong style={{ fontSize: 16 }}>{title}</Text>
      </div>
      <Text type="secondary" style={{ fontSize: 13 }}>{description}</Text>
    </div>
  )
}

interface SettlementFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<Settlement>
  onSubmit: (values: Record<string, unknown>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function SettlementForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SettlementFormProps) {
  const [form] = Form.useForm()
  const isEdit = mode === 'edit'

  // 선택된 사업주와 정산월
  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>(initialValues?.business_owner_id)
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs | null>(null)

  // 정산월에서 자동 계산된 기간
  const periodRange = useMemo(() => {
    if (!selectedMonth) return null
    const periodStart = selectedMonth.subtract(1, 'month').startOf('month')
    const periodEnd = selectedMonth.subtract(1, 'month').endOf('month')
    return { start: periodStart, end: periodEnd }
  }, [selectedMonth])

  // 사업주 목록 조회 (정산에서는 비활성 사업주도 포함)
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendorsForSelectAll'],
    queryFn: () => getVendorsForSelect(true),
  })

  // 결제 내역 조회
  const { data: paymentData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['paymentsForSettlement', selectedVendorId, periodRange?.start.format('YYYY-MM-DD'), periodRange?.end.format('YYYY-MM-DD')],
    queryFn: () => getPaymentsForSettlement(
      selectedVendorId!,
      periodRange!.start.format('YYYY-MM-DD'),
      periodRange!.end.format('YYYY-MM-DD')
    ),
    enabled: !!selectedVendorId && !!periodRange,
  })

  // 폼 값 감시
  const totalSales = Form.useWatch('total_sales', form) || 0
  const commissionRate = Form.useWatch('commission_rate', form) || 0
  const refundAmount = Form.useWatch('refund_amount', form) || 0

  // 수수료 금액 및 정산금 자동 계산
  const calculatedValues = useMemo(() => {
    const commissionAmount = Math.round(totalSales * (commissionRate / 100))
    const settlementAmount = totalSales - commissionAmount - refundAmount
    return { commissionAmount, settlementAmount }
  }, [totalSales, commissionRate, refundAmount])

  // 초기값 설정
  useEffect(() => {
    if (initialValues) {
      const formValues: Record<string, unknown> = { ...initialValues }

      // 정산월 설정
      if (initialValues.settlement_month) {
        const month = dayjs(initialValues.settlement_month + '-01')
        formValues.settlement_month_picker = month
        setSelectedMonth(month)
      } else if (initialValues.settlement_period_start && initialValues.settlement_period_end) {
        // settlement_month가 없으면 period_end에서 추출
        const endDate = dayjs(initialValues.settlement_period_end)
        const month = endDate.add(1, 'month').startOf('month')
        formValues.settlement_month_picker = month
        setSelectedMonth(month)
      }

      form.setFieldsValue(formValues)
    }
  }, [initialValues, form])

  // 결제 데이터가 로드되면 금액 자동 채우기
  useEffect(() => {
    if (paymentData && !isEdit) {
      form.setFieldsValue({
        total_sales: paymentData.totalSales,
        refund_amount: paymentData.refundAmount,
      })
    }
  }, [paymentData, form, isEdit])

  // 사업주 변경 시 수수료율 자동 설정
  const handleVendorChange = (vendorId: string) => {
    setSelectedVendorId(vendorId)
    const vendor = vendors.find(v => v.id === vendorId)
    if (vendor && !isEdit) {
      form.setFieldsValue({ commission_rate: vendor.commission_rate })
    }
  }

  // 정산월 변경 시
  const handleMonthChange = (date: dayjs.Dayjs | null) => {
    setSelectedMonth(date)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 기간 데이터 변환 (정산월에서 자동 계산)
      const submitData: Record<string, unknown> = {
        business_owner_id: values.business_owner_id,
        total_sales: values.total_sales,
        commission_rate: values.commission_rate,
        refund_amount: values.refund_amount || 0,
      }

      if (periodRange) {
        submitData.settlement_period_start = periodRange.start.format('YYYY-MM-DD')
        submitData.settlement_period_end = periodRange.end.format('YYYY-MM-DD')
      }

      if (selectedMonth) {
        submitData.settlement_month = selectedMonth.format('YYYY-MM')
      }

      onSubmit(submitData)
    } catch {
      // validation error
    }
  }

  // 결제 내역 테이블 컬럼
  const paymentColumns: ColumnsType<SettlementPayment> = [
    {
      title: '예약번호',
      key: 'reservation_number',
      width: 120,
      render: (_, record) => record.reservation?.reservation_number || '-',
    },
    {
      title: '예약일',
      key: 'reserved_date',
      width: 100,
      render: (_, record) => record.reservation?.reserved_date ? dayjs(record.reservation.reserved_date).format(DATE_FORMAT) : '-',
    },
    {
      title: '어린이집',
      key: 'daycare',
      render: (_, record) => record.reservation?.daycare?.name || '-',
    },
    {
      title: '상품',
      key: 'product',
      render: (_, record) => record.reservation?.product?.name || '-',
    },
    {
      title: '결제금액',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      align: 'right',
      render: (v: number) => `${v.toLocaleString()}원`,
    },
    {
      title: '결제상태',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'paid' ? 'green' : 'red'}>
          {status === 'paid' ? '완료' : '취소'}
        </Tag>
      ),
    },
    {
      title: '예약상태',
      key: 'reservation_status',
      width: 80,
      render: (_, record) => {
        const status = record.reservation?.status
        const colors: Record<string, string> = {
          confirmed: 'blue',
          completed: 'green',
          cancelled: 'default',
          refunded: 'red',
        }
        const labels: Record<string, string> = {
          confirmed: '확정',
          completed: '완료',
          cancelled: '취소',
          refunded: '환불',
        }
        return <Tag color={colors[status || ''] || 'default'}>{labels[status || ''] || status}</Tag>
      },
    },
    {
      title: '결제일시',
      dataIndex: 'paid_at',
      key: 'paid_at',
      width: 140,
      render: (date: string | null) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
  ]

  return (
    <>
      <style>{`
        .compact-form .ant-form-item { margin-bottom: 16px; }
        .compact-form .ant-row > .ant-col .ant-form-item { margin-bottom: 0; }
        .compact-form .ant-row { margin-bottom: 12px; }
        .compact-form .ant-card-body > *:last-child { margin-bottom: 0; }
      `}</style>

      <Form
        form={form}
        layout="vertical"
        initialValues={{ commission_rate: 10, refund_amount: 0 }}
        style={{ width: '100%' }}
        className="compact-form"
        requiredMark={(label, { required }) => (
          <>
            {label}
            {required && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>}
          </>
        )}
      >
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<CalendarOutlined />}
            title="정산 기본 정보"
            description="사업주와 정산월을 선택하면 전월 이용 완료 예약 기준으로 결제 내역이 자동 조회됩니다."
          />

          <Row gutter={24}>
            <Col>
              <Form.Item
                name="business_owner_id"
                label="사업주"
                rules={[{ required: true, message: '사업주를 선택하세요' }]}
              >
                <Select
                  placeholder="사업주를 선택하세요"
                  style={{ width: 280 }}
                  showSearch
                  optionFilterProp="label"
                  disabled={isEdit}
                  options={vendors.map((v) => ({
                    value: v.id,
                    label: v.status === 'inactive' ? `${v.name} (비활성)` : v.name
                  }))}
                  onChange={handleVendorChange}
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="settlement_month_picker"
                label="정산월"
                rules={[{ required: true, message: '정산월을 선택하세요' }]}
                extra={periodRange ? `정산 대상 기간: ${periodRange.start.format(DATE_FORMAT)} ~ ${periodRange.end.format(DATE_FORMAT)}` : undefined}
              >
                <DatePicker
                  picker="month"
                  style={{ width: 200 }}
                  format="YYYY년 MM월"
                  placeholder="정산월 선택"
                  onChange={handleMonthChange}
                  disabled={isEdit}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<DollarOutlined />}
            title="정산 금액 정보"
            description="정산월 선택 시 이용 완료 예약의 결제 내역 기반으로 자동 계산됩니다. 필요시 직접 수정할 수 있습니다."
          />

          <Row gutter={24}>
            <Col>
              <Form.Item
                name="total_sales"
                label="총 매출"
                rules={[
                  { required: true, message: '총 매출을 입력하세요' },
                  { type: 'number', min: 0, message: '0 이상 입력해주세요' },
                ]}
              >
                <InputNumber
                  style={{ width: 180 }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, '') || 0) as any}
                  addonAfter="원"
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="commission_rate"
                label="수수료율"
                rules={[
                  { required: true, message: '수수료율을 입력하세요' },
                  { type: 'number', min: 0, max: 100, message: '0~100% 사이여야 합니다' },
                ]}
              >
                <InputNumber
                  style={{ width: 120 }}
                  min={0}
                  max={100}
                  step={0.5}
                  addonAfter="%"
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="refund_amount"
                label="환불 금액"
              >
                <InputNumber
                  style={{ width: 180 }}
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, '') || 0) as any}
                  addonAfter="원"
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ background: '#f0f5ff', padding: 16, borderRadius: 6, marginTop: 8 }}>
            <Row gutter={24}>
              <Col span={8}>
                <div style={{ marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>수수료 금액</Text>
                </div>
                <Text strong style={{ fontSize: 16 }}>
                  {calculatedValues.commissionAmount.toLocaleString()}원
                </Text>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                  ({commissionRate}%)
                </Text>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>환불 금액</Text>
                </div>
                <Text strong style={{ fontSize: 16 }}>
                  {refundAmount.toLocaleString()}원
                </Text>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>정산금</Text>
                </div>
                <Text strong style={{ fontSize: 20, color: '#1677ff' }}>
                  {calculatedValues.settlementAmount.toLocaleString()}원
                </Text>
              </Col>
            </Row>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                정산금 = 총 매출 - 수수료 금액 - 환불 금액
              </Text>
            </div>
          </div>
        </Card>

        {/* 결제 내역 */}
        {selectedVendorId && periodRange && (
          <Card style={{ marginBottom: 24 }}>
            <SectionHeader
              icon={<FileSearchOutlined />}
              title="결제 내역"
              description={`${periodRange.start.format(DATE_FORMAT)} ~ ${periodRange.end.format(DATE_FORMAT)} 기간의 이용 완료 예약 결제 내역입니다.`}
            />

            {paymentsLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : (
              <>
                {paymentData && (
                  <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
                    <Tag color="blue">
                      결제 완료: {paymentData.paidCount}건 / {paymentData.totalSales.toLocaleString()}원
                    </Tag>
                    <Tag color="red">
                      환불/취소: {paymentData.refundedCount}건 / {paymentData.refundAmount.toLocaleString()}원
                    </Tag>
                  </div>
                )}
                <Table
                  columns={paymentColumns}
                  dataSource={paymentData?.payments || []}
                  rowKey="id"
                  size="small"
                  bordered
                  pagination={{
                    pageSize: 10,
                    showTotal: (total) => `총 ${total}건`,
                    size: 'small',
                  }}
                  scroll={{ x: 900 }}
                />
              </>
            )}
          </Card>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={onCancel}>
            취소
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            {isEdit ? '저장' : '등록'}
          </Button>
        </div>
      </Form>
    </>
  )
}
