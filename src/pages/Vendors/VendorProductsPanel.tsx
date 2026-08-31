import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Empty, Select, Space, Table, Tag, Typography } from 'antd'
import { EditOutlined, PlusOutlined, ShoppingOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getBusinessesByOwner } from '@/services/businessService'
import { getProducts, MAX_PRODUCTS_PER_BUSINESS_OWNER } from '@/services/productService'
import { DATE_FORMAT, PRODUCT_STATUS_COLOR, PRODUCT_STATUS_LABEL } from '@/constants'
import type { BusinessOwner, Product } from '@/types'

interface VendorProductsPanelProps {
  vendor: BusinessOwner
  preferredBusinessId?: string
  onBusinessChange?: (businessId: string) => void
}

function getProductStatus(product: Product): 'visible' | 'hidden' | 'sold_out' {
  if (product.is_sold_out) return 'sold_out'
  return product.is_visible ? 'visible' : 'hidden'
}

export default function VendorProductsPanel({
  vendor,
  preferredBusinessId,
  onBusinessChange,
}: VendorProductsPanelProps) {
  const navigate = useNavigate()
  const [chosenBusinessId, setChosenBusinessId] = useState<string | undefined>()
  const { data: businesses = [], isLoading: isBusinessesLoading } = useQuery({
    queryKey: ['businessesByOwner', vendor.id],
    queryFn: () => getBusinessesByOwner(vendor.id),
  })

  const businessId = [preferredBusinessId, chosenBusinessId, businesses[0]?.id]
    .find((id) => id && businesses.some((business) => business.id === id))

  const selectedBusiness = businesses.find((business) => business.id === businessId)
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', 'vendor-business', vendor.id, businessId],
    queryFn: () => getProducts({
      page: 1,
      pageSize: 50,
      status: 'all',
      business_owner_id: vendor.id,
      business_id: businessId,
    }),
    enabled: !!businessId,
  })

  const chooseBusiness = (nextBusinessId: string) => {
    setChosenBusinessId(nextBusinessId)
    onBusinessChange?.(nextBusinessId)
  }

  const columns: ColumnsType<Product> = [
    {
      title: '상품명',
      dataIndex: 'name',
      render: (name: string, product) => <Button type="link" size="small" onClick={() => navigate(`/products/${product.id}`)}>{name}</Button>,
    },
    { title: '카테고리', key: 'category', width: 130, render: (_, product) => product.category?.name || '-' },
    { title: '판매가', dataIndex: 'sale_price', width: 120, align: 'right', render: (price: number) => `${price.toLocaleString()}원` },
    {
      title: '상태', key: 'status', width: 90,
      render: (_, product) => {
        const status = getProductStatus(product)
        return <Tag color={PRODUCT_STATUS_COLOR[status]}>{PRODUCT_STATUS_LABEL[status]}</Tag>
      },
    },
    { title: '등록일', dataIndex: 'created_at', width: 110, render: (date: string) => dayjs(date).format(DATE_FORMAT) },
    {
      title: '관리', key: 'actions', width: 76,
      render: (_, product) => <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/products/${product.id}/edit`)}>수정</Button>,
    },
  ]

  const productCount = productsData?.total || 0
  const atLimit = productCount >= MAX_PRODUCTS_PER_BUSINESS_OWNER
  const createUrl = businessId
    ? `/products/new?business_owner_id=${encodeURIComponent(vendor.id)}&business_id=${encodeURIComponent(businessId)}`
    : '/products/new'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>상품 관리</Typography.Title>
          <Typography.Text type="secondary">사업장을 선택하면 해당 사업장에 등록된 상품을 확인하고 추가·수정할 수 있습니다.</Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={!businessId || atLimit}
          onClick={() => navigate(createUrl)}
        >
          상품 등록
        </Button>
      </div>

      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Select
          loading={isBusinessesLoading}
          value={businessId}
          placeholder="상품을 확인할 사업장을 선택하세요"
          style={{ width: 360, maxWidth: '100%' }}
          options={businesses.map((business) => ({
            value: business.id,
            label: `${business.name} (${business.product_count || 0}/${MAX_PRODUCTS_PER_BUSINESS_OWNER}개)`,
          }))}
          onChange={chooseBusiness}
        />

        {selectedBusiness && (
          <Typography.Text type="secondary">
            <ShoppingOutlined /> {selectedBusiness.name} · 등록 상품 {productCount}/{MAX_PRODUCTS_PER_BUSINESS_OWNER}개
          </Typography.Text>
        )}

        {!isBusinessesLoading && !businesses.length ? (
          <Empty description="먼저 사업장을 등록해주세요." />
        ) : (
          <Table
            columns={columns}
            dataSource={productsData?.data || []}
            rowKey="id"
            loading={isProductsLoading}
            size="small"
            bordered
            locale={{ emptyText: businessId ? '이 사업장에 등록된 상품이 없습니다.' : '사업장을 선택해주세요.' }}
            pagination={false}
            onRow={(product) => ({
              onClick: () => navigate(`/products/${product.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </Space>
    </div>
  )
}
