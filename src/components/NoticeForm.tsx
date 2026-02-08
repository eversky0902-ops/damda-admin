import { useRef, useMemo, useCallback } from 'react'
import { Form, Input, Switch, Button, Card, Typography, message } from 'antd'
import { ArrowLeftOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import type { Notice } from '@/types'
import { uploadImage } from '@/services/storageService'

const { Text } = Typography

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent',
  'color', 'background',
  'align',
  'link',
  'image',
]

interface NoticeFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<Notice>
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

export function NoticeForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: NoticeFormProps) {
  const [form] = Form.useForm()
  const quillRef = useRef<ReactQuill>(null)

  const imageHandler = useCallback(() => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        message.error('이미지 크기는 5MB 이하만 가능합니다')
        return
      }

      try {
        message.loading({ content: '이미지 업로드 중...', key: 'upload' })
        const imageUrl = await uploadImage(file, 'notices')
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
        is_pinned: false,
        is_visible: true,
        ...initialValues,
      }}
      className="compact-form"
    >
      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<FileTextOutlined />}
          title="공지사항 내용"
          description="공지사항 제목과 내용을 입력합니다"
        />

        <Form.Item
          name="title"
          label="제목"
          rules={[{ required: true, message: '제목을 입력해주세요' }]}
        >
          <Input placeholder="공지사항 제목" style={{ width: '100%', maxWidth: 600 }} />
        </Form.Item>

        <Form.Item
          name="content"
          label="내용"
          rules={[
            {
              required: true,
              message: '내용을 입력해주세요',
              validator: (_, value) => {
                const stripped = value?.replace(/<[^>]*>/g, '').trim()
                if (!stripped) return Promise.reject('내용을 입력해주세요')
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
            placeholder="공지사항 내용을 입력해주세요"
            className="notice-editor"
          />
        </Form.Item>
        <style>{`
          .notice-editor .ql-container {
            min-height: 300px;
          }
          .notice-editor .ql-editor {
            min-height: 300px;
          }
          .notice-editor .ql-editor img {
            max-width: 100%;
            height: auto;
          }
        `}</style>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<SettingOutlined />}
          title="게시 설정"
          description="공지사항의 노출 설정을 관리합니다"
        />

        <div style={{ display: 'flex', gap: 48 }}>
          <Form.Item
            name="is_pinned"
            label="상단 고정"
            valuePropName="checked"
            extra="활성화하면 목록 상단에 고정됩니다"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="is_visible"
            label="공개 여부"
            valuePropName="checked"
            extra="비공개 시 사용자에게 노출되지 않습니다"
          >
            <Switch />
          </Form.Item>
        </div>
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
