/**
 * app-order.js - 명함 주문 페이지 메인 컨트롤러
 *
 * order.html의 모든 UI 요소를 연결하고 페이지 초기화를 담당한다.
 * - 인증 확인 및 헤더 사용자 표시
 * - 탭 전환 (개인주문 / 단체주문)
 * - 버튼 핸들러 (지우기, 미리보기, 발주, 로그아웃)
 * - 폼 데이터 수집 및 주문 API 호출
 *
 * 의존성:
 *   - common.js      (requireAuth, updateHeaderUser, apiFetch, getValue, clearForm,
 *                      showToast, formatNumber, logout)
 *   - price-calc.js  (calculatePrice)
 *   - form-validation.js (validateIndividualOrder, validateBulkOrder)
 *   - canvas-preview.js  (doApply)
 */

/* ============================================================
   1. 페이지 초기화
   ============================================================ */

document.addEventListener('DOMContentLoaded', async function () {

  // ---- 인증 확인 ----
  var user = await requireAuth();
  if (!user) return;

  updateHeaderUser(user);

  // ---- UI 초기화 ----
  initTabs();
  initButtons();
  initLogout();
});

/* ============================================================
   2. 탭 전환 (개인주문 / 단체주문)
   ============================================================ */

/**
 * 탭 버튼과 패널 전환을 초기화한다.
 *
 * 동작:
 *   - "개인주문" 탭 클릭 → panelIndividual 표시, panelBulk 숨김
 *   - "단체주문" 탭 클릭 → panelBulk 표시, panelIndividual 숨김
 *   - aria-selected, active 클래스, hidden 속성을 올바르게 토글
 */
function initTabs() {
  var tabIndividual   = document.getElementById('tabIndividual');
  var tabBulk         = document.getElementById('tabBulk');
  var panelIndividual = document.getElementById('panelIndividual');
  var panelBulk       = document.getElementById('panelBulk');

  if (!tabIndividual || !tabBulk || !panelIndividual || !panelBulk) return;

  tabIndividual.addEventListener('click', function () {
    // 탭 활성 상태
    tabIndividual.classList.add('active');
    tabIndividual.setAttribute('aria-selected', 'true');
    tabBulk.classList.remove('active');
    tabBulk.setAttribute('aria-selected', 'false');

    // 패널 전환
    panelIndividual.classList.add('active');
    panelIndividual.removeAttribute('hidden');
    panelBulk.classList.remove('active');
    panelBulk.setAttribute('hidden', '');
  });

  tabBulk.addEventListener('click', function () {
    // 탭 활성 상태
    tabBulk.classList.add('active');
    tabBulk.setAttribute('aria-selected', 'true');
    tabIndividual.classList.remove('active');
    tabIndividual.setAttribute('aria-selected', 'false');

    // 패널 전환
    panelBulk.classList.add('active');
    panelBulk.removeAttribute('hidden');
    panelIndividual.classList.remove('active');
    panelIndividual.setAttribute('hidden', '');
  });
}

/* ============================================================
   3. 버튼 핸들러
   ============================================================ */

/**
 * 하단 액션 버튼들(지우기, 미리보기, 발주)의 이벤트를 바인딩한다.
 */
function initButtons() {
  var btnClear   = document.getElementById('btnClear');
  var btnPreview = document.getElementById('btnPreview');
  var btnOrder   = document.getElementById('btnOrder');

  // ---- 지우기 (Clear) ----
  if (btnClear) {
    btnClear.addEventListener('click', function () {
      if (!confirm('입력한 내용을 모두 지우시겠습니까?')) return;

      // 개인주문 & 단체주문 폼 초기화
      clearForm('panelIndividual');
      clearForm('panelBulk');

      // 가격 표시 초기화 (1갑 기본 가격)
      var priceDisplay = document.getElementById('priceDisplay');
      if (priceDisplay) {
        priceDisplay.textContent = '\u20A9' + formatNumber(calculatePrice(1));
      }

      // 수량 사유 입력란 숨김
      var qtyReasonGroup = document.getElementById('qtyReasonGroup');
      if (qtyReasonGroup) {
        qtyReasonGroup.style.display = 'none';
      }

      // 지사 입력 그룹 숨김
      var branchGroup = document.getElementById('branchGroup');
      var branchEnGroup = document.getElementById('branchEnGroup');
      if (branchGroup) branchGroup.style.display = 'none';
      if (branchEnGroup) branchEnGroup.style.display = 'none';

      // 미리보기 영역 숨김
      var previewArea = document.getElementById('previewArea');
      if (previewArea) {
        previewArea.style.display = 'none';
      }

      // 발주 확인 체크박스 해제
      var confirmCheck = document.getElementById('confirmCheck');
      if (confirmCheck) {
        confirmCheck.checked = false;
      }

      showToast('입력 내용이 초기화되었습니다.');
    });
  }

  // ---- 미리보기 (Preview) ----
  if (btnPreview) {
    btnPreview.addEventListener('click', function () {
      doApply();
    });
  }

  // ---- 발주 (Order) ----
  if (btnOrder) {
    btnOrder.addEventListener('click', async function () {
      // 현재 활성 탭 확인
      var isBulk = isCurrentTabBulk();

      // 유효성 검사
      var valid = isBulk ? validateBulkOrder() : validateIndividualOrder();
      if (!valid) return;

      // 단체주문: 파일 업로드 처리
      if (isBulk) {
        var uploadOk = await uploadBulkFiles();
        if (!uploadOk) return;
      }

      // 폼 데이터 수집
      var formData = collectFormData(isBulk);

      // 주문 생성 API 호출
      var result = await apiFetch('/api/orders/create', {
        method: 'POST',
        body: formData
      });

      if (!result || result.code !== 'succ') {
        // apiFetch 내부에서 오류 토스트가 이미 처리됨
        return;
      }

      // 장바구니에 추가
      var cartResult = await apiFetch('/api/cart/add', {
        method: 'POST',
        body: { order_id: result.order_id }
      });

      if (!cartResult || cartResult.code !== 'succ') {
        showToast('장바구니 추가 중 오류가 발생했습니다.');
        return;
      }

      showToast('발주가 완료되었습니다!');

      // 장바구니 이동 여부 확인
      if (confirm('발주가 완료되었습니다. 장바구니로 이동하시겠습니까?')) {
        window.location.href = '/cart.html';
      }
    });
  }
}

