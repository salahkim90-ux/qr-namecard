/**
 * common.js - 명함 주문 시스템 공통 유틸리티
 *
 * 모든 페이지에서 공유하는 함수들을 제공합니다.
 * <script src="/js/common.js"> 로 로드하여 전역 스코프에서 사용합니다.
 *
 * 필수 HTML: <div class="toast" id="toast"></div>
 */

/* ============================================================
   1. Toast 알림
   ============================================================ */

/**
 * 화면 하단에 토스트 메시지를 표시한다.
 * (digital_namecard.html 367-372행 패턴 재사용)
 *
 * @param {string} msg      - 표시할 메시지
 * @param {number} duration - 표시 시간(ms), 기본 2500
 */
function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/* ============================================================
   2. API fetch 래퍼
   ============================================================ */

/**
 * JSON 처리와 에러 핸들링을 포함하는 fetch 래퍼.
 *
 * @param {string} url          - 요청 URL
 * @param {object} options      - fetch 옵션 (method, body 등)
 * @returns {Promise<object>}   - 파싱된 JSON 응답
 */
async function apiFetch(url, options = {}) {
  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
    options.headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
  }

  const res = await fetch(url, options);
  const data = await res.json();

  if (data.code === 'fail') {
    showToast(data.message || data.msg || '요청 처리 중 오류가 발생했습니다.');
  }

  return data;
}

/* ============================================================
   3. 인증 확인
   ============================================================ */

/**
 * 로그인 여부를 확인하고, 미로그인 시 로그인 페이지로 리다이렉트한다.
 *
 * @returns {Promise<object|null>} - 로그인된 사용자 객체 또는 null
 */
async function requireAuth() {
  try {
    const data = await apiFetch('/api/auth/me');
    if (!data || data.code === 'fail' || !data.user) {
      location.href = '/index.html';
      return null;
    }
    return data.user;
  } catch (e) {
    location.href = '/index.html';
    return null;
  }
}

/* ============================================================
   4. 헤더 사용자 정보 표시
   ============================================================ */

/**
 * 헤더 영역에 로그인한 사용자 이름을 표시한다.
 *
 * @param {object} user - 사용자 객체 (user.name 필요)
 */
function updateHeaderUser(user) {
  const el = document.getElementById('headerUser');
  if (el && user && user.name) {
    el.textContent = user.name + '님';
  }
}

/* ============================================================
   5. 로그아웃
   ============================================================ */

/**
 * 서버에 로그아웃 요청 후 로그인 페이지로 이동한다.
 */
async function logout() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    // 로그아웃 실패해도 로그인 페이지로 이동
  }
  location.href = '/index.html';
}

/* ============================================================
   6. 폼 유틸리티
   ============================================================ */

/**
 * id로 폼 필드 값을 가져온다 (공백 제거).
 *
 * @param {string} id - 요소 id
 * @returns {string}
 */
function getValue(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

/**
 * id로 폼 필드 값을 설정한다.
 *
 * @param {string} id    - 요소 id
 * @param {string} value - 설정할 값
 */
function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

/**
 * 컨테이너 내의 모든 폼 필드를 초기화한다.
 *
 * @param {string} containerId - 컨테이너 요소 id
 */
function clearForm(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.type === 'checkbox') el.checked = false;
    else el.value = '';
  });
}

/* ============================================================
   7. 숫자 포맷
   ============================================================ */

/**
 * 숫자를 한국 로케일 형식(천 단위 쉼표)으로 변환한다.
 *
 * @param {number|string} num - 변환할 숫자
 * @returns {string}
 */
function formatNumber(num) {
  return Number(num).toLocaleString('ko-KR');
}
