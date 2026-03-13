# QR Namecard - 명함 발주 시스템

사내 직원용 **명함 온라인 발주 시스템**입니다.
명함 정보를 입력하면 **실시간 Canvas 미리보기**와 **vCard QR 코드**가 자동 생성되며, 개인/단체 주문을 관리할 수 있습니다.

## 주요 기능

### 명함 주문
- **3가지 명함 디자인** 선택 (01형, 02형, 03청렴형)
- **실시간 Canvas 미리보기** — 입력과 동시에 앞면(한글)/뒷면(영문) 렌더링
- **vCard QR 코드 자동 생성** — 뒷면에 연락처 정보 QR 삽입
- **부서 검색 자동완성** — 부서 선택 시 주소·영문명 자동 입력
- **직위 선택 다이얼로그** — 직위 목록 + 직접 입력 지원

### 단체 주문
- **Excel 파일 업로드** — 다수 명함 일괄 발주
- **사진 ZIP 업로드** — 사진형 명함 대량 처리

### 주문 관리
- **장바구니** — 여러 건 모아서 발주
- **마이페이지** — 주문 내역 및 상태 추적 (대기 → 확정 → 인쇄 → 완료)
- **관리자 페이지** — 부서/사용자/주문 관리

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Backend** | Node.js, Express 5 |
| **Database** | SQLite (better-sqlite3, WAL mode) |
| **Frontend** | Vanilla JS, HTML5 Canvas API |
| **QR 생성** | qrcode.js (vCard 포맷) |
| **이미지 처리** | Sharp |
| **파일 업로드** | Multer |
| **Excel 파싱** | SheetJS (xlsx) |

## 프로젝트 구조

```
qr-namecard/
├── server/
│   ├── index.js              # Express 서버 엔트리포인트
│   ├── db/
│   │   ├── schema.sql        # DB 스키마 정의
│   │   └── seed.sql          # 초기 부서 데이터
│   ├── routes/
│   │   ├── auth.js           # 인증 API
│   │   ├── orders.js         # 주문 CRUD API
│   │   ├── cart.js           # 장바구니 API
│   │   ├── departments.js    # 부서 검색 API
│   │   └── files.js          # 파일 업로드 API
│   ├── middleware/
│   │   └── auth.js           # 세션 인증 미들웨어
│   └── utils/
│       └── excel-parser.js   # Excel 파싱 유틸리티
├── public/
│   ├── index.html            # 로그인 페이지
│   ├── order.html            # 명함 주문 페이지
│   ├── cart.html             # 장바구니 페이지
│   ├── mypage.html           # 마이페이지
│   ├── admin.html            # 관리자 페이지
│   ├── css/                  # 스타일시트
│   └── js/
│       ├── canvas-preview.js # Canvas 렌더링 + QR 생성 (652 lines)
│       ├── app-order.js      # 주문 페이지 컨트롤러
│       ├── dept-search.js    # 부서 검색 다이얼로그
│       ├── title-select.js   # 직위 선택 다이얼로그
│       ├── form-validation.js# 폼 유효성 검사
│       ├── price-calc.js     # 가격 계산
│       └── common.js         # 공통 유틸리티
└── uploads/                  # 업로드 파일 저장소
```

## 시작하기

### 요구사항
- Node.js 18 이상

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/<your-username>/qr-namecard.git
cd qr-namecard

# 의존성 설치
npm install

# 개발 서버 실행 (파일 변경 시 자동 재시작)
npm run dev

# 또는 운영 모드 실행
npm start
```

서버가 시작되면 `http://localhost:3000`에서 접속할 수 있습니다.

### 데모 계정

| 구분 | 사번 | 비밀번호 |
|------|------|----------|
| 관리자 | `admin` | `admin1234` |
| 일반 사용자 | `demo` | `demo1234` |

### 환경변수 (선택)

```bash
cp .env.example .env
```

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `PORT` | 서버 포트 | `3000` |
| `SESSION_SECRET` | 세션 암호화 키 | 내장 기본값 |

## 핵심 구현 포인트

### 1. Canvas 실시간 미리보기
HTML5 Canvas API를 활용하여 명함 앞면(한글)과 뒷면(영문)을 실시간으로 렌더링합니다. 폼 입력값이 변경될 때마다 Canvas를 다시 그려 즉각적인 시각 피드백을 제공합니다.

### 2. vCard QR 코드 생성
입력된 연락처 정보를 vCard 3.0 포맷으로 변환하고, qrcode.js를 통해 QR 코드를 생성하여 명함 뒷면에 자동 삽입합니다. 스마트폰으로 스캔하면 연락처가 바로 저장됩니다.

### 3. 부서 검색 자동완성
SQLite 기반 부서 데이터를 실시간 검색하여 부서명, 주소, 영문명을 자동 입력합니다. 사용자 입력 실수를 줄이고 일관된 명함 정보를 보장합니다.

### 4. Express + SQLite 경량 아키텍처
별도의 DB 서버 설치 없이 SQLite 파일 하나로 동작하는 경량 아키텍처를 채택했습니다. WAL 모드로 동시 읽기 성능을 확보하고, 서버 시작 시 스키마를 자동 생성합니다.

## 라이선스

MIT
