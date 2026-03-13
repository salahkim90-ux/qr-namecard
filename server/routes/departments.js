const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');

// POST /api/departments/search
router.post('/search', requireAuth, (req, res) => {
  const { key } = req.body;
  const db = req.app.locals.db;

  if (!key || key.trim().length === 0) {
    return res.json({ code: 'succ', dept: [] });
  }

  const keyword = `%${key.trim()}%`;
  const rows = db.prepare(
    `SELECT * FROM departments
     WHERE dept LIKE ? OR dept_en LIKE ? OR team LIKE ? OR branch LIKE ?
     ORDER BY dept, team`
  ).all(keyword, keyword, keyword, keyword);

  res.json({ code: 'succ', dept: rows });
});

// GET /api/departments (전체 목록 - 관리자용)
router.get('/', requireAdmin, (req, res) => {
  const db = req.app.locals.db;
  const rows = db.prepare('SELECT * FROM departments ORDER BY dept, team').all();
  res.json({ code: 'succ', dept: rows });
});

// POST /api/departments (추가 - 관리자용)
router.post('/', requireAdmin, (req, res) => {
  const db = req.app.locals.db;
  const { dept, dept_en, team, addr, addr_en, branch, branch_en } = req.body;

  if (!dept) {
    return res.json({ code: 'fail', msg: '부서명은 필수입니다.' });
  }

  const result = db.prepare(
    `INSERT INTO departments (dept, dept_en, team, addr, addr_en, branch, branch_en)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(dept, dept_en || '', team || '', addr || '', addr_en || '', branch || '', branch_en || '');

  res.json({ code: 'succ', id: result.lastInsertRowid });
});

// DELETE /api/departments/:id (삭제 - 관리자용)
router.delete('/:id', requireAdmin, (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM departments WHERE id = ?').run(req.params.id);
  res.json({ code: 'succ' });
});

module.exports = router;
