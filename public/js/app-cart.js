/**
 * app-cart.js - 장바구니 페이지 로직
 *
 * 장바구니 목록 조회, 삭제, 주문확정 기능을 처리합니다.
 * 의존: common.js (apiFetch, requireAuth, updateHeaderUser, showToast, formatNumber, logout)
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;

  updateHeaderUser(user);
  setupLogout();
  setupCheckAll();
  setupConfirmOrder();
  loadCart();
});

/* ============================================================
   1. 장바구니 로드
   ============================================================ */

async function loadCart() {
  const result = await apiFetch('/api/cart');
  if (result.code === 'succ') {
    renderCart(result.items);
    updateTotal(result.items);
  }
}

/* ============================================================
   2. 장바구니 렌더링
   ============================================================ */

function renderCart(items) {
  const tbody = document.getElementById('cartBody');
  const emptyEl = document.getElementById('cartEmpty');
  const summaryEl = document.getElementById('cartSummary');

  if (!items || items.length === 0) {
    tbody.innerHTML = '';
    emptyEl.classList.remove('d-none');
    summaryEl.style.display = 'none';
    return;
  }

  emptyEl.classList.add('d-none');
  summaryEl.style.display = '';

  tbody.innerHTML = items.map((item, idx) => `
    <tr data-id="${item.cart_id}">
      <td class="col-checkbox">
        <input type="checkbox" class="cart-check" value="${item.cart_id}">
      </td>
      <td class="col-no">${idx + 1}</td>
      <td class="col-type">${escapeHtml(item.nc_type || '')}</td>
      <td>${escapeHtml(item.nc_name || '')}</td>
      <td>${escapeHtml(item.nc_dept || '')}</td>
      <td class="col-qty">${item.nc_qty || 1}</td>
      <td class="col-price price-cell">&won;${formatNumber(item.total_price || 0)}</td>
      <td class="col-action">
        <button type="button" class="btn-delete" onclick="removeItem(${item.cart_id})">삭제</button>
      </td>
    </tr>
  `).join('');

  // Reset check-all state
  document.getElementById('checkAll').checked = false;
}

/* ============================================================
   3. 금액 합계 갱신
   ============================================================ */

function updateTotal(items) {
  const total = (items || []).reduce((sum, item) => sum + (item.total_price || 0), 0);
  document.getElementById('cartTotal').textContent = formatNumber(total);
}

/* ============================================================
   4. 개별 삭제
   ============================================================ */

async function removeItem(cartId) {
  if (!confirm('장바구니에서 삭제하시겠습니까?')) return;

  const result = await apiFetch(`/api/cart/${cartId}`, { method: 'DELETE' });
  if (result.code === 'succ') {
    showToast('삭제되었습니다.');
    loadCart();
  }
}

/* ============================================================
   5. 전체 선택 / 해제
   ============================================================ */

function setupCheckAll() {
  const checkAll = document.getElementById('checkAll');
  checkAll.addEventListener('change', () => {
    const boxes = document.querySelectorAll('.cart-check');
    boxes.forEach(cb => { cb.checked = checkAll.checked; });
  });
}

/* ============================================================
   6. 주문확정
   ============================================================ */

function setupConfirmOrder() {
  document.getElementById('btnConfirmOrder').addEventListener('click', async () => {
    const checked = document.querySelectorAll('.cart-check:checked');
    if (checked.length === 0) {
      showToast('주문할 항목을 선택해주세요.');
      return;
    }

    const ids = Array.from(checked).map(cb => Number(cb.value));

    if (!confirm(`선택한 ${ids.length}건을 주문확정 하시겠습니까?`)) return;

    const result = await apiFetch('/api/orders', {
      method: 'POST',
      body: { cart_ids: ids }
    });

    if (result.code === 'succ') {
      showToast('주문이 확정되었습니다.');
      loadCart();
    }
  });
}

/* ============================================================
   7. 로그아웃
   ============================================================ */

function setupLogout() {
  const btn = document.getElementById('btnLogout');
  if (btn) {
    btn.addEventListener('click', logout);
  }
}

/* ============================================================
   8. 유틸리티
   ============================================================ */

/**
 * HTML 특수문자를 이스케이프한다.
 *
 * @param {string} str - 이스케이프할 문자열
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
