const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// POST /api/orders/create
router.post('/create', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;
  const d = req.body;

  const result = db.prepare(`
    INSERT INTO orders (
      user_id, order_type, nc_type, nc_qty, nc_qty_reason,
      nc_name, nc_dept, nc_team, nc_title, nc_addr,
      nc_phone, nc_fax, nc_mobile, nc_email,
      nc_branch_ck, nc_branch,
      nc_name_en, nc_dept_en, nc_title_en, nc_addr_en, nc_branch_en,
      nc_info, excel_file_path, zip_file_path, total_price
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `).run(
    userId, d.order_type || 'individual', d.nc_type, d.nc_qty || 1, d.nc_qty_reason || '',
    d.nc_name || '', d.nc_dept || '', d.nc_team || '', d.nc_title || '', d.nc_addr || '',
    d.nc_phone || '', d.nc_fax || '', d.nc_mobile || '', d.nc_email || '',
    d.nc_branch_ck ? 1 : 0, d.nc_branch || '',
    d.nc_name_en || '', d.nc_dept_en || '', d.nc_title_en || '', d.nc_addr_en || '', d.nc_branch_en || '',
    d.nc_info || '', d.excel_file_path || '', d.zip_file_path || '', d.total_price || 0
  );

  res.json({ code: 'succ', order_id: result.lastInsertRowid });
});

// GET /api/orders/my
router.get('/my', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;

  const rows = db.prepare(
    `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`
  ).all(userId);

  res.json({ code: 'succ', orders: rows });
});

// GET /api/orders/:id
router.get('/:id', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  if (!order) {
    return res.json({ code: 'fail', msg: '주문을 찾을 수 없습니다.' });
  }
  res.json({ code: 'succ', order });
});

module.exports = router;
