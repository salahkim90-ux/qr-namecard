/**
 * title-select.js - 직책 선택 다이얼로그
 *
 * #dialogTitleSelect 다이얼로그를 제어한다.
 * 직위 목록(TITLES)을 테이블로 표시하고, 행의 "적용" 버튼을 클릭하면
 * nc_title(한글) / nc_title_en(영문) 폼 필드를 자동으로 채운다.
 *
 * 의존: common.js (setValue)
 */
(function () {
  'use strict';

  /* ============================================================
     Title master data (SPEC 7-1)
     ============================================================ */
  var TITLES = [
    { ko: '사장',   en: 'President and CEO' },
    { ko: '부사장', en: 'Executive Vice President' },
    { ko: '본부장', en: 'Vice President' },
    { ko: '공항장', en: 'Chief Officer of ... Airport' },
    { ko: '실장',   en: 'Director' },
    { ko: '센터장', en: 'Head' },
    { ko: '부장',   en: 'General Manager' },
    { ko: '차장',   en: 'Deputy General Manager' },
    { ko: '과장',   en: 'Manager' },
    { ko: '대리',   en: 'Assistant Manager' },
    { ko: '',       en: 'N/A' }
  ];

  /* ============================================================
     비고(remarks) 규칙
     - "~ 대우" : 해당 직위와 동일한 영어 명칭 사용
     - "~ 직무대리" : 영어 명칭 앞에 "Acting" 추가
     ============================================================ */

  /**
   * 각 직위에 대한 비고 텍스트를 반환한다.
   * @param {object} title - { ko, en } 직위 객체
   * @returns {string} 비고 문자열
   */
  function getRemarks(title) {
    if (!title.ko) {
      return '직책 없음';
    }
    var lines = [];
    lines.push(title.ko + ' 대우 \u2192 ' + title.en);
    lines.push(title.ko + ' 직무대리 \u2192 Acting ' + title.en);
    return lines.join('\n');
  }

  /* ============================================================
     DOM References
     ============================================================ */
  var dialog    = document.getElementById('dialogTitleSelect');
  var btnOpen   = document.getElementById('btnTitleSelect');
  var btnClose  = document.getElementById('btnTitleSelectClose');
  var btnCancel = document.getElementById('btnTitleSelectCancel');
  var table     = document.getElementById('titleSelectTable');
  var tbody     = table ? table.querySelector('tbody') : null;

  /* ============================================================
     Table population
     ============================================================ */

  /** TITLES 배열을 기반으로 테이블 행을 생성한다. */
  function buildTitleRows() {
    if (!tbody) return;
    tbody.innerHTML = '';

    TITLES.forEach(function (title) {
      var tr = document.createElement('tr');

      // 직위(ko)
      var tdKo = document.createElement('td');
      tdKo.className = 'col-kr';
      tdKo.textContent = title.ko || '(없음)';
      tr.appendChild(tdKo);

      // 영어 명칭(en)
      var tdEn = document.createElement('td');
      tdEn.className = 'col-en';
      tdEn.textContent = title.en;
      tr.appendChild(tdEn);

      // 비고
      var tdNote = document.createElement('td');
      tdNote.style.whiteSpace = 'pre-line';
      tdNote.style.fontSize = 'var(--font-sm, 12px)';
      tdNote.style.color = 'var(--text-muted, #888)';
      tdNote.textContent = getRemarks(title);
      tr.appendChild(tdNote);

      // 적용 버튼
      var tdBtn = document.createElement('td');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-primary btn-sm';
      btn.textContent = '적용';
      btn.addEventListener('click', function (e) {
        e.stopPropagation(); // 행 hover 등 간섭 방지
        applyTitle(title);
      });
      tdBtn.appendChild(btn);
      tr.appendChild(tdBtn);

      tbody.appendChild(tr);
    });
  }

  /* ============================================================
     Dialog open / close
     ============================================================ */

  /** 다이얼로그를 모달로 연다. */
  function openDialog() {
    if (!dialog) return;
    // 행이 아직 생성되지 않았으면 최초 1회 빌드
    if (tbody && tbody.children.length === 0) {
      buildTitleRows();
    }
    dialog.showModal();
  }

  /** 다이얼로그를 닫는다. */
  function closeDialog() {
    if (!dialog) return;
    dialog.close();
  }

  /* ============================================================
     Apply
     ============================================================ */

  /**
   * 선택된 직위를 폼 필드에 반영하고 다이얼로그를 닫는다.
   * @param {object} title - { ko, en }
   */
  function applyTitle(title) {
    setValue('nc_title',    title.ko);
    setValue('nc_title_en', title.en);
    closeDialog();
  }

  /* ============================================================
     Event bindings
     ============================================================ */

  // 직책선택 버튼 → 다이얼로그 열기
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

  // 다이얼로그 backdrop 클릭 시 닫기
  if (dialog) {
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) {
        closeDialog();
      }
    });
  }

  // DOM 준비 시 테이블 행 빌드 (dialog가 이미 존재하면 즉시)
  buildTitleRows();
})();
