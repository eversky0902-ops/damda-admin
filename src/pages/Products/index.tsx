import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Input, Select, Tag, Image, Dropdown, Modal, message, Upload, Alert } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { MenuProps } from 'antd'
import dayjs from 'dayjs'

import {
  getProducts,
  getBusinessOwners,
  getCategoriesFlat,
  getAllProducts,
  upsertProductsBulk,
} from '@/services/productService'
import {
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUS_COLOR,
  DEFAULT_PAGE_SIZE,
  DATE_FORMAT,
} from '@/constants'
import type { Product, ProductFilter, ProductCreateInput } from '@/types'
import {
  downloadExcel,
  formatProductsForExcel,
  PRODUCT_EXCEL_COLUMNS,
  parseExcelFile,
  parseProductExcelData,
} from '@/utils/excel'

type ProductStatusFilter = ProductFilter['status']

function getProductStatus(product: Product): 'visible' | 'hidden' | 'sold_out' {
  if (product.is_sold_out) return 'sold_out'
  if (!product.is_visible) return 'hidden'
  return 'visible'
}

export function ProductsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>('all')
  const [vendorFilter, setVendorFilter] = useState<string | undefined>(undefined)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)

  // 엑셀 업로드 모달 상태
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadErrors, setUploadErrors] = useState<{ row: number; message: string }[]>([])
  const [uploadResult, setUploadResult] = useState<{
    success: number
    created: number
    updated: number
    failed: { row: number; error: string }[]
  } | null>(null)

  // 상품 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ['products', page, pageSize, search, statusFilter, vendorFilter, categoryFilter],
    queryFn: () =>
      getProducts({
        page,
        pageSize,
        search,
        status: statusFilter,
        business_owner_id: vendorFilter,
        category_id: categoryFilter,
      }),
  })

  // 사업주 목록 조회 (필터용)
  const { data: vendors } = useQuery({
    queryKey: ['businessOwners'],
    queryFn: getBusinessOwners,
  })

  // 카테고리 목록 조회 (필터용)
  const { data: categories } = useQuery({
    queryKey: ['categoriesFlat'],
    queryFn: getCategoriesFlat,
  })

  // 대량 업로드 mutation (upsert)
  const uploadMutation = useMutation({
    mutationFn: (inputs: (ProductCreateInput & { id?: string })[]) => upsertProductsBulk(inputs),
    onSuccess: (result) => {
      setUploadResult(result)
      if (result.success > 0) {
        queryClient.invalidateQueries({ queryKey: ['products'] })
      }
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.')
    },
  })

  // 엑셀 다운로드 (현재 검색 조건)
  const handleDownloadCurrent = () => {
    if (!data?.data || data.data.length === 0) {
      message.warning('다운로드할 데이터가 없습니다.')
      return
    }
    const formatted = formatProductsForExcel(data.data)
    downloadExcel(formatted, PRODUCT_EXCEL_COLUMNS, '상품_목록')
    message.success('엑셀 다운로드가 완료되었습니다.')
  }

  // 엑셀 다운로드 (전체)
  const handleDownloadAll = async () => {
    try {
      message.loading({ content: '전체 데이터를 가져오는 중...', key: 'download' })
      const allProducts = await getAllProducts()
      if (allProducts.length === 0) {
        message.warning({ content: '다운로드할 데이터가 없습니다.', key: 'download' })
        return
      }
      const formatted = formatProductsForExcel(allProducts)
      downloadExcel(formatted, PRODUCT_EXCEL_COLUMNS, '상품_전체목록')
      message.success({ content: `엑셀 다운로드 완료 (${allProducts.length}건)`, key: 'download' })
    } catch (error) {
      message.error({ content: '다운로드 중 오류가 발생했습니다.', key: 'download' })
    }
  }

  // 파일 선택 처리
  const handleFileSelect = async (file: File) => {
    setUploadErrors([])
    setUploadResult(null)

    try {
      const rawData = await parseExcelFile<Record<string, unknown>>(file)
      if (rawData.length === 0) {
        setUploadErrors([{ row: 0, message: '데이터가 없습니다.' }])
        return
      }

      const { valid, errors } = parseProductExcelData(rawData)

      if (errors.length > 0) {
        setUploadErrors(errors)
        return
      }

      if (valid.length === 0) {
        setUploadErrors([{ row: 0, message: '유효한 데이터가 없습니다.' }])
        return
      }

      // 업로드 실행 (upsert)
      uploadMutation.mutate(valid as unknown as (ProductCreateInput & { id?: string })[])
    } catch (error) {
      setUploadErrors([
        { row: 0, message: error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.' },
      ])
    }
  }

  // 다운로드 메뉴
  const downloadMenuItems: MenuProps['items'] = [
    {
      key: 'current',
      label: '현재 목록 다운로드',
      icon: <DownloadOutlined />,
      onClick: handleDownloadCurrent,
    },
    {
      key: 'all',
      label: '전체 목록 다운로드',
      icon: <DownloadOutlined />,
      onClick: handleDownloadAll,
    },
  ]

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1)
    setPageSize(pagination.pageSize || DEFAULT_PAGE_SIZE)
  }

  const columns: ColumnsType<Product> = [
    {
      title: '썸네일',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
      width: 80,
      render: (thumbnail: string) => (
        <Image
          src={thumbnail}
          alt="상품 썸네일"
          width={60}
          height={60}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
          preview={false}
        />
      ),
    },
    {
      title: '상품명',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <a
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/products/${record.id}`)
            }}
          >
            {name}
          </a>
          {record.summary && (
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{record.summary}</div>
          )}
        </div>
      ),
    },
    {
      title: '사업주',
      key: 'business_owner',
      width: 140,
      render: (_, record) => {
        const owner = record.business_owner as { name: string; status?: string } | undefined
        if (!owner) return '-'
        return (
          <span>
            {owner.name}
            {owner.status === 'inactive' && (
              <Tag color="default" style={{ marginLeft: 4, fontSize: 10 }}>비활성</Tag>
            )}
          </span>
        )
      },
    },
    {
      title: '카테고리',
      key: 'category',
      width: 120,
      render: (_, record) => record.category?.name || '-',
    },
    {
      title: '가격',
      key: 'price',
      width: 140,
      render: (_, record) => (
        <div>
          {record.original_price !== record.sale_price && (
            <div style={{ textDecoration: 'line-through', color: '#999', fontSize: 12 }}>
              {record.original_price.toLocaleString()}원
            </div>
          )}
          <div style={{ fontWeight: 500 }}>{record.sale_price.toLocaleString()}원</div>
        </div>
      ),
    },
    {
      title: '인원',
      key: 'participants',
      width: 100,
      render: (_, record) => `${record.min_participants}~${record.max_participants}명`,
    },
    {
      title: '조회수',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 80,
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: '상태',
      key: 'status',
      width: 80,
      render: (_, record) => {
        const status = getProductStatus(record)
        return <Tag color={PRODUCT_STATUS_COLOR[status]}>{PRODUCT_STATUS_LABEL[status]}</Tag>
      },
    },
    {
      title: '등록일',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
    },
  ]

  // 카테고리 옵션 (깊이별 들여쓰기)
  const categoryOptions = [
    { value: '', label: '전체 카테고리' },
    ...(categories?.map((cat) => ({
      value: cat.id,
      label: `${'　'.repeat(cat.depth - 1)}${cat.name}`,
    })) || []),
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>상품 관리</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Dropdown menu={{ items: downloadMenuItems }} placement="bottomRight">
            <Button icon={<DownloadOutlined />}>엑셀 다운로드</Button>
          </Dropdown>
          <Button
            icon={<UploadOutlined />}
            onClick={() => {
              setUploadErrors([])
              setUploadResult(null)
              setIsUploadModalOpen(true)
            }}
          >
            엑셀 업로드
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/products/new')}
          >
            상품 등록
          </Button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 12,
          padding: 12,
          background: '#fafafa',
          borderRadius: 6,
          flexWrap: 'wrap',
        }}
      >
        <Input
          placeholder="상품명 검색"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 200 }}
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        />
        <Select
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '전체 상태' },
            { value: 'visible', label: '노출' },
            { value: 'hidden', label: '숨김' },
            { value: 'sold_out', label: '품절' },
          ]}
        />
        <Select
          value={vendorFilter || ''}
          onChange={(value) => {
            setVendorFilter(value || undefined)
            setPage(1)
          }}
          style={{ width: 160 }}
          showSearch
          optionFilterProp="label"
          options={[
            { value: '', label: '전체 사업주' },
            ...(vendors?.map((v) => ({ value: v.id, label: v.name })) || []),
          ]}
        />
        <Select
          value={categoryFilter || ''}
          onChange={(value) => {
            setCategoryFilter(value || undefined)
            setPage(1)
          }}
          style={{ width: 160 }}
          options={categoryOptions}
        />
        <Button type="primary" onClick={handleSearch}>
          검색
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        size="small"
        bordered
        pagination={{
          current: page,
          pageSize,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `총 ${total}개`,
          size: 'small',
        }}
        onChange={handleTableChange}
        onRow={(record) => ({
          onClick: () => navigate(`/products/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />

      {/* 엑셀 업로드 모달 */}
      <Modal
        title="상품 엑셀 업로드"
        open={isUploadModalOpen}
        onCancel={() => setIsUploadModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsUploadModalOpen(false)}>
            닫기
          </Button>,
        ]}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            message="업로드 안내"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>"전체 목록 다운로드" 엑셀을 그대로 수정하여 업로드하세요.</li>
                <li><strong>ID가 비어있으면</strong> 신규 상품으로 등록됩니다.</li>
                <li><strong>ID가 있으면</strong> 해당 상품 정보가 수정됩니다.</li>
                <li>
                  <strong>옵션:</strong> 이름:가격:필수여부 형식, | 로 구분
                  <br />
                  <span style={{ color: '#666' }}>예: 추가인원:5000:N|특별케어:10000:Y</span>
                </li>
                <li>
                  <strong>운영시간:</strong> 요일:시작-종료 형식, | 로 구분 (0=일~6=토)
                  <br />
                  <span style={{ color: '#666' }}>예: 1:09:00-18:00|2:09:00-18:00</span>
                </li>
              </ul>
            }
            type="info"
            showIcon
          />
        </div>

        <Upload.Dragger
          accept=".xlsx,.xls"
          showUploadList={false}
          beforeUpload={(file) => {
            handleFileSelect(file)
            return false
          }}
          disabled={uploadMutation.isPending}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          </p>
          <p className="ant-upload-text">클릭하거나 파일을 드래그하여 업로드</p>
          <p className="ant-upload-hint">xlsx, xls 파일만 지원합니다</p>
        </Upload.Dragger>

        {uploadMutation.isPending && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Alert message="업로드 중입니다..." type="info" showIcon />
          </div>
        )}

        {uploadErrors.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Alert
              message="데이터 검증 오류"
              description={
                <ul style={{ margin: 0, paddingLeft: 20, maxHeight: 200, overflow: 'auto' }}>
                  {uploadErrors.map((err, i) => (
                    <li key={i} style={{ color: '#ff4d4f' }}>
                      {err.row > 0 ? `${err.row}행: ` : ''}{err.message}
                    </li>
                  ))}
                </ul>
              }
              type="error"
              showIcon
            />
          </div>
        )}

        {uploadResult && (
          <div style={{ marginTop: 16 }}>
            <Alert
              message="업로드 완료"
              description={
                <div>
                  <p style={{ margin: '4px 0' }}>
                    성공: {uploadResult.success}건
                    {uploadResult.created > 0 && <span style={{ color: '#52c41a' }}> (신규 {uploadResult.created}건)</span>}
                    {uploadResult.updated > 0 && <span style={{ color: '#1677ff' }}> (수정 {uploadResult.updated}건)</span>}
                  </p>
                  {uploadResult.failed.length > 0 && (
                    <>
                      <p style={{ margin: '4px 0', color: '#ff4d4f' }}>
                        실패: {uploadResult.failed.length}건
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 20, maxHeight: 150, overflow: 'auto' }}>
                        {uploadResult.failed.map((f, i) => (
                          <li key={i} style={{ color: '#ff4d4f' }}>
                            {f.row}행: {f.error}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              }
              type={uploadResult.failed.length > 0 ? 'warning' : 'success'}
              showIcon
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
