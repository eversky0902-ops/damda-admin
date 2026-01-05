# Damda Admin UI 가이드라인

이 문서는 어드민 UI 개발 시 참고해야 할 패턴과 규칙을 정의합니다.
**사업주 관리(Vendors)** 화면을 바이블로 삼아 모든 관리 화면의 UI를 통일성 있게 구현합니다.

## 참조 파일

- 목록: `src/pages/Vendors/index.tsx`
- 상세: `src/pages/Vendors/VendorDetail.tsx`
- 등록/수정 폼: `src/components/VendorForm.tsx`
- 등록 페이지: `src/pages/Vendors/VendorCreate.tsx`
- 수정 페이지: `src/pages/Vendors/VendorEdit.tsx`

---

## 1. 목록 페이지 패턴

### 헤더 영역
```tsx
<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
  <h2 style={{ margin: 0 }}>OOO 관리</h2>
  <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/xxx/new')}>
    OOO 등록
  </Button>
</div>
```

### 필터/검색 영역
```tsx
<div style={{
  display: 'flex',
  gap: 8,
  marginBottom: 12,
  padding: 12,
  background: '#fafafa',
  borderRadius: 6,
}}>
  <Input placeholder="검색어" prefix={<SearchOutlined />} style={{ width: 240 }} />
  <Select style={{ width: 120 }} options={[...]} />
  <Button type="primary">검색</Button>
</div>
```

### 테이블
```tsx
<Table
  columns={columns}
  dataSource={data}
  rowKey="id"
  loading={isLoading}
  size="small"
  bordered
  pagination={{
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    showTotal: (total) => `총 ${total}개`,
    size: 'small',
  }}
  onRow={(record) => ({
    onClick: () => navigate(`/xxx/${record.id}`),
    style: { cursor: 'pointer' },
  })}
/>
```

---

## 2. 상세 페이지 패턴

### 헤더 영역
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
  <Avatar src={logoUrl} icon={<ShopOutlined />} size={48} />
  <h2 style={{ margin: 0 }}>{name}</h2>
</div>
```

### 탭 구조
```tsx
<Tabs items={[
  { key: 'info', label: '기본 정보', children: <InfoContent /> },
  { key: 'history', label: '이력', children: <HistoryContent /> },
]} />
```

### 정보 표시 (Descriptions)
```tsx
<Descriptions column={2} bordered size="small">
  <Descriptions.Item label="라벨">{value}</Descriptions.Item>
</Descriptions>
```

### 하단 네비게이션
```tsx
<Divider />
<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/xxx')}>
  목록으로
</Button>
```

---

## 3. 폼 페이지 패턴 (등록/수정)

### 페이지 구조
```tsx
<div>
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ margin: 0 }}>OOO 등록</h2>
    <Text type="secondary">부제목 설명</Text>
  </div>

  <XXXForm
    mode="create" // or "edit"
    initialValues={data}
    onSubmit={handleSubmit}
    onCancel={() => navigate('/xxx')}
    isSubmitting={mutation.isPending}
  />
