function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ code: 'fail', msg: '로그인이 필요합니다.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.status(403).json({ code: 'fail', msg: '관리자 권한이 필요합니다.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
