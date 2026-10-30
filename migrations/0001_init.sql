PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ai', 'service', 'digital')),
  description TEXT NOT NULL DEFAULT '',
  duration TEXT,
  price_vnd INTEGER CHECK (price_vnd IS NULL OR price_vnd >= 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  requires_gmail INTEGER NOT NULL DEFAULT 0 CHECK (requires_gmail IN (0, 1)),
  fulfillment_note TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_type TEXT NOT NULL CHECK (order_type IN ('ai', 'service')),
  customer_name TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  activation_email TEXT NOT NULL DEFAULT '',
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  brief TEXT NOT NULL DEFAULT '',
  amount_vnd INTEGER NOT NULL DEFAULT 0 CHECK (amount_vnd >= 0),
  transfer_note TEXT NOT NULL DEFAULT '',
  consented_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'quote_sent', 'awaiting_payment', 'paid', 'in_progress', 'fulfilled', 'cancelled')),
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(activation_email, contact);

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  attempted_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip_time ON admin_login_attempts(ip_hash, attempted_at);

INSERT OR IGNORE INTO products (id, name, category, description, duration, price_vnd, active, requires_gmail, fulfillment_note, sort_order) VALUES
  ('google-ai-pro-18m', 'Google AI Pro', 'ai', 'Kích hoạt trên Gmail cá nhân bằng lời mời vào nhóm Google One; một số quyền lợi/hạn mức có thể dùng chung.', '18 tháng', 600000, 1, 1, 'Khách cần dùng Gmail cá nhân đủ điều kiện tham gia nhóm Google One.', 10),
  ('muse-ai', 'Muse AI', 'ai', 'Tư vấn gói phù hợp theo nhu cầu sử dụng.', '', NULL, 1, 0, '', 20),
  ('landing-page', 'Landing page', 'service', 'Thiết kế trang giới thiệu cho cửa hàng, sản phẩm hoặc chiến dịch.', 'Theo yêu cầu', NULL, 1, 0, '', 30),
  ('canva-templates', 'Mẫu thiết kế Canva', 'digital', 'Mẫu số có thể tùy chỉnh cho nội dung và hoạt động bán hàng.', 'Theo bộ mẫu', NULL, 1, 0, '', 40),
  ('vnpt-vinaphone', 'Dịch vụ VNPT · VinaPhone', 'service', 'SIM số, Internet và các gói cước di động VinaPhone.', 'Theo khu vực/gói', NULL, 1, 0, '', 50);