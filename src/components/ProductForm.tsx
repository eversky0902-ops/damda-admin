import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
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
  Cascader,
  DatePicker,
} from 'antd'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
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
  CalendarOutlined,
  CarOutlined,
  CloudOutlined,
  CoffeeOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  HomeOutlined,
  RestOutlined,
  SkinOutlined,
  SmileOutlined,
} from '@ant-design/icons'
import { DaumPostcodeEmbed, type Address } from 'react-daum-postcode'
import type { UploadProps } from 'antd/es/upload'
import type { RcFile } from 'antd/es/upload/interface'
import dayjs from 'dayjs'

import {
  getBusinessOwners,
  getCategories,
  MAX_PRODUCT_DETAIL_IMAGES,
  MAX_PRODUCTS_PER_BUSINESS_OWNER,
} from '@/services/productService'
import { getBusinessesByOwner } from '@/services/businessService'
import { uploadProductImage, uploadImage } from '@/services/storageService'
import { REGION_CASCADER_OPTIONS, DAY_OF_WEEK_LABEL, TIME_SLOT_INTERVAL_OPTIONS } from '@/constants'
import type { Product, TimeSlot, TimeSlotMode, TimeSlotInterval, Category } from '@/types'

const { Text } = Typography

const FACILITY_SERVICE_OPTIONS = [
  { code: 'large_bus_parking', label: '대형버스 주차 가능', icon: <CarOutlined /> },
  { code: 'lunchbox_allowed', label: '도시락 지참', icon: <CoffeeOutlined /> },
  { code: 'meal_space', label: '식사 공간', icon: <RestOutlined /> },
  { code: 'restroom', label: '화장실', icon: <HomeOutlined /> },
  { code: 'indoor_waiting_area', label: '실내 대기실', icon: <DashboardOutlined /> },
  { code: 'operates_in_rain', label: '우천 시 진행', icon: <CloudOutlined /> },
  { code: 'nursing_room', label: '수유실', icon: <SmileOutlined /> },
  { code: 'diaper_changing_station', label: '기저귀 교환대', icon: <SkinOutlined /> },
  { code: 'passenger_car_parking', label: '승용차 주차', icon: <CarOutlined /> },
  { code: 'toddler_lounge', label: '유아 휴게실', icon: <SmileOutlined /> },
  { code: 'drinking_water', label: '식수대', icon: <CoffeeOutlined /> },
  { code: 'outdoor_activity_area', label: '야외 활동장', icon: <ExperimentOutlined /> },
] as const

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'indent',
  'color', 'background',
  'align',
  'link',
  'image',
]

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
  const selectedBusinessOwnerId = Form.useWatch('business_owner_id', form)
  const selectedBusinessId = Form.useWatch('business_id', form)
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false)
  const isEdit = mode === 'edit'
  const quillRef = useRef<ReactQuill>(null)

  // HTML 에디터 이미지 업로드 핸들러
  const descriptionImageHandler = useCallback(() => {
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
        const imageUrl = await uploadImage(file, 'product-descriptions')
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

  // quillModules
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
        image: descriptionImageHandler,
      },
    },
  }), [descriptionImageHandler])

  // 썸네일
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(initialValues?.thumbnail || '')
  const [thumbnailUploading, setThumbnailUploading] = useState(false)

  // 추가 이미지
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialValues?.images?.map((img) => img.image_url) || []
  )
  const [imageUploadCount, setImageUploadCount] = useState(0)
  const imageUploading = imageUploadCount > 0

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

  // 휴무일 (임시 휴무)
  interface UnavailableDateItem {
    date: string // YYYY-MM-DD
    reason: string
  }
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDateItem[]>(
    initialValues?.unavailable_dates?.map((d: { unavailable_date: string; reason: string | null }) => ({
      date: d.unavailable_date,
      reason: d.reason || '',
    })) || []
  )

  // 일괄 커스텀 슬롯 (bulk edit용)
  const [bulkCustomSlots, setBulkCustomSlots] = useState<string[]>([])

  // 사업주 목록
  const { data: vendors } = useQuery({
    queryKey: ['businessOwners'],
    queryFn: getBusinessOwners,
  })
  const selectedVendor = vendors?.find((vendor) => vendor.id === selectedBusinessOwnerId)
  const { data: businesses } = useQuery({
    queryKey: ['businessesByOwner', selectedBusinessOwnerId],
    queryFn: () => getBusinessesByOwner(selectedBusinessOwnerId),
    enabled: !!selectedBusinessOwnerId,
  })
  const selectedBusiness = businesses?.find((business) => business.id === selectedBusinessId)

  // 카테고리 목록 (계층 구조)
  const { data: categories } = useQuery({
    queryKey: ['categoriesTree'],
    queryFn: getCategories,
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

  // 추가 이미지 업로드 (다중)
  const handleImageUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    setImageUploadCount((count) => count + 1)
    try {
      const url = await uploadProductImage(file as RcFile, productId)
      setImageUrls((prev) => [...prev, url].slice(0, MAX_PRODUCT_DETAIL_IMAGES))
      onSuccess?.({})
    } catch (error) {
      message.error('이미지 업로드에 실패했습니다')
      onError?.(error as Error)
    } finally {
      setImageUploadCount((count) => Math.max(0, count - 1))
    }
  }

  const validateImageSelection: UploadProps['beforeUpload'] = (file, fileList) => {
    const remaining = MAX_PRODUCT_DETAIL_IMAGES - imageUrls.length
    const selectedIndex = fileList.findIndex((selectedFile) => selectedFile.uid === file.uid)

    if (selectedIndex >= remaining) {
      if (selectedIndex === remaining) {
        message.warning(`상품 상세 이미지는 최대 ${MAX_PRODUCT_DETAIL_IMAGES}장까지 등록할 수 있습니다`)
      }
      return Upload.LIST_IGNORE
    }

    return true
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

  // 일괄 커스텀 슬롯 추가
  const addBulkCustomSlot = (time: string) => {
    if (!bulkCustomSlots.includes(time)) {
      setBulkCustomSlots((prev) => [...prev, time].sort())
    }
  }

  // 일괄 커스텀 슬롯 제거
  const removeBulkCustomSlot = (time: string) => {
    setBulkCustomSlots((prev) => prev.filter((t) => t !== time))
  }

  // 일괄 커스텀 슬롯을 활성화된 요일에 적용
  const applyBulkCustomSlots = () => {
    if (bulkCustomSlots.length === 0) {
      message.warning('적용할 시간을 먼저 추가해주세요')
      return
    }
    setTimeSlots((slots) =>
      slots.map((slot) =>
        slot.enabled && slot.mode === 'custom'
          ? {
              ...slot,
              customSlots: [...new Set([...slot.customSlots, ...bulkCustomSlots])].sort(),
            }
          : slot
      )
    )
    message.success('선택된 요일에 시간이 추가되었습니다')
  }

  // 일괄 커스텀 슬롯을 활성화된 요일에서 제거
  const removeBulkCustomSlotsFromAll = () => {
    if (bulkCustomSlots.length === 0) {
      message.warning('제거할 시간을 먼저 추가해주세요')
      return
    }
    setTimeSlots((slots) =>
      slots.map((slot) =>
        slot.enabled && slot.mode === 'custom'
          ? {
              ...slot,
              customSlots: slot.customSlots.filter((t) => !bulkCustomSlots.includes(t)),
            }
          : slot
      )
    )
    message.success('선택된 요일에서 시간이 제거되었습니다')
  }

  // 휴무일 추가
  const addUnavailableDate = (date: string) => {
    if (!unavailableDates.find((d) => d.date === date)) {
      setUnavailableDates((prev) => [...prev, { date, reason: '' }].sort((a, b) => a.date.localeCompare(b.date)))
    }
  }

  // 휴무일 제거
  const removeUnavailableDate = (date: string) => {
    setUnavailableDates((prev) => prev.filter((d) => d.date !== date))
  }

  // 휴무일 사유 수정
  const updateUnavailableDateReason = (date: string, reason: string) => {
    setUnavailableDates((prev) =>
      prev.map((d) => (d.date === date ? { ...d, reason } : d))
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

      // category_path에서 마지막 요소를 category_id로 사용
      const categoryPath = values.category_path as string[] | undefined
      const category_id = categoryPath && categoryPath.length > 0 ? categoryPath[categoryPath.length - 1] : null

      // category_path는 제외하고 category_id 추가
      const restValues = { ...values }
      delete restValues.category_path
      const selectedFacilityCodes = (values.facility_service_codes as string[] | undefined) ?? []
      delete restValues.facility_service_codes
      restValues.facility_services = Object.fromEntries(
        FACILITY_SERVICE_OPTIONS.map(({ code }) => [code, selectedFacilityCodes.includes(code)])
      )
      restValues.booking_start_date = values.booking_start_date ? dayjs(values.booking_start_date).format('YYYY-MM-DD') : null
      restValues.booking_end_date = values.booking_end_date ? dayjs(values.booking_end_date).format('YYYY-MM-DD') : null

      onSubmit({
        ...restValues,
        category_id,
        thumbnail: thumbnailUrl,
        images: imageUrls,
        options: productOptions,
        available_time_slots: availableTimeSlots.length > 0 ? availableTimeSlots : null,
        unavailable_dates: unavailableDates.length > 0 ? unavailableDates : null,
      })
    } catch {
      // validation error
    }
  }

  // Cascader용 카테고리 옵션 변환
  interface CascaderOption {
    value: string
    label: string
    children?: CascaderOption[]
  }

  const convertToCascaderOptions = (cats: Category[]): CascaderOption[] => {
    return cats.map((cat) => ({
      value: cat.id,
      label: cat.name,
      children: cat.children && cat.children.length > 0 ? convertToCascaderOptions(cat.children) : undefined,
    }))
  }

  // 카테고리 ID로 경로(path) 찾기 (수정 모드에서 초기값 설정용)
  const findCategoryPath = (cats: Category[], targetId: string, path: string[] = []): string[] | null => {
    for (const cat of cats) {
      const currentPath = [...path, cat.id]
      if (cat.id === targetId) {
        return currentPath
      }
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryPath(cat.children, targetId, currentPath)
        if (found) return found
      }
    }
    return null
  }

  const categoryOptions = useMemo(() => {
    return categories ? convertToCascaderOptions(categories) : []
  }, [categories])

  // 초기 카테고리 경로 (수정 모드용) - categories 로드 후 form에 반영
  const initialCategoryPath = useMemo(() => {
    if (initialValues?.category_id && categories) {
      return findCategoryPath(categories, initialValues.category_id) || []
    }
    return []
  }, [initialValues?.category_id, categories])

  useEffect(() => {
    if (initialCategoryPath.length > 0) {
      form.setFieldsValue({ category_path: initialCategoryPath })
    }
  }, [initialCategoryPath, form])

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
          is_sold_out: initialValues?.is_sold_out ?? false,
          display_order: initialValues?.display_order ?? 0,
          booking_cutoff_hours: initialValues?.booking_cutoff_hours ?? 24,
          allow_same_day_booking: initialValues?.allow_same_day_booking ?? false,
          facility_service_codes: Object.entries(initialValues?.facility_services ?? {})
            .filter(([, available]) => available)
            .map(([code]) => code),
          booking_start_date: initialValues?.booking_start_date ? dayjs(initialValues.booking_start_date) : null,
          booking_end_date: initialValues?.booking_end_date ? dayjs(initialValues.booking_end_date) : null,
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
            extra={selectedVendor
              ? `${selectedVendor.name} 계정의 사업장을 아래에서 선택하세요.`
              : '상품을 등록할 사업주 계정을 선택하세요.'}
            rules={[{ required: true, message: '사업주를 선택하세요' }]}
          >
            <Select
              placeholder="사업주 선택"
              style={{ width: 280 }}
              showSearch
              optionFilterProp="label"
              disabled={isEdit}
              onChange={() => form.setFieldValue('business_id', undefined)}
              options={vendors?.map((v) => ({
                value: v.id,
                label: v.name,
              })) || []}
            />
          </Form.Item>

          <Form.Item
            name="business_id"
            label="상품"
            extra={selectedBusiness
              ? `현재 ${selectedBusiness.product_count || 0}/${MAX_PRODUCTS_PER_BUSINESS_OWNER}개 등록 · 홈페이지에는 이 사업장명으로 노출됩니다.`
              : '상품이 실제로 노출될 사업장을 선택하세요.'}
            rules={[{ required: true, message: '상품을 선택하세요' }]}
          >
            <Select
              placeholder={selectedBusinessOwnerId ? '상품 선택' : '사업주를 먼저 선택하세요'}
              style={{ width: 360 }}
              disabled={!selectedBusinessOwnerId || isEdit}
              options={(businesses || []).map((business) => ({
                value: business.id,
                label: `${business.name} (${business.product_count || 0}/${MAX_PRODUCTS_PER_BUSINESS_OWNER})`,
                disabled: !isEdit && (business.product_count || 0) >= MAX_PRODUCTS_PER_BUSINESS_OWNER,
              }))}
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
              <Form.Item
                name="category_path"
                label="카테고리"
                initialValue={initialCategoryPath}
                extra="대분류 → 중분류 → 소분류 순으로 선택하세요"
              >
                <Cascader
                  options={categoryOptions}
                  placeholder="카테고리 선택"
                  style={{ width: 280 }}
                  allowClear
                  changeOnSelect
                  expandTrigger="hover"
                  showSearch={{
                    filter: (inputValue, path) =>
                      path.some((option) =>
                        (option.label as string).toLowerCase().includes(inputValue.toLowerCase())
                      ),
                  }}
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
            <Col>
              <Form.Item name="is_sold_out" label="판매 상태" valuePropName="checked">
                <Switch checkedChildren="판매 마감" unCheckedChildren="판매 중" />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="display_order" label="노출 순서">
                <InputNumber min={0} style={{ width: 110 }} />
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
            <Col><Form.Item name="minimum_age" label="최소 이용 연령"><InputNumber min={0} style={{ width: 120 }} addonAfter="세" /></Form.Item></Col>
            <Col><Form.Item name="recommended_age_min" label="권장 연령 시작"><InputNumber min={0} style={{ width: 120 }} addonAfter="세" /></Form.Item></Col>
            <Col><Form.Item name="recommended_age_max" label="권장 연령 종료" dependencies={['recommended_age_min']} rules={[({ getFieldValue }) => ({ validator(_, value) { const min = getFieldValue('recommended_age_min'); return value == null || min == null || value >= min ? Promise.resolve() : Promise.reject(new Error('권장 최대 연령은 최소 연령 이상이어야 합니다')) } })]}><InputNumber min={0} style={{ width: 120 }} addonAfter="세" /></Form.Item></Col>
          </Row>

          <Row gutter={24}>
            <Col>
              <Form.Item
                name="region"
                label="지역"
                getValueProps={(value) => ({
                  value: value ? value.split(' ') : undefined,
                })}
                getValueFromEvent={(value: string[]) =>
                  value && value.length === 2 ? value.join(' ') : value?.[0] || null
                }
              >
                <Cascader
                  placeholder="지역 선택"
                  style={{ width: 220 }}
                  allowClear
                  options={REGION_CASCADER_OPTIONS}
                  showSearch={{
                    filter: (input, path) =>
                      path.some((option) =>
                        (option.label as string).toLowerCase().includes(input.toLowerCase())
                      ),
                  }}
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

        <Card style={{ marginBottom: 24 }}>
          <SectionHeader icon={<CalendarOutlined />} title="예약 정책" description="예약 가능 기간, 마감 시점과 당일 예약 여부를 설정합니다." />
          <Row gutter={24}>
            <Col><Form.Item name="booking_start_date" label="예약 시작일"><DatePicker /></Form.Item></Col>
            <Col><Form.Item name="booking_end_date" label="예약 종료일" dependencies={['booking_start_date']} rules={[({ getFieldValue }) => ({ validator(_, value) { const start = getFieldValue('booking_start_date'); return !value || !start || !dayjs(value).isBefore(dayjs(start), 'day') ? Promise.resolve() : Promise.reject(new Error('예약 종료일은 시작일 이후여야 합니다')) } })]}><DatePicker /></Form.Item></Col>
            <Col><Form.Item name="booking_cutoff_hours" label="예약 마감"><InputNumber min={0} addonAfter="시간 전" /></Form.Item></Col>
            <Col><Form.Item name="allow_same_day_booking" label="당일 예약" valuePropName="checked"><Switch checkedChildren="허용" unCheckedChildren="불가" /></Form.Item></Col>
          </Row>
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <SectionHeader icon={<HomeOutlined />} title="시설·서비스" description="체크 시 사용자 화면에 ‘가능’, 미체크 시 ‘불가’로 표시됩니다. 상품별 실제 제공 여부를 설정하세요." />
          <Form.Item name="facility_service_codes" style={{ marginBottom: 0 }}>
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[12, 12]}>
                {FACILITY_SERVICE_OPTIONS.map((option) => (
                  <Col xs={24} sm={12} lg={8} key={option.code}>
                    <Checkbox value={option.code} style={{ width: '100%', margin: 0 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 32 }}>
                        <span style={{ color: '#1677ff', fontSize: 16 }}>{option.icon}</span>
                        <span>{option.label}</span>
                      </span>
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Card>

        {/* 이미지 */}
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<PictureOutlined />}
            title="이미지"
            description={`썸네일은 필수입니다. 상세 이미지는 최대 ${MAX_PRODUCT_DETAIL_IMAGES}장까지 등록할 수 있습니다.`}
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

          <Form.Item label="추가 이미지" extra="여러 장을 한 번에 선택할 수 있으며 상품 상세페이지에 표시됩니다">
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
              {imageUrls.length < MAX_PRODUCT_DETAIL_IMAGES && (
                <Upload
                  listType="picture-card"
                  showUploadList={false}
                  customRequest={handleImageUpload}
                  beforeUpload={validateImageSelection}
                  accept="image/*"
                  multiple
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

            {/* 일괄 시간 추가/삭제 (직접 지정 모드용) */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e8e8e8' }}>
              <Row gutter={16} align="middle">
                <Col>
                  <Text type="secondary" style={{ fontSize: 13 }}>일괄 시간 (직접 지정):</Text>
                </Col>
                <Col flex="auto">
                  <Space wrap size={[4, 4]}>
                    {bulkCustomSlots.map((time) => (
                      <Tag
                        key={time}
                        closable
                        onClose={() => removeBulkCustomSlot(time)}
                        style={{ margin: 0 }}
                        color="blue"
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
                          addBulkCustomSlot(time.format('HH:mm'))
                        }
                      }}
                      value={null}
                    />
                  </Space>
                </Col>
              </Row>
              <Row gutter={8} style={{ marginTop: 8 }}>
                <Col>
                  <Button
                    size="small"
                    type="primary"
                    onClick={applyBulkCustomSlots}
                    disabled={bulkCustomSlots.length === 0}
                  >
                    선택 요일에 추가
                  </Button>
                </Col>
                <Col>
                  <Button
                    size="small"
                    danger
                    onClick={removeBulkCustomSlotsFromAll}
                    disabled={bulkCustomSlots.length === 0}
                  >
                    선택 요일에서 삭제
                  </Button>
                </Col>
                <Col>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    * 직접 지정 모드로 설정된 요일에만 적용됩니다
                  </Text>
                </Col>
              </Row>
            </div>
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

        {/* 휴무일 (임시 휴무) */}
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<CalendarOutlined />}
            title="휴무일 설정"
            description="제휴사 사정 등으로 임시 휴무가 필요한 날짜를 지정해주세요"
          />

          <div style={{ marginBottom: 16 }}>
            <Space size="small">
              <DatePicker
                placeholder="휴무일 선택"
                format="YYYY-MM-DD"
                onChange={(date) => {
                  if (date) {
                    addUnavailableDate(dayjs(date).format('YYYY-MM-DD'))
                  }
                }}
                disabledDate={(current) => {
                  // 이미 선택된 날짜는 비활성화
                  return unavailableDates.some((d) => d.date === dayjs(current).format('YYYY-MM-DD'))
                }}
                value={null}
              />
              <Text type="secondary" style={{ fontSize: 13 }}>
                날짜를 선택하면 휴무일로 추가됩니다
              </Text>
            </Space>
          </div>

          {unavailableDates.length > 0 ? (
            <div
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              {unavailableDates.map((item, index) => (
                <div
                  key={item.date}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    background: index % 2 === 0 ? '#fafafa' : '#fff',
                    borderBottom: index < unavailableDates.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <Tag color="red" style={{ margin: 0 }}>
                    {dayjs(item.date).format('YYYY년 MM월 DD일 (ddd)')}
                  </Tag>
                  <Input
                    placeholder="휴무 사유 (선택)"
                    value={item.reason}
                    onChange={(e) => updateUnavailableDateReason(item.date, e.target.value)}
                    style={{ flex: 1, maxWidth: 300 }}
                    size="small"
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeUnavailableDate(item.date)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                background: '#fafafa',
                borderRadius: 6,
                border: '1px dashed #d9d9d9',
              }}
            >
              <Text type="secondary">등록된 휴무일이 없습니다</Text>
            </div>
          )}
        </Card>

        {/* 상세 설명 */}
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<ShoppingOutlined />}
            title="상세 설명"
            description="상품의 상세한 설명을 입력해주세요. 이미지를 첨부할 수 있습니다."
          />

          <Form.Item name="description">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              modules={quillModules}
              formats={quillFormats}
              placeholder="상품 상세 설명을 입력하세요"
              className="product-description-editor"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="inclusions" label="포함 사항"><Input.TextArea rows={3} /></Form.Item></Col>
            <Col span={12}><Form.Item name="exclusions" label="불포함 사항"><Input.TextArea rows={3} /></Form.Item></Col>
            <Col span={12}><Form.Item name="materials" label="준비물"><Input.TextArea rows={3} /></Form.Item></Col>
            <Col span={12}><Form.Item name="usage_method" label="이용 방법"><Input.TextArea rows={3} /></Form.Item></Col>
            <Col span={12}><Form.Item name="product_precautions" label="상품 유의사항"><Input.TextArea rows={3} /></Form.Item></Col>
            <Col span={12}><Form.Item name="reservation_notice" label="예약 공지"><Input.TextArea rows={3} /></Form.Item></Col>
            <Col span={12}><Form.Item name="refund_notice" label="취소·환불 안내"><Input.TextArea rows={3} /></Form.Item></Col>
            <Col span={12}><Form.Item name="other_notice" label="기타 안내"><Input.TextArea rows={3} /></Form.Item></Col>
          </Row>
          <style>{`
            .product-description-editor .ql-container {
              min-height: 300px;
            }
            .product-description-editor .ql-editor {
              min-height: 300px;
            }
            .product-description-editor .ql-editor img {
              max-width: 600px !important;
              height: auto !important;
              border-radius: 8px;
            }
          `}</style>
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
        <DaumPostcodeEmbed scriptUrl="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" onComplete={handlePostcodeComplete} style={{ height: 450 }} />
      </Modal>
    </>
  )
}
