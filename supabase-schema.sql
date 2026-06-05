-- ============================================================
--  Klint's Cafe – Supabase / PostgreSQL Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Users / Staff ───────────────────────────────────────────
create table if not exists users (
  id          serial primary key,
  full_name   text not null,
  email       text unique not null,
  username    text unique not null,
  password    text not null,        -- bcrypt hash
  role        text not null default 'staff' check (role in ('admin','staff','user')),
  created_at  timestamptz default now()
);

-- ─── Products / Menu ─────────────────────────────────────────
create table if not exists products (
  id             serial primary key,
  name           text not null,
  category       text not null default 'coffee',
  description    text default '',
  price          numeric(10,2) not null,
  stock_quantity integer not null default 0,
  image_url      text default '',
  is_available   boolean default true,
  is_featured    boolean default false,
  created_at     timestamptz default now()
);

-- ─── Orders ──────────────────────────────────────────────────
create table if not exists orders (
  id               serial primary key,
  customer_name    text not null,
  customer_phone   text default '',
  order_type       text not null default 'pickup' check (order_type in ('pickup','delivery')),
  payment_method   text not null default 'cod',
  status           text not null default 'Received'
                     check (status in ('Received','Processing','Out for Delivery','Ready','Completed','Cancelled')),
  subtotal         numeric(10,2) default 0,
  tax              numeric(10,2) default 0,
  delivery_fee     numeric(10,2) default 0,
  service_fee      numeric(10,2) default 0,
  total            numeric(10,2) default 0,
  notes            text default '',
  delivery_address text default '',
  lat              numeric(11,8),
  lng              numeric(11,8),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── Order Items ─────────────────────────────────────────────
create table if not exists order_items (
  id         serial primary key,
  order_id   integer references orders(id) on delete cascade,
  product_id integer references products(id) on delete set null,
  name       text not null,
  quantity   integer not null default 1,
  price      numeric(10,2) not null
);

-- ─── Sales Reports ───────────────────────────────────────────
create table if not exists sales_reports (
  id           serial primary key,
  staff_id     integer references users(id) on delete set null,
  staff_name   text,
  report_date  date not null,
  shift        text default 'Full Day',
  total_sales  numeric(10,2) default 0,
  total_orders integer default 0,
  cash_on_hand numeric(10,2) default 0,
  notes        text default '',
  is_read      boolean default false,
  submitted_at timestamptz default now()
);

-- ─── Reviews ─────────────────────────────────────────────────
create table if not exists reviews (
  id            serial primary key,
  order_id      integer references orders(id) on delete cascade,
  customer_name text,
  product_id    integer references products(id) on delete set null,
  product_name  text,
  rating        integer check (rating between 1 and 5),
  review_text   text default '',
  created_at    timestamptz default now()
);

-- ─── Seed: Default Admin Account ─────────────────────────────
-- password = "admin123"  (bcrypt hash – change after first login!)
insert into users (full_name, email, username, password, role)
values (
  'Administrator',
  'admin@klintscafe.com',
  'admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- "password" hash
  'admin'
) on conflict (username) do nothing;

-- ─── Seed: Default Staff Account ─────────────────────────────
-- password = "staff123"
insert into users (full_name, email, username, password, role)
values (
  'Staff User',
  'staff@klintscafe.com',
  'staff',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- "password" hash
  'staff'
) on conflict (username) do nothing;

-- ─── Seed: Menu Items ────────────────────────────────────────
insert into products (name, category, description, price, stock_quantity, image_url, is_featured) values
('Americano',           'coffee',     'Espresso topped with hot water.',               140.00, 20, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&fit=crop', true),
('Cappuccino',          'coffee',     'Espresso with steamed milk and foam.',           165.00, 17, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&fit=crop', true),
('Caramel Macchiato',   'coffee',     'Espresso with steamed milk and sweet caramel drizzle.', 180.00, 12, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&fit=crop', true),
('Espresso',            'coffee',     'Strong and bold single-shot espresso.',          120.00, 15, 'https://images.unsplash.com/photo-1596952954288-16862d37405b?w=800&fit=crop', false),
('Latte',               'coffee',     'Creamy milk coffee with smooth texture.',        160.00, 17, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&fit=crop', false),
('Ham and Cheese Sandwich','food',    'Toasted sandwich with ham and cheese.',          180.00, 16, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&fit=crop', false),
('Iced Tea Lemon',      'non-coffee', 'Refreshing brewed tea with lemon.',              110.00, 18, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&fit=crop', false),
('Chocolate Muffin',    'pastry',     'Freshly baked chocolate muffin.',                 85.00, 13, 'https://images.unsplash.com/photo-1604882406195-d94d4f33b0a9?w=800&fit=crop', false)
on conflict do nothing;

-- NOTE: After running this schema, go to Supabase Dashboard → Auth → Settings
-- and DISABLE "Enable email confirmations" so staff accounts work immediately.
-- Then change default passwords after first login.
