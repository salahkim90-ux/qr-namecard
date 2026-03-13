/**
 * price-calc.js - 가격 계산 및 UI 연동
 *
 * SPEC.md 섹션 8에 정의된 가격 계산 로직과
 * 수량 변경, 지사 체크박스 등의 UI 이벤트를 처리한다.
 *
 * 의존성: common.js (formatNumber)
 */

/* ============================================================
   가격 상수 및 계산 함수
   ============================================================ */

/** 1갑(200매) 기본 단가 (부가세 미포함) */
var UNIT_PRICE = 19000;

/** 부가세율 10% */
var TAX_RATE = 0.1;

/**
 * 수량에 따른 총 주문금액을 계산한다 (부가세 포함).
 * 1갑 = 19,000 x 1.1 = 20,900원
 *
 * @param {number} qty - 주문 수량 (갑 단위)
 * @returns {number} 부가세 포함 총액 (원 단위, 소수점 이하 버림)
 */
function calculatePrice(qty) {
  return Math.floor(qty * UNIT_PRICE * (1 + TAX_RATE));
}

/* ============================================================
   UI 이벤트 바인딩 - 가격 표시 업데이트
   ============================================================ */

(function () {
  var qtySelect   = document.getElementById('nc_qty');
  var qtyBulk     = document.getElementById('nc_qty_bulk');
  var priceDisplay = document.getElementById('priceDisplay');
  var reasonGroup  = document.getElementById('qtyReasonGroup');

  /**
   * 가격 표시 영역을 업데이트한다.
   *
   * @param {number} qty - 수량
   */
  function updatePrice(qty) {
    if (!priceDisplay) return;
    var price = calculatePrice(qty);
    priceDisplay.textContent = '\u20A9' + formatNumber(price);
  }

  // 개인주문 수량 select 변경 시
  if (qtySelect) {
    qtySelect.addEventListener('change', function () {
      var qty = parseInt(qtySelect.value, 10) || 1;
      updatePrice(qty);

      // 수량 2갑 이상이면 사유 입력란 표시, 1갑이면 숨김
      if (reasonGroup) {
        reasonGroup.style.display = qty > 1 ? '' : 'none';
      }
    });
  }

  // 단체주문 수량 input 변경 시 (keyup/input)
  if (qtyBulk) {
    qtyBulk.addEventListener('input', function () {
      var qty = parseInt(qtyBulk.value, 10) || 0;
      updatePrice(qty);
    });
  }
})();

/* ============================================================
   UI 이벤트 바인딩 - 지사 체크박스 토글
   ============================================================ */

(function () {
  var branchCk      = document.getElementById('nc_branch_ck');
  var branchGroup   = document.getElementById('branchGroup');
  var branchEnGroup = document.getElementById('branchEnGroup');

  if (branchCk) {
    branchCk.addEventListener('change', function () {
      var show = branchCk.checked;
      if (branchGroup)   branchGroup.style.display   = show ? '' : 'none';
      if (branchEnGroup) branchEnGroup.style.display = show ? '' : 'none';
    });
  }
})();
