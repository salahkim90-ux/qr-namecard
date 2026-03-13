const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// POST /api/cart/add
router.post('/add', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;
  const { order_id } = req.body;

  if (!order_id) {
    return res.json({ code: 'fail', msg: '주문 ID가 필요합니다.' });
  }

  db.prepare(
    'INSERT INTO cart (user_id, order_id) VALUES (?, ?)'
  ).run(userId, order_id);

  res.json({ code: 'succ' });
});

// GET /api/cart
router.get('/', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;

  const rows = db.prepare(`
    SELECT c.id as cart_id, c.added_at, o.*
    FROM cart c
    JOIN orders o ON c.order_id = o.id
    WHERE c.user_id = ?
    ORDER BY c.added_at DESC
  `).all(userId);

  res.json({ code: 'succ', items: rows });
});

// DELETE /api/cart/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM cart WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.session.user.id);
  res.json({ code: 'succ' });
});

module.exports = router;
