import { useState } from 'react'
import { Upload, Avatar, message, Spin } from 'antd'
import { PlusOutlined, ShopOutlined, DeleteOutlined } from '@ant-design/icons'
import type { UploadProps, RcFile } from 'antd/es/upload'

import { uploadVendorLogo } from '@/services/storageService'

interface LogoUploadProps {
  value?: string
  onChange?: (url: string | undefined) => void
  vendorId?: string
}

export function LogoUpload({ value, onChange, vendorId }: LogoUploadProps) {
  const [loading, setLoading] = useState(false)

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('이미지 파일만 업로드 가능합니다')
      return false
    }
    const isLt20M = file.size / 1024 / 1024 < 20
    if (!isLt20M) {
      message.error('이미지는 20MB 이하여야 합니다')
      return false
    }
    return true
  }

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const file = options.file as RcFile
    setLoading(true)
    try {
      const url = await uploadVendorLogo(file, vendorId)
      onChange?.(url)
      message.success('로고가 업로드되었습니다')
    } catch (error) {
      message.error('업로드에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    onChange?.(undefined)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Upload
        name="logo"
        showUploadList={false}
        beforeUpload={beforeUpload}
        customRequest={handleUpload}
        accept="image/*"
      >
        <div
          style={{
            width: 100,
            height: 100,
            border: '1px dashed #d9d9d9',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
            background: '#fafafa',
          }}
        >
          {loading ? (
            <Spin />
          ) : value ? (
            <Avatar
              src={value}
              size={98}
              shape="square"
              style={{ borderRadius: 6 }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#999' }}>
              <PlusOutlined style={{ fontSize: 24 }} />
              <div style={{ marginTop: 4, fontSize: 12 }}>로고 업로드</div>
            </div>
          )}
        </div>
      </Upload>
      {value && (
        <div
          onClick={handleRemove}
          style={{
            color: '#ff4d4f',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
          }}
        >
          <DeleteOutlined />
          삭제
        </div>
      )}
      {!value && (
        <div style={{ color: '#999', fontSize: 13 }}>
          <ShopOutlined style={{ marginRight: 4 }} />
          20MB 이하 이미지
        </div>
      )}
    </div>
  )
}
