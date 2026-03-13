const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireAuth } = require('../middleware/auth');

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadBase = path.join(__dirname, '..', '..', 'uploads');
    if (file.fieldname === 'excel') {
      cb(null, path.join(uploadBase, 'excel'));
    } else if (file.fieldname === 'zip') {
      cb(null, path.join(uploadBase, 'zip'));
    } else {
      cb(null, path.join(uploadBase, 'photos'));
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'excel') {
      const allowed = ['.xls', '.xlsx'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowed.includes(ext)) {
        return cb(new Error('엑셀 파일(.xls, .xlsx)만 업로드 가능합니다.'));
      }
    }
    cb(null, true);
  }
});

// POST /api/files/upload
router.post('/upload', requireAuth, upload.fields([
  { name: 'excel', maxCount: 1 },
  { name: 'zip', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), (req, res) => {
  const result = {};

  if (req.files.excel) {
    result.excel_path = req.files.excel[0].path;
  }
  if (req.files.zip) {
    result.zip_path = req.files.zip[0].path;
  }
  if (req.files.photo) {
    result.photo_path = req.files.photo[0].path;
  }

  res.json({ code: 'succ', files: result });
});

module.exports = router;
