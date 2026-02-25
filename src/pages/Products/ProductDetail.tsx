import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tabs,
  Descriptions,
  Button,
  Tag,
  Table,
  Space,
  Switch,
  Image,
  message,
  Spin,
  Divider,
  Popconfirm,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import {
  getProduct,
  updateProductVisibility,
  updateProductSoldOut,
  deleteProduct,
} from '@/services/productService'
import {
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUS_COLOR,
  DATE_FORMAT,
  DAY_OF_WEEK_LABEL,
} from '@/constants'
import type { Product, ProductOption, ProductImage, TimeSlot } from '@/types'

function getProductStatus(product: Product): 'visible' | 'hidden' | 'sold_out' {
  if (product.is_sold_out) return 'sold_out'
  if (!product.is_visible) return 'hidden'
  return 'visible'
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // 상품 정보 조회
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  })

  // 노출 상태 변경
  const visibilityMutation = useMutation({
    mutationFn: (is_visible: boolean) => updateProductVisibility(id!, is_visible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      message.success('노출 상태가 변경되었습니다')
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  // 품절 상태 변경
  const soldOutMutation = useMutation({
    mutationFn: (is_sold_out: boolean) => updateProductSoldOut(id!, is_sold_out),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      message.success('품절 상태가 변경되었습니다')
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  // 상품 삭제
  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(id!),
    onSuccess: () => {
      message.success('상품이 삭제되었습니다')
      navigate('/products')
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const optionColumns: ColumnsType<ProductOption> = [
    {
      title: '옵션명',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '가격',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `${price.toLocaleString()}원`,
    },
    {
      title: '필수여부',
      dataIndex: 'is_required',
      key: 'is_required',
      render: (required: boolean) => (
        <Tag color={required ? 'red' : 'default'}>{required ? '필수' : '선택'}</Tag>
      ),
    },
  ]

  // 운영 시간 표시
  const renderTimeSlots = (timeSlots: TimeSlot[] | null) => {
    if (!timeSlots || timeSlots.length === 0) return '-'

    // 요일별로 그룹화
    const byDay = timeSlots.reduce(
      (acc, slot) => {
        if (!acc[slot.day]) acc[slot.day] = []
        acc[slot.day].push(`${slot.start}~${slot.end}`)
        return acc
      },
      {} as Record<number, string[]>
    )

    return Object.entries(byDay)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([day, times]) => (
        <div key={day}>
          <Tag>{DAY_OF_WEEK_LABEL[Number(day)]}</Tag>
          {times.join(', ')}
        </div>
      ))
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!product) {
    return <div>상품을 찾을 수 없습니다</div>
  }

  const status = getProductStatus(product)
  const discountRate =
    product.original_price > product.sale_price
      ? Math.round((1 - product.sale_price / product.original_price) * 100)
      : 0

  const tabItems = [
    {
      key: 'info',
      label: '기본 정보',
      children: (
        <>
          <div style={{ marginBottom: 12, textAlign: 'right' }}>
            <Space>
              <Button icon={<EditOutlined />} onClick={() => navigate(`/products/${id}/edit`)}>
                수정
              </Button>
              <Popconfirm
                title="상품 삭제"
                description="정말로 이 상품을 삭제하시겠습니까?"
                onConfirm={() => deleteMutation.mutate()}
                okText="삭제"
                cancelText="취소"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>
                  삭제
                </Button>
              </Popconfirm>
            </Space>
          </div>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="상품명">{product.name}</Descriptions.Item>
            <Descriptions.Item label="상태">
              <Space>
                <Tag color={PRODUCT_STATUS_COLOR[status]}>{PRODUCT_STATUS_LABEL[status]}</Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="노출">
              <Switch
                checked={product.is_visible}
                onChange={(checked) => visibilityMutation.mutate(checked)}
                loading={visibilityMutation.isPending}
                checkedChildren="노출"
                unCheckedChildren="숨김"
              />
            </Descriptions.Item>
            <Descriptions.Item label="품절">
              <Switch
                checked={product.is_sold_out}
                onChange={(checked) => soldOutMutation.mutate(checked)}
                loading={soldOutMutation.isPending}
                checkedChildren="품절"
                unCheckedChildren="판매중"
              />
            </Descriptions.Item>
            <Descriptions.Item label="간단 설명" span={2}>
              {product.summary || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="사업주">
              {product.business_owner?.name || '-'}
              {(product.business_owner as { status?: string } | undefined)?.status === 'inactive' && (
                <Tag color="default" style={{ marginLeft: 8 }}>비활성</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="카테고리">{product.category?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="정가">
              {product.original_price.toLocaleString()}원
            </Descriptions.Item>
            <Descriptions.Item label="판매가">
              <Space>
                <strong style={{ color: '#1677ff' }}>
                  {product.sale_price.toLocaleString()}원
                </strong>
                {discountRate > 0 && <Tag color="red">{discountRate}% 할인</Tag>}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="최소 인원">{product.min_participants}명</Descriptions.Item>
            <Descriptions.Item label="최대 인원">{product.max_participants}명</Descriptions.Item>
            <Descriptions.Item label="소요 시간">
              {product.duration_minutes ? `${product.duration_minutes}분` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="지역">{product.region || '-'}</Descriptions.Item>
            <Descriptions.Item label="주소" span={2}>
              {product.address || '-'}
              {product.address_detail && ` ${product.address_detail}`}
            </Descriptions.Item>
            <Descriptions.Item label="조회수">{product.view_count.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="등록일">
              {dayjs(product.created_at).format(DATE_FORMAT)}
            </Descriptions.Item>
            <Descriptions.Item label="운영 시간" span={2}>
              {renderTimeSlots(product.available_time_slots)}
            </Descriptions.Item>
            <Descriptions.Item label="상세 설명" span={2}>
              <div
                className="product-description-content"
                dangerouslySetInnerHTML={{ __html: product.description || '-' }}
              />
              <style>{`
                .product-description-content {
                  line-height: 1.6;
                }
                .product-description-content img {
                  max-width: 600px !important;
                  height: auto !important;
                  border-radius: 8px;
                  display: block;
                  margin: 12px 0;
                }
                .product-description-content p {
                  margin: 8px 0;
                }
                .product-description-content h1,
                .product-description-content h2,
                .product-description-content h3,
                .product-description-content h4 {
                  margin: 16px 0 8px 0;
                  font-weight: 600;
                }
                .product-description-content ul,
                .product-description-content ol {
                  padding-left: 20px;
                  margin: 8px 0;
                }
                .product-description-content li {
                  margin: 4px 0;
                }
              `}</style>
            </Descriptions.Item>
          </Descriptions>
        </>
      ),
    },
    {
      key: 'options',
      label: `옵션 (${product.options?.length || 0})`,
      children: (
        <Table
          columns={optionColumns}
          dataSource={product.options || []}
          rowKey="id"
          size="small"
          bordered
          pagination={false}
        />
      ),
    },
    {
      key: 'images',
      label: `이미지 (${(product.images?.length || 0) + 1})`,
      children: (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div>
            <Image
              src={product.thumbnail}
              alt="썸네일"
              width={150}
              height={150}
              style={{ objectFit: 'cover', borderRadius: 8 }}
            />
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <Tag color="blue">썸네일</Tag>
            </div>
          </div>
          {product.images?.map((image: ProductImage, index: number) => (
            <div key={image.id}>
              <Image
                src={image.image_url}
                alt={`이미지 ${index + 1}`}
                width={150}
                height={150}
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <Tag>{index + 1}</Tag>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Image
          src={product.thumbnail}
          alt="썸네일"
          width={48}
          height={48}
          style={{ objectFit: 'cover', borderRadius: 8 }}
          preview={false}
        />
        <h2 style={{ margin: 0 }}>{product.name}</h2>
        <Tag color={PRODUCT_STATUS_COLOR[status]}>{PRODUCT_STATUS_LABEL[status]}</Tag>
      </div>

      <Tabs items={tabItems} />

      <Divider />

      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>
        목록으로
      </Button>
    </div>
  )
}
