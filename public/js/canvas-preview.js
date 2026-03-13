/**
 * canvas-preview.js - 명함 Canvas 미리보기 + QR 코드 렌더링
 *
 * 3가지 명함 유형(01형, 02형, 03청렴형)의 앞면(한글)/뒷면(영문)을
 * HTML5 Canvas에 렌더링하고, 뒷면에 vCard QR 코드를 삽입한다.
 *
 * 의존성:
 *   - common.js (getValue 함수)
 *   - qrcode.min.js (QRCode.toCanvas)
 *   - Google Fonts: Noto Sans KR
 */

/* ============================================================
   1. 상수
   ============================================================ */

const CARD_W = 500;
const CARD_H = 278;
const GAP = 10;
const TOTAL_W = 1010; // CARD_W + GAP + CARD_W
const BACK_X = 510;   // CARD_W + GAP — 뒷면 X 오프셋

const FONT_FAMILY = "'Noto Sans KR', sans-serif";

/** QR 코드 크기 및 위치 (뒷면 우하단) */
const QR_SIZE = 80;
const QR_X = BACK_X + CARD_W - QR_SIZE - 16; // 뒷면 우측 여백 16px
const QR_Y = CARD_H - QR_SIZE - 16;          // 하단 여백 16px

/** 03형 사진 위치 및 크기 */
const PHOTO_W = 118;
const PHOTO_H = 156;
const PHOTO_X = 363;
const PHOTO_Y = 20;

/* ============================================================
   2. 배경 이미지 프리로드
   ============================================================ */

const bgImages = {};
const BG_TYPES = ['01', '02', '03'];
const BG_FACES = ['front', 'back'];

/**
 * 배경 이미지 6장을 프리로드한다.
 * 로드 실패 시 null로 남겨 두고, 렌더링 시 플레이스홀더를 그린다.
 *
 * @returns {Promise<void>}
 */
function preloadBackgrounds() {
  const promises = [];

  BG_TYPES.forEach(type => {
    BG_FACES.forEach(face => {
      const key = `${type}-${face}`;
      const img = new Image();
      img.src = `/images/card-type${type}-${face}.png`;

      const p = new Promise(resolve => {
        img.onload = () => {
          bgImages[key] = img;
          resolve();
        };
        img.onerror = () => {
          bgImages[key] = null;
          resolve();
        };
      });

      promises.push(p);
    });
  });

  return Promise.all(promises);
}

// 페이지 로드 시 즉시 프리로드 시작
preloadBackgrounds();

/* ============================================================
   3. 텍스트 포맷팅 함수 (SPEC 5-4)
   ============================================================ */

/**
 * 이름 글자 사이에 공백을 삽입한다.
 * "홍길동" -> "홍 길 동"
 *
 * @param {string} name
 * @returns {string}
 */
function formatName(name) {
  if (!name) return '';
  return name.replace(/ /g, '').split('').join(' ');
}

/**
 * 전화번호 문자열에서 숫자만 추출하고 구간별로 분리한다.
 *   02 시작 -> 2-N-4  (예: 02 2000 1234)
 *   그 외   -> 3-N-4  (예: 051 974 3709)
 *
 * @param {string} raw - 예) "0220001234", "02-2000-1234"
 * @returns {string}   - 예) "02 2000 1234"
 */
function splitPhone(raw) {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 9) return digits;

  if (digits.startsWith('02')) {
    // 지역번호 2자리: 02 XXXX XXXX
    const area = '02';
    const last4 = digits.slice(-4);
    const mid = digits.slice(2, digits.length - 4);
    return `${area} ${mid} ${last4}`;
  }

  // 지역번호 3자리: 051 XXXX XXXX / 010 XXXX XXXX
  const area = digits.slice(0, 3);
  const last4 = digits.slice(-4);
  const mid = digits.slice(3, digits.length - 4);
  return `${area} ${mid} ${last4}`;
}

/**
 * 전화번호를 국제 형식으로 변환한다.
 *   02 2000 1234 -> +82 2 2000 1234
 *   051 974 3709 -> +82 51 974 3709
 *   010 1234 5678 -> +82 10 1234 5678
 *
 * @param {string} raw
 * @returns {string}
 */
