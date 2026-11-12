PRAGMA defer_foreign_keys = on;

ALTER TABLE products ADD COLUMN file_name TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN file_size INTEGER NOT NULL DEFAULT 0;

-- Paid files live here (never in the public static output) and are streamed only to paid orders.
CREATE TABLE IF NOT EXISTS product_file_chunks (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  data BLOB NOT NULL,
  PRIMARY KEY (product_id, chunk_index)
);

CREATE TABLE orders_new (
  id TEXT PRIMARY KEY,
  order_type TEXT NOT NULL CHECK (order_type IN ('ai', 'service', 'digital')),
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
  download_token_hash TEXT NOT NULL DEFAULT '',
  download_count INTEGER NOT NULL DEFAULT 0,
  last_download_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO orders_new (id, order_type, customer_name, contact, activation_email, product_id, product_name, duration, brief, amount_vnd, transfer_note, consented_at, status, admin_note, created_at, updated_at)
SELECT id, order_type, customer_name, contact, activation_email, product_id, product_name, duration, brief, amount_vnd, transfer_note, consented_at, status, admin_note, created_at, updated_at FROM orders;

DROP TABLE orders;
ALTER TABLE orders_new RENAME TO orders;

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(activation_email, contact);

INSERT OR IGNORE INTO products (id, name, category, description, duration, price_vnd, active, requires_gmail, fulfillment_note, sort_order) VALUES
  ('ebook-100-prompt-ai-can-bo-cong-chuc', 'Ebook 100 Prompt AI cho Cán bộ Công chức', 'digital', '100 câu lệnh AI mẫu giúp cán bộ, công chức soạn văn bản, tổng hợp báo cáo và xử lý công việc hành chính nhanh hơn.', 'Ebook PDF', 49000, 1, 0, '', 60);
