const express = require('express');
const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { employee_id, password } = req.body;
  const db = req.app.locals.db;

  if (!employee_id || !password) {
    return res.json({ code: 'fail', msg: '사번과 비밀번호를 입력해주세요.' });
  }

  const user = db.prepare(
    'SELECT id, employee_id, name, is_admin FROM users WHERE employee_id = ? AND password = ?'
  ).get(employee_id, password);

  if (!user) {
    return res.json({ code: 'fail', msg: '사번 또는 비밀번호가 올바르지 않습니다.' });
  }

  req.session.user = user;
  res.json({ code: 'succ', user: { name: user.name, is_admin: user.is_admin } });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ code: 'succ' });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.json({ code: 'fail', msg: '로그인이 필요합니다.' });
  }
  res.json({ code: 'succ', user: req.session.user });
});

module.exports = router;