function splitPhoneIntl(raw) {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 9) return digits;

  if (digits.startsWith('02')) {
    const last4 = digits.slice(-4);
    const mid = digits.slice(2, digits.length - 4);
    return `+82 2 ${mid} ${last4}`;
  }

  // 앞의 0을 제거하고 국제 코드 부착
  const area = digits.slice(1, 3);
  const last4 = digits.slice(-4);
  const mid = digits.slice(3, digits.length - 4);
  return `+82 ${area} ${mid} ${last4}`;
}

/**
 * 한글면 전화/팩스 포맷
 * "TEL 02 2000 1234 FAX 02 2000 5678"
 *
 * @param {string} phone
 * @param {string} fax
 * @returns {string}
 */
function formatPhone(phone, fax) {
  const parts = [];
  if (phone) parts.push('TEL ' + splitPhone(phone));
  if (fax) parts.push('FAX ' + splitPhone(fax));
  return parts.join(' ');
}

/**
 * 영문면 전화/팩스 포맷
 * "T +82 2 2000 1234 F +82 2 2000 5678"
 *
 * @param {string} phone
 * @param {string} fax
 * @returns {string}
 */
function formatPhoneEn(phone, fax) {
  const parts = [];
  if (phone) parts.push('T ' + splitPhoneIntl(phone));
  if (fax) parts.push('F ' + splitPhoneIntl(fax));
  return parts.join(' ');
}

/**
 * 한글면 휴대폰/이메일 포맷
 * "Mobile 010 1234 5678 E-mail hong@company.com"
 *
 * @param {string} mobile
 * @param {string} email
 * @returns {string}
 */
function formatMobile(mobile, email) {
  const parts = [];
  if (mobile) parts.push('Mobile ' + splitPhone(mobile));
  if (email) parts.push('E-mail ' + email);
  return parts.join(' ');
}

/**
 * 영문면 휴대폰/이메일 포맷
 * "M +82 10 1234 5678 E hong@company.com"
 *
 * @param {string} mobile
 * @param {string} email
 * @returns {string}
 */
function formatMobileEn(mobile, email) {
  const parts = [];
  if (mobile) parts.push('M ' + splitPhoneIntl(mobile));
  if (email) parts.push('E ' + email);
  return parts.join(' ');
}

/**
 * 팀/직책을 결합한다.
 * "기획팀", "과장" -> "기획팀 과장"
 *
 * @param {string} team
 * @param {string} title
 * @returns {string}
 */
function formatTitle(team, title) {
  return [team, title].filter(Boolean).join(' ');
}

/* ============================================================
   4. Canvas 텍스트 렌더링 헬퍼
   ============================================================ */

/**
 * Canvas에 텍스트를 렌더링한다.
 * maxWidth를 초과하면 폰트 크기를 자동으로 축소한다.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string}  text     - 렌더링할 텍스트
 * @param {number}  x        - X 좌표
 * @param {number}  y        - Y 좌표
 * @param {number}  maxWidth - 최대 허용 너비 (px)
 * @param {string}  align    - 텍스트 정렬 ("left" | "right" | "center")
 * @param {string}  font     - CSS font 문자열 (예: "bold 25px 'Noto Sans KR'")
 */
function drawText(ctx, text, x, y, maxWidth, align, font) {
  if (!text) return;

  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillStyle = '#333333';

  // maxWidth 초과 시 폰트 크기 축소
  let fontSize = parseInt(font, 10);
  while (ctx.measureText(text).width > maxWidth && fontSize > 8) {
    fontSize--;
    ctx.font = font.replace(/\d+px/, fontSize + 'px');
  }

  ctx.fillText(text, x, y, maxWidth);
}

/* ============================================================
   5. 배경 렌더링
   ============================================================ */

/**
 * Canvas에 배경 이미지를 그린다.
 * 이미지 로드에 실패한 경우 플레이스홀더 사각형을 표시한다.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} type - "01" | "02" | "03"
 */
function drawBackground(ctx, type) {
  const frontImg = bgImages[`${type}-front`];
  const backImg = bgImages[`${type}-back`];

  // --- 앞면 ---
  if (frontImg) {
    ctx.drawImage(frontImg, 0, 0, CARD_W, CARD_H);
  } else {
    ctx.fillStyle = '#EEEEEE';
    ctx.fillRect(0, 0, CARD_W, CARD_H);
    ctx.strokeStyle = '#CCCCCC';
    ctx.strokeRect(0, 0, CARD_W, CARD_H);
    ctx.fillStyle = '#999999';
    ctx.font = `14px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${type}형 앞면`, CARD_W / 2, CARD_H / 2);
  }

  // --- 뒷면 ---
  if (backImg) {
    ctx.drawImage(backImg, BACK_X, 0, CARD_W, CARD_H);
  } else {
    ctx.fillStyle = '#EEEEEE';
    ctx.fillRect(BACK_X, 0, CARD_W, CARD_H);
    ctx.strokeStyle = '#CCCCCC';
    ctx.strokeRect(BACK_X, 0, CARD_W, CARD_H);
    ctx.fillStyle = '#999999';
    ctx.font = `14px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${type}형 뒷면`, BACK_X + CARD_W / 2, CARD_H / 2);
  }
}

