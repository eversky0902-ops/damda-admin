import { useState } from 'react'
import { Upload, Button, List, message, Spin, Typography, Space, Popconfirm } from 'antd'
import { UploadOutlined, FileOutlined, DeleteOutlined, FilePdfOutlined, FileImageOutlined, FileExcelOutlined, FileWordOutlined } from '@ant-design/icons'
import type { UploadProps, RcFile } from 'antd/es/upload'

const { Text } = Typography

export interface DocumentItem {
  id?: string
  file_name: string
  file_url: string
  file_size?: number | null
  mime_type?: string | null
}

interface DocumentsUploadProps {
  value?: DocumentItem[]
  onChange?: (documents: DocumentItem[]) => void
  entityId?: string
  documentType: string
  uploadFn: (file: File, entityId: string, documentType: string) => Promise<{
    url: string
    fileName: string
    fileSize: number
    mimeType: string
  }>
  maxCount?: number
  accept?: string
  maxSizeMB?: number
  label?: string
  description?: string
}

function getFileIcon(mimeType?: string | null) {
  if (!mimeType) return <FileOutlined />
  if (mimeType.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />
  if (mimeType.includes('image')) return <FileImageOutlined style={{ color: '#1890ff' }} />
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileExcelOutlined style={{ color: '#52c41a' }} />
  if (mimeType.includes('word') || mimeType.includes('document')) return <FileWordOutlined style={{ color: '#1677ff' }} />
  return <FileOutlined />
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsUpload({
  value = [],
  onChange,
  entityId,
  documentType,
  uploadFn,
  maxCount = 10,
  accept = '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx',
  maxSizeMB = 20,
  label = '파일 업로드',
  description,
}: DocumentsUploadProps) {
  const [loading, setLoading] = useState(false)

  const beforeUpload = (file: RcFile) => {
    const isAllowedType = accept.split(',').some(ext => {
      const extension = ext.trim().toLowerCase()
      return file.name.toLowerCase().endsWith(extension)
    })
    if (!isAllowedType) {
      message.error(`허용된 파일 형식: ${accept}`)
      return false
    }
    const isLtMaxSize = file.size / 1024 / 1024 < maxSizeMB
    if (!isLtMaxSize) {
      message.error(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다`)
      return false
    }
    if (value.length >= maxCount) {
      message.error(`최대 ${maxCount}개까지 업로드 가능합니다`)
      return false
    }
    return true
  }

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    if (!entityId) {
      message.error('먼저 저장 후 파일을 업로드해주세요')
      return
    }

    const file = options.file as RcFile
    setLoading(true)
    try {
      const result = await uploadFn(file, entityId, documentType)
      const newDocument: DocumentItem = {
        file_name: result.fileName,
        file_url: result.url,
        file_size: result.fileSize,
        mime_type: result.mimeType,
      }
      onChange?.([...value, newDocument])
      message.success('파일이 업로드되었습니다')
    } catch (error) {
      message.error('업로드에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = (index: number) => {
    const newDocuments = value.filter((_, i) => i !== index)
    onChange?.(newDocuments)
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <Upload
          showUploadList={false}
          beforeUpload={beforeUpload}
          customRequest={handleUpload}
          accept={accept}
          disabled={loading || !entityId}
        >
          <Button icon={<UploadOutlined />} loading={loading} disabled={!entityId}>
            {label}
          </Button>
        </Upload>
        {!entityId && (
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            먼저 저장 후 파일을 업로드해주세요
          </Text>
        )}
        {description && (
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            {description}
          </Text>
        )}
      </div>

      {value.length > 0 && (
        <List
          size="small"
          bordered
          dataSource={value}
          renderItem={(item, index) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="delete"
                  title="파일을 삭제하시겠습니까?"
                  onConfirm={() => handleRemove(index)}
                  okText="삭제"
                  cancelText="취소"
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>,
              ]}
            >
              <Space>
                {getFileIcon(item.mime_type)}
                <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                  {item.file_name}
                </a>
                {item.file_size && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ({formatFileSize(item.file_size)})
                  </Text>
                )}
              </Space>
            </List.Item>
          )}
        />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <Spin size="small" />
          <Text type="secondary" style={{ marginLeft: 8 }}>업로드 중...</Text>
        </div>
      )}
    </div>
  )
}
