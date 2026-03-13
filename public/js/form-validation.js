/**
 * form-validation.js - 명함 주문 폼 유효성 검사
 *
 * SPEC.md 섹션 9에 정의된 검증 순서를 그대로 따른다.
 * - 개인주문: 17단계 순차 검증 + 최종 발주 확인
 * - 단체주문: 엑셀 파일 + 확인 체크
 *
 * 의존성: common.js (getValue)
 */

/* ============================================================
   내부 헬퍼 함수
   ============================================================ */

/**
 * 필드가 비어있으면 경고 후 포커스한다.
 *
 * @param {string} fieldId - 검사할 필드의 id
 * @param {string} message - alert에 표시할 메시지
 * @returns {boolean} 비어있으면 true, 값이 있으면 false
 */
function _isEmpty(fieldId, message) {
  if (!getValue(fieldId)) {
    alert(message);
    var el = document.getElementById(fieldId);
    if (el) el.focus();
    return true;
  }
  return false;
}

/**
 * 팀/직책 필드에 "/"가 포함되어 있는지 확인한다.
 * "/"가 없으면 사용자에게 그대로 사용할지 confirm 한다.
 *
 * @param {string} fieldId - 검사할 필드의 id (nc_title 또는 nc_title_en)
 * @returns {boolean} 계속 진행해도 되면 true, 중단이면 false
 */
function _checkSlash(fieldId) {
  var val = getValue(fieldId);
  if (val && val.indexOf('/') === -1) {
    var ok = confirm("팀/직책에 '/'가 없습니다. 그대로 사용하시겠습니까?");
    if (!ok) {
      var el = document.getElementById(fieldId);
      if (el) el.focus();
      return false;
    }
  }
  return true;
}

/* ============================================================
   개인주문 유효성 검사
   ============================================================ */

/**
 * 개인주문 폼의 유효성을 SPEC 섹션 9 순서대로 검사한다.
 *
 * 검증 순서 (17단계 + 최종 확인):
 *  1. nc_type       - 명함 유형 선택 여부
 *  2. nc_qty        - 수량 선택 여부
 *  3. nc_name       - 이름 입력 여부
 *  4. nc_dept       - 부서 입력 여부
 *  5. nc_title      - 팀/직책에 "/" 없으면 confirm
 *  6. nc_addr       - 주소 입력 여부
 *  7. nc_phone      - 전화번호 입력 여부
 *  8. nc_fax        - 팩스 입력 여부
 *  9. nc_mobile     - 휴대폰 입력 여부
 * 10. nc_email      - 이메일 입력 여부
 * 11. nc_branch     - 지사 체크 시 지사명 입력 여부
 * 12. nc_name_en    - 영문 이름 입력 여부
 * 13. nc_dept_en    - 영문 부서 입력 여부
 * 14. nc_title_en   - 영문 직책 "/" 확인
 * 15. nc_addr_en    - 영문 주소 입력 여부
 * 16. nc_branch_en  - 지사 체크 시 영문 지사명 입력 여부
 * 17. confirmCheck  - "입력한 모든 항목에 이상이 없음" 체크 여부
 * 18. 최종 발주 확인 다이얼로그
 *
 * @returns {boolean} 모든 검증 통과 시 true, 실패 시 false
 */
function validateIndividualOrder() {

  // 1. 명함 유형 선택 여부
  if (_isEmpty('nc_type', '명함 유형을 선택해주세요.')) return false;

  // 2. 수량 선택 여부
  if (_isEmpty('nc_qty', '수량을 선택해주세요.')) return false;

  // 3. 이름 입력 여부
  if (_isEmpty('nc_name', '이름을 입력해주세요.')) return false;

  // 4. 부서 입력 여부
  if (_isEmpty('nc_dept', '부서를 입력해주세요.')) return false;

  // 5. 팀/직책 "/" 확인
  if (!_checkSlash('nc_title')) return false;

  // 6. 주소 입력 여부
  if (_isEmpty('nc_addr', '주소를 입력해주세요.')) return false;

  // 7. 전화번호 입력 여부
  if (_isEmpty('nc_phone', '전화번호를 입력해주세요.')) return false;

  // 8. 팩스 입력 여부
  if (_isEmpty('nc_fax', '팩스를 입력해주세요.')) return false;

  // 9. 휴대폰 입력 여부
  if (_isEmpty('nc_mobile', '휴대폰 번호를 입력해주세요.')) return false;

  // 10. 이메일 입력 여부
  if (_isEmpty('nc_email', '이메일을 입력해주세요.')) return false;

  // 11. 지사 체크 시 지사명 입력 여부
  var branchCk = document.getElementById('nc_branch_ck');
  if (branchCk && branchCk.checked) {
    if (_isEmpty('nc_branch', '지사명을 입력해주세요.')) return false;
  }

  // 12. 영문 이름 입력 여부
  if (_isEmpty('nc_name_en', '영문 이름을 입력해주세요.')) return false;

  // 13. 영문 부서 입력 여부
  if (_isEmpty('nc_dept_en', '영문 부서를 입력해주세요.')) return false;

  // 14. 영문 직책 "/" 확인
  if (!_checkSlash('nc_title_en')) return false;

  // 15. 영문 주소 입력 여부
  if (_isEmpty('nc_addr_en', '영문 주소를 입력해주세요.')) return false;

  // 16. 지사 체크 시 영문 지사명 입력 여부
  if (branchCk && branchCk.checked) {
    if (_isEmpty('nc_branch_en', '영문 지사명을 입력해주세요.')) return false;
  }

  // 17. "입력한 모든 항목에 이상이 없음" 체크 여부
  var confirmEl = document.getElementById('confirmCheck');
  if (!confirmEl || !confirmEl.checked) {
    alert('입력한 모든 항목에 이상이 없음을 확인해주세요.');
    if (confirmEl) confirmEl.focus();
    return false;
  }

  // 18. 최종 발주 확인
  if (!confirm('선택한 정보로 발주합니다.')) return false;

  return true;
}

/* ============================================================
   단체주문 유효성 검사
   ============================================================ */

/**
 * 단체주문 폼의 유효성을 검사한다.
 *
 * 검증 순서:
 *  1. nc_excel_file - 엑셀 파일 업로드 여부
 *  2. confirmCheck  - "입력한 모든 항목에 이상이 없음" 체크 여부
 *  3. 최종 발주 확인 다이얼로그
 *
 * @returns {boolean} 모든 검증 통과 시 true, 실패 시 false
 */
function validateBulkOrder() {

  // 1. 엑셀 파일 업로드 여부
  var fileInput = document.getElementById('nc_excel_file');
  if (!fileInput || !fileInput.value) {
    alert('엑셀 파일을 업로드해주세요.');
    if (fileInput) fileInput.focus();
    return false;
  }

  // 2. "입력한 모든 항목에 이상이 없음" 체크 여부
  var confirmEl = document.getElementById('confirmCheck');
  if (!confirmEl || !confirmEl.checked) {
    alert('입력한 모든 항목에 이상이 없음을 확인해주세요.');
    if (confirmEl) confirmEl.focus();
    return false;
  }

  // 3. 최종 발주 확인
  if (!confirm('선택한 정보로 발주합니다.')) return false;

  return true;
}
