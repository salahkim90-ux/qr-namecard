/**
 * dept-search.js - 부서 검색 다이얼로그
 *
 * #dialogDeptSearch 다이얼로그를 제어한다.
 * 사용자가 부서명/팀명 키워드를 입력하면 POST /api/departments/search 를 호출하고,
 * 결과 목록에서 행을 선택한 뒤 "적용"을 클릭하면 주문 폼 필드 7개를 자동으로 채운다.
 *
 * 의존: common.js (apiFetch, setValue, showToast)
 */
(function () {
  'use strict';

  /* ============================================================
     DOM References
     ============================================================ */
  const dialog       = document.getElementById('dialogDeptSearch');
  const btnOpen      = document.getElementById('btnDeptSearch');
  const btnClose     = document.getElementById('btnDeptSearchClose');
  const btnCancel    = document.getElementById('btnDeptSearchCancel');
  const btnApply     = document.getElementById('btnDeptSearchApply');
  const inputKeyword = document.getElementById('deptSearchKeyword');
  const btnExec      = document.getElementById('btnDeptSearchExec');
  const table        = document.getElementById('deptSearchResults');
  const tbody        = table ? table.querySelector('tbody') : null;

  /* ============================================================
     State
     ============================================================ */
  /** @type {object|null} 현재 선택된 부서 데이터 */
  let selectedDept = null;

  /* ============================================================
     Dialog open / close
     ============================================================ */

  /** 다이얼로그를 초기 상태로 리셋하고 모달로 연다. */
  function openDialog() {
    if (!dialog) return;
    resetDialog();
    dialog.showModal();
    // 열린 직후 검색어 입력에 포커스
    setTimeout(function () {
      if (inputKeyword) inputKeyword.focus();
    }, 50);
  }

  /** 다이얼로그를 닫는다. */
  function closeDialog() {
    if (!dialog) return;
    dialog.close();
  }

  /** 다이얼로그 내부 상태를 초기화한다. */
  function resetDialog() {
    if (inputKeyword) inputKeyword.value = '';
    if (tbody) tbody.innerHTML = '';
    selectedDept = null;
    updateApplyButton();
  }

  /* ============================================================
     Search
     ============================================================ */

  /** 검색 API를 호출하고 결과를 테이블에 렌더링한다. */
  async function executeSearch() {
    var keyword = inputKeyword ? inputKeyword.value.trim() : '';
    if (!keyword) {
      showToast('검색어를 입력하세요.');
      if (inputKeyword) inputKeyword.focus();
      return;
    }

    try {
      var data = await apiFetch('/api/departments/search', {
        method: 'POST',
        body: { key: keyword }
      });

      if (!data || data.code !== 'succ') {
        // apiFetch 내부에서 fail 토스트를 이미 처리한다.
        renderEmpty('검색 결과가 없습니다.');
        return;
      }

      var results = data.dept;
      if (!Array.isArray(results) || results.length === 0) {
        renderEmpty('검색 결과가 없습니다.');
        return;
      }

      renderResults(results);
    } catch (err) {
      renderEmpty('검색 중 오류가 발생했습니다.');
    }
  }

  /* ============================================================
     Render
     ============================================================ */

  /**
   * 검색 결과 배열을 테이블 <tbody>에 렌더링한다.
   * @param {Array<object>} results - 부서 데이터 배열
   */
  function renderResults(results) {
    if (!tbody) return;
    tbody.innerHTML = '';
    selectedDept = null;
    updateApplyButton();

    results.forEach(function (item) {
      var tr = document.createElement('tr');

      var tdDept = document.createElement('td');
      tdDept.textContent = item.dept || '';

      var tdTeam = document.createElement('td');
      tdTeam.textContent = item.team || '';

      var tdAddr = document.createElement('td');
      tdAddr.textContent = item.addr || '';

      tr.appendChild(tdDept);
      tr.appendChild(tdTeam);
      tr.appendChild(tdAddr);

      // 행 클릭 → 선택
      tr.addEventListener('click', function () {
        selectRow(tr, item);
      });

      tbody.appendChild(tr);
    });
  }

  /**
   * 결과가 없을 때 안내 메시지를 표시한다.
   * @param {string} message - 표시 메시지
   */
  function renderEmpty(message) {
    if (!tbody) return;
    tbody.innerHTML = '';
    selectedDept = null;
    updateApplyButton();

    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.colSpan = 3;
    td.className = 'results-empty';
    td.textContent = message;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  /* ============================================================
     Row selection
     ============================================================ */

  /**
   * 특정 행을 선택(하이라이트) 처리한다.
   * @param {HTMLTableRowElement} row  - 클릭된 행
   * @param {object}              item - 해당 부서 데이터
   */
  function selectRow(row, item) {
    // 이전 선택 해제
    if (tbody) {
      tbody.querySelectorAll('tr.selected').forEach(function (tr) {
        tr.classList.remove('selected');
      });
    }
    row.classList.add('selected');
    selectedDept = item;
    updateApplyButton();
  }

  /** 적용 버튼의 disabled 상태를 갱신한다. */
  function updateApplyButton() {
    if (btnApply) {
      btnApply.disabled = !selectedDept;
    }
  }

  /* ============================================================
     Apply
     ============================================================ */

  /** 선택된 부서 데이터를 주문 폼 필드에 반영하고 다이얼로그를 닫는다. */
  function applySelection() {
    if (!selectedDept) return;

    setValue('nc_dept',      selectedDept.dept      || '');
    setValue('nc_dept_en',   selectedDept.dept_en   || '');
    setValue('nc_team',      selectedDept.team      || '');
    setValue('nc_addr',      selectedDept.addr      || '');
    setValue('nc_addr_en',   selectedDept.addr_en   || '');
    setValue('nc_branch',    selectedDept.branch    || '');
    setValue('nc_branch_en', selectedDept.branch_en || '');

    // 지사명이 존재하면 지사 체크박스를 활성화하고 지사 영역을 표시
    var branchCk = document.getElementById('nc_branch_ck');
    if (branchCk) {
      var hasBranch = !!(selectedDept.branch && selectedDept.branch.trim());
      branchCk.checked = hasBranch;
      // 지사 입력 그룹 표시 / 숨김 (app-order.js 에서도 처리하지만 여기서도 보정)
      var branchGroup   = document.getElementById('branchGroup');
      var branchEnGroup = document.getElementById('branchEnGroup');
      if (branchGroup)   branchGroup.style.display   = hasBranch ? '' : 'none';
      if (branchEnGroup) branchEnGroup.style.display  = hasBranch ? '' : 'none';
    }

    closeDialog();
  }

  /* ============================================================
     Event bindings
     ============================================================ */

  // 부서검색 버튼 → 다이얼로그 열기
  if (btnOpen) {
    btnOpen.addEventListener('click', openDialog);
  }

  // 닫기(×) 버튼
  if (btnClose) {
    btnClose.addEventListener('click', closeDialog);
  }

  // 취소 버튼
  if (btnCancel) {
    btnCancel.addEventListener('click', closeDialog);
  }

  // 적용 버튼
  if (btnApply) {
    btnApply.addEventListener('click', applySelection);
  }

  // 검색 실행 버튼
  if (btnExec) {
    btnExec.addEventListener('click', executeSearch);
  }

  // 검색어 입력에서 Enter 키 → 검색 실행
  if (inputKeyword) {
    inputKeyword.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSearch();
      }
    });
  }

  // 다이얼로그 backdrop 클릭(ESC 또는 바깥 영역) 시 닫기
  if (dialog) {
    dialog.addEventListener('cancel', function (e) {
      // ESC 키에 의한 cancel 이벤트 — 기본 동작(닫기)을 허용
    });

    dialog.addEventListener('click', function (e) {
      // <dialog> 요소 자체를 클릭한 경우(= backdrop 영역) 닫기
      if (e.target === dialog) {
        closeDialog();
      }
    });
  }
})();