/* ============================================================
   6. 앞면(한글) 텍스트 렌더링
   ============================================================ */

/**
 * 앞면(한글)에 입력 폼 데이터를 Canvas에 그린다.
 * 좌표는 SPEC 5-3 기준이다.
 *
 * @param {CanvasRenderingContext2D} ctx
 */
function drawFrontText(ctx) {
  const name     = getValue('nc_name');
  const dept     = getValue('nc_dept');
  const team     = getValue('nc_team');
  const title    = getValue('nc_title');
  const addr     = getValue('nc_addr');
  const phone    = getValue('nc_phone');
  const fax      = getValue('nc_fax');
  const mobile   = getValue('nc_mobile');
  const email    = getValue('nc_email');
  const branchCk = document.getElementById('nc_branch_ck')?.checked;
  const branch   = getValue('nc_branch');

  // 1. 이름 (bold 25px, right 정렬, x=221, y=148, w=154)
  drawText(ctx, formatName(name), 221, 148, 154, 'right',
    `bold 25px ${FONT_FAMILY}`);

  // 2. 부서 (13px, left 정렬, x=245, y=133, w=192)
  drawText(ctx, dept, 245, 133, 192, 'left',
    `13px ${FONT_FAMILY}`);

  // 3. 팀/직책 (bold 15px, left 정렬, x=243, y=152, w=192)
  drawText(ctx, formatTitle(team, title), 243, 152, 192, 'left',
    `bold 15px ${FONT_FAMILY}`);

  // 4. 주소 (14px, left 정렬, x=60, y=207, w=380)
  drawText(ctx, addr, 60, 207, 380, 'left',
    `14px ${FONT_FAMILY}`);

  // 5. 전화/팩스 (14px, left 정렬, x=60, y=227, w=380)
  drawText(ctx, formatPhone(phone, fax), 60, 227, 380, 'left',
    `14px ${FONT_FAMILY}`);

  // 6. 휴대폰/이메일 (14px, left 정렬, x=60, y=247, w=380)
  drawText(ctx, formatMobile(mobile, email), 60, 247, 380, 'left',
    `14px ${FONT_FAMILY}`);

  // 7. 지사명 (14px, left 정렬, x=60, y=187, w=380)
  if (branchCk && branch) {
    drawText(ctx, branch, 60, 187, 380, 'left',
      `14px ${FONT_FAMILY}`);
  }
}

/* ============================================================
   7. 뒷면(영문) 텍스트 렌더링
   ============================================================ */

/**
 * 뒷면(영문)에 입력 폼 데이터를 Canvas에 그린다.
 * 앞면 좌표 + BACK_X(510) 오프셋을 적용한다.
 *
 * @param {CanvasRenderingContext2D} ctx
 */
