import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Descriptions, Button, Tag, Spin, Divider, Switch, message, Popconfirm, Table, Image } from 'antd'
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import { getCategoryWithParent, getChildCategories, deleteCategory, updateCategoryStatus } from '@/services/categoryService'
import { CATEGORY_DEPTH_LABEL, CATEGORY_DEPTH_COLOR, DATE_FORMAT, DATETIME_FORMAT } from '@/constants'
import type { Category } from '@/types'

const USER_SITE_URL = import.meta.env.VITE_USER_SITE_URL || 'https://withdamda.kr'

// 아이콘 URL 변환 (상대경로인 경우 사용자 사이트 URL 추가)
function resolveIconUrl(iconUrl: string | null): string | null {
  if (!iconUrl) return null
  if (iconUrl.startsWith('/')) {
    return `${USER_SITE_URL}${iconUrl}`
  }
  return iconUrl
}

// 카테고리별 기본 배너 이미지 (사용자 화면과 동일)
const DEFAULT_BANNERS: Record<string, string> = {
  'BEST 체험': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80',
  '계절 특화체험': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80',
  '농장/자연': 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1600&q=80',
  '과학/박물관': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1600&q=80',
  '미술/전시회': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1600&q=80',
  '요리/클래스': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1600&q=80',
  '물놀이/수영장': 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1600&q=80',
  '동물/야외활동': 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=1600&q=80',
  '뮤지컬/연극': 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1600&q=80',
  '음악/예술': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1600&q=80',
  '놀이동산/수족관': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80',
  '직업/전통/안전': 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1600&q=80',
}
const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80'

// 배너 URL 가져오기 (커스텀 배너가 없으면 기본 배너 사용)
function getBannerUrl(category: { name: string; banner_url: string | null }): string {
  if (category.banner_url) return category.banner_url
  return DEFAULT_BANNERS[category.name] || DEFAULT_BANNER
}

