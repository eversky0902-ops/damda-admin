import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Empty, Form, Input, List, Modal, Popconfirm, Select, Space, Switch, Tag, Typography, message } from 'antd'
import { AppstoreOutlined, DeleteOutlined, EditOutlined, ShopOutlined } from '@ant-design/icons'
import { createBusiness, deleteBusiness, getBusinessesByOwner, updateBusiness, type BusinessInput } from '@/services/businessService'
import type { Business, BusinessOwner } from '@/types'

export default function VendorBusinessesPanel({
  vendor,
  onManageProducts,
}: {
  vendor: BusinessOwner
  onManageProducts: (businessId?: string) => void
}) {
  const queryClient = useQueryClient()
  const [form] = Form.useForm<BusinessInput>()
  const [editing, setEditing] = useState<Business | null>(null)
  const [open, setOpen] = useState(false)
  const { data = [], isLoading } = useQuery({ queryKey: ['businessesByOwner', vendor.id], queryFn: () => getBusinessesByOwner(vendor.id) })
  const saveMutation = useMutation({
    mutationFn: async (values: BusinessInput) => { if (editing) await updateBusiness(editing.id, vendor.id, values); else await createBusiness(vendor.id, values) },
    onSuccess: async () => { message.success('사업장 정보가 저장되었습니다.'); setOpen(false); form.resetFields(); await queryClient.invalidateQueries({ queryKey: ['businessesByOwner', vendor.id] }) },
    onError: (error) => message.error(error instanceof Error ? error.message : '사업장 저장에 실패했습니다.'),
  })
  const deleteMutation = useMutation({
    mutationFn: (business: Business) => deleteBusiness(business.id, business.name),
    onSuccess: async () => { message.success('사업장이 삭제되었습니다.'); await queryClient.invalidateQueries({ queryKey: ['businessesByOwner', vendor.id] }) },
    onError: (error) => message.error(error instanceof Error ? error.message : '사업장 삭제에 실패했습니다.'),
  })
  const openForm = (business?: Business) => {
    setEditing(business || null)
    form.setFieldsValue(business ? {
      name: business.name, business_number: business.business_number || '', representative: business.representative || '',
      contact_name: business.contact_name || '', contact_phone: business.contact_phone || '', email: business.email || '',
      address: business.address, address_detail: business.address_detail || '', zipcode: business.zipcode || '', status: business.status,
      summary: business.summary || '', introduction: business.introduction || '', parking_available: business.parking_available ?? false,
      parking_notice: business.parking_notice || '', facilities: business.facilities || [],
      common_guide: business.common_guide || '', common_precautions: business.common_precautions || '',
      latitude: business.latitude, longitude: business.longitude, directions: business.directions || '', reservation_notice: business.reservation_notice || '',
    } : {
      name: '', business_number: vendor.business_number, representative: vendor.representative,
      contact_name: vendor.contact_name, contact_phone: vendor.contact_phone, email: vendor.email,
      address: vendor.address, address_detail: vendor.address_detail || '', zipcode: vendor.zipcode || '', status: 'active',
      summary: '', introduction: '', parking_available: false, parking_notice: '', facilities: [], common_guide: '', common_precautions: '',
      latitude: null, longitude: null, directions: '', reservation_notice: '',
    })
    setOpen(true)
  }

  return <>
    <div style={{ marginBottom: 16 }}>
      <Typography.Title level={4} style={{ margin: 0 }}>사업장 관리</Typography.Title>
      <Typography.Text type="secondary">이 사업주 계정이 관리할 사업장을 여러 개 등록할 수 있습니다.</Typography.Text>
    </div>
    {!data.length && !isLoading ? <Empty description="등록된 사업장이 없습니다." /> : <List
      loading={isLoading} grid={{ gutter: 16, xs: 1, md: 2 }} dataSource={data}
      renderItem={(business) => <List.Item><Card
        title={<Space><ShopOutlined />{business.name}{business.is_primary && <Tag color="blue">기본</Tag>}</Space>}
        extra={<Space><Button size="small" icon={<AppstoreOutlined />} onClick={() => onManageProducts(business.id)}>상품 관리</Button><Button size="small" icon={<EditOutlined />} onClick={() => openForm(business)}>수정</Button><Popconfirm title="사업장을 삭제할까요?" description="기본 사업장 또는 상품·예약이 연결된 사업장은 삭제할 수 없습니다." onConfirm={() => deleteMutation.mutate(business)}><Button danger size="small" disabled={business.is_primary} icon={<DeleteOutlined />}>삭제</Button></Popconfirm></Space>}
        styles={{ body: { padding: '18px 20px' } }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 24, rowGap: 16, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <Typography.Text type="secondary">사업장 코드</Typography.Text>
            <Typography.Text code copyable>{business.business_code}</Typography.Text>
          </div>
          <div style={{ display: 'grid', gap: 6, minWidth: 0 }}>
            <Typography.Text type="secondary">주소</Typography.Text>
            <Typography.Text ellipsis={{ tooltip: [business.address, business.address_detail].filter(Boolean).join(' ') || '-' }}>
              {[business.address, business.address_detail].filter(Boolean).join(' ') || '-'}
            </Typography.Text>
          </div>
          <Space size={8} wrap style={{ gridColumn: '1 / -1' }}>
            <Tag color={business.status === 'active' ? 'green' : 'default'}>{business.status === 'active' ? '활성' : '비활성'}</Tag>
            <Tag>상품 {business.product_count || 0}/10개</Tag>
          </Space>
        </div>
      </Card></List.Item>}
    />}
    <Modal title={editing ? '사업장 수정' : '사업장 추가'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={saveMutation.isPending} width={720}>
      <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
        <Form.Item name="name" label="사업장명" rules={[{ required: true }]}><Input /></Form.Item>
        <Space align="start" style={{ display: 'flex' }}><Form.Item name="business_number" label="사업자등록번호"><Input /></Form.Item><Form.Item name="representative" label="대표자"><Input /></Form.Item></Space>
        <Space align="start" style={{ display: 'flex' }}><Form.Item name="contact_name" label="담당자"><Input /></Form.Item><Form.Item name="contact_phone" label="연락처"><Input /></Form.Item><Form.Item name="email" label="이메일"><Input /></Form.Item></Space>
        <Space align="start" style={{ display: 'flex' }}><Form.Item name="zipcode" label="우편번호"><Input /></Form.Item><Form.Item name="address" label="주소" rules={[{ required: true }]}><Input style={{ width: 360 }} /></Form.Item></Space>
        <Form.Item name="address_detail" label="상세주소"><Input /></Form.Item>
        <Space align="start" style={{ display: 'flex' }}><Form.Item name="latitude" label="위도"><Input type="number" /></Form.Item><Form.Item name="longitude" label="경도"><Input type="number" /></Form.Item></Space>
        <Form.Item name="directions" label="대중교통·오시는 길"><Input.TextArea rows={3} /></Form.Item>
        <Form.Item name="summary" label="한 줄 소개"><Input maxLength={500} /></Form.Item>
        <Form.Item name="introduction" label="사업장 소개"><Input.TextArea rows={4} /></Form.Item>
        <Space align="start" style={{ display: 'flex' }}><Form.Item name="parking_available" label="주차 가능" valuePropName="checked"><Switch /></Form.Item><Form.Item name="parking_notice" label="주차 안내"><Input style={{ width: 420 }} /></Form.Item></Space>
        <Form.Item name="facilities" label="시설·서비스"><Select mode="tags" tokenSeparators={[',']} placeholder="예: 주차, 수유실, 엘리베이터" /></Form.Item>
        <Form.Item name="common_guide" label="공통 이용 안내"><Input.TextArea rows={3} /></Form.Item>
        <Form.Item name="common_precautions" label="공통 유의사항"><Input.TextArea rows={3} /></Form.Item>
        <Form.Item name="reservation_notice" label="예약 공지"><Input.TextArea rows={3} /></Form.Item>
        <Form.Item name="status" label="활성 상태" valuePropName="checked" getValueFromEvent={(checked) => checked ? 'active' : 'inactive'} getValueProps={(value) => ({ checked: value === 'active' })}><Switch /></Form.Item>
      </Form>
    </Modal>
  </>
}
