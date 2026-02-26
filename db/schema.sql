-- OroCoins Database Schema
-- Run this once in your Neon SQL Editor before deploying

CREATE TABLE IF NOT EXISTS orders (
  id            SERIAL PRIMARY KEY,
  order_number  VARCHAR(30)    UNIQUE NOT NULL,
  country       VARCHAR(100)   NOT NULL,
  country_slug  VARCHAR(50)    NOT NULL,
  game_username VARCHAR(100)   NOT NULL,
  customer_contact VARCHAR(100) NOT NULL,
  package_id    VARCHAR(30)    NOT NULL,
  package_coins INTEGER        NOT NULL,
  package_price DECIMAL(14, 2) NOT NULL,
  currency_code VARCHAR(10)    NOT NULL,
  currency_symbol VARCHAR(10)  NOT NULL,
  is_custom     BOOLEAN        NOT NULL DEFAULT false,
  status        VARCHAR(20)    NOT NULL DEFAULT 'pending',
  notes         TEXT,
  created_at    TIMESTAMPTZ    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number  ON orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_country_slug  ON orders (country_slug);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at    ON orders (created_at DESC);
