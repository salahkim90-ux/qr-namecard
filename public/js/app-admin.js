/**
 * app-admin.js - 관리자 부서 관리 페이지 로직
 *
 * 부서 목록 조회, 추가, 삭제 기능을 처리합니다.
 * 의존: common.js (apiFetch, requireAuth, updateHeaderUser, showToast, getValue, clearForm, logout)
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;

  // 관리자 권한 확인
  if (!user.is_admin) {
    alert('관리자 권한이 필요합니다.');
    window.location.href = '/order.html';
    return;
  }

  updateHeaderUser(user);
  setupLogout();
  setupAddDepartment();
  loadDepartments();
});

/* ============================================================
   1. 부서 목록 로드
   ============================================================ */

async function loadDepartments() {
  const result = await apiFetch('/api/departments');
  if (result.code === 'succ') {
    renderDepartments(result.dept);
  }
}

/* ============================================================
   2. 부서 목록 렌더링
   ============================================================ */

function renderDepartments(depts) {
  const tbody = document.getElementById('deptBody');
  const emptyEl = document.getElementById('deptEmpty');
  const countEl = document.getElementById('deptCount');

  if (!depts || depts.length === 0) {
    tbody.innerHTML = '';
    emptyEl.classList.remove('d-none');
    countEl.textContent = '0건';
    return;
  }

  emptyEl.classList.add('d-none');
  countEl.textContent = `${depts.length}건`;

  tbody.innerHTML = depts.map(d => `
    <tr>
      <td class="col-id">${d.id}</td>
      <td>${escapeHtml(d.dept || '')}</td>
      <td>${escapeHtml(d.dept_en || '')}</td>
      <td>${escapeHtml(d.team || '')}</td>
      <td>${escapeHtml(d.addr || '')}</td>
      <td>${escapeHtml(d.branch || '')}</td>
      <td class="col-action">
        <button type="button" class="btn-delete" onclick="deleteDepartment(${d.id})">삭제</button>
      </td>
    </tr>
  `).join('');
}

/* ============================================================
   3. 부서 추가
   ============================================================ */

function setupAddDepartment() {
  document.getElementById('btnAddDept').addEventListener('click', addDepartment);

  // Enter 키로도 추가 가능
  document.getElementById('addDeptForm').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDepartment();
    }
  });
}

async function addDepartment() {
  const data = {
    dept: getValue('addDept'),
    dept_en: getValue('addDeptEn'),
    team: getValue('addTeam'),
    addr: getValue('addAddr'),
    addr_en: getValue('addAddrEn'),
    branch: getValue('addBranch'),
    branch_en: getValue('addBranchEn')
  };

  if (!data.dept) {
    alert('부서명을 입력해주세요.');
    document.getElementById('addDept').focus();
    return;
  }

  const result = await apiFetch('/api/departments', {
    method: 'POST',
    body: data
  });

  if (result.code === 'succ') {
    showToast('부서가 추가되었습니다.');
    clearAddForm();
    loadDepartments();
  }
}

/**
 * 부서 추가 폼의 모든 입력 필드를 초기화한다.
 */
function clearAddForm() {
  const ids = ['addDept', 'addDeptEn', 'addTeam', 'addAddr', 'addAddrEn', 'addBranch', 'addBranchEn'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('addDept').focus();
}

/* ============================================================
   4. 부서 삭제
   ============================================================ */

async function deleteDepartment(id) {
  if (!confirm('이 부서를 삭제하시겠습니까?')) return;

  const result = await apiFetch(`/api/departments/${id}`, { method: 'DELETE' });
  if (result.code === 'succ') {
    showToast('삭제되었습니다.');
    loadDepartments();
  }
}

/* ============================================================
   5. 로그아웃
   ============================================================ */

function setupLogout() {
  const btn = document.getElementById('btnLogout');
  if (btn) {
    btn.addEventListener('click', logout);
  }
}

/* ============================================================
   6. 유틸리티
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
