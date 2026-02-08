import { useRef, useMemo, useCallback } from 'react'
import { Form, Input, Switch, Button, Card, Typography, Radio, message } from 'antd'
import { ArrowLeftOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import type { LegalDocument, LegalDocumentCategory } from '@/types'
import { LEGAL_DOCUMENT_CATEGORY_OPTIONS } from '@/constants'
import { uploadImage } from '@/services/storageService'

const { Text } = Typography

interface LegalDocumentFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<LegalDocument>
  onSubmit: (values: Record<string, unknown>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

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

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent',
  'color', 'background',
  'align',
  'link',
  'image',
]

export function LegalDocumentForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: LegalDocumentFormProps) {
  const [form] = Form.useForm()
  const quillRef = useRef<ReactQuill>(null)

  // 이미지 업로드 핸들러
  const imageHandler = useCallback(() => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        message.error('이미지 크기는 5MB 이하만 가능합니다')
        return
      }

      try {
        message.loading({ content: '이미지 업로드 중...', key: 'upload' })
        const imageUrl = await uploadImage(file, 'legal-documents')
        message.success({ content: '이미지 업로드 완료', key: 'upload' })

        const quill = quillRef.current?.getEditor()
        if (quill) {
          const range = quill.getSelection(true)
          quill.insertEmbed(range.index, 'image', imageUrl)
          quill.setSelection(range.index + 1)
        }
      } catch (error) {
        console.error('Image upload failed:', error)
        message.error({ content: '이미지 업로드에 실패했습니다', key: 'upload' })
      }
    }
  }, [])

  // quillModules를 useMemo로 감싸서 이미지 핸들러 연결
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), [imageHandler])

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values)
    })
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        is_visible: true,
        category: 'terms',
        ...initialValues,
      }}
      className="compact-form"
    >
      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<FileTextOutlined />}
          title="문서 정보"
          description="약관/정책 문서의 카테고리와 내용을 입력합니다"
        />

        <Form.Item
          name="category"
          label="카테고리"
          rules={[{ required: true, message: '카테고리를 선택해주세요' }]}
        >
          <Radio.Group disabled={mode === 'edit'}>
            {LEGAL_DOCUMENT_CATEGORY_OPTIONS.map((option) => (
              <Radio.Button key={option.value} value={option.value as LegalDocumentCategory}>
                {option.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="title"
          label="제목"
          rules={[{ required: true, message: '제목을 입력해주세요' }]}
          extra="버전명이나 시행일 등을 포함하면 관리에 용이합니다 (예: 이용약관 v2.0 - 2025.01.30 시행)"
        >
          <Input placeholder="문서 제목" style={{ width: '100%', maxWidth: 600 }} />
        </Form.Item>

        <Form.Item
          name="content"
          label="내용"
          rules={[
            {
              required: true,
              validator: (_, value) => {
                // ReactQuill은 빈 상태에서도 <p><br></p> 등을 반환하므로 실제 텍스트가 있는지 확인
                const strippedContent = value?.replace(/<[^>]*>/g, '').trim()
                if (!strippedContent) {
                  return Promise.reject('내용을 입력해주세요')
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <ReactQuill
            ref={quillRef}
            theme="snow"
            modules={quillModules}
            formats={quillFormats}
            placeholder="약관/정책 내용을 입력해주세요"
            className="legal-document-editor"
          />
        </Form.Item>
        <style>{`
          .legal-document-editor .ql-container {
            min-height: 300px;
          }
          .legal-document-editor .ql-editor {
            min-height: 300px;
          }
        `}</style>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<SettingOutlined />}
          title="게시 설정"
          description="문서의 공개 여부를 설정합니다"
        />

        <Form.Item
          name="is_visible"
          label="공개 여부"
          valuePropName="checked"
          extra="비공개 시 사용자에게 노출되지 않습니다. 미리 작성해두고 나중에 공개할 수 있습니다."
        >
          <Switch defaultChecked />
        </Form.Item>
      </Card>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onCancel}>
          취소
        </Button>
        <Button type="primary" onClick={handleSubmit} loading={isSubmitting}>
          {mode === 'create' ? '등록' : '저장'}
        </Button>
      </div>
    </Form>
  )
}
