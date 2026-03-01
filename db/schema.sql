-- OroCoins Database Schema
-- Run this once in your Neon SQL Editor before deploying

CREATE TABLE IF NOT EXISTS admin_users (
  id               SERIAL PRIMARY KEY,
  username         VARCHAR(50)  UNIQUE NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  role             VARCHAR(20)  NOT NULL CHECK (role IN ('super_admin', 'admin', 'seller')),
  seller_name      VARCHAR(100),
  is_active        BOOLEAN      NOT NULL DEFAULT true,
  failed_attempts  INTEGER      NOT NULL DEFAULT 0,
  locked_until     TIMESTAMPTZ,
  last_logout_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- Run this if the table already exists:
-- ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_logout_at TIMESTAMPTZ;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS login_rate_limits (
  id            SERIAL PRIMARY KEY,
  ip            VARCHAR(45)  UNIQUE NOT NULL,
  attempts      INTEGER      NOT NULL DEFAULT 0,
  blocked_until TIMESTAMPTZ,
  last_attempt  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  order_number    VARCHAR(30)    UNIQUE NOT NULL,
  country         VARCHAR(100)   NOT NULL,
  country_slug    VARCHAR(50)    NOT NULL,
  game_username   VARCHAR(100)   NOT NULL,
  seller          VARCHAR(100)   NOT NULL,
  package_id      VARCHAR(30)    NOT NULL,
  package_coins   INTEGER        NOT NULL,
  package_price   DECIMAL(14, 2) NOT NULL,
  currency_code   VARCHAR(10)    NOT NULL,
  currency_symbol VARCHAR(10)    NOT NULL,
  is_custom       BOOLEAN        NOT NULL DEFAULT false,
  coin_account    VARCHAR(20)    NOT NULL,
  registered_by   TEXT,
  approved_by     TEXT,
  approved_at     TIMESTAMPTZ,
  cancel_reason   TEXT,
  notes           TEXT,
  status          VARCHAR(20)    NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ    DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_country_slug ON orders (country_slug);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at   ON orders (created_at DESC);

CREATE TABLE IF NOT EXISTS coin_accounts (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(20)  UNIQUE NOT NULL,
  current_balance INTEGER      NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coin_account_history (
  id           SERIAL PRIMARY KEY,
  account_name VARCHAR(20)  NOT NULL,
  prev_balance INTEGER      NOT NULL,
  new_balance  INTEGER      NOT NULL,
  changed_by   TEXT         NOT NULL,
  changed_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_history_account ON coin_account_history (account_name, changed_at DESC);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  endpoint   TEXT    NOT NULL,
  p256dh     TEXT    NOT NULL,
  auth       TEXT    NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

CREATE TABLE IF NOT EXISTS collector_payments (
  id             SERIAL PRIMARY KEY,
  seller_name    VARCHAR(100)   NOT NULL,
  amount_usd     DECIMAL(14, 2) NOT NULL,
  reference      TEXT           NOT NULL,
  notes          TEXT,
  status         VARCHAR(20)    NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'confirmed', 'rejected')),
  reject_reason  TEXT,
  submitted_by   TEXT           NOT NULL,
  reviewed_by    TEXT,
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collector_payments_seller
  ON collector_payments (seller_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collector_payments_status
  ON collector_payments (status);

CREATE TABLE IF NOT EXISTS app_settings (
  key        VARCHAR(50) PRIMARY KEY,
  value      TEXT        NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
