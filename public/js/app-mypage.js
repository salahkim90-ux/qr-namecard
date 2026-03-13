/**
 * app-mypage.js - 마이페이지 전용 스크립트
 *
 * 의존: common.js (requireAuth, updateHeaderUser, apiFetch, formatNumber, showToast, logout)
 * 필수 HTML: #headerUser, #ordersBody, #ordersTable, #emptyState, #btnLogout
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 인증 확인
  const user = await requireAuth();
  if (!user) return;

  // 헤더 사용자 정보 표시
  updateHeaderUser(user);

  // 로그아웃 버튼
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', logout);
  }

  // 주문내역 로드
  await loadOrders();
});

/**
 * 서버에서 내 주문내역을 조회하여 렌더링한다.
 */
async function loadOrders() {
  try {
    const result = await apiFetch('/api/orders/my');
    if (result.code === 'succ') {
      renderOrders(result.orders || []);
    } else {
      renderOrders([]);
    }
  } catch (err) {
    showToast('주문내역을 불러오는 중 오류가 발생했습니다.');
    renderOrders([]);
  }
}

/**
 * 주문 목록을 테이블에 렌더링한다.
 *
 * @param {Array} orders - 주문 배열
 */
function renderOrders(orders) {
  const tbody = document.getElementById('ordersBody');
  const table = document.getElementById('ordersTable');
  const emptyState = document.getElementById('emptyState');

  if (!tbody) return;

  // 주문이 없으면 empty state 표시
  if (!orders || orders.length === 0) {
    tbody.innerHTML = '';
    if (table) table.classList.add('d-none');
    if (emptyState) emptyState.classList.remove('d-none');
    return;
  }

  // 주문이 있으면 테이블 표시
  if (table) table.classList.remove('d-none');
  if (emptyState) emptyState.classList.add('d-none');

  tbody.innerHTML = orders.map((order, index) => {
    const rowNum = orders.length - index;
    const dateStr = formatDate(order.created_at || order.order_date);
    const typeName = getTypeName(order.nc_type || order.type);
    const name = escapeHtml(order.nc_name || order.name || '-');
    const qty = order.nc_qty || order.qty || '-';
    const price = order.total_price != null ? '\u20A9' + formatNumber(order.total_price) : '-';
    const statusBadge = getStatusBadge(order.status);

    return `<tr>
      <td>${rowNum}</td>
      <td>${dateStr}</td>
      <td>${typeName}</td>
      <td>${name}</td>
      <td>${qty}갑</td>
      <td>${price}</td>
      <td>${statusBadge}</td>
    </tr>`;
  }).join('');
}

/**
 * 날짜 문자열을 사람이 읽기 쉬운 형식으로 변환한다.
 *
 * @param {string} dateStr - ISO 날짜 문자열
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${min}`;
  } catch {
    return dateStr;
  }
}

/**
 * 명함유형 코드를 한글명으로 변환한다.
 *
 * @param {string} type - 유형 코드 (01, 02, 03 등)
 * @returns {string}
 */
function getTypeName(type) {
  const typeMap = {
    '01': '01형',
    '02': '02형',
    '03': '03청렴형'
  };
  return typeMap[type] || type || '-';
}

/**
 * 상태 코드에 맞는 배지 HTML을 반환한다.
 *
 * @param {string} status - 상태 코드
 * @returns {string} HTML 문자열
 */
function getStatusBadge(status) {
  const statusMap = {
    pending:   { label: '대기중', cls: 'badge-pending' },
    confirmed: { label: '확정',   cls: 'badge-confirmed' },
    printing:  { label: '인쇄중', cls: 'badge-printing' },
    completed: { label: '완료',   cls: 'badge-completed' },
    cancelled: { label: '취소',   cls: 'badge-cancelled' }
  };

  const info = statusMap[status] || { label: status || '-', cls: 'badge-pending' };
  return `<span class="badge-status ${info.cls}">${info.label}</span>`;
}

/**
 * HTML 특수문자를 이스케이프 처리한다.
 *
 * @param {string} str - 원본 문자열
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