/* ============================================================
   4. 로그아웃 버튼 핸들러
   ============================================================ */

/**
 * 헤더의 로그아웃 버튼에 이벤트를 바인딩한다.
 */
function initLogout() {
  var btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', function () {
      logout();
    });
  }
}

/* ============================================================
   5. 현재 활성 탭 확인
   ============================================================ */

/**
 * 현재 단체주문 탭이 활성 상태인지 확인한다.
 *
 * @returns {boolean} 단체주문 탭이 활성이면 true, 개인주문이면 false
 */
function isCurrentTabBulk() {
  var tabBulk = document.getElementById('tabBulk');
  if (!tabBulk) return false;
  return tabBulk.getAttribute('aria-selected') === 'true';
}

/* ============================================================
   6. 폼 데이터 수집
   ============================================================ */

/**
 * 현재 활성 탭에 맞는 주문 데이터를 객체로 수집한다.
 *
 * @param {boolean} isBulk - 단체주문 여부
 * @returns {object} 서버에 전송할 주문 데이터
 */
function collectFormData(isBulk) {
  if (isBulk) {
    return {
      order_type: 'bulk',
      nc_type: getValue('nc_type'),
      nc_qty: parseInt(getValue('nc_qty_bulk'), 10) || 1,
      total_price: calculatePrice(parseInt(getValue('nc_qty_bulk'), 10) || 1)
    };
  }

  return {
    order_type: 'individual',
    nc_type: getValue('nc_type'),
    nc_qty: parseInt(getValue('nc_qty'), 10) || 1,
    nc_qty_reason: getValue('nc_qty_reason'),
    nc_name: getValue('nc_name'),
    nc_dept: getValue('nc_dept'),
    nc_team: getValue('nc_team'),
    nc_title: getValue('nc_title'),
    nc_addr: getValue('nc_addr'),
    nc_phone: getValue('nc_phone'),
    nc_fax: getValue('nc_fax'),
    nc_mobile: getValue('nc_mobile'),
    nc_email: getValue('nc_email'),
    nc_branch_ck: document.getElementById('nc_branch_ck')?.checked ? 1 : 0,
    nc_branch: getValue('nc_branch'),
    nc_name_en: getValue('nc_name_en'),
    nc_dept_en: getValue('nc_dept_en'),
    nc_title_en: getValue('nc_title_en'),
    nc_addr_en: getValue('nc_addr_en'),
    nc_branch_en: getValue('nc_branch_en'),
    nc_info: getValue('nc_info'),
    total_price: calculatePrice(parseInt(getValue('nc_qty'), 10) || 1)
  };
}

/* ============================================================
   7. 단체주문 파일 업로드
   ============================================================ */

/**
 * 단체주문 시 엑셀 파일(필수)과 zip 사진 파일(선택)을 서버에 업로드한다.
 *
 * @returns {Promise<boolean>} 업로드 성공 시 true, 실패 시 false
 */
async function uploadBulkFiles() {
  var excelInput = document.getElementById('nc_excel_file');
  var zipInput   = document.getElementById('nc_zip_file');

  if (!excelInput || !excelInput.files || !excelInput.files[0]) {
    showToast('엑셀 파일을 선택해주세요.');
    return false;
  }

  var formData = new FormData();
  formData.append('excel', excelInput.files[0]);

  if (zipInput && zipInput.files && zipInput.files[0]) {
    formData.append('zip', zipInput.files[0]);
  }

  try {
    var res = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData
    });

    var data = await res.json();

    if (!data || data.code !== 'succ') {
      showToast(data?.message || data?.msg || '파일 업로드 중 오류가 발생했습니다.');
      return false;
    }

    return true;
  } catch (err) {
    showToast('파일 업로드 중 오류가 발생했습니다.');
    return false;
  }
}
