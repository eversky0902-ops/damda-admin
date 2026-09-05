import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Input, Select, Tag, Avatar, Dropdown, Modal, message, Upload, Alert, Typography } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ShopOutlined,
  DownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  LockOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { MenuProps } from 'antd'
import dayjs from 'dayjs'

import { getVendors, getAllVendors, upsertVendorsBulk, deleteVendor } from '@/services/vendorService'
import { VENDOR_STATUS_LABEL, DEFAULT_PAGE_SIZE, DATE_FORMAT } from '@/constants'
import { formatPhoneNumber } from '@/utils/format'
import type { BusinessOwner, VendorStatus, BusinessOwnerCreateInput } from '@/types'
import {
  downloadExcel,
  formatVendorsForExcel,
  VENDOR_EXCEL_COLUMNS,
  parseExcelFile,
  parseVendorExcelData,
} from '@/utils/excel'

export function VendorsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<VendorStatus | 'all'>('all')
  const [deleteTarget, setDeleteTarget] = useState<BusinessOwner | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  // 엑셀 업로드 모달 상태
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadErrors, setUploadErrors] = useState<{ row: number; message: string }[]>([])
  const [uploadResult, setUploadResult] = useState<{
    success: number
    created: number
    updated: number
    failed: { row: number; error: string }[]
  } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', page, pageSize, search, statusFilter],
    queryFn: () =>
      getVendors({
        page,
        pageSize,
        search,
        status: statusFilter,
      }),
  })

  // 대량 업로드 mutation (upsert)
  const uploadMutation = useMutation({
    mutationFn: (inputs: (BusinessOwnerCreateInput & { id?: string })[]) => upsertVendorsBulk(inputs),
    onSuccess: (result) => {
      setUploadResult(result)
      if (result.success > 0) {
        queryClient.invalidateQueries({ queryKey: ['vendors'] })
      }
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => deleteVendor(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      setDeleteTarget(null)
      setDeleteConfirmation('')
      message.success('사업주가 삭제되었습니다.')
    },
    onError: (error: Error) => message.error(error.message),
  })

  // 엑셀 다운로드 (현재 검색 조건)
  const handleDownloadCurrent = () => {
    if (!data?.data || data.data.length === 0) {
      message.warning('다운로드할 데이터가 없습니다.')
      return
    }
    const formatted = formatVendorsForExcel(data.data)
    downloadExcel(formatted, VENDOR_EXCEL_COLUMNS, '사업주_목록')
    message.success('엑셀 다운로드가 완료되었습니다.')
  }

  // 엑셀 다운로드 (전체)
  const handleDownloadAll = async () => {
    try {
      message.loading({ content: '전체 데이터를 가져오는 중...', key: 'download' })
      const allVendors = await getAllVendors()
      if (allVendors.length === 0) {
        message.warning({ content: '다운로드할 데이터가 없습니다.', key: 'download' })
        return
      }
      const formatted = formatVendorsForExcel(allVendors)
      downloadExcel(formatted, VENDOR_EXCEL_COLUMNS, '사업주_전체목록')
      message.success({ content: `엑셀 다운로드 완료 (${allVendors.length}건)`, key: 'download' })
    } catch {
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

      const { valid, errors } = parseVendorExcelData(rawData)

      if (errors.length > 0) {
        setUploadErrors(errors)
        return
      }

      if (valid.length === 0) {
        setUploadErrors([{ row: 0, message: '유효한 데이터가 없습니다.' }])
        return
      }

      // 업로드 실행 (upsert)
      uploadMutation.mutate(valid as unknown as (BusinessOwnerCreateInput & { id?: string })[])
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

  const columns: ColumnsType<BusinessOwner> = [
    {
      title: '사업자명',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar
            src={record.logo_url}
            icon={!record.logo_url && <ShopOutlined />}
            size={32}
            style={{ backgroundColor: record.logo_url ? undefined : '#f0f0f0', color: '#999' }}
          />
          <a onClick={(e) => { e.stopPropagation(); navigate(`/vendors/${record.id}`); }}>{name}</a>
        </div>
      ),
    },
    {
      title: '사업자번호',
      dataIndex: 'business_number',
      key: 'business_number',
    },
    {
      title: '사업주 코드',
      dataIndex: 'owner_code',
      key: 'owner_code',
      width: 145,
      render: (code: string) => <Typography.Text code copyable>{code}</Typography.Text>,
    },
    {
      title: '비즈니스센터 ID',
      dataIndex: 'email',
      key: 'business_center_id',
      width: 220,
      render: (email: string, record) => (
        <div>
          <Typography.Text copyable={!!email}>{email || '-'}</Typography.Text>
          <div><Tag color={record.auth_user_id ? 'green' : 'orange'}>{record.auth_user_id ? '가입·연결 완료' : '계정 미연결'}</Tag></div>
        </div>
      ),
    },
    {
      title: '비밀번호',
      key: 'business_center_password',
      width: 130,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<LockOutlined />}
          onClick={(event) => {
            event.stopPropagation()
            navigate(`/vendors/${record.id}`)
          }}
        >
          안전하게 재설정
        </Button>
      ),
    },
    {
      title: '대표자',
      dataIndex: 'representative',
      key: 'representative',
    },
    {
      title: '담당자',
      dataIndex: 'contact_name',
      key: 'contact_name',
    },
    {
      title: '연락처',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
      render: (phone: string) => formatPhoneNumber(phone),
    },
    {
      title: '수수료율',
      dataIndex: 'commission_rate',
      key: 'commission_rate',
      render: (rate: number) => `${rate}%`,
      width: 100,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: VendorStatus) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {VENDOR_STATUS_LABEL[status]}
        </Tag>
      ),
    },
    {
      title: '가입일',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
    },
    {
      title: '관리',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={(event) => {
            event.stopPropagation()
            setDeleteTarget(record)
            setDeleteConfirmation('')
          }}
        >
          삭제
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>사업주 관리</h2>
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
            onClick={() => navigate('/vendors/new')}
          >
            사업주 등록
          </Button>
        </div>
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
          placeholder="사업자명, 사업자번호 또는 사업주 코드"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 240 }}
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
            { value: 'active', label: '활성' },
            { value: 'inactive', label: '비활성' },
          ]}
        />
        <Button type="primary" onClick={handleSearch}>
          검색
        </Button>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="비즈니스센터 ID는 복사할 수 있습니다. 기존 비밀번호는 암호화되어 조회할 수 없으며, 사업주 상세에서 새 비밀번호로 안전하게 재설정할 수 있습니다."
      />

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
          onClick: () => navigate(`/vendors/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />

      <Modal
        title="사업주 삭제"
        open={!!deleteTarget}
        okText="영구 삭제"
        cancelText="취소"
        okButtonProps={{
          danger: true,
          disabled: deleteConfirmation !== deleteTarget?.name,
        }}
        confirmLoading={deleteMutation.isPending}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleteConfirmation('')
        }}
        onOk={() => {
          if (deleteTarget && deleteConfirmation === deleteTarget.name) {
            deleteMutation.mutate({ id: deleteTarget.id, name: deleteConfirmation })
          }
        }}
      >
        <Alert
          type="warning"
          showIcon
          message="삭제 후 복구할 수 없습니다."
          description="상품·예약·정산 데이터가 연결된 사업주는 삭제되지 않습니다. 필요한 경우 상태를 비활성으로 변경하세요."
          style={{ marginBottom: 16 }}
        />
        <Typography.Paragraph>
          확인을 위해 사업자명 <Typography.Text strong>{deleteTarget?.name}</Typography.Text>을(를) 입력하세요.
        </Typography.Paragraph>
        <Input
          value={deleteConfirmation}
          onChange={(event) => setDeleteConfirmation(event.target.value)}
          placeholder={deleteTarget?.name}
          onPressEnter={() => {
            if (deleteTarget && deleteConfirmation === deleteTarget.name) {
              deleteMutation.mutate({ id: deleteTarget.id, name: deleteConfirmation })
            }
          }}
        />
      </Modal>

      {/* 엑셀 업로드 모달 */}
      <Modal
        title="사업주 엑셀 업로드"
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
                <li><strong>ID가 비어있으면</strong> 신규 사업주로 등록됩니다.</li>
                <li><strong>ID가 있으면</strong> 해당 사업주 정보가 수정됩니다.</li>
                <li>사업자번호는 10자리 숫자만 입력 (하이픈 제외).</li>
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
