const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// --- DB 초기화 ---
const dbPath = path.join(__dirname, 'db', 'database.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 스키마 실행
const schemaSQL = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf-8');
db.exec(schemaSQL);

// 시드 데이터 (부서 테이블이 비어있을 때만)
const deptCount = db.prepare('SELECT COUNT(*) as cnt FROM departments').get();
if (deptCount.cnt === 0) {
  const seedSQL = fs.readFileSync(path.join(__dirname, 'db', 'seed.sql'), 'utf-8');
  db.exec(seedSQL);
  console.log('Seed data inserted.');
}

// db를 다른 라우트에서 사용할 수 있도록 app에 저장
app.locals.db = db;

// --- 미들웨어 ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 4 } // 4시간
}));

// 정적 파일
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- 라우트 ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/files', require('./routes/files'));

// SPA 라우팅: HTML 페이지 직접 접근 허용
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// --- 서버 시작 ---
app.listen(PORT, () => {
  console.log(`\n  명함 발주 시스템 서버 실행 중`);
  console.log(`  http://localhost:${PORT}\n`);
});
