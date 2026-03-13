-- 명함 발주 시스템 DB 스키마

CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    password    TEXT NOT NULL,
    is_admin    INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS departments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    dept        TEXT NOT NULL,
    dept_en     TEXT,
    team        TEXT,
    addr        TEXT,
    addr_en     TEXT,
    branch      TEXT,
    branch_en   TEXT
);

CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    order_type      TEXT NOT NULL CHECK(order_type IN ('individual','bulk')),
    nc_type         TEXT,
    nc_qty          INTEGER NOT NULL DEFAULT 1,
    nc_qty_reason   TEXT,
    nc_name         TEXT,
    nc_dept         TEXT,
    nc_team         TEXT,
    nc_title        TEXT,
    nc_addr         TEXT,
    nc_phone        TEXT,
    nc_fax          TEXT,
    nc_mobile       TEXT,
    nc_email        TEXT,
    nc_branch_ck    INTEGER DEFAULT 0,
    nc_branch       TEXT,
    nc_name_en      TEXT,
    nc_dept_en      TEXT,
    nc_title_en     TEXT,
    nc_addr_en      TEXT,
    nc_branch_en    TEXT,
    nc_info         TEXT,
    excel_file_path TEXT,
    zip_file_path   TEXT,
    total_price     INTEGER,
    status          TEXT DEFAULT 'pending'
                    CHECK(status IN ('pending','confirmed','printing','completed','cancelled')),
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cart (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    order_id    INTEGER NOT NULL,
    added_at    TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(order_id) REFERENCES orders(id)
);

-- 기본 데모 계정 (실제 운영 시 환경변수로 관리 권장)
INSERT OR IGNORE INTO users (employee_id, name, password, is_admin)
VALUES ('admin', '관리자', 'admin1234', 1);

INSERT OR IGNORE INTO users (employee_id, name, password, is_admin)
VALUES ('demo', '홍길동', 'demo1234', 0);
