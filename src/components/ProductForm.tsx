import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Modal,
  Select,
  Upload,
  Switch,
  Space,
  TimePicker,
  Checkbox,
  Radio,
  Tag,
  message,
} from 'antd'
import {
  ArrowLeftOutlined,
  ShoppingOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  PictureOutlined,
  PlusOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { DaumPostcodeEmbed, type Address } from 'react-daum-postcode'
import type { UploadProps } from 'antd/es/upload'
import type { RcFile } from 'antd/es/upload/interface'
import dayjs from 'dayjs'

import { getBusinessOwners, getCategoriesFlat } from '@/services/productService'
import { uploadProductImage } from '@/services/storageService'
import { REGION_OPTIONS, DAY_OF_WEEK_LABEL, TIME_SLOT_INTERVAL_OPTIONS } from '@/constants'
import type { Product, TimeSlot, TimeSlotMode, TimeSlotInterval } from '@/types'

const { Text } = Typography
const { TextArea } = Input

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18, color: '#1677ff' }}>{icon}</span>
        <Text strong style={{ fontSize: 16 }}>
          {title}
        </Text>
      </div>
      <Text type="secondary" style={{ fontSize: 13 }}>
        {description}
      </Text>
    </div>
  )
}

interface ProductFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<Product>
  productId?: string
  onSubmit: (values: Record<string, unknown>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

interface OptionItem {
  key: string
  name: string
  price: number
  is_required: boolean
}

interface TimeSlotItem {
  day: number
  enabled: boolean
  start: string
  end: string
  mode: TimeSlotMode
  interval: TimeSlotInterval
  customSlots: string[]
}

export function ProductForm({
  mode,
  initialValues,
  productId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ProductFormProps) {
  const [form] = Form.useForm()
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false)
  const isEdit = mode === 'edit'

  // 썸네일
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(initialValues?.thumbnail || '')
  const [thumbnailUploading, setThumbnailUploading] = useState(false)

  // 추가 이미지
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialValues?.images?.map((img) => img.image_url) || []
  )
  const [imageUploading, setImageUploading] = useState(false)

  // 옵션
  const [options, setOptions] = useState<OptionItem[]>(
    initialValues?.options?.map((opt, idx) => ({
      key: opt.id || `opt_${idx}`,
      name: opt.name,
      price: opt.price,
      is_required: opt.is_required,
    })) || []
  )

  // 운영 시간
  const [timeSlots, setTimeSlots] = useState<TimeSlotItem[]>(() => {
    const defaultSlots: TimeSlotItem[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      day,
      enabled: false,
      start: '09:00',
      end: '18:00',
      mode: 'auto' as TimeSlotMode,
      interval: 60 as TimeSlotInterval,
      customSlots: [],
    }))

    if (initialValues?.available_time_slots) {
      initialValues.available_time_slots.forEach((slot) => {
        const idx = defaultSlots.findIndex((s) => s.day === slot.day)
        if (idx !== -1) {
          defaultSlots[idx] = {
            ...defaultSlots[idx],
            enabled: true,
            start: slot.start,
            end: slot.end,
            mode: slot.mode || 'auto',
            interval: slot.interval || 60,
            customSlots: slot.customSlots || [],
          }
        }
      })
    }

    return defaultSlots
  })

  // 사업주 목록
  const { data: vendors } = useQuery({
    queryKey: ['businessOwners'],
    queryFn: getBusinessOwners,
  })

  // 카테고리 목록
  const { data: categories } = useQuery({
    queryKey: ['categoriesFlat'],
    queryFn: getCategoriesFlat,
  })

  const handlePostcodeComplete = (data: Address) => {
    form.setFieldsValue({
      address: data.roadAddress || data.jibunAddress,
    })
    setIsPostcodeOpen(false)
  }

  // 썸네일 업로드
  const handleThumbnailUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    setThumbnailUploading(true)
    try {
      const url = await uploadProductImage(file as RcFile, productId)
      setThumbnailUrl(url)
      onSuccess?.({})
    } catch (error) {
      message.error('이미지 업로드에 실패했습니다')
      onError?.(error as Error)
    } finally {
      setThumbnailUploading(false)
    }
  }

  // 추가 이미지 업로드
  const handleImageUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    setImageUploading(true)
    try {
      const url = await uploadProductImage(file as RcFile, productId)
      setImageUrls((prev) => [...prev, url])
      onSuccess?.({})
    } catch (error) {
      message.error('이미지 업로드에 실패했습니다')
      onError?.(error as Error)
    } finally {
      setImageUploading(false)
    }
  }

  // 이미지 삭제
  const handleImageRemove = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  // 옵션 추가
  const addOption = () => {
    setOptions([
      ...options,
      { key: `opt_${Date.now()}`, name: '', price: 0, is_required: false },
    ])
  }

  // 옵션 삭제
  const removeOption = (key: string) => {
    setOptions(options.filter((opt) => opt.key !== key))
  }

  // 옵션 수정
  const updateOption = (key: string, field: keyof OptionItem, value: unknown) => {
    setOptions(
      options.map((opt) => (opt.key === key ? { ...opt, [field]: value } : opt))
    )
  }

  // 시간대 수정
  const updateTimeSlot = (day: number, field: keyof TimeSlotItem, value: unknown) => {
    setTimeSlots(
      timeSlots.map((slot) => (slot.day === day ? { ...slot, [field]: value } : slot))
    )
  }

  // 자동 시간 슬롯 생성
  const generateTimeSlots = (start: string, end: string, interval: number): string[] => {
    const slots: string[] = []
    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)

    let currentMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    while (currentMinutes < endMinutes) {
      const hour = Math.floor(currentMinutes / 60)
      const min = currentMinutes % 60
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
      currentMinutes += interval
    }

    return slots
  }

  // 커스텀 슬롯 추가
  const addCustomSlot = (day: number, time: string) => {
    setTimeSlots((slots) =>
      slots.map((slot) =>
        slot.day === day && !slot.customSlots.includes(time)
          ? { ...slot, customSlots: [...slot.customSlots, time].sort() }
          : slot
      )
    )
  }

  // 커스텀 슬롯 제거
  const removeCustomSlot = (day: number, time: string) => {
    setTimeSlots((slots) =>
      slots.map((slot) =>
        slot.day === day
          ? { ...slot, customSlots: slot.customSlots.filter((t) => t !== time) }
          : slot
      )
    )
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 썸네일 필수 검증
      if (!thumbnailUrl) {
        message.error('썸네일 이미지를 등록해주세요')
        return
      }

      // 운영 시간 변환
      const availableTimeSlots: TimeSlot[] = timeSlots
        .filter((slot) => slot.enabled)
        .map((slot) => ({
          day: slot.day,
          start: slot.start,
          end: slot.end,
          mode: slot.mode,
          interval: slot.mode === 'auto' ? slot.interval : undefined,
          customSlots: slot.mode === 'custom' ? slot.customSlots : undefined,
        }))

      // 옵션 변환
      const productOptions = options
        .filter((opt) => opt.name.trim())
        .map((opt, idx) => ({
          name: opt.name,
          price: opt.price,
          is_required: opt.is_required,
          sort_order: idx,
        }))

      onSubmit({
        ...values,
        thumbnail: thumbnailUrl,
        images: imageUrls,
        options: productOptions,
        available_time_slots: availableTimeSlots.length > 0 ? availableTimeSlots : null,
      })
    } catch {
      // validation error
    }
  }

  // 카테고리 옵션
  const categoryOptions =
    categories?.map((cat) => ({
      value: cat.id,
      label: `${'　'.repeat(cat.depth - 1)}${cat.name}`,
    })) || []

  return (
    <>
      <style>{`
        .compact-form .ant-form-item { margin-bottom: 16px; }
        .compact-form .ant-row > .ant-col .ant-form-item { margin-bottom: 0; }
        .compact-form .ant-row { margin-bottom: 12px; }
        .compact-form .ant-card-body > *:last-child { margin-bottom: 0; }
      `}</style>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...initialValues,
          min_participants: initialValues?.min_participants ?? 1,
          is_visible: initialValues?.is_visible ?? true,
        }}
        style={{ width: '100%' }}
        className="compact-form"
        requiredMark={(label, { required }) => (
          <>
            {label}
            {required && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>}
          </>
        )}
      >
        {/* 기본 정보 */}
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<ShoppingOutlined />}
            title="기본 정보"
            description="상품의 기본 정보를 입력해주세요"
          />

          <Form.Item
            name="business_owner_id"
            label="사업주"
            rules={[{ required: true, message: '사업주를 선택하세요' }]}
          >
            <Select
              placeholder="사업주 선택"
              style={{ width: 280 }}
              showSearch
              optionFilterProp="label"
              disabled={isEdit}
              options={vendors?.map((v) => ({ value: v.id, label: v.name })) || []}
            />
          </Form.Item>

          <Row gutter={24}>
            <Col>
              <Form.Item
                name="name"
                label="상품명"
                rules={[{ required: true, message: '상품명을 입력하세요' }]}
              >
                <Input placeholder="예: 도자기 만들기 체험" style={{ width: 320 }} />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="category_id" label="카테고리">
                <Select
                  placeholder="카테고리 선택"
                  style={{ width: 200 }}
                  allowClear
                  options={categoryOptions}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="summary" label="간단 설명" extra="목록에서 상품명 아래에 표시됩니다">
            <Input placeholder="한 줄 요약 (최대 100자)" style={{ width: 480 }} maxLength={100} />
          </Form.Item>

          <Row gutter={24} align="middle">
            <Col>
              <Form.Item name="is_visible" label="노출 여부" valuePropName="checked">
                <Switch checkedChildren="노출" unCheckedChildren="숨김" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 가격 정보 */}
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<DollarOutlined />}
            title="가격 정보"
            description="정가와 판매가를 입력해주세요. 판매가가 정가보다 낮으면 할인율이 자동 계산됩니다."
          />

          <Row gutter={24}>
            <Col>
              <Form.Item
                name="original_price"
                label="정가"
                rules={[{ required: true, message: '정가를 입력하세요' }]}
              >
                <InputNumber
                  min={0}
                  step={1000}
                  style={{ width: 160 }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/,/g, '') || 0) as 0}
                  addonAfter="원"
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="sale_price"
                label="판매가"
                rules={[{ required: true, message: '판매가를 입력하세요' }]}
              >
                <InputNumber
                  min={0}
                  step={1000}
                  style={{ width: 160 }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/,/g, '') || 0) as 0}
                  addonAfter="원"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 체험 정보 */}
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<EnvironmentOutlined />}
            title="체험 정보"
            description="체험 인원, 소요시간, 장소 정보를 입력해주세요"
          />

          <Row gutter={24}>
            <Col>
              <Form.Item
                name="min_participants"
                label="최소 인원"
                rules={[{ required: true, message: '최소 인원을 입력하세요' }]}
              >
                <InputNumber min={1} style={{ width: 100 }} addonAfter="명" />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="max_participants"
                label="최대 인원"
                rules={[{ required: true, message: '최대 인원을 입력하세요' }]}
              >
                <InputNumber min={1} style={{ width: 100 }} addonAfter="명" />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="duration_minutes" label="소요 시간">
                <InputNumber min={0} step={30} style={{ width: 120 }} addonAfter="분" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col>
              <Form.Item name="region" label="지역">
                <Select
                  placeholder="지역 선택"
                  style={{ width: 120 }}
                  allowClear
                  options={REGION_OPTIONS}
                />
              </Form.Item>
            </Col>
            <Col flex="auto">
              <Form.Item label="주소">
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="address" noStyle>
                    <Input placeholder="주소검색을 클릭하세요" style={{ width: 400 }} readOnly />
                  </Form.Item>
                  <Button onClick={() => setIsPostcodeOpen(true)}>주소검색</Button>
                </Space.Compact>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address_detail" label="상세주소" extra="건물명, 층수, 호수 등을 입력하세요">
            <Input placeholder="예: 3층 301호" style={{ width: 400 }} />
          </Form.Item>
        </Card>

        {/* 이미지 */}
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<PictureOutlined />}
            title="이미지"
            description="썸네일은 필수입니다. 추가 이미지는 최대 10장까지 등록할 수 있습니다."
          />

          <Form.Item label="썸네일" required extra="권장 크기: 800x800px">
            <Upload
              listType="picture-card"
              showUploadList={false}
              customRequest={handleThumbnailUpload}
              accept="image/*"
            >
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="썸네일"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div>
                  {thumbnailUploading ? '업로드중...' : <PlusOutlined />}
                  <div style={{ marginTop: 8 }}>썸네일</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item label="추가 이미지" extra="상품 상세페이지에 표시됩니다">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {imageUrls.map((url, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    width: 104,
                    height: 104,
                    border: '1px dashed #d9d9d9',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={url}
                    alt={`이미지 ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleImageRemove(index)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(255,255,255,0.9)',
                    }}
                  />
                </div>
              ))}
              {imageUrls.length < 10 && (
                <Upload
                  listType="picture-card"
                  showUploadList={false}
                  customRequest={handleImageUpload}
                  accept="image/*"
                >
                  <div>
                    {imageUploading ? '업로드중...' : <PlusOutlined />}
                    <div style={{ marginTop: 8 }}>추가</div>
                  </div>
                </Upload>
              )}
            </div>
          </Form.Item>
        </Card>

        {/* 옵션 */}
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<UnorderedListOutlined />}
            title="옵션"
            description="인원별 가격, 추가 옵션 등을 설정할 수 있습니다"
          />

          {options.map((option) => (
            <Row key={option.key} gutter={16} align="middle" style={{ marginBottom: 12 }}>
              <Col>
                <Input
                  placeholder="옵션명 (예: 성인)"
                  value={option.name}
                  onChange={(e) => updateOption(option.key, 'name', e.target.value)}
                  style={{ width: 200 }}
                />
              </Col>
              <Col>
                <InputNumber
                  placeholder="가격"
                  value={option.price}
                  onChange={(value) => updateOption(option.key, 'price', value || 0)}
                  min={0}
                  step={1000}
                  style={{ width: 140 }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/,/g, '') as unknown as number}
                  addonAfter="원"
                />
              </Col>
              <Col>
                <Checkbox
                  checked={option.is_required}
                  onChange={(e) => updateOption(option.key, 'is_required', e.target.checked)}
                >
                  필수
                </Checkbox>
              </Col>
              <Col>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeOption(option.key)}
                />
              </Col>
            </Row>
          ))}

          <Button type="dashed" icon={<PlusOutlined />} onClick={addOption}>
            옵션 추가
          </Button>
        </Card>

        {/* 운영 시간 */}
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<ClockCircleOutlined />}
            title="운영 시간"
            description="요일별 운영 시간을 설정해주세요"
          />

          {/* 벌크 수정 영역 */}
          <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
            <Row gutter={16} align="middle" style={{ marginBottom: 8 }}>
              <Col>
                <Button
                  size="small"
                  onClick={() => {
                    const allEnabled = timeSlots.every((s) => s.enabled)
                    setTimeSlots(timeSlots.map((s) => ({ ...s, enabled: !allEnabled })))
                  }}
                >
                  {timeSlots.every((s) => s.enabled) ? '전체 해제' : '전체 선택'}
                </Button>
              </Col>
              <Col>
                <Space size="small">
                  <Text type="secondary" style={{ fontSize: 13 }}>일괄 시간:</Text>
                  <TimePicker
                    size="small"
                    format="HH:mm"
                    minuteStep={30}
                    defaultValue={dayjs('09:00', 'HH:mm')}
                    onChange={(time) => {
                      if (time) {
                        setTimeSlots(timeSlots.map((s) => ({ ...s, start: time.format('HH:mm') })))
                      }
                    }}
                    placeholder="시작"
                    style={{ width: 90 }}
                  />
                  <span>~</span>
                  <TimePicker
                    size="small"
                    format="HH:mm"
                    minuteStep={30}
                    defaultValue={dayjs('18:00', 'HH:mm')}
                    onChange={(time) => {
                      if (time) {
                        setTimeSlots(timeSlots.map((s) => ({ ...s, end: time.format('HH:mm') })))
                      }
                    }}
                    placeholder="종료"
                    style={{ width: 90 }}
                  />
                </Space>
              </Col>
              <Col>
                <Button
                  size="small"
                  onClick={() => {
                    // 평일(월~금)만 선택
                    setTimeSlots(timeSlots.map((s) => ({
                      ...s,
                      enabled: s.day >= 1 && s.day <= 5,
                    })))
                  }}
                >
                  평일만
                </Button>
              </Col>
              <Col>
                <Button
                  size="small"
                  onClick={() => {
                    // 주말(토,일)만 선택
                    setTimeSlots(timeSlots.map((s) => ({
                      ...s,
                      enabled: s.day === 0 || s.day === 6,
                    })))
                  }}
                >
                  주말만
                </Button>
              </Col>
            </Row>
            <Row gutter={16} align="middle">
              <Col>
                <Space size="small">
                  <Text type="secondary" style={{ fontSize: 13 }}>일괄 슬롯:</Text>
                  <Select
                    size="small"
                    style={{ width: 100 }}
                    placeholder="모드"
                    onChange={(mode: TimeSlotMode) => {
                      setTimeSlots(timeSlots.map((s) => ({ ...s, mode })))
                    }}
                    options={[
                      { value: 'auto', label: '자동 생성' },
                      { value: 'custom', label: '직접 지정' },
                    ]}
                  />
                  <Select
                    size="small"
                    style={{ width: 80 }}
                    placeholder="간격"
                    onChange={(interval: TimeSlotInterval) => {
                      setTimeSlots(timeSlots.map((s) => ({ ...s, interval })))
                    }}
                    options={TIME_SLOT_INTERVAL_OPTIONS}
                  />
                </Space>
              </Col>
            </Row>
          </div>

          {timeSlots.map((slot) => (
            <div
              key={slot.day}
              style={{
                marginBottom: 16,
                padding: 12,
                border: slot.enabled ? '1px solid #d9d9d9' : '1px dashed #d9d9d9',
                borderRadius: 6,
                background: slot.enabled ? '#fff' : '#fafafa',
              }}
            >
              <Row gutter={16} align="middle">
                <Col style={{ width: 80 }}>
                  <Checkbox
                    checked={slot.enabled}
                    onChange={(e) => updateTimeSlot(slot.day, 'enabled', e.target.checked)}
                  >
                    <Text strong={slot.enabled}>{DAY_OF_WEEK_LABEL[slot.day]}</Text>
                  </Checkbox>
                </Col>
                <Col>
                  <TimePicker
                    value={dayjs(slot.start, 'HH:mm')}
                    format="HH:mm"
                    minuteStep={30}
                    disabled={!slot.enabled}
                    onChange={(time) =>
                      updateTimeSlot(slot.day, 'start', time?.format('HH:mm') || '09:00')
                    }
                    size="small"
                  />
                </Col>
                <Col>~</Col>
                <Col>
                  <TimePicker
                    value={dayjs(slot.end, 'HH:mm')}
                    format="HH:mm"
                    minuteStep={30}
                    disabled={!slot.enabled}
                    onChange={(time) =>
                      updateTimeSlot(slot.day, 'end', time?.format('HH:mm') || '18:00')
                    }
                    size="small"
                  />
                </Col>
              </Row>

              {slot.enabled && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e8e8e8' }}>
                  <Row gutter={16} align="middle">
                    <Col>
                      <Text type="secondary" style={{ fontSize: 13 }}>예약 시간:</Text>
                    </Col>
                    <Col>
                      <Radio.Group
                        value={slot.mode}
                        onChange={(e) => updateTimeSlot(slot.day, 'mode', e.target.value)}
                        size="small"
                      >
                        <Radio value="auto">자동 생성</Radio>
                        <Radio value="custom">직접 지정</Radio>
                      </Radio.Group>
                    </Col>
                  </Row>

                  {slot.mode === 'auto' && (
                    <Row gutter={16} align="middle" style={{ marginTop: 8 }}>
                      <Col>
                        <Space size="small">
                          <Text type="secondary" style={{ fontSize: 13 }}>간격:</Text>
                          <Select
                            value={slot.interval}
                            onChange={(value) => updateTimeSlot(slot.day, 'interval', value)}
                            size="small"
                            style={{ width: 80 }}
                            options={TIME_SLOT_INTERVAL_OPTIONS}
                          />
                        </Space>
                      </Col>
                      <Col>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          미리보기: {generateTimeSlots(slot.start, slot.end, slot.interval).slice(0, 6).join(', ')}
                          {generateTimeSlots(slot.start, slot.end, slot.interval).length > 6 && ' ...'}
                        </Text>
                      </Col>
                    </Row>
                  )}

                  {slot.mode === 'custom' && (
                    <div style={{ marginTop: 8 }}>
                      <Space wrap size={[4, 4]}>
                        {slot.customSlots.map((time) => (
                          <Tag
                            key={time}
                            closable
                            onClose={() => removeCustomSlot(slot.day, time)}
                            style={{ margin: 0 }}
                          >
                            {time}
                          </Tag>
                        ))}
                        <TimePicker
                          format="HH:mm"
                          minuteStep={30}
                          placeholder="시간 추가"
                          size="small"
                          style={{ width: 100 }}
                          onChange={(time) => {
                            if (time) {
                              addCustomSlot(slot.day, time.format('HH:mm'))
                            }
                          }}
                          value={null}
                        />
                      </Space>
                      {slot.customSlots.length === 0 && (
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                          예약 가능한 시간을 추가해주세요
                        </Text>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </Card>

        {/* 상세 설명 */}
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<ShoppingOutlined />}
            title="상세 설명"
            description="상품의 상세한 설명을 입력해주세요"
          />

          <Form.Item name="description">
            <TextArea rows={10} placeholder="상품 상세 설명을 입력하세요" />
          </Form.Item>
        </Card>

        {/* 버튼 영역 */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={onCancel}>
            취소
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={isSubmitting}>
            {isEdit ? '저장' : '등록'}
          </Button>
        </div>
      </Form>

      {/* 주소 검색 모달 */}
      <Modal
        title="주소검색"
        open={isPostcodeOpen}
        onCancel={() => setIsPostcodeOpen(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <DaumPostcodeEmbed onComplete={handlePostcodeComplete} style={{ height: 450 }} />
      </Modal>
    </>
  )
}