export function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: category, isLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => getCategoryWithParent(id!),
    enabled: !!id,
  })

  const { data: childCategories, isLoading: isLoadingChildren } = useQuery({
    queryKey: ['categories', 'children', id],
    queryFn: () => getChildCategories(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      message.success('카테고리가 삭제되었습니다.')
      // 모든 카테고리 관련 캐시 무효화 (형제 카테고리 sort_order 변경 반영)
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      await queryClient.invalidateQueries({ queryKey: ['category'] }) // 모든 개별 카테고리 캐시
      // 상위 카테고리가 있으면 상위 카테고리 상세 페이지로, 없으면 목록으로
      if (category?.parent?.id) {
        navigate(`/categories/${category.parent.id}`)
      } else {
        navigate('/categories')
      }
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const statusMutation = useMutation({
    mutationFn: (isActive: boolean) => updateCategoryStatus(id!, isActive),
    onSuccess: async () => {
      message.success('상태가 변경되었습니다.')
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      await queryClient.invalidateQueries({ queryKey: ['category'] })
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!category) {
    return <div>카테고리를 찾을 수 없습니다.</div>
  }

  const childColumns: ColumnsType<Category> = [
    {
      title: '카테고리명',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <a onClick={() => navigate(`/categories/${record.id}`)}>{name}</a>
      ),
    },
    {
      title: '분류',
      dataIndex: 'depth',
      key: 'depth',
      width: 100,
      render: (depth: number) => (
        <Tag color={CATEGORY_DEPTH_COLOR[depth]}>
          {CATEGORY_DEPTH_LABEL[depth]}
        </Tag>
      ),
    },
    {
      title: '정렬순서',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 100,
      align: 'center',
    },
    {
      title: '상태',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: '등록일',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <FolderOutlined style={{ fontSize: 32, color: CATEGORY_DEPTH_COLOR[category.depth] }} />
        <div>
          <h2 style={{ margin: 0 }}>{category.name}</h2>
          <Tag color={CATEGORY_DEPTH_COLOR[category.depth]}>
            {CATEGORY_DEPTH_LABEL[category.depth]}
          </Tag>
        </div>
        <div style={{ flex: 1 }} />
        <Button
          icon={<EditOutlined />}
          onClick={() => navigate(`/categories/${id}/edit`)}
        >
          수정
        </Button>
        <Popconfirm
          title="카테고리 삭제"
          description="정말 이 카테고리를 삭제하시겠습니까?"
          onConfirm={() => deleteMutation.mutate(id!)}
          okText="삭제"
          cancelText="취소"
        >
          <Button danger icon={<DeleteOutlined />}>
            삭제
          </Button>
        </Popconfirm>
      </div>

      <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="카테고리명">{category.name}</Descriptions.Item>
        <Descriptions.Item label="분류">
          <Tag color={CATEGORY_DEPTH_COLOR[category.depth]}>
            {CATEGORY_DEPTH_LABEL[category.depth]}
          </Tag>
        </Descriptions.Item>
        {category.depth === 1 && (
          <>
            <Descriptions.Item label="아이콘" span={2}>
              {category.icon_url ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <img
                      src={resolveIconUrl(category.icon_url)!}
                      alt={category.name}
                      style={{ maxWidth: 28, maxHeight: 28, objectFit: 'contain' }}
                    />
                  </div>
                  <span style={{ color: '#666', fontSize: 12 }}>{category.icon_url}</span>
                </div>
              ) : (
                <span style={{ color: '#999' }}>아이콘 없음</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="상단 배너" span={2}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Image
                  src={getBannerUrl(category)}
                  alt="카테고리 배너"
                  width={160}
                  height={64}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                  preview={{
                    mask: '클릭하여 확대',
                  }}
                />
                <div>
                  {category.banner_url ? (
                    <span style={{ color: '#666', fontSize: 12, display: 'block', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {category.banner_url}
                    </span>
                  ) : (
                    <span style={{ color: '#faad14', fontSize: 12 }}>기본 배너 사용 중</span>
                  )}
                </div>
              </div>
            </Descriptions.Item>
          </>
        )}
        <Descriptions.Item label="상위 카테고리">
          {category.parent ? (
            <a onClick={() => navigate(`/categories/${category.parent!.id}`)}>
              {category.parent.name}
            </a>
          ) : (
            <span style={{ color: '#999' }}>없음 (최상위)</span>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="정렬순서">{category.sort_order}</Descriptions.Item>
        <Descriptions.Item label="상태">
          <Switch
            checked={category.is_active}
            onChange={(checked) => statusMutation.mutate(checked)}
            checkedChildren="활성"
            unCheckedChildren="비활성"
            loading={statusMutation.isPending}
          />
        </Descriptions.Item>
        <Descriptions.Item label="등록일">
          {dayjs(category.created_at).format(DATETIME_FORMAT)}
        </Descriptions.Item>
        <Descriptions.Item label="수정일" span={2}>
          {dayjs(category.updated_at).format(DATETIME_FORMAT)}
        </Descriptions.Item>
      </Descriptions>

      {category.depth < 3 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}>하위 카테고리 ({CATEGORY_DEPTH_LABEL[category.depth + 1]})</h4>
            <Button
              type="primary"
              size="small"
              onClick={() => navigate(`/categories/new?parentId=${id}&depth=${category.depth + 1}`)}
            >
              하위 카테고리 추가
            </Button>
          </div>
          <Table
            columns={childColumns}
            dataSource={childCategories || []}
            rowKey="id"
            loading={isLoadingChildren}
            size="small"
            bordered
            pagination={false}
            locale={{ emptyText: '하위 카테고리가 없습니다.' }}
            onRow={(record) => ({
              onClick: () => navigate(`/categories/${record.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        </>
      )}

      <Divider />
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/categories')}>
        목록으로
      </Button>
    </div>
  )
}