function drawBackText(ctx) {
  const nameEn   = getValue('nc_name_en');
  const deptEn   = getValue('nc_dept_en');
  const titleEn  = getValue('nc_title_en');
  const addrEn   = getValue('nc_addr_en');
  const phone    = getValue('nc_phone');
  const fax      = getValue('nc_fax');
  const mobile   = getValue('nc_mobile');
  const email    = getValue('nc_email');
  const branchCk = document.getElementById('nc_branch_ck')?.checked;
  const branchEn = getValue('nc_branch_en');

  const ox = BACK_X; // 510px 오프셋

  // 1. 영문 이름 (bold 25px, right, x=221+ox, y=148, w=154)
  drawText(ctx, nameEn, 221 + ox, 148, 154, 'right',
    `bold 25px ${FONT_FAMILY}`);

  // 2. 영문 부서 (13px, left, x=245+ox, y=133, w=192)
  drawText(ctx, deptEn, 245 + ox, 133, 192, 'left',
    `13px ${FONT_FAMILY}`);

  // 3. 영문 직책 (bold 15px, left, x=243+ox, y=152, w=192)
  drawText(ctx, titleEn, 243 + ox, 152, 192, 'left',
    `bold 15px ${FONT_FAMILY}`);

  // 4. 영문 주소 (14px, left, x=60+ox, y=207, w=380)
  drawText(ctx, addrEn, 60 + ox, 207, 380, 'left',
    `14px ${FONT_FAMILY}`);

  // 5. 영문 전화/팩스 (14px, left, x=60+ox, y=227, w=380)
  drawText(ctx, formatPhoneEn(phone, fax), 60 + ox, 227, 380, 'left',
    `14px ${FONT_FAMILY}`);

  // 6. 영문 휴대폰/이메일 (14px, left, x=60+ox, y=247, w=380)
  drawText(ctx, formatMobileEn(mobile, email), 60 + ox, 247, 380, 'left',
    `14px ${FONT_FAMILY}`);

  // 7. 영문 지사명 (14px, left, x=60+ox, y=187, w=380)
  if (branchCk && branchEn) {
    drawText(ctx, branchEn, 60 + ox, 187, 380, 'left',
      `14px ${FONT_FAMILY}`);
  }
}

/* ============================================================
   8. vCard 생성
   ============================================================ */

/**
 * 폼 데이터로부터 vCard 3.0 문자열을 생성한다.
 * gen_qr_namecard.py의 포맷을 그대로 따른다.
 *
 * @param {"ko"|"en"} lang - "ko"이면 한글 vCard, "en"이면 영문 vCard
 * @returns {string}       - vCard 텍스트
 */
function generateVCard(lang) {
  const name     = getValue('nc_name');
  const nameEn   = getValue('nc_name_en');
  const dept     = getValue('nc_dept');
  const deptEn   = getValue('nc_dept_en');
  const team     = getValue('nc_team');
  const title    = getValue('nc_title');
  const titleEn  = getValue('nc_title_en');
  const phone    = getValue('nc_phone');
  const fax      = getValue('nc_fax');
  const mobile   = getValue('nc_mobile');
  const email    = getValue('nc_email');
  const branchCk = document.getElementById('nc_branch_ck')?.checked;
  const branch   = getValue('nc_branch');
  const branchEn = getValue('nc_branch_en');

  // 전화번호를 국제 형식으로 변환 (하이픈 포함)
  function toIntlHyphen(raw) {
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 9) return raw;

    if (digits.startsWith('02')) {
      const last4 = digits.slice(-4);
      const mid = digits.slice(2, digits.length - 4);
      return `+82-2-${mid}-${last4}`;
    }

    const area = digits.slice(1, 3);
    const last4 = digits.slice(-4);
    const mid = digits.slice(3, digits.length - 4);
    return `+82-${area}-${mid}-${last4}`;
  }

  const cellIntl = toIntlHyphen(mobile);
  const workIntl = toIntlHyphen(phone);

  // 조직명: "한국공항공사" (지사가 있으면 "한국공항공사 지사명")
  const orgBase = '한국공항공사';
  const orgBaseEn = 'Korea Airports Corporation';

  if (lang === 'ko') {
    // 한글 vCard
    const orgKo = branchCk && branch
      ? `${orgBase} ${branch}`
      : orgBase;
    const fnKo = branchCk && branch
      ? `${orgBase}(${branch}) ${name} ${title}`
      : `${orgBase} ${name} ${title}`;

    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${name};;;;`,
      `FN:${fnKo}`,
      `ORG:${orgKo};${dept}`,
      `TITLE:${title}`,
      `TEL;TYPE=CELL:${cellIntl}`,
      `TEL;TYPE=WORK:${workIntl}`,
      `EMAIL;TYPE=WORK:${email}`,
      'END:VCARD'
    ].join('\n');
  }

  // 영문 vCard
  // 이름 분리: "Gildong HONG" -> first="Gildong", last="HONG"
  const nameParts = nameEn.split(/\s+/);
  let firstName, lastName;
  if (nameParts.length >= 2) {
    lastName = nameParts[nameParts.length - 1];
    firstName = nameParts.slice(0, -1).join(' ');
  } else {
    firstName = nameEn;
    lastName = '';
  }

  const orgEn = branchCk && branchEn
    ? `${orgBaseEn}, ${branchEn}`
    : orgBaseEn;
  const fnEn = branchCk && branchEn
    ? `${firstName} ${lastName} (KAC ${branchEn})`
    : `${firstName} ${lastName}`;

  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${fnEn}`,
    `ORG:${orgEn};${deptEn}`,
    `TITLE:${titleEn}`,
    `TEL;TYPE=CELL:${cellIntl}`,
    `TEL;TYPE=WORK:${workIntl}`,
    `EMAIL;TYPE=WORK:${email}`,
    'END:VCARD'
  ].join('\n');
}

