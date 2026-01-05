import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Input, Select, Tag, Space, Switch, message, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, FolderOutlined, FolderOpenOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import { getAllCategories, buildCategoryTree, deleteCategory, updateCategoryStatus, type CategoryTreeNode } from '@/services/categoryService'
import { CATEGORY_DEPTH_LABEL, CATEGORY_DEPTH_COLOR, DATE_FORMAT } from '@/constants'

export function CategoriesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      message.success('카테고리가 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateCategoryStatus(id, isActive),
    onSuccess: () => {
      message.success('상태가 변경되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  // 트리 데이터 생성
  const treeData = categories ? buildCategoryTree(categories) : []

  // 필터링
  const filteredData = treeData.filter((cat) => {
    // 검색 필터
    const matchSearch = !search ||
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.children.some(child =>
        child.name.toLowerCase().includes(search.toLowerCase()) ||
        child.children.some(grandChild =>
          grandChild.name.toLowerCase().includes(search.toLowerCase())
        )
      )

    // 상태 필터
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && cat.is_active) ||
      (statusFilter === 'inactive' && !cat.is_active)

    return matchSearch && matchStatus
  })

  const handleSearch = () => {
    setSearch(searchInput)
  }

  const handleExpandAll = () => {
    if (categories) {
      const allKeys = categories.map((cat) => cat.id)
      setExpandedRowKeys(allKeys)
    }
  }

  const handleCollapseAll = () => {
    setExpandedRowKeys([])
  }

  const columns: ColumnsType<CategoryTreeNode> = [
    {
      title: '카테고리명',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space>
          {record.depth === 1 && <FolderOutlined style={{ color: '#1677ff' }} />}
          {record.depth === 2 && <FolderOpenOutlined style={{ color: '#52c41a' }} />}
          <a onClick={(e) => { e.stopPropagation(); navigate(`/categories/${record.id}`); }}>{name}</a>
        </Space>
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
      width: 100,
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => statusMutation.mutate({ id: record.id, isActive: checked })}
          checkedChildren="활성"
          unCheckedChildren="비활성"
          size="small"
          onClick={(_, e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '등록일',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
    },
    {
      title: '관리',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => { e.stopPropagation(); navigate(`/categories/${record.id}/edit`); }}
          />
          <Popconfirm
            title="카테고리 삭제"
            description="정말 이 카테고리를 삭제하시겠습니까?"
            onConfirm={(e) => { e?.stopPropagation(); deleteMutation.mutate(record.id); }}
            onCancel={(e) => e?.stopPropagation()}
            okText="삭제"
            cancelText="취소"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>카테고리 관리</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/categories/new')}
        >
          카테고리 등록
        </Button>
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 12,
        padding: 12,
        background: '#fafafa',
        borderRadius: 6,
      }}>
        <Input
          placeholder="카테고리명 검색"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 240 }}
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        />
        <Select
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '전체 상태' },
            { value: 'active', label: '활성' },
            { value: 'inactive', label: '비활성' },
          ]}
        />
        <Button type="primary" onClick={handleSearch}>
          검색
        </Button>
        <div style={{ flex: 1 }} />
        <Button onClick={handleExpandAll}>전체 펼치기</Button>
        <Button onClick={handleCollapseAll}>전체 접기</Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={isLoading}
        size="small"
        bordered
        pagination={false}
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
          childrenColumnName: 'children',
          indentSize: 24,
        }}
        onRow={(record) => ({
          onClick: () => navigate(`/categories/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
