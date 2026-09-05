# 제휴 입점 E2E 검증 가이드

## 검증 대상

영업사원 포털 → 담다 비즈니스센터 가입 → 어드민 검수/승인 → 담다 비즈니스센터 로그인 → 홈페이지 상품 노출의 전체 흐름을 검증한다.

## 사전 조건

1. `20260804110000_create_partner_onboarding.sql` 마이그레이션을 적용한다.
2. 홈페이지, 어드민/영업 포털, 담다 비즈니스센터가 동일한 Supabase 프로젝트를 사용한다.
3. Supabase Auth에 영업사원 사용자를 만들고 같은 UUID로 `sales_agents` 행을 등록한다.
4. 어드민 배포 환경에 `VITE_BUSINESS_SITE_URL`을 설정한다.
5. 싸인오케이 API/웹훅이 미연동인 동안에는 운영 승인을 진행하지 않는다. 스테이징 검증에서만 계약 상태를 테스트 데이터로 완료 처리한다.

1차에서는 Supabase Dashboard의 Authentication에서 영업사원 계정을 만든 후 아래처럼 권한 행을 등록한다.

```sql
insert into public.sales_agents (id, name, phone)
values ('<Auth 사용자 UUID>', '홍길동', '01012345678');
```

## 1. 영업사원 포털

1. `/sales/login`에서 영업사원으로 로그인한다.
2. `/sales/onboardings/new`에서 사업주 기본정보를 입력한다.
3. 사업자등록증과 통장사본을 모바일 카메라로 업로드한다.
4. 상품을 2개 이상 등록하고 가격과 인원 조건을 확인한다.
5. 생성된 `DAMDA-XXXXXX` 사업주 코드를 기록한다.

확인 항목:

- 다른 영업사원의 신청이 목록에 보이지 않는다.
- 사업자번호 중복 신청이 차단된다.
- 서류가 공개 URL이 아닌 서명된 URL로만 열린다.
- 승인/반려된 신청은 영업사원이 수정할 수 없다.

## 2. 담다 비즈니스센터 가입

1. 입점 상세의 `담다 비즈니스센터 가입 열기` 버튼을 누른다.
2. 사업주 코드와 사업자번호가 자동 입력됐는지 확인한다.
3. 사업주 계정을 가입한다.
4. 영업 포털에서 `가입 요청 다시 조회`를 누른다.
5. 동일 사업자번호의 가입 요청만 표시되는지 확인하고 연결한다.

확인 항목:

- 다른 사업자번호 또는 다른 사업주 코드의 가입 요청은 최종 승인되지 않는다.
- 승인 전 담다 비즈니스센터 로그인은 `가입 승인을 기다리고 있습니다`로 차단된다.

## 3. 계약과 관리자 승인

1. 계약서 발송을 요청한다.
2. 싸인오케이에서 발송·열람·서명·완료 상태가 웹훅으로 반영되는지 확인한다.
3. 어드민 `/partner-onboardings`에서 동일 신청을 연다.
4. 서류, 상품, 콘솔 가입, 전자계약 네 조건이 모두 완료인지 확인한다.
5. `검수 완료` 후 `입점 승인`을 실행한다.

확인 항목:

- 승인 요청을 여러 번 보내도 사업주와 상품이 중복 생성되지 않는다.
- 처리 중 오류가 발생하면 사업주나 상품 일부만 생성되지 않는다.
- 가입 요청의 `matched_business_owner_id`가 생성된 사업주 ID와 일치한다.
- 상품은 최초 `is_visible=false`로 생성된다.

## 4. 담다 비즈니스센터와 홈페이지

1. 앞서 가입한 계정으로 담다 비즈니스센터에 로그인한다.
2. 자동 생성된 모든 상품이 `내 상품`에 보이는지 확인한다.
3. 한 상품을 노출 상태로 변경한다.
4. 어드민 상품관리에서 같은 상품과 사업주가 조회되는지 확인한다.
5. 홈페이지 상품 목록과 사업주 상세에서 상품이 보이는지 확인한다.

홈페이지의 인기 상품/사업주 영역은 최대 5분 캐시가 적용되므로 즉시 보이지 않을 수 있다. 상품 상세 및 목록 조회 조건은 `products.is_visible=true`와 `business_owners.status=active`이다.

## DB 정합성 확인 쿼리

아래 쿼리는 스테이징 DB에서 사업자번호를 테스트 번호로 바꿔 실행한다.

```sql
select id, owner_code, auth_user_id, business_number, status
from business_owners
where business_number = '0000000000';

select id, business_owner_id, name, is_visible
from products
where business_owner_id = '<생성된 사업주 UUID>';

select status, matched_business_owner_id, auth_user_id, owner_code, business_number
from business_owner_signup_requests
where business_number = '0000000000';

select status, contract_status, business_owner_id, signup_request_id
from partner_onboardings
where business_number = '0000000000';
```

## 현재 미완료 연동

- 싸인오케이 실제 API 발송 및 웹훅 수신
- 영업사원 계정 생성/비활성화 어드민 화면