/* ============================================================
   9. QR 코드 렌더링
   ============================================================ */

/**
 * vCard 텍스트를 QR 코드로 변환하여 Canvas에 그린다.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} vcardText - vCard 전체 문자열
 * @param {number} x         - QR 코드 X 좌표
 * @param {number} y         - QR 코드 Y 좌표
 * @param {number} size      - QR 코드 크기 (px)
 * @returns {Promise<void>}
 */
async function drawQR(ctx, vcardText, x, y, size) {
  if (!vcardText || typeof QRCode === 'undefined') return;

  try {
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, vcardText, {
      width: size,
      margin: 1,
      color: {
        dark: '#0B3D6B',
        light: '#FFFFFF'
      }
    });
    ctx.drawImage(qrCanvas, x, y, size, size);
  } catch (err) {
    console.warn('QR 코드 생성 실패:', err);
  }
}

/* ============================================================
   10. 사진 렌더링 (03형 전용)
   ============================================================ */

/**
 * 업로드된 사진 파일을 Canvas 앞면에 렌더링한다.
 * 03형(청렴형)에서만 사용한다.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @returns {Promise<void>}
 */
async function drawPhoto(ctx) {
  // 사진 파일 입력 필드 (nc_zip_file은 단체, 개인은 별도 input이 있을 수 있음)
  // 개인주문에서 사진 업로드가 있으면 해당 파일을 사용
  const fileInput = document.getElementById('nc_photo') ||
                    document.getElementById('nc_zip_file');
  if (!fileInput || !fileInput.files || !fileInput.files[0]) return;

  const file = fileInput.files[0];

  // zip이 아닌 이미지 파일만 처리
  if (!file.type.startsWith('image/')) return;

  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        ctx.drawImage(img, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);
        resolve();
      };
      img.onerror = resolve;
      img.src = e.target.result;
    };
    reader.onerror = resolve;
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   11. 메인 렌더링 함수 — doApply()
   ============================================================ */

/**
 * 모든 명함 유형(01, 02, 03)을 Canvas에 렌더링한다.
 *
 * 호출 시점:
 *   - "미리보기" 버튼 클릭
 *
 * 처리 순서:
 *   1. 폰트 로딩 대기
 *   2. 배경 이미지 로드 확인
 *   3. 유형별 Canvas에 배경 -> 앞면 텍스트 -> 뒷면 텍스트 -> QR 코드 렌더링
 *   4. 03형은 사진도 그림
 *   5. 미리보기 영역 표시 및 스크롤 이동
 */
async function doApply() {
  // 폰트 로딩 대기
  await document.fonts.ready;

  // 배경 이미지가 아직 로드 중이면 대기
  await preloadBackgrounds();

  // vCard 생성 (한글/영문)
  const vcardKo = generateVCard('ko');
  const vcardEn = generateVCard('en');

  const types = ['01', '02', '03'];

  for (const type of types) {
    const canvas = document.getElementById('canvas' + type);
    if (!canvas) continue;

    const ctx = canvas.getContext('2d');

    // Canvas 초기화
    ctx.clearRect(0, 0, TOTAL_W, CARD_H);

    // 1. 배경 그리기 (앞면 + 뒷면)
    drawBackground(ctx, type);

    // 2. 앞면(한글) 텍스트 렌더링
    drawFrontText(ctx);

    // 3. 뒷면(영문) 텍스트 렌더링
    drawBackText(ctx);

    // 4. 03형: 사진 렌더링
    if (type === '03') {
      await drawPhoto(ctx);
    }

    // 5. 뒷면에 QR 코드 렌더링 (영문 vCard 사용)
    await drawQR(ctx, vcardEn, QR_X, QR_Y, QR_SIZE);
  }

  // 미리보기 영역 표시 및 스크롤 이동
  const previewArea = document.getElementById('previewArea');
  if (previewArea) {
    previewArea.style.display = '';
    previewArea.scrollIntoView({ behavior: 'smooth' });
  }
}
