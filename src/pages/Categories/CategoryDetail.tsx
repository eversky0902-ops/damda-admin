import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Descriptions, Button, Tag, Spin, Divider, Switch, message, Popconfirm, Table } from 'antd'
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import { getCategoryWithParent, getChildCategories, deleteCategory, updateCategoryStatus } from '@/services/categoryService'
import { CATEGORY_DEPTH_LABEL, CATEGORY_DEPTH_COLOR, DATE_FORMAT, DATETIME_FORMAT } from '@/constants'
import type { Category } from '@/types'

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
    onSuccess: () => {
      message.success('카테고리가 삭제되었습니다.')
      navigate('/categories')
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const statusMutation = useMutation({
    mutationFn: (isActive: boolean) => updateCategoryStatus(id!, isActive),
    onSuccess: () => {
      message.success('상태가 변경되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['category', id] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
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
