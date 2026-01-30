import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Form, Input, InputNumber, Select, Switch, Button, Card, Typography, TreeSelect, Upload, message } from 'antd'
import { ArrowLeftOutlined, FolderOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons'

import { getAllCategories, buildCategoryTree, type CategoryTreeNode } from '@/services/categoryService'
import { CATEGORY_DEPTH_LABEL } from '@/constants'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

const { Text } = Typography

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const USER_SITE_URL = import.meta.env.VITE_USER_SITE_URL || 'https://withdamda.kr'

// 아이콘 URL 변환 (상대경로인 경우 사용자 사이트 URL 추가)
function resolveIconUrl(iconUrl: string | null): string | null {
  if (!iconUrl) return null
  if (iconUrl.startsWith('/')) {
    return `${USER_SITE_URL}${iconUrl}`
  }
  return iconUrl
}

interface CategoryFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<Category> & { parentId?: string; depth?: number }
  onSubmit: (values: CategoryFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export interface CategoryFormValues {
  name: string
  parent_id: string | null
  depth: number
  sort_order: number
  is_active: boolean
  icon_url: string | null
}

// 섹션 헤더 컴포넌트
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

// 트리 데이터 변환 (TreeSelect용)
function convertToTreeSelectData(
  nodes: CategoryTreeNode[],
  maxDepth: number,
  excludeId?: string
): { title: string; value: string; disabled?: boolean; children?: ReturnType<typeof convertToTreeSelectData> }[] {
  return nodes
    .filter((node) => node.id !== excludeId) // 자기 자신 제외
    .filter((node) => node.depth < maxDepth) // 선택 가능한 깊이만 표시
    .map((node) => ({
      title: `${node.name} (${CATEGORY_DEPTH_LABEL[node.depth]})`,
      value: node.id,
      disabled: node.depth >= maxDepth,
      children: node.children.length > 0
        ? convertToTreeSelectData(node.children, maxDepth, excludeId)
        : undefined,
    }))
}

export function CategoryForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: CategoryFormProps) {
  const [form] = Form.useForm<CategoryFormValues>()
  const parentId = Form.useWatch('parent_id', form)
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // 모든 카테고리 조회
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
  })

  // 트리 데이터 생성
  const treeData = categories ? buildCategoryTree(categories) : []

  // 상위 카테고리 선택에 따른 depth 자동 설정
  useEffect(() => {
    if (parentId && categories) {
      const parent = categories.find((cat) => cat.id === parentId)
      if (parent) {
        form.setFieldValue('depth', parent.depth + 1)
      }
    } else if (!parentId) {
      form.setFieldValue('depth', 1)
    }
  }, [parentId, categories, form])

  // 초기값 설정
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        name: initialValues.name || '',
        parent_id: initialValues.parent_id || initialValues.parentId || null,
        depth: initialValues.depth || 1,
        sort_order: initialValues.sort_order ?? 0,
        is_active: initialValues.is_active ?? true,
        icon_url: initialValues.icon_url || null,
      })
      setIconUrl(initialValues.icon_url || null)
    }
  }, [initialValues, form])

  // 아이콘 업로드 핸들러
  const handleIconUpload = async (file: File) => {
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `category-icons/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      const url = `${SUPABASE_URL}/storage/v1/object/public/public/${fileName}`
      setIconUrl(url)
      form.setFieldValue('icon_url', url)
      message.success('아이콘이 업로드되었습니다.')
    } catch (error) {
      console.error('Upload error:', error)
      message.error('아이콘 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  // 아이콘 삭제 핸들러
  const handleIconRemove = () => {
    setIconUrl(null)
    form.setFieldValue('icon_url', null)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values)
    })
  }

  const currentDepth = Form.useWatch('depth', form) || 1

  return (
    <Form
      form={form}
      layout="vertical"
      className="compact-form"
      initialValues={{
        name: '',
        parent_id: null,
        depth: 1,
        sort_order: 0,
        is_active: true,
        icon_url: null,
      }}
    >
      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<FolderOutlined />}
          title="카테고리 정보"
          description="카테고리의 기본 정보를 입력해주세요."
        />

        <Form.Item
          name="name"
          label="카테고리명"
          rules={[{ required: true, message: '카테고리명을 입력해주세요' }]}
          extra="고객에게 노출되는 카테고리명입니다."
        >
          <Input placeholder="카테고리명을 입력하세요" style={{ width: 280 }} />
        </Form.Item>

        {currentDepth === 1 && (
          <Form.Item
            name="icon_url"
            label="카테고리 아이콘"
            extra="대분류 카테고리의 아이콘입니다. SVG, PNG, JPG 파일을 업로드하세요."
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {iconUrl && (
                <div style={{
                  width: 64,
                  height: 64,
                  border: '1px solid #d9d9d9',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fafafa',
                  position: 'relative',
                }}>
                  <img
                    src={resolveIconUrl(iconUrl)!}
                    alt="카테고리 아이콘"
                    style={{ maxWidth: 48, maxHeight: 48, objectFit: 'contain' }}
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={handleIconRemove}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      background: '#fff',
                      borderRadius: '50%',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  />
                </div>
              )}
              <Upload
                accept=".svg,.png,.jpg,.jpeg"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleIconUpload(file)
                  return false
                }}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  {iconUrl ? '아이콘 변경' : '아이콘 업로드'}
                </Button>
              </Upload>
            </div>
          </Form.Item>
        )}

        <Form.Item
          name="parent_id"
          label="상위 카테고리"
          extra={mode === 'edit' ? '수정 시 상위 카테고리는 변경할 수 없습니다.' : '대분류인 경우 선택하지 않습니다.'}
        >
          <TreeSelect
            placeholder="상위 카테고리를 선택하세요 (선택 안함 = 대분류)"
            allowClear
            treeData={convertToTreeSelectData(treeData, 3, mode === 'edit' ? initialValues?.id : undefined)}
            style={{ width: 320 }}
            treeDefaultExpandAll
            disabled={mode === 'edit'}
          />
        </Form.Item>

        <Form.Item
          name="depth"
          label="분류 단계"
          extra="상위 카테고리 선택에 따라 자동으로 설정됩니다."
        >
          <Select
            style={{ width: 120 }}
            disabled
            options={[
              { value: 1, label: CATEGORY_DEPTH_LABEL[1] },
              { value: 2, label: CATEGORY_DEPTH_LABEL[2] },
              { value: 3, label: CATEGORY_DEPTH_LABEL[3] },
            ]}
          />
        </Form.Item>

        {currentDepth >= 3 && (
          <div style={{ padding: '8px 12px', background: '#fff7e6', borderRadius: 6, marginBottom: 16 }}>
            <Text type="warning">
              소분류(3단계)는 더 이상 하위 카테고리를 추가할 수 없습니다.
            </Text>
          </div>
        )}

        <Form.Item
          name="sort_order"
          label="정렬순서"
          extra="숫자가 작을수록 먼저 표시됩니다."
        >
          <InputNumber min={0} max={9999} style={{ width: 120 }} />
        </Form.Item>

        <Form.Item
          name="is_active"
          label="상태"
          valuePropName="checked"
        >
          <Switch checkedChildren="활성" unCheckedChildren="비활성" />
        </Form.Item>
      </Card>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onCancel}>
          취소
        </Button>
        <Button type="primary" onClick={handleSubmit} loading={isSubmitting}>
          {mode === 'edit' ? '저장' : '등록'}
        </Button>
      </div>
    </Form>
  )
}