</div>
```

### 공통 폼 컴포넌트 구조

등록/수정 폼은 반드시 **공통 컴포넌트**로 분리합니다.

```tsx
interface XXXFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<XXX>
  onSubmit: (values: Record<string, unknown>) => void
  onCancel: () => void
  isSubmitting?: boolean
}
```

### 폼 스타일 (compact-form)
```css
.compact-form .ant-form-item { margin-bottom: 16px; }
.compact-form .ant-row > .ant-col .ant-form-item { margin-bottom: 0; }
.compact-form .ant-row { margin-bottom: 12px; }
.compact-form .ant-card-body > *:last-child { margin-bottom: 0; }
```

### 섹션 헤더
```tsx
function SectionHeader({ icon, title, description }) {
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
```

### 카드 섹션
```tsx
<Card style={{ marginBottom: 24 }}>
  <SectionHeader icon={<ShopOutlined />} title="기본 정보" description="설명..." />
  {/* Form.Items */}
</Card>
```

### Input 너비 가이드
| 필드 유형 | 권장 너비 |
|----------|----------|
| 이메일 | 320px |
| 이름 (사람) | 160px |
| 상호명/업체명 | 280px |
| 사업자번호 | 180px |
| 전화번호 | 180px |
| 주소 | 480px |
| 우편번호 | 100~120px |
| 은행명 | 140px |
| 계좌번호 | 200~240px |
| 숫자(%, 금액) | 120px |

### 한 줄에 여러 필드 배치
```tsx
<Row gutter={24}>
  <Col>
    <Form.Item name="field1" label="라벨1">
      <Input style={{ width: 160 }} />
    </Form.Item>
  </Col>
  <Col>
    <Form.Item name="field2" label="라벨2">
      <Input style={{ width: 180 }} />
    </Form.Item>
  </Col>
</Row>
```

### 주소 입력 (다음 우편번호)
```tsx
import { DaumPostcodeEmbed } from 'react-daum-postcode'

<Form.Item label="주소" extra="설명" required>
  <Row gutter={8} align="middle" style={{ marginBottom: 8 }}>
    <Col>
      <Form.Item name="zipcode" noStyle>
        <Input placeholder="우편번호" style={{ width: 100 }} readOnly />
      </Form.Item>
    </Col>
    <Col>
      <Button icon={<SearchOutlined />} onClick={() => setIsPostcodeOpen(true)}>
        주소검색
      </Button>
    </Col>
  </Row>
  <div style={{ marginBottom: 8 }}>
    <Form.Item name="address" noStyle rules={[{ required: true }]}>
      <Input style={{ width: 480 }} readOnly />
    </Form.Item>
  </div>
  <div>
    <Form.Item name="address_detail" noStyle>
      <Input placeholder="상세주소" style={{ width: 480 }} />
    </Form.Item>
  </div>
</Form.Item>
```

### 하단 버튼 영역
```tsx
<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
  <Button icon={<ArrowLeftOutlined />} onClick={onCancel}>
    취소
  </Button>
  <Button type="primary" onClick={handleSubmit} loading={isSubmitting}>
    {mode === 'edit' ? '저장' : '등록'}
  </Button>
</div>
```

### extra 설명 가이드
- 꼭 필요한 필드에만 extra 사용 (과도하게 사용 X)
- 권장 사용: 사용자에게 노출되는 값, 특수 형식 안내, 중요 비즈니스 로직 설명
- 예시: "고객에게 노출되는 상호명입니다", "- 없이 숫자만 입력"

---

## 4. 공통 규칙

### 레이아웃
- 헤더 없음 (사이드바만 사용)
- Content 영역: margin 16px, padding 16px, background #fff

### 상태 표시
```tsx
<Tag color={status === 'active' ? 'green' : 'default'}>
  {STATUS_LABEL[status]}
</Tag>
```

### 로딩 상태
```tsx
if (isLoading) {
  return (
    <div style={{ textAlign: 'center', padding: 50 }}>
      <Spin size="large" />
    </div>
  )
}
```

### 에러/빈 상태
```tsx
if (!data) {
  return <div>데이터를 찾을 수 없습니다</div>
}
```

### 날짜 포맷
```tsx
import dayjs from 'dayjs'
import { DATE_FORMAT } from '@/constants' // 'YYYY-MM-DD'

dayjs(date).format(DATE_FORMAT)
```

### 금액 표시
```tsx
{amount.toLocaleString()}원
```

---

## 5. 파일 구조

새로운 관리 기능 추가 시:

```
src/
├── pages/
│   └── XXX/
│       ├── index.tsx        # 목록 페이지 (XXXPage)
│       ├── XXXDetail.tsx    # 상세 페이지 (XXXDetailPage)
│       ├── XXXCreate.tsx    # 등록 페이지 (XXXCreatePage)
│       └── XXXEdit.tsx      # 수정 페이지 (XXXEditPage)
├── components/
│   └── XXXForm.tsx          # 공통 폼 컴포넌트
└── services/
    └── xxxService.ts        # API 서비스
```
