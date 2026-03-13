# 명함 주문 시스템 - 프로젝트 명세서 (SPEC.md)
## 1. 프로젝트 개요
사내 직원 전용 명함 온라인 주문 시스템이다.
직원이 개인정보를 입력하면 명함 미리보기를 실시간으로 확인하고, 발주할 수 있다.
개인주문(1인)과 단체주문(엑셀 업로드) 두 가지 모드를 지원한다.
## 2. 기술 스택
- Frontend: HTML5, CSS3, Vanilla JS (또는 React/Vue 선택 가능)
- 미리보기: HTML5 Canvas API
- Backend: Node.js + Express (또는 Python Flask/Django 선택 가능)
- DB: SQLite 또는 MySQL
- 파일 업로드: Multer (Node) 또는 동등 라이브러리
## 3. 페이지 구조
```
/ (루트)
├── /login              → 로그인 페이지
├── /order              → 명함 주문 페이지 (메인) ★
├── /cart               → 장바구니
├── /mypage             → 마이페이지 (주문내역 조회)
└── /admin              → 관리자 페이지 (부서 데이터 관리)
```
메인 레이아웃 구조:
```
┌─────────────────────────────────────────────┐
│ [헤더] 로고 + 시스템명 | 로그인 | 마이페이지  │
├─────────────────────────────────────────────┤
│ [브레드크럼] 명함 > 명함주문                   │
├─────────────────────────────────────────────┤
│ [탭] 개인주문 | 단체주문                       │
├─────────────────────────────────────────────┤
│ [주문 폼 영역]                                │
│   좌측: 한글정보 입력    우측: 영문정보 입력     │
├─────────────────────────────────────────────┤
│ [버튼] 지우기 | 미리보기 | 발주                │
├─────────────────────────────────────────────┤
│ [미리보기 영역] Canvas로 명함 앞/뒤 실시간 렌더 │
├─────────────────────────────────────────────┤
│ [푸터]                                       │
└─────────────────────────────────────────────┘
```
## 4. 주문 폼 필드 정의
### 4-1. 개인주문 - 한글 및 정보 (좌측)
| 필드명    | field name      | type     | 필수 | 비고                            |
|----------|-----------------|----------|------|-------------------------------|
| 유형      | nc_type         | select   | ✅   | 옵션: 01형, 02형, 03청렴형        |
| 수량      | nc_qty          | select   | ✅   | 기본 1갑(200매), 추가시 사유 필요   |
| 주문사유   | nc_qty_reason   | text     |      | 추가 수량 선택시에만 활성화         |
| 이름      | nc_name         | text     | ✅   |                                |
| 부서      | nc_dept         | text     | ✅   | 🔍 부서검색 버튼 연동              |
| 팀       | nc_team         | text     |      | 부서 검색시 자동 채워짐             |
| 직책      | nc_title        | text     | ✅   | 🔍 직책선택 다이얼로그 연동         |
| 주소      | nc_addr         | text     | ✅   | 부서 검색시 자동 채워짐             |
| 전화번호   | nc_phone        | text     | ✅   |                                |
| 팩스      | nc_fax          | text     | ✅   |                                |
| 휴대폰    | nc_mobile       | text     | ✅   |                                |
| email    | nc_email        | text     | ✅   |                                |
| 지사여부   | nc_branch_ck    | checkbox |      | 체크시 지사명 필드 활성화           |
| 지사명    | nc_branch       | text     | 조건 | 지사여부 체크시 필수                |
### 4-2. 개인주문 - 영문 (우측)
| 필드명       | field name       | type   | 필수 | 비고                     |
|-------------|-----------------|--------|------|------------------------|
| 이름(영문)   | nc_name_en      | text   | ✅   |                         |
| 부서(영문)   | nc_dept_en      | text   | ✅   | 부서 검색시 자동 채워짐     |
| 직책(영문)   | nc_title_en     | text   | ✅   | 직책 선택시 자동 채워짐     |
| 주소(영문)   | nc_addr_en      | text   | ✅   | 부서 검색시 자동 채워짐     |
| 지사명(영문)  | nc_branch_en   | text   | 조건 | 지사여부 체크시 필수        |
| 기타추가사항  | nc_info         | text   |      |                         |
### 4-3. 단체주문
| 필드명         | field name        | type     | 필수 | 비고                        |
|---------------|-------------------|----------|------|-----------------------------|
| 수량           | nc_qty_bulk      | number   | ✅   | 엑셀 파일 내 수량의 합         |
| 엑셀파일       | nc_excel_file    | file     | ✅   | .xls, .xlsx 허용              |
| 사진파일(zip)   | nc_zip_file     | file     |      | 이름_부서.jpg 파일들을 zip 압축  |
## 5. 명함 미리보기 (Canvas) 상세
### 5-1. 명함 규격
- 실제 크기: 90mm × 50mm
- Canvas 렌더링 크기: 500px × 278px (한 면)
- Canvas 총 크기: 1010px × 278px (앞면 500 + 간격 10 + 뒷면 500)
- 유형별 Canvas 3개 (01형, 02형, 03형)
### 5-2. 배경 이미지
각 유형별 앞면/뒷면 총 6개의 배경 이미지가 필요하다:
```
/images/card-type01-front.png   ← 01형 앞면 (한글면)
/images/card-type01-back.png    ← 01형 뒷면 (영문면)
/images/card-type02-front.png   ← 02형 앞면
/images/card-type02-back.png    ← 02형 뒷면
/images/card-type03-front.png   ← 03형(청렴형) 앞면
/images/card-type03-back.png    ← 03형(청렴형) 뒷면
```
### 5-3. 텍스트 렌더링 좌표
앞면(한글면)에 그려지는 텍스트 6종:
| 순서 | 내용          | x    | y    | 너비 | 정렬   | 폰트              |
|------|-------------|------|------|------|--------|------------------|
| 1    | 이름         | 221  | 148  | 154  | right  | bold 25px 고딕     |
| 2    | 부서         | 245  | 133  | 192  | left   | 13px 고딕          |
| 3    | 팀/직책      | 243  | 152  | 192  | left   | bold 15px 고딕     |
| 4    | 주소         | 60   | 207  | 380  | left   | 14px 고딕          |
| 5    | 전화/팩스    | 60   | 227  | 380  | left   | 14px 고딕          |
| 6    | 휴대폰/이메일 | 60  | 247  | 380  | left   | 14px 고딕          |
| 7    | 지사명       | 60   | 187  | 380  | left   | 14px 고딕          |
뒷면(영문면)의 좌표는 x 기준 +510px (500 너비 + 10 간격) 오프셋을 적용한다.
### 5-4. 텍스트 포맷팅 규칙
```javascript
// 이름: 글자 사이에 공백 삽입
// "홍길동" → "홍 길 동"
function formatName(name) {
  return name.replace(/ /g, '').split('').join(' ');
}
// 전화번호 포맷팅 (한글면)
// "0220001234", "0220005678" → "TEL 02 2000 1234 FAX 02 2000 5678"
function formatPhone(phone, fax) {
  // 숫자만 추출 후, 02로 시작하면 2-N-4, 그 외 3-N-4 형태로 분리
  // 한글면: "TEL xxx FAX xxx"
  // 영문면: "T +82 2 xxx F +82 2 xxx"
}
// 휴대폰 포맷팅
// "01012345678", "hong@company.com"
// 한글면: "Mobile 010 1234 5678 E-mail hong@company.com"
// 영문면: "M +82 10 1234 5678 E hong@company.com"
function formatMobile(mobile, email) { ... }
// 팀/직책 결합
// "기획팀", "과장" → "기획팀 과장"
function formatTitle(team, title) {
  return [team, title].filter(Boolean).join(' ');
}
```
### 5-5. 미리보기 렌더링 함수 (doApply)
```
doApply() 호출 시:
1. 배경 이미지를 Canvas에 다시 그림 (초기화)
2. 앞면(한글): 입력 폼에서 값 읽기 → 포맷팅 → Canvas에 fillText
3. 뒷면(영문): 영문 입력에서 값 읽기 → 포맷팅 → Canvas에 fillText
4. 03형인 경우 앞면에 사진도 drawImage (118×156px, 좌표 363,20)
5. 3개 유형 모두 동시에 렌더링
6. 스크롤을 미리보기 영역으로 이동
```
## 6. 부서 검색 기능
### 6-1. 검색 다이얼로그 UI
- 모달 다이얼로그 (너비 450px)
- 상단: 검색 키워드 입력 + 검색 버튼
- 중단: 검색 결과 목록 (행 클릭으로 선택)
- 하단: 적용 / 취소 버튼
- 안내문: "부서명 또는 팀명에 포함되는 단어를 입력하세요. 예) 기획, 전략, 인사..."
### 6-2. 부서 데이터 구조 (DB)
```sql
CREATE TABLE departments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  dept        TEXT NOT NULL,       -- 부서명 (한글)
  dept_en     TEXT,                -- 부서명 (영문)
  team        TEXT,                -- 팀명
  addr        TEXT,                -- 주소
  addr_en     TEXT,                -- 주소 (영문)
  branch      TEXT,                -- 공항명/지사명
  branch_en   TEXT                 -- 공항명/지사명 (영문)
);
```
### 6-3. 검색 API
```
POST /api/departments/search
Body: { "key": "기획" }
Response: {
  "code": "succ",
  "dept": [
    {
      "id": 1,
      "dept": "경영기획본부",
      "dept_en": "Corporate Planning Division",
      "team": "기획팀",
      "addr": "서울특별시 강서구 하늘길 78",
      "addr_en": "78, Haneul-gil, Gangseo-gu, Seoul",
      "branch": "",
      "branch_en": ""
    }
  ]
}
```
적용 버튼 클릭 시 자동으로 채워지는 필드:
- 부서 → nc_dept
- 부서(영문) → nc_dept_en
- 팀 → nc_team
- 주소 → nc_addr
- 주소(영문) → nc_addr_en
- 지사명 → nc_branch
- 지사명(영문) → nc_branch_en
## 7. 직책 선택 기능
### 7-1. 직책 데이터 (하드코딩 가능)
```javascript
const TITLES = [
  { ko: "사장",   en: "President and CEO" },
  { ko: "부사장", en: "Executive Vice President" },
  { ko: "본부장", en: "Vice President" },
  { ko: "공항장", en: "Chief Officer of ... Airport" },
  { ko: "실장",   en: "Director" },
  { ko: "센터장", en: "Head" },
  { ko: "부장",   en: "General Manager" },
  { ko: "차장",   en: "Deputy General Manager" },
  { ko: "과장",   en: "Manager" },
  { ko: "대리",   en: "Assistant Manager" },
  { ko: "",      en: "N/A" }   // 직책 없음
];
```
### 7-2. 직책 선택 다이얼로그
- 테이블 형태로 직위/영어명칭/비고 표시
- 각 행에 "직책 적용" 버튼
- 클릭 시 nc_title에 한글 직책, nc_title_en에 영문 직책 자동 입력
- 비고: "~ 대우"는 해당 직위와 동일 영어명칭, "~ 직무대리"는 앞에 "Acting" 추가
## 8. 가격 계산
```javascript
const UNIT_PRICE = 19000;  // 1갑(200매) 기본가
const TAX_RATE = 0.1;       // 부가세 10%
function calculatePrice(qty) {
  return Math.floor(qty * UNIT_PRICE * (1 + TAX_RATE));
  // 1갑 = 20,900원 (부가세 포함)
}
```
- 수량 변경 시 실시간으로 주문금액 표시 업데이트
- 단체주문에서는 수량 직접 입력(keyup) 시 실시간 계산
## 9. 유효성 검사 (발주 버튼 클릭 시)
### 개인주문 검증 순서:
1. 명함 유형 선택 여부
2. 수량 선택 여부
3. 이름 입력 여부
4. 부서 입력 여부
5. 팀/직책에 "/"가 없으면 "그대로 사용하시겠습니까?" 확인
6. 주소 입력 여부
7. 전화번호 입력 여부
8. 팩스 입력 여부
9. 휴대폰 입력 여부
10. 이메일 입력 여부
11. 지사 체크 시 지사명 입력 여부
12. 영문 이름 입력 여부
13. 영문 부서 입력 여부
14. 영문 팀/직책 "/" 확인
15. 영문 주소 입력 여부
16. 지사 체크 시 영문 지사명 입력 여부
17. "입력한 모든 항목에 이상이 없음" 체크 여부
18. 최종 "선택한 정보로 발주합니다" 확인 다이얼로그
### 단체주문 검증:
1. 엑셀 파일 업로드 여부
2. "입력한 모든 항목에 이상이 없음" 체크 여부
## 10. API 엔드포인트 정리
```
POST /api/auth/login           ← 로그인
POST /api/departments/search   ← 부서 검색
POST /api/files/upload         ← 파일 업로드 (사진/엑셀/zip)
POST /api/orders/create        ← 주문 생성 (명함 데이터 저장)
POST /api/cart/add             ← 장바구니 추가
GET  /api/orders/my            ← 내 주문 내역 조회
GET  /api/cart                 ← 장바구니 목록
```
## 11. 주문 프로세스 플로우
```
사용자 로그인
  → /order 페이지 진입
  → [개인주문] 또는 [단체주문] 탭 선택
[개인주문]:
  → 정보 입력 (유형, 이름, 부서, 직책, 주소, 전화...)
  → [부서검색], [직책선택] 보조 기능 활용
  → [미리보기] 클릭 → Canvas에 명함 실시간 렌더링
  → [확인 체크] 선택
  → [발주] 클릭
  → 유효성 검사 통과
  → POST /api/orders/create (명함 데이터 전송)
  → 성공 시 order_id 수신
  → POST /api/cart/add (장바구니에 추가)
  → 장바구니 → 결제 페이지로 이동
[단체주문]:
  → 수량 입력 + 엑셀파일 업로드 + (선택)사진zip 업로드
  → [확인 체크] → [발주]
  → 같은 플로우로 주문 처리
```
## 12. 파일 구조 (제안)
```
project/
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js            ← 메인 앱 로직
│   │   ├── canvas-preview.js ← Canvas 미리보기 렌더링
│   │   ├── form-validation.js← 유효성 검사
│   │   ├── dept-search.js    ← 부서 검색 다이얼로그
│   │   ├── title-select.js   ← 직책 선택 다이얼로그
│   │   └── price-calc.js     ← 가격 계산
│   └── images/
│       ├── card-type01-front.png
│       ├── card-type01-back.png
│       ├── card-type02-front.png
│       ├── card-type02-back.png
│       ├── card-type03-front.png
│       └── card-type03-back.png
├── server/
│   ├── index.js              ← Express 서버 진입점
│   ├── routes/
│   │   ├── auth.js
│   │   ├── orders.js
│   │   ├── departments.js
│   │   ├── files.js
│   │   └── cart.js
│   ├── models/
│   │   ├── user.js
│   │   ├── order.js
│   │   ├── department.js
│   │   └── cart.js
│   └── db/
│       └── database.sqlite
├── package.json
├── SPEC.md                   ← 이 파일
└── README.md
```
## 13. 구현 우선순위
1단계: 기본 폼 UI + 유효성 검사
2단계: Canvas 미리보기 렌더링
3단계: 부서 검색 + 직책 선택 다이얼로그
4단계: 파일 업로드 (단체주문)
5단계: 주문 API + DB 저장
6단계: 로그인 + 마이페이지 + 장바구니