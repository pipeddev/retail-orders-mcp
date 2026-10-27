CREATE TABLE customers (
  id     SERIAL PRIMARY KEY,
  name   TEXT NOT NULL,
  phone  TEXT NOT NULL,
  email  TEXT NOT NULL
);

CREATE TABLE products (
  sku         TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  price_clp   INTEGER NOT NULL CHECK (price_clp > 0),
  description TEXT NOT NULL
);

CREATE TABLE stock (
  sku       TEXT PRIMARY KEY REFERENCES products(sku),
  available INTEGER NOT NULL CHECK (available >= 0)
);

CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');

CREATE TABLE orders (
  id          SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  status      order_status NOT NULL DEFAULT 'pending',
  total_clp   INTEGER NOT NULL DEFAULT 0,
  eta         DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  order_id       INTEGER NOT NULL REFERENCES orders(id),
  sku            TEXT NOT NULL REFERENCES products(sku),
  qty            INTEGER NOT NULL CHECK (qty BETWEEN 1 AND 50),
  unit_price_clp INTEGER NOT NULL,
  PRIMARY KEY (order_id, sku)
);

CREATE INDEX idx_orders_customer ON orders(customer_id);