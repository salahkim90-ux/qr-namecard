/**
 * app-login.js - 로그인 페이지 전용 스크립트
 *
 * 의존: common.js (apiFetch, getValue, showToast)
 * 필수 HTML: #loginForm, #employee_id, #password, #loginError, #btnLogin
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');
  const btnLogin = document.getElementById('btnLogin');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const employeeId = getValue('employee_id');
    const password = getValue('password');

    // Basic validation
    if (!employeeId || !password) {
      showError('사번과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    // Disable button during request
    btnLogin.disabled = true;
    btnLogin.innerHTML = '<span class="spinner"></span> 로그인 중...';

    try {
      const result = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: {
          employee_id: employeeId,
          password: password
        }
      });

      if (result.code === 'succ') {
        window.location.href = '/order.html';
      } else {
        showError(result.message || result.msg || '사번 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      showError('서버와 통신 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      btnLogin.disabled = false;
      btnLogin.textContent = '로그인';
    }
  });

  /**
   * 에러 메시지를 표시한다.
   * @param {string} msg - 표시할 에러 메시지
   */
  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.classList.add('show');
  }

  /**
   * 에러 메시지를 숨긴다.
   */
  function hideError() {
    if (!errorEl) return;
    errorEl.classList.remove('show');
  }

  // Hide error when user starts typing
  document.getElementById('employee_id')?.addEventListener('input', hideError);
  document.getElementById('password')?.addEventListener('input', hideError);
});
